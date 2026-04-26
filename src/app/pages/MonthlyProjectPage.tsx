import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fetchCurrentUser, type CurrentUser } from "../api/auth";
import { deleteVoucherFile, downloadVoucherFile, uploadVoucherFile } from "../api/files";
import {
  fetchMonthlyDetail,
  fetchMonthlyFeeSchema,
  fetchProjectMonthlyList,
  saveMonthlyDetail,
  submitMonthlyDetail,
  type MonthlyDetail,
  type MonthlyDeviceItem,
  type MonthlyEmployeeItem,
  type MonthlyFeeItem,
  type MonthlyFeeSchemaCategory,
  type MonthlyFees,
  type ProjectMonthlyRecord,
} from "../api/monthly";
import {
  fetchAllProjects,
  fetchDeviceOptions,
  fetchEmployeeOptions,
  fetchProjectDetail,
  type BackendOptionItem,
  type BackendProjectDetail,
} from "../api/projects";

type ProjectCardItem = {
  id: number;
  name: string;
  description?: string;
  code?: string;
  status: string;
  startDate: string;
  monthlyRecord?: ProjectMonthlyRecord;
  monthlyDetail?: MonthlyDetail | null;
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function createEmptyFees(categories: MonthlyFeeSchemaCategory[]): MonthlyFees {
  return Object.fromEntries(categories.map((item) => [item.code, { systemItems: [], manualItems: [] }])) as MonthlyFees;
}

function normalizeFees(categories: MonthlyFeeSchemaCategory[], fees?: MonthlyFees | null): MonthlyFees {
  const next = createEmptyFees(categories);
  if (!fees) {
    return next;
  }
  const legacyToNewCategoryCode: Record<string, string> = {
    direct_material: "direct",
    direct_fuel: "direct",
    direct_rental: "direct",
    depreciation: "deprec",
    long_deferred: "deprec",
    amortization: "intangible",
    commissioning: "equip",
    outsourced: "outsource",
  };
  const categoryCodeSet = new Set(categories.map((item) => item.code));
  for (const category of categories) {
    next[category.code] = {
      systemItems: fees[category.code]?.systemItems ?? [],
      manualItems: fees[category.code]?.manualItems ?? [],
    };
  }
  for (const [legacyCode, targetCode] of Object.entries(legacyToNewCategoryCode)) {
    if (!categoryCodeSet.has(targetCode)) {
      continue;
    }
    const legacyGroup = fees[legacyCode];
    if (!legacyGroup) {
      continue;
    }
    next[targetCode] = {
      systemItems: [...next[targetCode].systemItems, ...(legacyGroup.systemItems ?? [])],
      manualItems: [...next[targetCode].manualItems, ...(legacyGroup.manualItems ?? [])],
    };
  }
  return next;
}

function filterItemsByScope(items: MonthlyFeeSchemaCategory["items"], scope: "accounting" | "deduction" | "hightech") {
  if (scope === "accounting") {
    return items;
  }
  return items.filter((item) => {
    const label = item.label || "";
    if (scope === "deduction") {
      return !label.includes("不可加计扣除");
    }
    return !label.includes("不可计入高新");
  });
}

function getMonthlyStatusLabel(status?: string) {
  switch (status) {
    case "finalized":
      return "待结算";
    case "settled":
      return "已结算";
    default:
      return "编辑中";
  }
}

function getMonthlyStatusClass(status?: string) {
  switch (status) {
    case "finalized":
      return "bg-[#fff4e0] text-[#d48806]";
    case "settled":
      return "bg-[#e6f9f0] text-[#0d9f5f]";
    default:
      return "bg-[#e8f4ff] text-[#1677ff]";
  }
}

function getProjectStatusLabel(status?: string) {
  switch (status) {
    case "settled":
    case "SETTLED":
      return "已结算";
    case "ended":
    case "ENDED":
      return "已结束";
    default:
      return "进行中";
  }
}

function getProjectStatusClass(status?: string) {
  switch (getProjectStatusLabel(status)) {
    case "已结算":
      return "bg-[#eef2ff] text-[#4f6bed] border border-[#d8e0ff]";
    case "已结束":
      return "bg-[#fff7e8] text-[#d48806] border border-[#ffe2a8]";
    default:
      return "bg-[#ebfff6] text-[#1f9d72] border border-[#bde9d4]";
  }
}

function formatMoney(amount?: number) {
  return `¥ ${(amount ?? 0).toFixed(2)}`;
}

function calculateGrandTotal(fees: MonthlyFees) {
  return Object.values(fees).reduce((sum, group) => {
    const groupSum = [...group.systemItems, ...group.manualItems].reduce((inner, item) => inner + Number(item.amount || 0), 0);
    return sum + groupSum;
  }, 0);
}

function calculateCategoryTotal(fees: MonthlyFees, categoryCode: string) {
  const group = fees[categoryCode] ?? { systemItems: [], manualItems: [] };
  return [...group.systemItems, ...group.manualItems].reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function countCategoryItems(fees: MonthlyFees, categoryCode: string) {
  const group = fees[categoryCode] ?? { systemItems: [], manualItems: [] };
  return group.systemItems.length + group.manualItems.length;
}

function getCategoryItems(fees: MonthlyFees, categoryCode: string) {
  const group = fees[categoryCode] ?? { systemItems: [], manualItems: [] };
  return [
    ...group.systemItems.map((item) => ({ ...item, sourceLabel: "自动" })),
    ...group.manualItems.map((item) => ({ ...item, sourceLabel: "手动" })),
  ];
}

function isCorruptedChineseText(value?: string | null) {
  if (!value) {
    return false;
  }
  return /\?{2,}|\\u[0-9a-fA-F]{4}/.test(value);
}

function getFeeItemTitle(item: MonthlyFeeItem, category?: MonthlyFeeSchemaCategory) {
  const catalogLabel = item.itemCode ? category?.items.find((option) => option.code === item.itemCode)?.label : "";
  const candidates = [item.itemLabel, item.label, catalogLabel, item.name];
  const cleanText = candidates.find((value) => value && !isCorruptedChineseText(value));
  return cleanText || "手动录入费用";
}

function getFeeItemRemark(item: MonthlyFeeItem) {
  const cleanText = [item.remark, item.formula].find((value) => value && !isCorruptedChineseText(value));
  return cleanText || "暂无备注";
}

function getProjectPriority(project: ProjectCardItem, categoryCode?: string) {
  const activeScore = project.status === "ended" ? 0 : 1000;
  const detailScore = categoryCode && calculateCategoryTotal(project.monthlyDetail?.fees ?? ({} as MonthlyFees), categoryCode) > 0 ? 100 : 0;
  const dateScore = Number(new Date(project.startDate).getTime() || 0) / 100000000000;
  return activeScore + detailScore + dateScore + project.id / 100000;
}

const monthlyChartPalette = ["#4f6bed", "#1f9d72", "#f0a43a", "#d65db1", "#7950f2", "#00a7c4", "#f76707", "#868e96"];

function buildFeeBreakdownData(categories: MonthlyFeeSchemaCategory[], fees: MonthlyFees) {
  return categories
    .map((category, index) => {
      const group = fees[category.code] ?? { systemItems: [], manualItems: [] };
      const total = [...group.systemItems, ...group.manualItems].reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return {
        name: category.label,
        value: total,
        color: monthlyChartPalette[index % monthlyChartPalette.length],
      };
    })
    .filter((item) => item.value > 0);
}

function toMonthlyEmployeeFromOption(item: BackendOptionItem): MonthlyEmployeeItem {
  return {
    employeeId: item.id,
    employeeNo: item.code,
    name: item.name,
    department: item.extra,
    employeeType: "项目成员",
  };
}

function toMonthlyDeviceFromOption(item: BackendOptionItem): MonthlyDeviceItem {
  return {
    deviceId: item.id,
    deviceNo: item.code,
    name: item.name,
    category: item.extra,
    isUsed: true,
  };
}

function buildMonthlyDraftFromProject(detail: BackendProjectDetail, month: string, categories: MonthlyFeeSchemaCategory[]): MonthlyDetail {
  const employees = detail.employees.map((item) => ({
    employeeId: typeof item.employeeId === "number" ? item.employeeId : undefined,
    employeeNo: item.employeeId == null ? undefined : String(item.employeeId),
    name: item.employeeName,
    department: item.department,
    employeeType: item.employeeType,
  }));

  const devices = detail.devices.map((item) => ({
    deviceId: typeof item.deviceId === "number" ? item.deviceId : undefined,
    deviceNo: item.deviceId == null ? undefined : String(item.deviceId),
    name: item.deviceName,
    category: item.model,
    depreciationRate: item.dailyDepreciation,
    isUsed: true,
  }));

  return {
    projectId: detail.id,
    yearMonth: month,
    status: "draft",
    settledAt: null,
    grandTotal: 0,
    employees,
    availableEmployees: employees,
    devices,
    availableDevices: devices,
    fees: createEmptyFees(categories),
  };
}

function getSelectionKey(value: { employeeId?: number; employeeNo?: string; deviceId?: number; deviceNo?: string; name?: string }) {
  return String(value.employeeId ?? value.employeeNo ?? value.deviceId ?? value.deviceNo ?? value.name ?? "");
}

function ManageSelectionModal<T>({
  title,
  description,
  selectedItems,
  availableItems,
  getKey,
  renderTitle,
  renderMeta,
  addButtonLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  selectedItems: T[];
  availableItems: T[];
  getKey: (item: T) => string;
  renderTitle: (item: T) => string;
  renderMeta: (item: T) => string;
  addButtonLabel: string;
  onClose: () => void;
  onConfirm: (items: T[]) => void;
}) {
  const [items, setItems] = useState<T[]>(selectedItems);
  const [adding, setAdding] = useState(false);
  const [pendingKey, setPendingKey] = useState('');

  useEffect(() => {
    setItems(selectedItems);
    setAdding(false);
    setPendingKey('');
  }, [selectedItems]);

  const selectedKeySet = new Set(items.map((item) => getKey(item)));
  const remainingItems = availableItems.filter((item) => !selectedKeySet.has(getKey(item)));

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => getKey(item) !== key));
  }

  function addPendingItem() {
    if (!pendingKey) {
      return;
    }
    const found = availableItems.find((item) => getKey(item) == pendingKey);
    if (!found) {
      return;
    }
    setItems((prev) => [...prev, found]);
    setPendingKey('');
    setAdding(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex max-h-[78vh] w-[620px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_12px_48px_rgba(0,0,0,0.18)]">
        <div className="border-b border-[#f4f4f4] px-[24px] py-[18px]">
          <h3 className="text-[18px] font-semibold text-[#272b30]">{title}</h3>
          <p className="mt-[4px] text-[13px] text-[#6f767e]">{description}</p>
        </div>
        <div className="flex-1 overflow-auto p-[20px]">
          <div className="flex flex-col gap-[10px]">
            {items.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[#d9d9d9] px-[14px] py-[16px] text-[13px] text-[#9a9fa5]">
                当前还没有添加任何条目
              </div>
            ) : (
              items.map((item, index) => {
                const key = getKey(item) || String(index);
                return (
                  <div key={key} className="flex items-start justify-between gap-[12px] rounded-[12px] border border-[#efefef] px-[14px] py-[12px]">
                    <div>
                      <div className="text-[14px] font-semibold text-[#272b30]">{renderTitle(item)}</div>
                      <div className="mt-[4px] text-[12px] text-[#9a9fa5]">{renderMeta(item)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(key)}
                      className="rounded-[8px] bg-[#fff2f0] px-[10px] py-[6px] text-[12px] font-semibold text-[#ff4d4f]"
                    >
                      删除
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-[18px] rounded-[12px] border border-[#f4f4f4] bg-[#fafafa] p-[14px]">
            {!adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                disabled={remainingItems.length === 0}
                className="h-[38px] rounded-[10px] border border-[#efefef] bg-white px-[14px] text-[13px] font-semibold text-[#272b30] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {remainingItems.length === 0 ? '没有可新增项' : addButtonLabel}
              </button>
            ) : (
              <div className="flex items-center gap-[10px]">
                <select
                  value={pendingKey}
                  onChange={(event) => setPendingKey(event.target.value)}
                  className="h-[40px] flex-1 rounded-[10px] border border-[#efefef] bg-white px-[12px] text-[13px] text-[#272b30] outline-none"
                >
                  <option value="">请选择</option>
                  {remainingItems.map((item) => (
                    <option key={getKey(item)} value={getKey(item)}>
                      {renderTitle(item)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addPendingItem}
                  disabled={!pendingKey}
                  className="h-[40px] rounded-[10px] bg-[#272b30] px-[14px] text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  添加
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setPendingKey('');
                  }}
                  className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[14px] text-[13px] font-semibold text-[#6f767e]"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-[12px] border-t border-[#f4f4f4] px-[24px] py-[18px]">
          <button type="button" onClick={onClose} className="h-[40px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[13px] font-semibold text-[#6f767e]">
            取消
          </button>
          <button type="button" onClick={() => onConfirm(items)} className="h-[40px] flex-1 rounded-[10px] bg-[#272b30] text-[13px] font-semibold text-white">
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

function FeeCreateModal({
  categories,
  initialCategoryCode,
  onClose,
  onConfirm,
}: {
  categories: MonthlyFeeSchemaCategory[];
  initialCategoryCode: string;
  onClose: () => void;
  onConfirm: (categoryCode: string, itemCode: string) => void;
}) {
  const [scope, setScope] = useState<"accounting" | "deduction" | "hightech">("accounting");
  const [activeCategoryCode, setActiveCategoryCode] = useState(initialCategoryCode);
  const activeCategory = categories.find((item) => item.code === activeCategoryCode) ?? categories[0];
  const safeActiveCategory = activeCategory ?? { code: "", label: "", items: [] };
  const scopedItems = filterItemsByScope(activeCategory?.items ?? [], scope);
  const [selectedCode, setSelectedCode] = useState(scopedItems[0]?.code ?? "");

  useEffect(() => {
    const firstAvailable = scopedItems[0]?.code ?? "";
    if (!scopedItems.find((item) => item.code === selectedCode)) {
      setSelectedCode(firstAvailable);
    }
  }, [scopedItems, selectedCode]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[560px] rounded-[18px] bg-white p-[28px] shadow-[0_12px_48px_rgba(0,0,0,0.18)]">
        <h3 className="text-[18px] font-semibold text-[#272b30]">新增费用条目</h3>
        <p className="mt-[6px] text-[13px] text-[#6f767e]">先选择口径和一级费用类型，再选择二级分类。</p>

        <div className="mt-[14px] rounded-[12px] border border-[#f1f1f1] bg-[#fafafa] p-[10px]">
          <div className="mb-[8px] text-[12px] font-medium text-[#6f767e]">口径切换</div>
          <div className="flex gap-[8px]">
            {[
              { code: "accounting", label: "会计核算" },
              { code: "deduction", label: "加计扣除" },
              { code: "hightech", label: "高新认定" },
            ].map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setScope(item.code as "accounting" | "deduction" | "hightech")}
                className={`h-[34px] rounded-[10px] px-[12px] text-[12px] font-semibold ${
                  scope === item.code ? "bg-[#272b30] text-white" : "border border-[#e8e8e8] bg-white text-[#6f767e]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-[12px] rounded-[12px] border border-[#f1f1f1] p-[10px]">
          <div className="mb-[8px] text-[12px] font-medium text-[#6f767e]">一级费用类型</div>
          <div className="flex flex-wrap gap-[8px]">
            {categories.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setActiveCategoryCode(item.code)}
                className={`rounded-[999px] px-[10px] py-[6px] text-[12px] font-semibold ${
                  safeActiveCategory.code === item.code ? "bg-[#eef5ff] text-[#1677ff]" : "bg-[#f7f7f8] text-[#6f767e]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-[14px]">
          <label className="mb-[8px] block text-[13px] font-medium text-[#6f767e]">选择子分类</label>
          <select
            value={selectedCode}
            onChange={(event) => setSelectedCode(event.target.value)}
            className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none"
          >
            {scopedItems.length === 0 ? <option value="">当前口径下暂无可选子分类</option> : null}
            {scopedItems.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-[24px] flex gap-[12px]">
          <button type="button" onClick={onClose} className="h-[42px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[14px] font-semibold text-[#6f767e]">
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm(safeActiveCategory.code, selectedCode)}
            disabled={!selectedCode || !safeActiveCategory.code}
            className="h-[42px] flex-1 rounded-[10px] bg-[#272b30] text-[14px] font-semibold text-white disabled:opacity-50"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthlyEditorModal({
  projectName,
  detail,
  categories,
  activeCategoryCode,
  currentUser,
  employeePool,
  devicePool,
  saving,
  onClose,
  onSave,
}: {
  projectName: string;
  detail: MonthlyDetail;
  categories: MonthlyFeeSchemaCategory[];
  activeCategoryCode?: string;
  currentUser: CurrentUser | null;
  employeePool: MonthlyEmployeeItem[];
  devicePool: MonthlyDeviceItem[];
  saving: boolean;
  onClose: () => void;
  onSave: (fees: MonthlyFees, employees: MonthlyEmployeeItem[], devices: MonthlyDeviceItem[]) => void;
}) {
  const [fees, setFees] = useState<MonthlyFees>(() => normalizeFees(categories, detail.fees));
  const [employees, setEmployees] = useState<MonthlyEmployeeItem[]>(detail.employees);
  const [devices, setDevices] = useState<MonthlyDeviceItem[]>(detail.devices);
  const [creatingCategoryCode, setCreatingCategoryCode] = useState<string | null>(null);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [manualAmountDrafts, setManualAmountDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setFees(normalizeFees(categories, detail.fees));
    setEmployees(detail.employees);
    setDevices(detail.devices);
    setManualAmountDrafts({});
  }, [categories, detail]);

  const grandTotal = useMemo(() => calculateGrandTotal(fees), [fees]);
  const feeBreakdownData = useMemo(() => buildFeeBreakdownData(categories, fees), [categories, fees]);
  const visibleCategories = useMemo(
    () => (activeCategoryCode ? categories.filter((category) => category.code === activeCategoryCode) : categories),
    [activeCategoryCode, categories],
  );
  const activeCategory = activeCategoryCode ? categories.find((category) => category.code === activeCategoryCode) : null;
  const visibleTotal = useMemo(
    () => visibleCategories.reduce((sum, category) => sum + calculateCategoryTotal(fees, category.code), 0),
    [fees, visibleCategories],
  );
  const canEditSettled = ["admin", "branch_admin"].includes((currentUser?.role ?? "").toLowerCase());
  const readOnly = detail.status === "settled" && !canEditSettled;

  function updateManualItem(categoryCode: string, index: number, patch: Partial<MonthlyFeeItem>) {
    setFees((prev) => {
      const group = prev[categoryCode];
      const manualItems = [...group.manualItems];
      manualItems[index] = { ...manualItems[index], ...patch };
      return { ...prev, [categoryCode]: { ...group, manualItems } };
    });
  }

  function getManualItemDraftKey(categoryCode: string, index: number) {
    return `${categoryCode}-${index}`;
  }

  function handleManualAmountChange(categoryCode: string, index: number, rawValue: string) {
    if (!/^\d*(\.\d{0,2})?$/.test(rawValue)) {
      return;
    }
    const draftKey = getManualItemDraftKey(categoryCode, index);
    setManualAmountDrafts((prev) => ({ ...prev, [draftKey]: rawValue }));
    updateManualItem(categoryCode, index, { amount: rawValue === "" ? 0 : Number(rawValue) });
  }

  function handleManualAmountBlur(categoryCode: string, index: number) {
    const draftKey = getManualItemDraftKey(categoryCode, index);
    setManualAmountDrafts((prev) => {
      if (!(draftKey in prev)) {
        return prev;
      }
      const currentValue = prev[draftKey];
      if (currentValue === "") {
        return prev;
      }
      return { ...prev, [draftKey]: String(Number(currentValue)) };
    });
  }

  function addManualItem(categoryCode: string, itemCode: string) {
    const category = categories.find((item) => item.code === categoryCode);
    if (!category) {
      return;
    }
    const selected = category.items.find((item) => item.code === itemCode);
    if (!selected) {
      return;
    }
    setFees((prev) => {
      const group = prev[category.code];
      const nextItem: MonthlyFeeItem = {
        categoryCode: category.code,
        categoryLabel: category.label,
        itemCode: selected.code,
        itemLabel: selected.label,
        label: selected.label,
        amount: 0,
        remark: "",
        vouchers: [],
      };
      return { ...prev, [category.code]: { ...group, manualItems: [...group.manualItems, nextItem] } };
    });
    setCreatingCategoryCode(null);
  }

  function removeManualItem(categoryCode: string, index: number) {
    const removedDraftKey = getManualItemDraftKey(categoryCode, index);
    setFees((prev) => {
      const group = prev[categoryCode];
      return {
        ...prev,
        [categoryCode]: { ...group, manualItems: group.manualItems.filter((_, currentIndex) => currentIndex !== index) },
      };
    });
    setManualAmountDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(prev)) {
        if (key === removedDraftKey) {
          continue;
        }
        const [currentCategoryCode, currentIndexText] = key.split("-");
        if (currentCategoryCode === categoryCode && Number(currentIndexText) > index) {
          next[`${currentCategoryCode}-${Number(currentIndexText) - 1}`] = value;
          continue;
        }
        next[key] = value;
      }
      return next;
    });
  }

  async function handleUploadVoucher(categoryCode: string, index: number, file: File) {
    setUploadingKey(`${categoryCode}-${index}`);
    try {
      const uploaded = await uploadVoucherFile({
        projectId: detail.projectId,
        yearMonth: detail.yearMonth,
        category: categoryCode,
        file,
      });
      const current = fees[categoryCode].manualItems[index];
      updateManualItem(categoryCode, index, {
        voucherIds: [...(current.voucherIds ?? []), uploaded.id],
        vouchers: [...(current.vouchers ?? []), uploaded.fileName],
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "上传凭证失败");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleDeleteVoucher(categoryCode: string, index: number, voucherIndex: number) {
    const current = fees[categoryCode].manualItems[index];
    const voucherId = current.voucherIds?.[voucherIndex];
    if (!voucherId) {
      return;
    }
    try {
      await deleteVoucherFile(voucherId);
      updateManualItem(categoryCode, index, {
        voucherIds: (current.voucherIds ?? []).filter((_, currentIndex) => currentIndex !== voucherIndex),
        vouchers: (current.vouchers ?? []).filter((_, currentIndex) => currentIndex !== voucherIndex),
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除凭证失败");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex max-h-[calc(100vh-48px)] w-[1180px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_16px_64px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between border-b border-[#f4f4f4] px-[28px] py-[22px]">
          <div>
            <h2 className="text-[22px] font-semibold text-[#272b30]">{projectName}</h2>
            <p className="mt-[4px] text-[13px] text-[#9a9fa5]">
              {detail.yearMonth} {activeCategory ? activeCategory.label : "月度汇总"} · {getMonthlyStatusLabel(detail.status)}
            </p>
          </div>
          <button onClick={onClose} className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[#6f767e] hover:bg-[#f4f4f4]">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto p-[28px]">
          <div className="grid grid-cols-4 gap-[16px]">
            {[
              { label: "关联员工", value: `${employees.length} 人` },
              { label: "关联设备", value: `${devices.length} 台` },
              { label: "当前状态", value: getMonthlyStatusLabel(detail.status) },
              { label: activeCategory ? "本类合计" : "费用合计", value: formatMoney(activeCategory ? visibleTotal : grandTotal) },
            ].map((item) => (
              <div key={item.label} className="rounded-[14px] bg-[#fafafa] px-[16px] py-[14px]">
                <div className="text-[12px] text-[#9a9fa5]">{item.label}</div>
                <div className="mt-[6px] text-[18px] font-semibold text-[#272b30]">{item.value}</div>
              </div>
            ))}
          </div>

          {!activeCategory ? <div className="mt-[20px] grid grid-cols-2 gap-[20px]">
            <div className="rounded-[16px] border border-[#f4f4f4]">
              <div className="flex items-center justify-between border-b border-[#f4f4f4] px-[20px] py-[16px]">
                <div className="font-semibold text-[#272b30]">当月关联员工</div>
                {!readOnly ? (
                  <button onClick={() => setShowEmployeePicker(true)} className="h-[32px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#272b30]">
                    修改员工
                  </button>
                ) : null}
              </div>
              <div className="max-h-[280px] overflow-y-auto p-[20px]">
                <div className="flex flex-col gap-[10px]">
                  {employees.length === 0 ? (
                    <div className="rounded-[10px] border border-dashed border-[#d9d9d9] px-[12px] py-[14px] text-[12px] text-[#9a9fa5]">暂无关联员工</div>
                  ) : (
                    employees.map((item, index) => (
                      <div key={`${getSelectionKey(item)}-${index}`} className="rounded-[12px] bg-[#fafafa] px-[14px] py-[12px]">
                        <div className="text-[14px] font-semibold text-[#272b30]">{item.name}</div>
                        <div className="mt-[4px] text-[12px] text-[#9a9fa5]">
                          {item.employeeNo || "未设置工号"}
                          {item.department ? ` · ${item.department}` : ""}
                          {item.employeeType ? ` · ${item.employeeType}` : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[16px] border border-[#f4f4f4]">
              <div className="flex items-center justify-between border-b border-[#f4f4f4] px-[20px] py-[16px]">
                <div className="font-semibold text-[#272b30]">当月关联设备</div>
                {!readOnly ? (
                  <button onClick={() => setShowDevicePicker(true)} className="h-[32px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#272b30]">
                    修改设备
                  </button>
                ) : null}
              </div>
              <div className="max-h-[280px] overflow-y-auto p-[20px]">
                <div className="flex flex-col gap-[10px]">
                  {devices.length === 0 ? (
                    <div className="rounded-[10px] border border-dashed border-[#d9d9d9] px-[12px] py-[14px] text-[12px] text-[#9a9fa5]">暂无关联设备</div>
                  ) : (
                    devices.map((item, index) => (
                      <div key={`${getSelectionKey(item)}-${index}`} className="rounded-[12px] bg-[#fafafa] px-[14px] py-[12px]">
                        <div className="text-[14px] font-semibold text-[#272b30]">{item.name || `设备 ${index + 1}`}</div>
                        <div className="mt-[4px] text-[12px] text-[#9a9fa5]">
                          {item.deviceNo || "未设置编号"}
                          {item.category ? ` · ${item.category}` : ""}
                          {typeof item.depreciationRate === "number" ? ` · 折旧 ${item.depreciationRate}` : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div> : null}

          {!activeCategory ? <div className="mt-[20px] rounded-[16px] border border-[#f4f4f4] bg-white p-[20px]">
            <div className="mb-[14px] flex items-center justify-between">
              <div>
                <div className="text-[16px] font-semibold text-[#272b30]">费用结构概览</div>
                <div className="mt-[4px] text-[12px] text-[#8c8f94]">把费用分类做成比例图，方便快速看出本月支出重心。</div>
              </div>
              <div className="rounded-[999px] bg-[#f4f7fb] px-[10px] py-[5px] text-[12px] font-medium text-[#6f767e]">
                合计 {formatMoney(grandTotal)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-[16px] lg:grid-cols-[320px_1fr]">
              <div className="h-[260px]">
                {feeBreakdownData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={feeBreakdownData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={2}>
                        {feeBreakdownData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatMoney(value), "金额"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[14px] border border-dashed border-[#d8dce3] text-[13px] text-[#8c8f94]">
                    暂无费用数据
                  </div>
                )}
              </div>

              <div className="grid content-start gap-[10px] md:grid-cols-2">
                {(feeBreakdownData.length ? feeBreakdownData : categories.map((category, index) => ({
                  name: category.label,
                  value: 0,
                  color: monthlyChartPalette[index % monthlyChartPalette.length],
                }))).map((item) => (
                  <div key={item.name} className="rounded-[14px] bg-[#fafbfc] px-[14px] py-[12px]">
                    <div className="flex items-center gap-[10px]">
                      <span className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[13px] font-medium text-[#4b5563]">{item.name}</span>
                    </div>
                    <div className="mt-[8px] text-[16px] font-semibold text-[#272b30]">{formatMoney(item.value)}</div>
                    <div className="mt-[2px] text-[12px] text-[#8c8f94]">
                      {grandTotal > 0 ? `占比 ${((item.value / grandTotal) * 100).toFixed(1)}%` : "占比 0.0%"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div> : null}

          <div className="mt-[20px] rounded-[16px] border border-[#f4f4f4]">
            <div className="border-b border-[#f4f4f4] px-[20px] py-[16px] font-semibold text-[#272b30]">
              {activeCategory ? `${activeCategory.label}明细` : "费用明细"}
            </div>
            <div className="flex flex-col gap-[16px] p-[20px]">
              {visibleCategories.map((category) => {
                const group = fees[category.code] ?? { systemItems: [], manualItems: [] };
                const systemTotal = group.systemItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                const manualTotal = group.manualItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

                return (
                  <div key={category.code} className="rounded-[14px] bg-[#fafafa] p-[16px]">
                    <div className="mb-[12px] flex items-center justify-between">
                      <div>
                        <div className="text-[15px] font-semibold text-[#272b30]">{category.label}</div>
                        <div className="mt-[4px] text-[12px] text-[#9a9fa5]">
                          自动 {formatMoney(systemTotal)} · 手动 {formatMoney(manualTotal)}
                        </div>
                      </div>
                      {!readOnly ? (
                        <button onClick={() => setCreatingCategoryCode(category.code)} className="h-[32px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#272b30]">
                          新增
                        </button>
                      ) : null}
                    </div>

                    {group.systemItems.length > 0 ? (
                      <div className="mb-[12px] flex flex-col gap-[8px]">
                        {group.systemItems.map((item, index) => (
                          <div key={`sys-${category.code}-${index}`} className="flex items-center justify-between rounded-[10px] bg-white px-[12px] py-[10px]">
                            <div>
                              <div className="text-[13px] font-semibold text-[#272b30]">{getFeeItemTitle(item, category)}</div>
                              {!isCorruptedChineseText(item.formula) && item.formula ? <div className="mt-[3px] text-[11px] text-[#9a9fa5]">{item.formula}</div> : null}
                            </div>
                            <div className="text-[13px] font-semibold text-[#272b30]">{formatMoney(Number(item.amount || 0))}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-[10px]">
                      {group.manualItems.length === 0 ? (
                        <div className="rounded-[10px] border border-dashed border-[#d9d9d9] px-[12px] py-[14px] text-[12px] text-[#9a9fa5]">暂无手动录入条目</div>
                      ) : (
                        group.manualItems.map((item, index) => (
                          <div key={`manual-${category.code}-${index}`} className="grid grid-cols-[180px_1fr_160px_48px] items-start gap-[10px]">
                            <input
                              disabled
                              value={getFeeItemTitle(item, category)}
                              className="h-[40px] rounded-[10px] border border-[#efefef] bg-[#f5f5f5] px-[12px] text-[13px] text-[#272b30] outline-none"
                            />
                            <div className="flex flex-col gap-[8px]">
                              <input
                                disabled={readOnly}
                                value={item.remark || ""}
                                onChange={(event) => updateManualItem(category.code, index, { remark: event.target.value })}
                                placeholder="请输入备注"
                                className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[12px] text-[13px] text-[#272b30] outline-none disabled:bg-[#f5f5f5]"
                              />
                              <div className="flex flex-wrap items-center gap-[8px]">
                                {(item.vouchers ?? []).map((voucherName, voucherIndex) => (
                                  <div key={`${voucherName}-${voucherIndex}`} className="inline-flex items-center gap-[6px] rounded-[999px] border border-[#efefef] bg-white px-[10px] py-[6px] text-[12px] text-[#6f767e]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const voucherId = item.voucherIds?.[voucherIndex];
                                        if (voucherId) {
                                          void downloadVoucherFile(voucherId, voucherName);
                                        }
                                      }}
                                      className="max-w-[180px] truncate text-left text-[#272b30]"
                                    >
                                      {voucherName}
                                    </button>
                                    {!readOnly ? (
                                      <button type="button" onClick={() => void handleDeleteVoucher(category.code, index, voucherIndex)} className="text-[#ff4d4f]">
                                        ×
                                      </button>
                                    ) : null}
                                  </div>
                                ))}
                                {!readOnly ? (
                                  <label className="inline-flex h-[30px] cursor-pointer items-center rounded-[999px] border border-[#efefef] bg-white px-[10px] text-[12px] font-semibold text-[#272b30]">
                                    {uploadingKey === `${category.code}-${index}` ? "上传中..." : "上传凭证"}
                                    <input
                                      type="file"
                                      hidden
                                      onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) {
                                          void handleUploadVoucher(category.code, index, file);
                                        }
                                        event.currentTarget.value = "";
                                      }}
                                    />
                                  </label>
                                ) : null}
                              </div>
                            </div>
                            <input
                              disabled={readOnly}
                              type="text"
                              inputMode="decimal"
                              value={manualAmountDrafts[getManualItemDraftKey(category.code, index)] ?? (Number(item.amount || 0) === 0 ? "" : String(item.amount))}
                              onChange={(event) => handleManualAmountChange(category.code, index, event.target.value)}
                              onBlur={() => handleManualAmountBlur(category.code, index)}
                              placeholder="请输入金额"
                              className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[12px] text-[13px] text-[#272b30] outline-none disabled:bg-[#f5f5f5]"
                            />
                            {!readOnly ? (
                              <button onClick={() => removeManualItem(category.code, index)} className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-[#fff2f0] text-[#ff4d4f]">
                                ×
                              </button>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-[10px] border-t border-[#f4f4f4] px-[28px] py-[20px]">
          <button onClick={onClose} className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[18px] text-[13px] font-semibold text-[#6f767e]">
            关闭
          </button>
          {!readOnly ? (
            <button onClick={() => onSave(fees, employees, devices)} disabled={saving} className="h-[40px] rounded-[10px] bg-[#272b30] px-[18px] text-[13px] font-semibold text-white disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
          ) : null}
        </div>
      </div>

      {creatingCategoryCode ? (
        <FeeCreateModal
          categories={activeCategory ? [activeCategory] : categories}
          initialCategoryCode={creatingCategoryCode}
          onClose={() => setCreatingCategoryCode(null)}
          onConfirm={(categoryCode, itemCode) => addManualItem(categoryCode, itemCode)}
        />
      ) : null}

      {showEmployeePicker ? (
        <ManageSelectionModal
          title="选择当月关联员工"
          description="这里的修改只作用于当前月份，不会改项目基础关联员工。"
          selectedItems={employees}
          availableItems={employeePool}
          getKey={(item) => getSelectionKey(item)}
          renderTitle={(item) => item.name}
          renderMeta={(item) => `${item.employeeNo || "未设置工号"}${item.department ? ` · ${item.department}` : ""}${item.employeeType ? ` · ${item.employeeType}` : ""}`}
          onClose={() => setShowEmployeePicker(false)}
          addButtonLabel="新增员工"
          onConfirm={(items) => {
            setEmployees(items);
            setShowEmployeePicker(false);
          }}
        />
      ) : null}

      {showDevicePicker ? (
        <ManageSelectionModal
          title="选择当月关联设备"
          description="这里的修改只作用于当前月份，不会改项目基础关联设备。"
          selectedItems={devices}
          availableItems={devicePool}
          getKey={(item) => getSelectionKey(item)}
          renderTitle={(item) => item.name || "未命名设备"}
          renderMeta={(item) => `${item.deviceNo || "未设置编号"}${item.category ? ` · ${item.category}` : ""}`}
          onClose={() => setShowDevicePicker(false)}
          addButtonLabel="新增设备"
          onConfirm={(items) => {
            setDevices(items);
            setShowDevicePicker(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function MonthlyProjectPage() {
  const { categoryCode } = useParams();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectCardItem[]>([]);
  const [categories, setCategories] = useState<MonthlyFeeSchemaCategory[]>([]);
  const [employeePool, setEmployeePool] = useState<MonthlyEmployeeItem[]>([]);
  const [devicePool, setDevicePool] = useState<MonthlyDeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [editingProject, setEditingProject] = useState<ProjectCardItem | null>(null);
  const [editingDetail, setEditingDetail] = useState<MonthlyDetail | null>(null);
  const selectedCategory = categories.find((category) => category.code === categoryCode) ?? null;
  const filteredProjects = projects.filter((project) => {
    const value = `${project.name} ${project.code ?? ""} ${project.description ?? ""}`.toLowerCase();
    return value.includes(keyword.trim().toLowerCase());
  }).sort((left, right) => getProjectPriority(right, selectedCategory?.code) - getProjectPriority(left, selectedCategory?.code));
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pageProjects = filteredProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const categoryTotal = selectedCategory
    ? filteredProjects.reduce((sum, project) => sum + calculateCategoryTotal(project.monthlyDetail?.fees ?? ({} as MonthlyFees), selectedCategory.code), 0)
    : 0;
  const categoryItemCount = selectedCategory
    ? filteredProjects.reduce((sum, project) => sum + countCategoryItems(project.monthlyDetail?.fees ?? ({} as MonthlyFees), selectedCategory.code), 0)
    : 0;

  async function loadPage() {
    setLoading(true);
    setPageError("");
    try {
      const [user, projectPage, schema, employeeOptions, deviceOptions] = await Promise.all([
        fetchCurrentUser(),
        fetchAllProjects(),
        fetchMonthlyFeeSchema(),
        fetchEmployeeOptions(),
        fetchDeviceOptions(),
      ]);

      setCurrentUser(user);
      setCategories(schema.categories);
      setEmployeePool(employeeOptions.map(toMonthlyEmployeeFromOption));
      setDevicePool(deviceOptions.map(toMonthlyDeviceFromOption));

      const monthlyLists = await Promise.all(projectPage.records.map((project) => fetchProjectMonthlyList(project.id)));
      const baseProjects = projectPage.records.map((project, index) => ({
          id: project.id,
          name: project.projectName,
          code: project.code,
          description: project.description,
          status: project.status,
          startDate: project.startDate,
          monthlyRecord: monthlyLists[index].find((item) => String(item.workMonth).slice(0, 7) === selectedMonth),
        }));

      if (categoryCode) {
        const details = await Promise.all(
          baseProjects.map(async (project) => {
            if (!project.monthlyRecord) {
              return null;
            }
            try {
              const detail = await fetchMonthlyDetail(project.id, selectedMonth);
              return { ...detail, fees: normalizeFees(schema.categories, detail.fees) };
            } catch {
              return null;
            }
          }),
        );
        setProjects(baseProjects.map((project, index) => ({ ...project, monthlyDetail: details[index] })));
      } else {
        setProjects(baseProjects);
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "月度页面加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [selectedMonth, categoryCode]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedProjectId(null);
  }, [selectedMonth, categoryCode, keyword]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function openEditor(project: ProjectCardItem) {
    setPageError("");
    try {
      const [detail, projectDetail] = await Promise.allSettled([
        fetchMonthlyDetail(project.id, selectedMonth),
        fetchProjectDetail(project.id),
      ]);

      const resolvedProjectDetail = projectDetail.status === "fulfilled" ? projectDetail.value : null;
      let nextDetail: MonthlyDetail | null = detail.status === "fulfilled" ? detail.value : null;

      if (!nextDetail && resolvedProjectDetail) {
        nextDetail = buildMonthlyDraftFromProject(resolvedProjectDetail, selectedMonth, categories);
      }

      if (!nextDetail) {
        throw new Error("暂时无法获取月度数据");
      }

      setEditingProject(project);
      setEditingDetail({
        ...nextDetail,
        fees: normalizeFees(categories, nextDetail.fees),
      });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "打开月度详情失败");
    }
  }

  async function persistMonthlyData(fees: MonthlyFees, employees: MonthlyEmployeeItem[], devices: MonthlyDeviceItem[], submit = false) {
    if (!editingProject || !editingDetail) {
      return;
    }

    setSaving(true);
    setPageError("");
    try {
      await saveMonthlyDetail(editingProject.id, selectedMonth, {
        costData: JSON.stringify(fees),
        employeeData: JSON.stringify(employees),
        deviceData: JSON.stringify(devices),
        grandTotal: calculateGrandTotal(fees),
      });

      if (submit) {
        await submitMonthlyDetail(editingProject.id, selectedMonth);
      }

      const latestDetail = await fetchMonthlyDetail(editingProject.id, selectedMonth);
      setEditingDetail({
        ...latestDetail,
        fees: normalizeFees(categories, latestDetail.fees),
      });
      await loadPage();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : submit ? "提交月度数据失败" : "保存月度数据失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-[24px] p-[28px] lg:p-[36px]">
      <div className="flex items-center justify-between rounded-[18px] bg-white px-[32px] py-[26px] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div>
          <div className="text-[24px] font-semibold text-[#272b30]">{selectedCategory ? selectedCategory.label : "月度汇总"}</div>
          <div className="mt-[6px] text-[13px] text-[#8c8f94]">
            {selectedCategory
              ? "按研发支出分类维护当前月份的项目费用明细"
              : currentUser
                ? `${currentUser.name} · ${selectedMonth}`
                : "按月份查看项目费用与结算准备情况"}
          </div>
        </div>
        <div className="flex items-center gap-[10px]">
          {selectedCategory ? (
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="查询项目名称或编号"
              className="h-[40px] w-[220px] rounded-[12px] border border-[#efefef] bg-[#fafafa] px-[12px] text-[13px] text-[#272b30] outline-none"
            />
          ) : null}
          <label className="flex items-center gap-[10px] rounded-[12px] border border-[#efefef] bg-[#fafafa] px-[14px] py-[10px] text-[13px] text-[#6f767e]">
            月份
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-[8px] border border-[#efefef] bg-white px-[10px] py-[6px] text-[#272b30] outline-none"
            />
          </label>
        </div>
      </div>

      {pageError ? (
        <div className="rounded-[14px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#d46b08]">{pageError}</div>
      ) : null}

      {categoryCode && !loading && !selectedCategory ? (
        <div className="rounded-[20px] bg-white px-[28px] py-[40px] text-[14px] text-[#8c8f94] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          暂未找到对应费用分类，请从左侧月度汇总菜单重新选择。
        </div>
      ) : loading ? (
        <div className="rounded-[20px] bg-white px-[28px] py-[40px] text-[14px] text-[#8c8f94] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">正在加载月度项目数据...</div>
      ) : selectedCategory ? (
        <div className="flex flex-col gap-[16px]">
          <div className="grid gap-[18px] md:grid-cols-3">
            {[
              { label: "项目数量", value: `${filteredProjects.length} 个` },
              { label: "明细条数", value: `${categoryItemCount} 条` },
              { label: "分类金额", value: formatMoney(categoryTotal) },
            ].map((item) => (
              <div key={item.label} className="rounded-[16px] bg-white px-[24px] py-[20px] shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                <div className="text-[12px] text-[#8c8f94]">{item.label}</div>
                <div className="mt-[8px] text-[22px] font-semibold text-[#272b30]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="grid grid-cols-[1.2fr_120px_110px_140px_120px_150px] border-b border-[#f4f4f4] bg-[#fafafa] px-[20px] py-[14px] text-[13px] font-semibold text-[#6f767e]">
              <div>项目名称</div>
              <div>项目编号</div>
              <div>项目状态</div>
              <div>本类金额</div>
              <div>明细条数</div>
              <div className="text-right">操作</div>
            </div>
            {filteredProjects.length === 0 ? (
              <div className="px-[20px] py-[42px] text-center text-[13px] text-[#8c8f94]">暂无匹配项目</div>
            ) : (
              pageProjects.map((project) => {
                const detailFees = project.monthlyDetail?.fees ?? ({} as MonthlyFees);
                const total = calculateCategoryTotal(detailFees, selectedCategory.code);
                const itemCount = countCategoryItems(detailFees, selectedCategory.code);
                const categoryItems = getCategoryItems(detailFees, selectedCategory.code);
                const expanded = expandedProjectId === project.id;
                return (
                  <div key={project.id} className="border-b border-[#f4f4f4] last:border-b-0">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedProjectId((value) => (value === project.id ? null : project.id))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          setExpandedProjectId((value) => (value === project.id ? null : project.id));
                        }
                      }}
                      className="grid cursor-pointer grid-cols-[1.2fr_120px_110px_140px_120px_150px] items-center px-[24px] py-[18px] transition-colors hover:bg-[#fafafa]"
                    >
                      <div>
                        <div className="flex items-center gap-[8px]">
                          <span className="text-[15px] font-semibold text-[#272b30]">{project.name}</span>
                        </div>
                        <div className="mt-[5px] line-clamp-1 text-[12px] text-[#9a9fa5]">{project.description || "暂无项目说明"}</div>
                      </div>
                      <div className="text-[13px] text-[#6f767e]">{project.code || "未设置"}</div>
                      <div>
                        <span className={`inline-flex h-[26px] items-center rounded-[999px] px-[9px] text-[11px] font-semibold ${getProjectStatusClass(project.status)}`}>
                          {getProjectStatusLabel(project.status)}
                        </span>
                      </div>
                      <div className="text-[14px] font-semibold text-[#272b30]">{formatMoney(total)}</div>
                      <div className="text-[13px] text-[#6f767e]">{itemCount} 条</div>
                      <div className="text-right">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void openEditor(project);
                          }}
                          className="h-[34px] rounded-[8px] bg-[#272b30] px-[14px] text-[12px] font-semibold text-white"
                        >
                          {itemCount > 0 ? "编辑明细" : "新增数据"}
                        </button>
                      </div>
                    </div>
                    {expanded ? (
                      <div className="mx-[24px] mb-[18px] rounded-[14px] border border-[#efefef] bg-[#fcfcfc]">
                        {categoryItems.length === 0 ? (
                          <div className="px-[16px] py-[20px] text-[13px] text-[#8c8f94]">当前项目还没有录入本分类费用明细。</div>
                        ) : (
                          <div className="divide-y divide-[#efefef]">
                            {categoryItems.map((item, index) => (
                              <div key={`${project.id}-${item.itemCode}-${index}`} className="grid grid-cols-[120px_1fr_140px_160px] items-center gap-[12px] px-[16px] py-[12px]">
                                <span className="w-fit rounded-[999px] bg-white px-[9px] py-[4px] text-[11px] font-semibold text-[#6f767e]">{item.sourceLabel}</span>
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-semibold text-[#272b30]">{getFeeItemTitle(item, selectedCategory)}</div>
                                  <div className="mt-[3px] truncate text-[12px] text-[#9a9fa5]">{getFeeItemRemark(item)}</div>
                                </div>
                                <div className="text-[13px] font-semibold text-[#272b30]">{formatMoney(Number(item.amount || 0))}</div>
                                <div className="text-[12px] text-[#8c8f94]">{(item.vouchers?.length ?? 0) > 0 ? `${item.vouchers?.length} 个凭证` : "未上传凭证"}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
            {filteredProjects.length > pageSize ? (
              <div className="flex items-center justify-between border-t border-[#f4f4f4] px-[24px] py-[16px]">
                <div className="text-[12px] text-[#8c8f94]">
                  共 {filteredProjects.length} 个项目 · 第 {currentPage} / {totalPages} 页
                </div>
                <div className="flex items-center gap-[8px]">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                    className="h-[34px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#6f767e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                    className="h-[34px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#6f767e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-[16px] md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-[20px] bg-white p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[20px] font-semibold text-[#272b30]">{project.name}</div>
                  <div className="mt-[6px] text-[12px] text-[#8c8f94]">
                    {project.code || "未设置项目编号"} · 开始于 {project.startDate}
                  </div>
                </div>
                <span className={`rounded-[999px] px-[10px] py-[5px] text-[12px] font-semibold ${getMonthlyStatusClass(project.monthlyRecord?.status)}`}>
                  {getMonthlyStatusLabel(project.monthlyRecord?.status)}
                </span>
              </div>

              <div className="mt-[16px] grid grid-cols-2 gap-[10px]">
                <div className="rounded-[14px] bg-[#fafafa] px-[14px] py-[12px]">
                  <div className="text-[12px] text-[#8c8f94]">月度费用</div>
                  <div className="mt-[6px] text-[18px] font-semibold text-[#272b30]">{formatMoney(project.monthlyRecord?.grandTotal)}</div>
                </div>
                <div className="rounded-[14px] bg-[#fafafa] px-[14px] py-[12px]">
                  <div className="text-[12px] text-[#8c8f94]">项目状态</div>
                  <div className="mt-[6px] text-[18px] font-semibold text-[#272b30]">{project.status === "ended" ? "已结束" : "进行中"}</div>
                </div>
              </div>

              <div className="mt-[16px] min-h-[44px] text-[13px] leading-[1.7] text-[#6f767e]">
                {project.description || "暂无项目说明，可先进入月度汇总完善本月人员、设备和费用明细。"}
              </div>

              <div className="mt-[18px] flex items-center justify-end">
                <button onClick={() => void openEditor(project)} className="h-[38px] rounded-[10px] bg-[#272b30] px-[16px] text-[13px] font-semibold text-white">
                  打开月度汇总
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProject && editingDetail ? (
        <MonthlyEditorModal
          projectName={editingProject.name}
          detail={editingDetail}
          categories={categories}
          activeCategoryCode={selectedCategory?.code}
          currentUser={currentUser}
          employeePool={employeePool}
          devicePool={devicePool}
          saving={saving}
          onClose={() => {
            setEditingProject(null);
            setEditingDetail(null);
          }}
          onSave={(fees, employees, devices) => void persistMonthlyData(fees, employees, devices, false)}
        />
      ) : null}
    </div>
  );
}
