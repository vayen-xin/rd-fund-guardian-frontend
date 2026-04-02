import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AttendanceRecord = {
  id: string;
  employeeId: string;
  name: string;
  duration: number;   // 打卡时长（小时）
  date: string;       // 打卡时间 YYYY-MM-DD
  source: "系统导入" | "手动录入";
};

type RecordForm = {
  employeeId: string;
  name: string;
  date: string;
  duration: string;
};

type LookupStatus = "idle" | "loading" | "ok" | "not-found" | "multiple";

// ─── Mock Employees（用于工号/姓名双向绑定）──────────────────────────────────
const MOCK_EMPLOYEES = [
  { employeeId: "EMP001", name: "张伟" },
  { employeeId: "EMP002", name: "李娜" },
  { employeeId: "EMP003", name: "王芳" },
  { employeeId: "EMP004", name: "刘洋" },
  { employeeId: "EMP005", name: "陈静" },
  { employeeId: "EMP006", name: "赵磊" },
  { employeeId: "EMP007", name: "孙丽" },
  { employeeId: "EMP008", name: "周强" },
  { employeeId: "EMP009", name: "李明" }, // 重名测试
  { employeeId: "EMP010", name: "李明" }, // 重名测试
];

// ─── Mock Records ─────────────────────────────────────────────────────────────
const initialRecords: AttendanceRecord[] = [
  { id: "1",  employeeId: "EMP001", name: "张伟", duration: 8.0, date: "2026-03-02", source: "系统导入" },
  { id: "2",  employeeId: "EMP002", name: "李娜", duration: 7.5, date: "2026-03-02", source: "系统导入" },
  { id: "3",  employeeId: "EMP004", name: "刘洋", duration: 8.0, date: "2026-03-02", source: "系统导入" },
  { id: "4",  employeeId: "EMP006", name: "赵磊", duration: 6.5, date: "2026-03-02", source: "系统导入" },
  { id: "5",  employeeId: "EMP001", name: "张伟", duration: 8.0, date: "2026-03-03", source: "系统导入" },
  { id: "6",  employeeId: "EMP002", name: "李娜", duration: 8.0, date: "2026-03-03", source: "系统导入" },
  { id: "7",  employeeId: "EMP004", name: "刘洋", duration: 7.5, date: "2026-03-03", source: "系统导入" },
  { id: "8",  employeeId: "EMP006", name: "赵磊", duration: 8.0, date: "2026-03-03", source: "系统导入" },
  { id: "9",  employeeId: "EMP001", name: "张伟", duration: 8.0, date: "2026-03-04", source: "系统导入" },
  { id: "10", employeeId: "EMP003", name: "王芳", duration: 4.0, date: "2026-03-04", source: "手动录入" },
  { id: "11", employeeId: "EMP004", name: "刘洋", duration: 8.0, date: "2026-03-04", source: "系统导入" },
  { id: "12", employeeId: "EMP007", name: "孙丽", duration: 8.0, date: "2026-03-04", source: "系统导入" },
  { id: "13", employeeId: "EMP001", name: "张伟", duration: 7.0, date: "2026-03-05", source: "系统导入" },
  { id: "14", employeeId: "EMP002", name: "李娜", duration: 8.0, date: "2026-03-05", source: "系统导入" },
  { id: "15", employeeId: "EMP003", name: "王芳", duration: 8.0, date: "2026-03-05", source: "系统导入" },
  { id: "16", employeeId: "EMP004", name: "刘洋", duration: 8.0, date: "2026-03-05", source: "系统导入" },
  { id: "17", employeeId: "EMP007", name: "孙丽", duration: 7.5, date: "2026-03-05", source: "系统导入" },
  { id: "18", employeeId: "EMP001", name: "张伟", duration: 8.0, date: "2026-03-06", source: "系统导入" },
  { id: "19", employeeId: "EMP002", name: "李娜", duration: 7.0, date: "2026-03-06", source: "系统导入" },
  { id: "20", employeeId: "EMP003", name: "王芳", duration: 8.0, date: "2026-03-06", source: "系统导入" },
  { id: "21", employeeId: "EMP005", name: "陈静", duration: 8.0, date: "2026-03-06", source: "系统导入" },
  { id: "22", employeeId: "EMP007", name: "孙丽", duration: 6.0, date: "2026-03-06", source: "手动录入" },
  { id: "23", employeeId: "EMP001", name: "张伟", duration: 8.0, date: "2026-03-09", source: "系统导入" },
  { id: "24", employeeId: "EMP002", name: "李娜", duration: 8.0, date: "2026-03-09", source: "系统导入" },
  { id: "25", employeeId: "EMP005", name: "陈静", duration: 7.5, date: "2026-03-09", source: "系统导入" },
  { id: "26", employeeId: "EMP008", name: "周强", duration: 8.0, date: "2026-03-09", source: "系统导入" },
  { id: "27", employeeId: "EMP001", name: "张伟", duration: 8.0, date: "2026-03-10", source: "系统导入" },
  { id: "28", employeeId: "EMP004", name: "刘洋", duration: 8.0, date: "2026-03-10", source: "系统导入" },
  { id: "29", employeeId: "EMP005", name: "陈静", duration: 8.0, date: "2026-03-10", source: "系统导入" },
  { id: "30", employeeId: "EMP008", name: "周强", duration: 7.0, date: "2026-03-10", source: "系统导入" },
  { id: "31", employeeId: "EMP001", name: "张伟", duration: 8.0, date: "2026-03-11", source: "系统导入" },
  { id: "32", employeeId: "EMP005", name: "陈静", duration: 8.0, date: "2026-03-11", source: "系统导入" },
];

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Monday-first
  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function padDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isInRange(dateStr: string, start: string, end: string): boolean {
  if (!start && !end) return false;
  if (start && end) return dateStr >= start && dateStr <= end;
  if (start) return dateStr >= start;
  return dateStr <= end;
}

