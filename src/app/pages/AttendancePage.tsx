import { useEffect, useMemo, useRef, useState } from "react";
import {
  confirmAttendanceImport,
  createAttendance,
  deleteAttendance,
  downloadAttendanceTemplate,
  fetchAttendance,
  lookupAttendanceEmployee,
  previewAttendanceImport,
  updateAttendance,
  type AttendanceImportPreview,
  type AttendanceImportRow,
  type AttendanceRecord,
  type AttendanceSavePayload,
} from "../api/attendance";
import { fetchAllProjects, type BackendProject } from "../api/projects";

type FormState = {
  employeeId: string;
  name: string;
  projectCode: string;
  date: string;
  duration: string;
};

const EMPTY_FORM: FormState = {
  employeeId: "",
  name: "",
  projectCode: "",
  date: "",
  duration: "",
};

function formatSource(source?: string) {
  return source === "系统导入" ? "系统导入" : "手动录入";
}

function RecordModal({
  title,
  form,
  saving,
  onChange,
  onLookupEmployeeId,
  onLookupName,
  onCancel,
  onConfirm,
}: {
  title: string;
  form: FormState;
  saving: boolean;
  onChange: (field: keyof FormState, value: string) => void;
  onLookupEmployeeId: () => void;
  onLookupName: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-[520px] rounded-[16px] bg-white p-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <h3 className="mb-[24px] text-[18px] font-semibold text-[#272b30]">{title}</h3>
        <div className="grid grid-cols-2 gap-[16px]">
          <div>
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">工号</label>
            <input
              value={form.employeeId}
              onChange={(event) => onChange("employeeId", event.target.value)}
              onBlur={onLookupEmployeeId}
              placeholder="输入工号自动匹配姓名"
              className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
            />
          </div>
          <div>
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">姓名</label>
            <input
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              onBlur={onLookupName}
              placeholder="输入姓名自动匹配工号"
              className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
            />
          </div>
          <div>
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">项目号</label>
            <input
              value={form.projectCode}
              onChange={(event) => onChange("projectCode", event.target.value)}
              placeholder="请输入项目号"
              className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
            />
          </div>
          <div>
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">打卡日期</label>
            <input
              type="date"
              value={form.date}
              onChange={(event) => onChange("date", event.target.value)}
              className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">工时（小时）</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.duration}
              onChange={(event) => onChange("duration", event.target.value)}
              className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
            />
          </div>
        </div>

        <div className="mt-[28px] flex gap-[12px]">
          <button type="button" onClick={onCancel} disabled={saving} className="h-[44px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[14px] font-semibold text-[#6f767e]">
            取消
          </button>
          <button type="button" onClick={onConfirm} disabled={saving} className="h-[44px] flex-1 rounded-[10px] bg-[#272b30] text-[14px] font-semibold text-white">
            {saving ? "保存中..." : "确认"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportPreviewModal({
  preview,
  importing,
  onClose,
  onConfirm,
}: {
  preview: AttendanceImportPreview;
  importing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex max-h-[calc(100vh-48px)] w-[980px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_16px_64px_rgba(0,0,0,0.18)]">
        <div className="border-b border-[#f4f4f4] px-[28px] py-[22px]">
          <h3 className="text-[20px] font-semibold text-[#272b30]">导入预览</h3>
          <p className="mt-[6px] text-[13px] text-[#9a9fa5]">
            成功 {preview.successCount} 条，失败 {preview.failedCount} 条。确认后将按工号 + 项目号 + 日期覆盖导入。
          </p>
        </div>

        <div className="flex-1 overflow-auto p-[24px]">
          <div className="overflow-hidden rounded-[14px] border border-[#f4f4f4]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  {["工号", "姓名", "项目号", "日期", "工时"].map((header) => (
                    <th key={header} className="px-[16px] py-[12px] text-left text-[12px] font-semibold text-[#6f767e]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, index) => (
                  <tr key={`${row.employeeId}-${row.projectCode}-${row.date}-${index}`} className="border-b border-[#f4f4f4] last:border-b-0">
                    <td className="px-[16px] py-[12px] text-[13px] text-[#6f767e]">{row.employeeId}</td>
                    <td className="px-[16px] py-[12px] text-[13px] font-semibold text-[#272b30]">{row.name}</td>
                    <td className="px-[16px] py-[12px] text-[13px] text-[#6f767e]">{row.projectCode}</td>
                    <td className="px-[16px] py-[12px] text-[13px] text-[#6f767e]">{row.date}</td>
                    <td className="px-[16px] py-[12px] text-[13px] text-[#6f767e]">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-[12px] border-t border-[#f4f4f4] px-[28px] py-[20px]">
          <button type="button" onClick={onClose} className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[18px] text-[13px] font-semibold text-[#6f767e]">
            取消
          </button>
          <button type="button" onClick={onConfirm} disabled={importing} className="h-[40px] rounded-[10px] bg-[#272b30] px-[18px] text-[13px] font-semibold text-white disabled:opacity-50">
            {importing ? "导入中..." : "确认导入"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AttendancePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [projectOptions, setProjectOptions] = useState<BackendProject[]>([]);
  const [templateProjectId, setTemplateProjectId] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [importMonth, setImportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [preview, setPreview] = useState<AttendanceImportPreview | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function loadRecords() {
    setLoading(true);
    setPageError("");
    try {
      setRecords(
        await fetchAttendance({
          employeeId: employeeId || undefined,
          name: name || undefined,
          projectCode: projectCode || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      );
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "打卡记录加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      const response = await fetchAllProjects();
      setProjectOptions(response.records);
    } catch {
      // ignore to keep attendance page usable
    }
  }

  useEffect(() => {
    void loadRecords();
    void loadProjects();
  }, []);

  const totalHours = useMemo(() => records.reduce((sum, item) => sum + Number(item.duration || 0), 0), [records]);

  async function handleLookupByEmployeeId() {
    if (!form.employeeId.trim()) {
      return;
    }
    try {
      const data = await lookupAttendanceEmployee({ employeeId: form.employeeId.trim() });
      setForm((prev) => ({ ...prev, employeeId: data.employeeId, name: data.name }));
    } catch {
      // ignore
    }
  }

  async function handleLookupByName() {
    if (!form.name.trim()) {
      return;
    }
    try {
      const data = await lookupAttendanceEmployee({ name: form.name.trim() });
      setForm((prev) => ({ ...prev, employeeId: data.employeeId, name: data.name }));
    } catch {
      // ignore
    }
  }

  function openCreate() {
    setEditingRecord(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(record: AttendanceRecord) {
    setEditingRecord(record);
    setForm({
      employeeId: record.employeeId,
      name: record.name,
      projectCode: record.projectCode,
      date: record.date,
      duration: String(record.duration),
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.employeeId.trim() || !form.name.trim() || !form.projectCode.trim() || !form.date || !form.duration) {
      setPageError("工号、姓名、项目号、日期和工时不能为空");
      return;
    }

    const payload: AttendanceSavePayload = {
      employeeId: form.employeeId.trim(),
      name: form.name.trim(),
      projectCode: form.projectCode.trim(),
      date: form.date,
      duration: Number(form.duration),
    };

    setSaving(true);
    setPageError("");
    try {
      if (editingRecord) {
        await updateAttendance(editingRecord.id, payload);
      } else {
        await createAttendance(payload);
      }
      setEditingRecord(null);
      setForm(EMPTY_FORM);
      setShowModal(false);
      await loadRecords();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "保存打卡记录失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record: AttendanceRecord) {
    if (!window.confirm(`确定删除 ${record.name} 在 ${record.date} 的打卡记录吗？`)) {
      return;
    }
    setPageError("");
    try {
      await deleteAttendance(record.id);
      await loadRecords();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "删除打卡记录失败");
    }
  }

  async function handleUploadFile(file: File) {
    if (!importMonth) {
      setPageError("请先选择导入月份");
      return;
    }
    setPageError("");
    try {
      const previewResult = await previewAttendanceImport(file, importMonth);
      setPreview(previewResult);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "预解析打卡文件失败");
    }
  }

  async function handleConfirmImport() {
    if (!preview) {
      return;
    }
    setImporting(true);
    setPageError("");
    try {
      await confirmAttendanceImport(preview.rows as AttendanceImportRow[]);
      setPreview(null);
      await loadRecords();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "确认导入失败");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="px-[40px] py-[40px]">
      <div className="mb-[28px] flex items-center justify-between">
        <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">打卡记录导入</h1>
      </div>

      <div className="flex flex-col gap-[24px]">
        {pageError ? (
          <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#ad6800]">{pageError}</div>
        ) : null}

        <div className="rounded-[16px] bg-[#fcfcfc] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-end gap-[12px]">
            <div>
              <label className="mb-[6px] block text-[12px] font-medium text-[#6f767e]">模板项目</label>
              <select
                value={templateProjectId}
                onChange={(event) => setTemplateProjectId(event.target.value)}
                className="h-[40px] min-w-[220px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] outline-none focus:border-[#272b30]"
              >
                <option value="">通用模板</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-[6px] block text-[12px] font-medium text-[#6f767e]">导入月份</label>
              <input
                type="month"
                value={importMonth}
                onChange={(event) => setImportMonth(event.target.value)}
                className="h-[40px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] outline-none focus:border-[#272b30]"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                void downloadAttendanceTemplate({
                  projectId: templateProjectId || undefined,
                  month: importMonth || undefined,
                })
              }
              className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[16px] text-[13px] font-semibold text-[#272b30]"
            >
              下载导入模板
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[16px] text-[13px] font-semibold text-[#272b30]"
            >
              上传打卡记录
            </button>
            <button type="button" onClick={openCreate} className="h-[40px] rounded-[10px] bg-[#272b30] px-[16px] text-[13px] font-semibold text-white">
              数据添加
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleUploadFile(file);
                }
                event.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        <div className="rounded-[16px] bg-[#fcfcfc] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="mb-[16px] flex flex-wrap items-end gap-[12px]">
            <div>
              <label className="mb-[6px] block text-[12px] font-medium text-[#6f767e]">工号</label>
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="h-[40px] w-[160px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] outline-none focus:border-[#272b30]" />
            </div>
            <div>
              <label className="mb-[6px] block text-[12px] font-medium text-[#6f767e]">姓名</label>
              <input value={name} onChange={(event) => setName(event.target.value)} className="h-[40px] w-[160px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] outline-none focus:border-[#272b30]" />
            </div>
            <div>
              <label className="mb-[6px] block text-[12px] font-medium text-[#6f767e]">项目号</label>
              <input value={projectCode} onChange={(event) => setProjectCode(event.target.value)} className="h-[40px] w-[160px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] outline-none focus:border-[#272b30]" />
            </div>
            <div>
              <label className="mb-[6px] block text-[12px] font-medium text-[#6f767e]">开始日期</label>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-[40px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] outline-none focus:border-[#272b30]" />
            </div>
            <div>
              <label className="mb-[6px] block text-[12px] font-medium text-[#6f767e]">结束日期</label>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-[40px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] outline-none focus:border-[#272b30]" />
            </div>
            <button type="button" onClick={() => void loadRecords()} className="h-[40px] rounded-[10px] bg-[#272b30] px-[16px] text-[13px] font-semibold text-white">
              查询
            </button>
            <button
              type="button"
              onClick={() => {
                setEmployeeId("");
                setName("");
                setProjectCode("");
                setStartDate("");
                setEndDate("");
                void loadRecords();
              }}
              className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[16px] text-[13px] font-semibold text-[#6f767e]"
            >
              重置
            </button>
            <div className="ml-auto rounded-[12px] bg-[#f4f4f4] px-[16px] py-[10px] text-[13px] text-[#6f767e]">
              当前共 <span className="font-semibold text-[#272b30]">{records.length}</span> 条，累计 <span className="font-semibold text-[#272b30]">{totalHours.toFixed(1)}</span> 小时
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[16px] bg-[#fcfcfc] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  {["工号", "姓名", "项目号", "日期", "工时", "来源", "操作"].map((header) => (
                    <th key={header} className="px-[20px] py-[12px] text-left text-[12px] font-semibold text-[#6f767e]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      打卡记录加载中...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      暂无打卡记录
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-b border-[#f4f4f4] last:border-b-0 transition-colors hover:bg-[#fafafa]">
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{record.employeeId}</td>
                      <td className="px-[20px] py-[15px] text-[13px] font-semibold text-[#272b30]">{record.name}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{record.projectCode}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{record.date}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{record.duration}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{formatSource(record.source)}</td>
                      <td className="px-[20px] py-[15px]">
                        <div className="flex items-center gap-[8px]">
                          <button type="button" onClick={() => openEdit(record)} className="h-[30px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#272b30]">
                            编辑
                          </button>
                          <button type="button" onClick={() => void handleDelete(record)} className="h-[30px] rounded-[8px] border border-[#ff6a55]/20 bg-[#fff5f4] px-[12px] text-[12px] font-semibold text-[#ff6a55]">
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
        <RecordModal
          title={editingRecord ? "编辑打卡记录" : "数据添加"}
          form={form}
          saving={saving}
          onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
          onLookupEmployeeId={() => void handleLookupByEmployeeId()}
          onLookupName={() => void handleLookupByName()}
          onCancel={() => {
            setEditingRecord(null);
            setForm(EMPTY_FORM);
            setShowModal(false);
          }}
          onConfirm={() => void handleSave()}
        />
      ) : null}

      {preview ? (
        <ImportPreviewModal preview={preview} importing={importing} onClose={() => setPreview(null)} onConfirm={() => void handleConfirmImport()} />
      ) : null}
    </div>
  );
}
