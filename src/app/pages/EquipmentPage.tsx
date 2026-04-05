import { useEffect, useMemo, useState } from "react";
import {
  createDevice,
  deleteDevice,
  fetchDevices,
  updateDevice,
  type DevicePayload,
  type DeviceRecord,
} from "../api/devices";

type FormState = DevicePayload;

const EMPTY_FORM: FormState = {
  deviceName: "",
  model: "",
  specification: "",
  purchaseDate: "",
  purchasePrice: undefined,
  dailyDepreciation: undefined,
  monthlyRental: undefined,
  status: "normal",
  notes: "",
};

function DeviceModal({
  title,
  form,
  saving,
  onChange,
  onCancel,
  onConfirm,
}: {
  title: string;
  form: FormState;
  saving: boolean;
  onChange: (field: keyof FormState, value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-[560px] rounded-[16px] bg-white p-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <h3 className="mb-[24px] text-[18px] font-semibold text-[#272b30]">{title}</h3>
        <div className="grid grid-cols-2 gap-[16px]">
          {[
            { key: "deviceName", label: "设备名称", type: "text" },
            { key: "model", label: "型号", type: "text" },
            { key: "specification", label: "规格", type: "text" },
            { key: "purchaseDate", label: "采购日期", type: "date" },
            { key: "purchasePrice", label: "采购价格", type: "number" },
            { key: "dailyDepreciation", label: "日折旧", type: "number" },
            { key: "monthlyRental", label: "月租金", type: "number" },
          ].map((item) => (
            <div key={item.key}>
              <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">{item.label}</label>
              <input
                type={item.type}
                value={String(form[item.key as keyof FormState] ?? "")}
                onChange={(event) => onChange(item.key as keyof FormState, event.target.value)}
                className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">状态</label>
            <div className="flex gap-[10px]">
              {[
                { label: "正常", value: "normal" },
                { label: "维护中", value: "maintenance" },
                { label: "已报废", value: "scrapped" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange("status", item.value)}
                  className={`h-[40px] rounded-[10px] px-[16px] text-[13px] font-semibold transition-colors ${
                    form.status === item.value ? "bg-[#272b30] text-white" : "bg-[#f4f4f4] text-[#6f767e]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">备注</label>
            <textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(event) => onChange("notes", event.target.value)}
              className="w-full resize-none rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] py-[10px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
            />
          </div>
        </div>

        <div className="mt-[28px] flex gap-[12px]">
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
            {saving ? "保存中..." : "确认"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  name,
  deleting,
  onCancel,
  onConfirm,
}: {
  name: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-[420px] rounded-[16px] bg-white p-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <h3 className="text-[18px] font-semibold text-[#272b30]">确认删除</h3>
        <p className="mt-[10px] text-[14px] text-[#6f767e]">确定删除设备“{name}”吗？此操作不可撤销。</p>
        <div className="mt-[24px] flex gap-[12px]">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-[44px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[14px] font-semibold text-[#6f767e]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-[44px] flex-1 rounded-[10px] bg-[#ff6a55] text-[14px] font-semibold text-white"
          >
            {deleting ? "删除中..." : "删除"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "maintenance":
      return "维护中";
    case "scrapped":
      return "已报废";
    default:
      return "正常";
  }
}

export function EquipmentPage() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [editingDevice, setEditingDevice] = useState<DeviceRecord | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<DeviceRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function loadDevices() {
    setLoading(true);
    setPageError("");
    try {
      setDevices(await fetchDevices());
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "设备列表加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDevices();
  }, []);

  const filteredDevices = useMemo(() => {
    const currentKeyword = keyword.trim().toLowerCase();
    if (!currentKeyword) {
      return devices;
    }
    return devices.filter((item) =>
      [item.deviceName, item.model, item.specification]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(currentKeyword)),
    );
  }, [devices, keyword]);

  function openCreate() {
    setEditingDevice(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(device: DeviceRecord) {
    setEditingDevice(device);
    setForm({
      deviceName: device.deviceName,
      model: device.model || "",
      specification: device.specification || "",
      purchaseDate: device.purchaseDate || "",
      purchasePrice: device.purchasePrice,
      dailyDepreciation: device.dailyDepreciation,
      monthlyRental: device.monthlyRental,
      status: device.status || "normal",
      notes: device.notes || "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.deviceName.trim()) {
      setPageError("设备名称不能为空");
      return;
    }

    setSaving(true);
    setPageError("");
    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, form);
      } else {
        await createDevice(form);
      }
      setEditingDevice(null);
      setForm(EMPTY_FORM);
      setShowModal(false);
      await loadDevices();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "保存设备失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingDevice) {
      return;
    }
    setDeleting(true);
    setPageError("");
    try {
      await deleteDevice(deletingDevice.id);
      setDeletingDevice(null);
      await loadDevices();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "删除设备失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="px-[40px] py-[40px]">
      <div className="mb-[28px] flex items-center justify-between">
        <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">设备管理</h1>
      </div>

      <div className="flex flex-col gap-[24px]">
        {pageError ? (
          <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#ad6800]">{pageError}</div>
        ) : null}

        <div className="flex items-center justify-between gap-[16px] rounded-[16px] bg-[#fcfcfc] px-[24px] py-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索设备名称、型号或规格"
            className="h-[40px] w-[320px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
          />
          <button type="button" onClick={openCreate} className="h-[40px] rounded-[10px] bg-[#272b30] px-[16px] text-[13px] font-semibold text-white">
            新增设备
          </button>
        </div>

        <div className="overflow-hidden rounded-[16px] bg-[#fcfcfc] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  {["设备名称", "型号", "规格", "采购日期", "日折旧", "月租金", "状态", "操作"].map((header) => (
                    <th key={header} className="px-[20px] py-[12px] text-left text-[12px] font-semibold whitespace-nowrap text-[#6f767e]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      设备列表加载中...
                    </td>
                  </tr>
                ) : filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      暂无设备数据
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device) => (
                    <tr key={device.id} className="border-b border-[#f4f4f4] last:border-b-0 transition-colors hover:bg-[#fafafa]">
                      <td className="px-[20px] py-[15px] text-[13px] font-semibold text-[#272b30]">{device.deviceName}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{device.model || "-"}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{device.specification || "-"}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{device.purchaseDate || "-"}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{device.dailyDepreciation ?? "-"}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{device.monthlyRental ?? "-"}</td>
                      <td className="px-[20px] py-[15px]">
                        <span className="inline-flex h-[26px] items-center rounded-[999px] bg-[#f4f4f4] px-[10px] text-[12px] font-semibold text-[#6f767e]">
                          {getStatusLabel(device.status)}
                        </span>
                      </td>
                      <td className="px-[20px] py-[15px]">
                        <div className="flex items-center gap-[8px]">
                          <button type="button" onClick={() => openEdit(device)} className="h-[30px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#272b30]">
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingDevice(device)}
                            className="h-[30px] rounded-[8px] border border-[#ff6a55]/20 bg-[#fff5f4] px-[12px] text-[12px] font-semibold text-[#ff6a55]"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal ? (
        <DeviceModal
          title={editingDevice ? "编辑设备" : "新增设备"}
          form={form}
          saving={saving}
          onChange={(field, value) =>
            setForm((prev) => ({
              ...prev,
              [field]:
                field === "purchasePrice" || field === "dailyDepreciation" || field === "monthlyRental"
                  ? value === ""
                    ? undefined
                    : Number(value)
                  : value,
            }))
          }
          onCancel={() => {
            setEditingDevice(null);
            setForm(EMPTY_FORM);
            setShowModal(false);
          }}
          onConfirm={() => void handleSave()}
        />
      ) : null}

      {deletingDevice ? (
        <DeleteModal
          name={deletingDevice.deviceName}
          deleting={deleting}
          onCancel={() => setDeletingDevice(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}