function lookupByEmployeeId(id: string): LookupStatus {
  const found = MOCK_EMPLOYEES.filter((e) => e.employeeId === id.trim());
  if (found.length === 1) return "ok";
  if (found.length === 0) return "not-found";
  return "multiple";
}

function lookupByName(name: string): LookupStatus {
  const found = MOCK_EMPLOYEES.filter((e) => e.name === name.trim());
  if (found.length === 1) return "ok";
  if (found.length === 0) return "not-found";
  return "multiple";
}

// ─── Close Button ─────────────────────────────────────────────────────────────
function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-[32px] h-[32px] rounded-[8px] bg-[#f4f4f4] flex items-center justify-center text-[#6f767e] hover:text-[#272b30] transition-colors">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ─── Record Form Modal（添加 / 编辑）─────────────────────────────────────────
function RecordFormModal({
  title, initial, onConfirm, onCancel,
}: {
  title: string;
  initial?: Partial<RecordForm>;
  onConfirm: (form: RecordForm) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<RecordForm>({
    employeeId: initial?.employeeId ?? "",
    name: initial?.name ?? "",
    date: initial?.date ?? "",
    duration: initial?.duration ?? "",
  });
  const [idStatus, setIdStatus] = useState<LookupStatus>("idle");
  const [nameStatus, setNameStatus] = useState<LookupStatus>("idle");

  const set = (k: keyof RecordForm, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (k === "employeeId") { setIdStatus("idle"); setNameStatus("idle"); }
    if (k === "name") { setIdStatus("idle"); setNameStatus("idle"); }
  };

  const handleIdBlur = () => {
    if (!form.employeeId.trim()) return;
    setIdStatus("loading");
    setTimeout(() => {
      const found = MOCK_EMPLOYEES.filter((e) => e.employeeId === form.employeeId.trim());
      if (found.length === 1) {
        setForm((p) => ({ ...p, name: found[0].name }));
        setIdStatus("ok");
        setNameStatus("ok");
      } else if (found.length === 0) {
        setIdStatus("not-found");
      } else {
        setIdStatus("multiple");
      }
    }, 400);
  };

  const handleNameBlur = () => {
    if (!form.name.trim()) return;
    setNameStatus("loading");
    setTimeout(() => {
      const found = MOCK_EMPLOYEES.filter((e) => e.name === form.name.trim());
      if (found.length === 1) {
        setForm((p) => ({ ...p, employeeId: found[0].employeeId }));
        setNameStatus("ok");
        setIdStatus("ok");
      } else if (found.length === 0) {
        setNameStatus("not-found");
      } else {
        setNameStatus("multiple");
      }
    }, 400);
  };

  const hasWarning = idStatus === "not-found" || idStatus === "multiple" || nameStatus === "not-found" || nameStatus === "multiple";

  const inputCls = (warn: boolean) =>
    `h-[44px] px-[14px] rounded-[10px] border bg-[#f4f4f4] text-[#272b30] text-[14px] outline-none transition-colors ${warn ? "border-[#ff6a55] focus:border-[#ff6a55]" : "border-[#efefef] focus:border-[#272b30]"}`;

  const isValid = form.employeeId && form.name && form.date && form.duration && !hasWarning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[480px] p-[32px]">
        <div className="flex items-center justify-between mb-[24px]">
          <h3 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[#272b30] text-[18px]">{title}</h3>
          <CloseBtn onClick={onCancel} />
        </div>
        <div className="flex flex-col gap-[16px]">
          {/* 工号 */}
          <div className="flex flex-col gap-[6px]">
            <label className="font-medium text-[#6f767e] text-[13px]">工号</label>
            <div className="relative">
              <input
                type="text"
                placeholder="请输入工号，失焦后自动匹配姓名"
                value={form.employeeId}
                onChange={(e) => set("employeeId", e.target.value)}
                onBlur={handleIdBlur}
                className={inputCls(idStatus === "not-found" || idStatus === "multiple") + " w-full pr-[36px]"}
              />
              {idStatus === "loading" && (
                <div className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] border-2 border-[#272b30] border-t-transparent rounded-full animate-spin" />
              )}
              {idStatus === "ok" && (
                <svg className="absolute right-[12px] top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-6" stroke="#0d9f5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {(idStatus === "not-found" || idStatus === "multiple") && (
              <p className="text-[#ff6a55] text-[12px] flex items-center gap-[4px]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#ff6a55" strokeWidth="1.2" /><path d="M6 4v3M6 8.5v.2" stroke="#ff6a55" strokeWidth="1.2" strokeLinecap="round" /></svg>
                请确认人员信息
              </p>
            )}
          </div>

          {/* 姓名 */}
          <div className="flex flex-col gap-[6px]">
            <label className="font-medium text-[#6f767e] text-[13px]">姓名</label>
            <div className="relative">
              <input
                type="text"
                placeholder="请输入姓名，失焦后自动匹配工号"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={handleNameBlur}
                className={inputCls(nameStatus === "not-found" || nameStatus === "multiple") + " w-full pr-[36px]"}
              />
              {nameStatus === "loading" && (
                <div className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] border-2 border-[#272b30] border-t-transparent rounded-full animate-spin" />
              )}
              {nameStatus === "ok" && (
                <svg className="absolute right-[12px] top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-6" stroke="#0d9f5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {(nameStatus === "not-found" || nameStatus === "multiple") && (
              <p className="text-[#ff6a55] text-[12px] flex items-center gap-[4px]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#ff6a55" strokeWidth="1.2" /><path d="M6 4v3M6 8.5v.2" stroke="#ff6a55" strokeWidth="1.2" strokeLinecap="round" /></svg>
                请确认人员信息
              </p>
            )}
          </div>

          {/* 日期 */}
          <div className="flex flex-col gap-[6px]">
            <label className="font-medium text-[#6f767e] text-[13px]">打卡时间（日期）</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="h-[44px] px-[14px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[14px] outline-none focus:border-[#272b30] transition-colors"
            />
          </div>

          {/* 打卡时长 */}
          <div className="flex flex-col gap-[6px]">
            <label className="font-medium text-[#6f767e] text-[13px]">打卡时长（小时）</label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.1"
              placeholder="请输入时长，如 8.0"
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              className="h-[44px] px-[14px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[14px] outline-none focus:border-[#272b30] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-[12px] mt-[28px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button
            onClick={() => isValid && onConfirm(form)}
            disabled={!isValid}
            className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold hover:bg-[#1a1d1f] disabled:opacity-50 transition-colors"
          >确认</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ record, onConfirm, onCancel }: { record: AttendanceRecord; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[400px] p-[32px]">
        <div className="flex items-start gap-[16px] mb-[16px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-[#fff5f4] flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6h16M8 6V4h6v2M19 6l-1 13a2 2 0 01-2 2H6a2 2 0 01-2-2L3 6M9 11v4M13 11v4" stroke="#FF6A55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[#272b30] text-[18px]">确认删除</h3>
            <p className="text-[#6f767e] text-[14px] mt-[6px]">
              确定要删除{" "}
              <span className="text-[#272b30] font-semibold">「{record.name} · {record.date}」</span>{" "}
              的打卡记录吗？此操作不可撤销。
            </p>
          </div>
        </div>
        <div className="flex gap-[12px] mt-[24px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={onConfirm} className="flex-1 h-[44px] rounded-[10px] bg-[#ff6a55] text-white text-[14px] font-semibold hover:bg-[#e55a45] transition-colors">���除</button>
        </div>
      </div>
    </div>
  );
}

// ─── Import Preview Modal ─────────────────────────────────────────────────────
type ImportRow = { id: string } & RecordForm;

function ImportPreviewModal({ onClose, onImport }: { onClose: () => void; onImport: (rows: ImportRow[]) => void }) {
  const mockRows: ImportRow[] = [
    { id: "p1", employeeId: "EMP001", name: "张伟", date: "2026-03-12", duration: "8.0" },
    { id: "p2", employeeId: "EMP002", name: "李娜", date: "2026-03-12", duration: "7.5" },
    { id: "p3", employeeId: "EMP003", name: "王芳", date: "2026-03-12", duration: "8.0" },
    { id: "p4", employeeId: "EMP004", name: "刘洋", date: "2026-03-12", duration: "8.0" },
    { id: "p5", employeeId: "EMP005", name: "陈静", date: "2026-03-12", duration: "7.0" },
  ];

  const [rows, setRows] = useState<ImportRow[]>(mockRows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRow = rows.find((r) => r.id === editingId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[760px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-[32px] py-[24px] border-b border-[#f4f4f4]">
          <div>
            <h3 className="font-semibold text-[#272b30] text-[18px]">导入预览</h3>
            <p className="text-[#9a9fa5] text-[13px] mt-[2px]">共解析 {rows.length} 条打卡记录，请确认后导入</p>
          </div>
          <CloseBtn onClick={onClose} />
        </div>
        <div className="overflow-auto flex-1 px-[32px] py-[20px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {["工号", "姓名", "打卡时长（h）", "打卡时间", "操作"].map((h) => (
                  <th key={h} className="text-left px-[12px] py-[10px] text-[#6f767e] text-[12px] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-[#f4f4f4] ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                  <td className="px-[12px] py-[12px] text-[#6f767e] text-[13px] font-mono">{r.employeeId}</td>
                  <td className="px-[12px] py-[12px] text-[#272b30] text-[13px] font-semibold">{r.name}</td>
                  <td className="px-[12px] py-[12px] text-[#272b30] text-[13px]">{r.duration} h</td>
                  <td className="px-[12px] py-[12px] text-[#6f767e] text-[13px]">{r.date}</td>
                  <td className="px-[12px] py-[12px]">
                    <div className="flex gap-[8px]">
                      <button
                        onClick={() => setEditingId(r.id)}
                        className="px-[10px] h-[28px] rounded-[7px] border border-[#efefef] bg-white text-[#272b30] text-[12px] font-semibold hover:bg-[#f4f4f4]"
                      >修改</button>
                      <button
                        onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                        className="px-[10px] h-[28px] rounded-[7px] border border-[#ff6a55]/20 bg-[#fff5f4] text-[#ff6a55] text-[12px] font-semibold hover:bg-[#ffe8e5]"
                      >删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="text-center py-[32px] text-[#9a9fa5] text-[13px]">已删除全部记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex gap-[12px] px-[32px] py-[20px] border-t border-[#f4f4f4]">
          <button onClick={onClose} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4]">取消</button>
          <button
            onClick={() => onImport(rows)}
            disabled={rows.length === 0}
            className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold hover:bg-[#1a1d1f] disabled:opacity-50"
          >确认导入（{rows.length} 条）</button>
        </div>
      </div>

      {editingId && editingRow && (
        <RecordFormModal
          title="修改记录"
          initial={editingRow}
          onConfirm={(f) => {
            setRows((prev) => prev.map((r) => r.id === editingId ? { ...r, ...f } : r));
            setEditingId(null);
          }}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function CalendarView({
  records, rangeStart, rangeEnd,
}: {
  records: AttendanceRecord[];
  rangeStart: string;
  rangeEnd: string;
}) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const days = getCalendarDays(calYear, calMonth);

  // 当月有打卡记录的日期 → { date: duration_sum }
  const attendanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      if (!r.date.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, "0")}`)) return;
      map[r.date] = (map[r.date] ?? 0) + r.duration;
    });
    return map;
  }, [records, calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  return (
    <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-[24px]">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-[16px]">
        <button onClick={prevMonth} className="w-[32px] h-[32px] rounded-[8px] border border-[#efefef] bg-white flex items-center justify-center text-[#6f767e] hover:bg-[#f4f4f4] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span className="font-semibold text-[#272b30] text-[15px]">{calYear} 年 {MONTH_NAMES[calMonth]}</span>
        <button onClick={nextMonth} className="w-[32px] h-[32px] rounded-[8px] border border-[#efefef] bg-white flex items-center justify-center text-[#6f767e] hover:bg-[#f4f4f4] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-[8px]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[12px] text-[#9a9fa5] font-semibold py-[6px]">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-[4px]">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }
          const dateStr = padDate(calYear, calMonth, day);
          const hours = attendanceMap[dateStr];
          const hasPunch = hours !== undefined;
          const inRange = isInRange(dateStr, rangeStart, rangeEnd);

          return (
            <div
              key={dateStr}
              className={`rounded-[10px] p-[6px] min-h-[52px] flex flex-col items-center gap-[2px] transition-colors ${
                hasPunch
                  ? "bg-[#e6f9f0]"
                  : inRange
                  ? "bg-[#e8f4ff]"
                  : "bg-[#f4f4f4]"
              }`}
            >
              <span className={`text-[12px] font-semibold leading-none ${hasPunch ? "text-[#0d9f5f]" : inRange ? "text-[#2d7fd3]" : "text-[#9a9fa5]"}`}>
                {day}
              </span>
              {hasPunch && (
                <span className="text-[11px] text-[#0d9f5f] leading-none">{hours.toFixed(1)}h</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-[16px] mt-[16px] pt-[16px] border-t border-[#f4f4f4]">
        <div className="flex items-center gap-[6px]">
          <div className="w-[12px] h-[12px] rounded-[3px] bg-[#e6f9f0]" />
          <span className="text-[12px] text-[#6f767e]">有打卡记录</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <div className="w-[12px] h-[12px] rounded-[3px] bg-[#e8f4ff]" />
          <span className="text-[12px] text-[#6f767e]">查询日期范围</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <div className="w-[12px] h-[12px] rounded-[3px] bg-[#f4f4f4]" />
          <span className="text-[12px] text-[#6f767e]">无记录</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return (
    <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[#f4f4f4]">
      <p className="text-[#9a9fa5] text-[13px]">共 {total} 条，第 {page} / {totalPages} 页</p>
      <div className="flex items-center gap-[6px]">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="w-[32px] h-[32px] rounded-[8px] border border-[#efefef] bg-white flex items-center justify-center text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`d${i}`} className="w-[32px] flex justify-center text-[#9a9fa5] text-[13px]">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p as number)}
              className={`w-[32px] h-[32px] rounded-[8px] text-[13px] font-semibold transition-colors ${p === page ? "bg-[#272b30] text-white" : "border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4]"}`}
            >{p}</button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === Math.ceil(total / PAGE_SIZE)}
          className="w-[32px] h-[32px] rounded-[8px] border border-[#efefef] bg-white flex items-center justify-center text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Functional View ─────────────────────────────────────────────────────
function AttendanceMain() {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);

  // ── 区域二：筛选与统计 ──
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [queriedRecords, setQueriedRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [hasQueried, setHasQueried] = useState(false);

  const handleQuery = () => {
    const result = records.filter((r) => {
      const matchId = !filterEmployeeId || r.employeeId.includes(filterEmployeeId);
      const matchName = !filterName || r.name.includes(filterName);
      const matchRange = !filterDateStart && !filterDateEnd ? true : isInRange(r.date, filterDateStart, filterDateEnd);
      return matchId && matchName && matchRange;
    });
    setQueriedRecords(result);
    setHasQueried(true);
  };

  const handleResetQuery = () => {
    setFilterEmployeeId("");
    setFilterName("");
    setFilterDateStart("");
    setFilterDateEnd("");
    setQueriedRecords(records);
    setHasQueried(false);
  };

  // ── 区域二统计 ──
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const monthHours = queriedRecords.filter((r) => r.date.startsWith(currentMonth)).reduce((s, r) => s + r.duration, 0);

  // ── 区域三：打卡记录列表 ──
  const [listName, setListName] = useState("");
  const [listDate, setListDate] = useState("");
  const [listSource, setListSource] = useState<"全部" | "系统导入" | "手动录入">("全部");
  const [listPage, setListPage] = useState(1);

  const [showAdd, setShowAdd] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);

  const filteredList = useMemo(() => {
    return records.filter((r) => {
      const matchName = !listName || r.name.includes(listName);
      const matchDate = !listDate || r.date === listDate;
      const matchSrc = listSource === "全部" || r.source === listSource;
      return matchName && matchDate && matchSrc;
    });
  }, [records, listName, listDate, listSource]);

  const pagedList = useMemo(() => {
    const s = (listPage - 1) * PAGE_SIZE;
    return filteredList.slice(s, s + PAGE_SIZE);
  }, [filteredList, listPage]);

  // 添加记录
  const handleAdd = (form: RecordForm) => {
    const newRecord: AttendanceRecord = {
      id: `${Date.now()}`,
      employeeId: form.employeeId,
      name: form.name,
      duration: parseFloat(parseFloat(form.duration).toFixed(1)),
      date: form.date,
      source: "手动录入",
    };
    setRecords((prev) => [newRecord, ...prev]);
    setQueriedRecords((prev) => [newRecord, ...prev]);
    setShowAdd(false);
  };

  // 编辑记录
  const handleEdit = (form: RecordForm) => {
    if (!editingRecord) return;
    setRecords((prev) => prev.map((r) =>
      r.id === editingRecord.id
        ? { ...r, ...form, duration: parseFloat(parseFloat(form.duration).toFixed(1)), source: "��动录入" }
        : r
    ));
    setQueriedRecords((prev) => prev.map((r) =>
      r.id === editingRecord.id
        ? { ...r, ...form, duration: parseFloat(parseFloat(form.duration).toFixed(1)), source: "手动录入" }
        : r
    ));
    setEditingRecord(null);
  };

  // 删除记录
  const handleDelete = () => {
    if (!deletingRecord) return;
    setRecords((prev) => prev.filter((r) => r.id !== deletingRecord.id));
    setQueriedRecords((prev) => prev.filter((r) => r.id !== deletingRecord.id));
    setDeletingRecord(null);
  };

  // 批量导入
  const handleImport = (rows: ImportRow[]) => {
    const newRecords: AttendanceRecord[] = rows.map((r) => ({
      id: `imp-${Date.now()}-${r.id}`,
      employeeId: r.employeeId,
      name: r.name,
      duration: parseFloat(parseFloat(r.duration).toFixed(1)),
      date: r.date,
      source: "系统导入",
    }));
    setRecords((prev) => [...newRecords, ...prev]);
    setQueriedRecords((prev) => [...newRecords, ...prev]);
    setShowImportPreview(false);
  };

  const sourceColor = (s: "系统导入" | "手动录入") =>
    s === "系统导入"
      ? "bg-[#e8f0fe] text-[#3b5bdb]"
      : "bg-[#fff8e6] text-[#d48806]";

  return (
    <div className="flex flex-col gap-[28px]">
      {/* ── 区域一：模板与导入 ── */}
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-[24px]">
        <p className="font-semibold text-[#272b30] text-[15px] mb-[16px]">模板与导入</p>
        <div className="flex items-center gap-[12px] flex-wrap">
          {/* 下载模板 */}
          <button className="flex items-center gap-[8px] px-[16px] h-[40px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10M5.333 6.667L8 9.333l2.667-2.666M8 9.333V2" stroke="#272B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            下载导入模板
          </button>
          {/* 上传打卡记录 */}
          <button
            onClick={() => setShowImportPreview(true)}
            className="flex items-center gap-[8px] px-[16px] h-[40px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10M10.667 5.333L8 2.667 5.333 5.333M8 2.667V10" stroke="#272B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            上传打卡记录
          </button>
          {/* 数据添加 */}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-[8px] px-[16px] h-[40px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            数据添加
          </button>
        </div>
      </div>

      {/* ── 区域二：筛选与统计 + 日历 ── */}
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-[24px]">
        <p className="font-semibold text-[#272b30] text-[15px] mb-[16px]">筛选与统计</p>

        {/* Filter row */}
        <div className="flex items-end gap-[12px] flex-wrap mb-[20px]">
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#6f767e] text-[12px] font-medium">工号</label>
            <input
              type="text" placeholder="请输入工号" value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="h-[38px] px-[12px] w-[140px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#6f767e] text-[12px] font-medium">姓名</label>
            <input
              type="text" placeholder="请输入姓名" value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="h-[38px] px-[12px] w-[140px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#6f767e] text-[12px] font-medium">日期范围</label>
            <div className="flex items-center gap-[6px]">
              <input type="date" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)}
                className="h-[38px] px-[10px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
              />
              <span className="text-[#9a9fa5] text-[12px]">至</span>
              <input type="date" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)}
                className="h-[38px] px-[10px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
              />
            </div>
          </div>
          <button onClick={handleQuery}
            className="h-[38px] px-[16px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors">
            查询
          </button>
          <button onClick={handleResetQuery}
            className="h-[38px] px-[16px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors">
            重置
          </button>
        </div>

        {/* Calendar */}
        <CalendarView
          records={queriedRecords}
          rangeStart={hasQueried ? filterDateStart : ""}
          rangeEnd={hasQueried ? filterDateEnd : ""}
        />

        {/* Stats bar */}
        <div className="flex items-center gap-[24px] mt-[16px] pt-[16px] border-t border-[#f4f4f4]">
          <div className="flex items-center gap-[8px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#272b30]" />
            <span className="text-[#6f767e] text-[13px]">筛选结果：</span>
            <span className="text-[#272b30] text-[13px] font-semibold">共 {queriedRecords.length} 条记录</span>
          </div>
          <div className="w-[1px] h-[16px] bg-[#efefef]" />
          <div className="flex items-center gap-[8px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#0d9f5f]" />
            <span className="text-[#6f767e] text-[13px]">本月工时：</span>
            <span className="text-[#0d9f5f] text-[13px] font-semibold">{monthHours.toFixed(1)} 小时</span>
          </div>
        </div>
      </div>

      {/* ── 区域三：打卡记录列表 ── */}
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* List header + filters */}
        <div className="px-[24px] py-[20px] border-b border-[#f4f4f4]">
          <p className="font-semibold text-[#272b30] text-[15px] mb-[14px]">打卡记录列表</p>
          <div className="flex items-end gap-[10px] flex-wrap">
            <div className="flex flex-col gap-[5px]">
              <label className="text-[#6f767e] text-[12px] font-medium">姓名</label>
              <input
                type="text" placeholder="请输入姓名" value={listName}
                onChange={(e) => { setListName(e.target.value); setListPage(1); }}
                className="h-[36px] px-[10px] w-[140px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <label className="text-[#6f767e] text-[12px] font-medium">日期</label>
              <input
                type="date" value={listDate}
                onChange={(e) => { setListDate(e.target.value); setListPage(1); }}
                className="h-[36px] px-[10px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <label className="text-[#6f767e] text-[12px] font-medium">数据来源</label>
              <select
                value={listSource}
                onChange={(e) => { setListSource(e.target.value as typeof listSource); setListPage(1); }}
                className="h-[36px] px-[10px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors appearance-none pr-[28px] cursor-pointer"
              >
                <option value="全部">全部</option>
                <option value="系统导入">系统导入</option>
                <option value="手动录入">手动录入</option>
              </select>
            </div>
            {(listName || listDate || listSource !== "全部") && (
              <button
                onClick={() => { setListName(""); setListDate(""); setListSource("全部"); setListPage(1); }}
                className="h-[36px] px-[12px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors"
              >重置</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {["序号", "工号", "姓名", "打卡时长", "打卡时间", "数据来源", "操作"].map((h) => (
                  <th key={h} className="text-left px-[20px] py-[12px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedList.map((r, i) => (
                <tr key={r.id} className="border-b border-[#f4f4f4] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-[20px] py-[15px] text-[#9a9fa5] text-[13px] whitespace-nowrap">
                    {(listPage - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px] whitespace-nowrap font-mono">{r.employeeId}</td>
                  <td className="px-[20px] py-[15px] text-[#272b30] text-[13px] font-semibold whitespace-nowrap">{r.name}</td>
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <span className="text-[#272b30] text-[13px]">{r.duration.toFixed(1)}</span>
                    <span className="text-[#9a9fa5] text-[12px] ml-[2px]">h</span>
                  </td>
                  <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px] whitespace-nowrap">{r.date}</td>
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <span className={`px-[8px] py-[3px] rounded-[6px] text-[12px] font-semibold ${sourceColor(r.source)}`}>{r.source}</span>
                  </td>
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <div className="flex gap-[8px]">
                      <button
                        onClick={() => setEditingRecord(r)}
                        className="px-[12px] h-[30px] rounded-[8px] border border-[#efefef] bg-white text-[#272b30] text-[12px] font-semibold hover:bg-[#f4f4f4] transition-colors"
                      >编辑</button>
                      <button
                        onClick={() => setDeletingRecord(r)}
                        className="px-[12px] h-[30px] rounded-[8px] border border-[#ff6a55]/20 bg-[#fff5f4] text-[#ff6a55] text-[12px] font-semibold hover:bg-[#ffe8e5] transition-colors"
                      >删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedList.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-[48px] text-[#9a9fa5] text-[14px]">暂无符合条件的打卡记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filteredList.length} page={listPage} onPage={setListPage} />
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <RecordFormModal title="数据添加" onConfirm={handleAdd} onCancel={() => setShowAdd(false)} />
      )}
      {editingRecord && (
        <RecordFormModal
          title="编辑打卡记录"
          initial={{ employeeId: editingRecord.employeeId, name: editingRecord.name, date: editingRecord.date, duration: String(editingRecord.duration) }}
          onConfirm={handleEdit}
          onCancel={() => setEditingRecord(null)}
        />
      )}
      {deletingRecord && (
        <DeleteModal record={deletingRecord} onConfirm={handleDelete} onCancel={() => setDeletingRecord(null)} />
      )}
      {showImportPreview && (
        <ImportPreviewModal onClose={() => setShowImportPreview(false)} onImport={handleImport} />
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export function AttendancePage() {
  return (
    <div className="px-[40px] py-[40px]">
      <div className="flex items-center justify-between mb-[28px]">
        <h1 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">
          打卡记录导入
        </h1>
      </div>
      <AttendanceMain />
    </div>
  );
}
