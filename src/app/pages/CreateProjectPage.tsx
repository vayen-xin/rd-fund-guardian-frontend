import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  createProject,
  fetchDeviceOptions,
  fetchEmployeeOptions,
  type BackendOptionItem,
} from "../api/projects";

const TODAY = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);

type OptionItem = {
  id: number;
  code: string;
  name: string;
  extra?: string;
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-visible rounded-[16px] bg-[#fcfcfc] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="border-b border-[#f4f4f4] px-[24px] py-[18px]">
        <span className="text-[15px] font-semibold text-[#272b30]">{title}</span>
      </div>
      <div className="px-[24px] py-[20px]">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="flex items-center gap-[5px] text-[13px] font-semibold text-[#272b30]">
        {label}
        {required ? <span className="text-[12px] text-[#ff4d4f]">*</span> : null}
        {hint ? (
          <span className="text-[12px] font-normal text-[#9a9fa5]">{hint}</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

function SearchSelect({
  placeholder,
  selectedIds,
  options,
  onAdd,
}: {
  placeholder: string;
  selectedIds: Set<number>;
  options: OptionItem[];
  onAdd: (item: OptionItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return options.filter((item) => {
      if (selectedIds.has(item.id)) {
        return false;
      }
      if (!query.trim()) {
        return true;
      }
      const keyword = query.trim().toLowerCase();
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.code.toLowerCase().includes(keyword) ||
        (item.extra ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [options, query, selectedIds]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        className={`flex h-[42px] items-center gap-[8px] rounded-[10px] border px-[12px] ${
          open ? "border-[#272b30]" : "border-[#efefef]"
        } bg-[#f4f4f4]`}
      >
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[13px] text-[#272b30] placeholder-[#9a9fa5] outline-none"
        />
      </div>
      {open ? (
        <div className="absolute left-0 right-0 top-[46px] z-30 max-h-[240px] overflow-y-auto rounded-[12px] border border-[#f4f4f4] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {filtered.length === 0 ? (
            <div className="py-[24px] text-center text-[13px] text-[#9a9fa5]">
              {query ? `未找到与“${query}”相关的数据` : "已全部添加"}
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onAdd(item);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-[12px] px-[14px] py-[11px] text-left transition-colors hover:bg-[#f4f4f4]"
              >
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#272b30] text-[12px] font-semibold text-white">
                  {item.name.slice(-1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#272b30]">{item.name}</p>
                  <p className="text-[11px] text-[#9a9fa5]">
                    {item.code}
                    {item.extra ? ` · ${item.extra}` : ""}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function SelectedItems({
  items,
  emptyText,
  onRemove,
}: {
  items: OptionItem[];
  emptyText: string;
  onRemove: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#e6e8eb] bg-[#fafafa] px-[14px] py-[12px] text-[13px] text-[#9a9fa5]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-[12px]">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex min-w-[220px] items-center gap-[12px] rounded-[12px] border border-[#efefef] bg-white px-[14px] py-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#272b30] text-[13px] font-semibold text-white">
            {item.name.slice(-1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[#272b30]">{item.name}</p>
            <p className="truncate text-[12px] text-[#9a9fa5]">
              {item.code}
              {item.extra ? ` · ${item.extra}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="rounded-[8px] px-[10px] py-[6px] text-[12px] font-semibold text-[#6f767e] transition-colors hover:bg-[#f4f4f4] hover:text-[#272b30]"
          >
            移除
          </button>
        </div>
      ))}
    </div>
  );
}

function SaveConfirmModal({
  projectName,
  projectCode,
  startDate,
  employeeCount,
  deviceCount,
  saving,
  onConfirm,
  onCancel,
}: {
  projectName: string;
  projectCode: string;
  startDate: string;
  employeeCount: number;
  deviceCount: number;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-[460px] rounded-[16px] bg-white p-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <h3 className="text-[18px] font-semibold text-[#272b30]">确认创建项目</h3>
        <div className="mt-[18px] flex flex-col gap-[10px] rounded-[12px] bg-[#fafafa] p-[16px]">
          {[
            { label: "项目名称", value: projectName },
            { label: "项目编号", value: projectCode },
            { label: "开始时间", value: startDate },
            { label: "关联员工", value: `${employeeCount} 人` },
            { label: "关联设备", value: `${deviceCount} 台` },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[13px] text-[#9a9fa5]">{row.label}</span>
              <span className="text-[13px] font-semibold text-[#272b30]">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-[24px] flex gap-[12px]">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-[44px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[14px] font-semibold text-[#6f767e]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="h-[44px] flex-1 rounded-[10px] bg-[#272b30] text-[14px] font-semibold text-white"
          >
            {saving ? "提交中..." : "确认保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function toOptions(items: BackendOptionItem[]) {
  return items.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    extra: item.extra,
  }));
}

function CreateProjectMain() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<OptionItem[]>([]);
  const [deviceOptions, setDeviceOptions] = useState<OptionItem[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<OptionItem[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<OptionItem[]>([]);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchEmployeeOptions(), fetchDeviceOptions()])
      .then(([employees, devices]) => {
        if (!cancelled) {
          setEmployeeOptions(toOptions(employees));
          setDeviceOptions(toOptions(devices));
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setPageError(error.message || "加载创建项目所需数据失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!projectName.trim()) {
      nextErrors.name = "请输入项目名称";
    }
    if (!projectCode.trim()) {
      nextErrors.code = "请输入项目编号";
    }
    if (!startDate) {
      nextErrors.startDate = "请选择开始时间";
    }
    if (description.length > 200) {
      nextErrors.description = "项目描述不能超过 200 字";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleConfirmSave() {
    setSaving(true);
    setPageError("");
    try {
      await createProject({
        projectName: projectName.trim(),
        code: projectCode.trim(),
        startDate,
        description: description.trim() || undefined,
        employeeIds: selectedEmployees.map((item) => item.id),
        deviceIds: selectedDevices.map((item) => item.id),
      });
      setShowSaveConfirm(false);
      navigate("/projects");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "创建项目失败");
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!validate()) {
      return;
    }
    setShowSaveConfirm(true);
  }

  return (
    <div className="flex flex-col gap-[20px]">
      {pageError ? (
        <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#ad6800]">
          {pageError}
        </div>
      ) : null}

      <SectionCard title="基础信息">
        <div className="grid grid-cols-2 gap-[20px]">
          <Field label="项目名称" required>
            <input
              value={projectName}
              onChange={(event) => {
                setProjectName(event.target.value);
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="请输入项目名称"
              className={`h-[42px] rounded-[10px] border px-[12px] text-[13px] outline-none ${
                errors.name
                  ? "border-[#ff4d4f] bg-[#fff2f0]"
                  : "border-[#efefef] bg-[#f4f4f4]"
              }`}
            />
            {errors.name ? (
              <p className="text-[12px] text-[#ff4d4f]">{errors.name}</p>
            ) : null}
          </Field>

          <Field label="项目编号" required>
            <input
              value={projectCode}
              onChange={(event) => {
                setProjectCode(event.target.value);
                setErrors((prev) => ({ ...prev, code: "" }));
              }}
              placeholder="请输入项目编号"
              className={`h-[42px] rounded-[10px] border px-[12px] text-[13px] outline-none ${
                errors.code
                  ? "border-[#ff4d4f] bg-[#fff2f0]"
                  : "border-[#efefef] bg-[#f4f4f4]"
              }`}
            />
            {errors.code ? (
              <p className="text-[12px] text-[#ff4d4f]">{errors.code}</p>
            ) : null}
          </Field>

          <Field label="开始时间" required>
            <input
              type="date"
              value={startDate}
              max={TODAY}
              onChange={(event) => {
                setStartDate(event.target.value);
                setErrors((prev) => ({ ...prev, startDate: "" }));
              }}
              className={`h-[42px] rounded-[10px] border px-[12px] text-[13px] outline-none ${
                errors.startDate
                  ? "border-[#ff4d4f] bg-[#fff2f0]"
                  : "border-[#efefef] bg-[#f4f4f4]"
              }`}
            />
            {errors.startDate ? (
              <p className="text-[12px] text-[#ff4d4f]">{errors.startDate}</p>
            ) : null}
          </Field>

          <div className="col-span-2">
            <Field label="项目描述" hint="选填，最多 200 字">
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  placeholder="请输入项目背景、目标或补充说明"
                  rows={3}
                  className={`w-full resize-none rounded-[10px] border px-[12px] py-[10px] text-[13px] outline-none ${
                    description.length > 200
                      ? "border-[#ff4d4f] bg-[#fff2f0]"
                      : "border-[#efefef] bg-[#f4f4f4]"
                  }`}
                />
                <span
                  className={`absolute bottom-[10px] right-[12px] text-[11px] ${
                    description.length > 200 ? "text-[#ff4d4f]" : "text-[#9a9fa5]"
                  }`}
                >
                  {description.length}/200
                </span>
              </div>
              {errors.description ? (
                <p className="text-[12px] text-[#ff4d4f]">{errors.description}</p>
              ) : null}
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={`关联员工${selectedEmployees.length ? `（已选 ${selectedEmployees.length} 人）` : ""}`}
      >
        <div className="flex flex-col gap-[16px]">
          <SearchSelect
            placeholder={
              loadingOptions
                ? "员工数据加载中..."
                : "输入姓名、工号或部门搜索员工"
            }
            selectedIds={new Set(selectedEmployees.map((item) => item.id))}
            options={employeeOptions}
            onAdd={(item) => setSelectedEmployees((prev) => [...prev, item])}
          />
          <SelectedItems
            items={selectedEmployees}
            emptyText="还没有选择员工"
            onRemove={(id) =>
              setSelectedEmployees((prev) => prev.filter((item) => item.id !== id))
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title={`关联设备${selectedDevices.length ? `（已选 ${selectedDevices.length} 台）` : ""}`}
      >
        <div className="flex flex-col gap-[16px]">
          <SearchSelect
            placeholder={
              loadingOptions
                ? "设备数据加载中..."
                : "输入设备名称、编号或型号搜索设备"
            }
            selectedIds={new Set(selectedDevices.map((item) => item.id))}
            options={deviceOptions}
            onAdd={(item) => setSelectedDevices((prev) => [...prev, item])}
          />
          <SelectedItems
            items={selectedDevices}
            emptyText="还没有选择设备"
            onRemove={(id) =>
              setSelectedDevices((prev) => prev.filter((item) => item.id !== id))
            }
          />
        </div>
      </SectionCard>

      <div className="flex items-center justify-between pb-[8px]">
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="h-[44px] rounded-[10px] border border-[#efefef] bg-white px-[20px] text-[14px] font-semibold text-[#6f767e]"
        >
          返回列表
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loadingOptions}
          className="h-[44px] rounded-[10px] bg-[#272b30] px-[24px] text-[14px] font-semibold text-white disabled:opacity-50"
        >
          保存项目
        </button>
      </div>

      {showSaveConfirm ? (
        <SaveConfirmModal
          projectName={projectName}
          projectCode={projectCode}
          startDate={startDate}
          employeeCount={selectedEmployees.length}
          deviceCount={selectedDevices.length}
          saving={saving}
          onConfirm={() => void handleConfirmSave()}
          onCancel={() => setShowSaveConfirm(false)}
        />
      ) : null}
    </div>
  );
}

export function CreateProjectPage() {
  return (
    <div className="px-[40px] py-[40px]">
      <div className="mb-[28px] flex items-center justify-between">
        <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">
          创建项目
        </h1>
      </div>
      <CreateProjectMain />
    </div>
  );
}
