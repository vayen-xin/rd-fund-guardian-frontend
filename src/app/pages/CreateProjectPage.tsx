import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

// ─── Types ────────────────────────────────────────────────────────────────────
type PersonnelItem = {
  employeeId: string;
  name: string;
  department: string;
};

type DeviceItem = {
  deviceId: string;
  name: string;
  depreciationRate: number;
  category: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const TODAY = "2026-03-01";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const allPersonnel: PersonnelItem[] = [
  { employeeId: "EMP001", name: "张伟",  department: "研发部" },
  { employeeId: "EMP002", name: "李娜",  department: "研发部" },
  { employeeId: "EMP003", name: "王芳",  department: "测试部" },
  { employeeId: "EMP004", name: "刘洋",  department: "研发部" },
  { employeeId: "EMP005", name: "陈静",  department: "算法部" },
  { employeeId: "EMP006", name: "赵磊",  department: "测试部" },
  { employeeId: "EMP007", name: "孙丽",  department: "外包团队" },
  { employeeId: "EMP008", name: "周强",  department: "运维部" },
  { employeeId: "EMP009", name: "吴艳",  department: "测试部" },
  { employeeId: "EMP010", name: "郑华",  department: "研发部" },
  { employeeId: "EMP011", name: "马超",  department: "外包团队" },
  { employeeId: "EMP012", name: "韩梅",  department: "算法部" },
];

const allDevices: DeviceItem[] = [
  { deviceId: "SM001", name: "冲压机 A",   depreciationRate: 45, category: "成型设备" },
  { deviceId: "SM002", name: "缝纫机 B",   depreciationRate: 28, category: "缝制设备" },
  { deviceId: "SM003", name: "裁断机 C",   depreciationRate: 36, category: "裁剪设备" },
  { deviceId: "SM004", name: "打包机 D",   depreciationRate: 22, category: "包装设备" },
  { deviceId: "SM005", name: "焊接机 E",   depreciationRate: 58, category: "焊接设备" },
  { deviceId: "SM006", name: "打标机 F",   depreciationRate: 31, category: "标记设备" },
  { deviceId: "SM007", name: "激光切割机", depreciationRate: 75, category: "切割设备" },
  { deviceId: "SM008", name: "数控机床",   depreciationRate: 90, category: "加工设备" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center gap-[10px] px-[24px] py-[18px] border-b border-[#f4f4f4]">
        <span className="text-[16px]">{icon}</span>
        <span className="font-semibold text-[#272b30] text-[15px]">{title}</span>
      </div>
      <div className="px-[24px] py-[20px]">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-[#272b30] text-[13px] font-semibold flex items-center gap-[5px]">
        {label}
        {required && <span className="text-[#ff4d4f] text-[12px]">*</span>}
        {hint && <span className="text-[#9a9fa5] text-[12px] font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// Employee search dropdown
function EmployeeSearch({ selected, onAdd }: { selected: PersonnelItem[]; onAdd: (emp: PersonnelItem) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(selected.map((e) => e.employeeId));
  const filtered = allPersonnel.filter((p) => {
    if (selectedIds.has(p.employeeId)) return false;
    if (!query) return true;
    return p.name.includes(query) || p.employeeId.toLowerCase().includes(query.toLowerCase()) || p.department.includes(query);
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center gap-[8px] h-[42px] px-[12px] rounded-[10px] border ${open ? "border-[#272b30]" : "border-[#efefef]"} bg-[#f4f4f4] transition-colors`}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
          <path d="M6 11A5 5 0 106 1a5 5 0 000 10zM13 13l-3-3" stroke="#9A9FA5" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          placeholder="输入姓名、工号或部门搜索员工…"
          className="flex-1 bg-transparent text-[13px] text-[#272b30] placeholder-[#9a9fa5] outline-none" />
        {query && <button onClick={() => { setQuery(""); setOpen(false); }} className="text-[#9a9fa5] hover:text-[#272b30]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </button>}
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-[46px] z-30 bg-white rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#f4f4f4] max-h-[240px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-[24px] text-center text-[#9a9fa5] text-[13px]">{query ? `未找到"${query}"相关员工` : "所有员工已全部添加"}</div>
          ) : filtered.map((emp) => (
            <button key={emp.employeeId} onClick={() => { onAdd(emp); setQuery(""); setOpen(false); }}
              className="w-full flex items-center gap-[12px] px-[14px] py-[11px] hover:bg-[#f4f4f4] transition-colors text-left">
              <div className="w-[32px] h-[32px] rounded-full bg-[#272b30] flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0">{emp.name.slice(-1)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[#272b30] text-[13px] font-semibold">{emp.name}</p>
                <p className="text-[#9a9fa5] text-[11px]">{emp.employeeId} · {emp.department}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Device search dropdown
function DeviceSearch({ selected, onAdd }: { selected: DeviceItem[]; onAdd: (dev: DeviceItem) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(selected.map((d) => d.deviceId));
  const filtered = allDevices.filter((d) => {
    if (selectedIds.has(d.deviceId)) return false;
    if (!query) return true;
    return d.name.includes(query) || d.deviceId.toLowerCase().includes(query.toLowerCase()) || d.category.includes(query);
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center gap-[8px] h-[42px] px-[12px] rounded-[10px] border ${open ? "border-[#272b30]" : "border-[#efefef]"} bg-[#f4f4f4] transition-colors`}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
          <path d="M6 11A5 5 0 106 1a5 5 0 000 10zM13 13l-3-3" stroke="#9A9FA5" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          placeholder="输入设备名称、编号或类别搜索…"
          className="flex-1 bg-transparent text-[13px] text-[#272b30] placeholder-[#9a9fa5] outline-none" />
        {query && <button onClick={() => { setQuery(""); setOpen(false); }} className="text-[#9a9fa5] hover:text-[#272b30]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </button>}
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-[46px] z-30 bg-white rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#f4f4f4] max-h-[240px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-[24px] text-center text-[#9a9fa5] text-[13px]">{query ? `未找到"${query}"相关设备` : "所有设备已全部添加"}</div>
          ) : filtered.map((dev) => (
            <button key={dev.deviceId} onClick={() => { onAdd(dev); setQuery(""); setOpen(false); }}
              className="w-full flex items-center gap-[12px] px-[14px] py-[11px] hover:bg-[#f4f4f4] transition-colors text-left">
              <div className="w-[32px] h-[32px] rounded-[8px] bg-[#f4f4f4] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="#6F767E" strokeWidth="1.3" /><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="#6F767E" strokeWidth="1.3" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#272b30] text-[13px] font-semibold">{dev.name}</p>
                <p className="text-[#9a9fa5] text-[11px]">{dev.deviceId} · {dev.category}</p>
              </div>
              <span className="text-[#0d9f5f] text-[12px] font-semibold flex-shrink-0">¥{dev.depreciationRate}/h</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Save confirm modal
function SaveConfirmModal({ name, startDate, empCount, devCount, onConfirm, onCancel }: {
  name: string; startDate: string; empCount: number; devCount: number;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[440px] p-[32px]">
        <div className="flex items-start gap-[14px] mb-[20px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 3v9M11 15v1" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" />
              <circle cx="11" cy="11" r="9" stroke="#3b5bdb" strokeWidth="1.8" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[#272b30] text-[18px]">确认创建项目？</h3>
            <p className="text-[#6f767e] text-[13px] mt-[4px]">请核对以下信息，确认无误后提交</p>
          </div>
        </div>
        <div className="bg-[#fafafa] rounded-[12px] p-[16px] mb-[20px] flex flex-col gap-[10px]">
          {[
            { label: "项目名称", value: name },
            { label: "开始时间", value: startDate },
            { label: "关联员工", value: `${empCount} 人` },
            { label: "关联设备", value: `${devCount} 台` },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-[#9a9fa5] text-[13px]">{r.label}</span>
              <span className="text-[#272b30] text-[13px] font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="bg-[#e6f9f0] rounded-[10px] px-[14px] py-[10px] mb-[24px]">
          <p className="text-[#0d9f5f] text-[12px] leading-[18px]">
            💡 员工类型与关联系数将在「月度总结」中按月独立配置（正式 0.60~0.80 / 兼职 0.40~0.60），保存后可随时调整。
          </p>
        </div>
        <div className="flex gap-[12px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={onConfirm} className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold hover:bg-[#1a1d1f] transition-colors">确认保存</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Functional View ─────────────────────────────────────────────────────
function CreateProjectMain() {
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<PersonnelItem[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<DeviceItem[]>([]);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRemoveEmployee = (id: string) => setSelectedEmployees((prev) => prev.filter((e) => e.employeeId !== id));
  const handleRemoveDevice = (id: string) => setSelectedDevices((prev) => prev.filter((d) => d.deviceId !== id));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!projectName.trim()) errs.name = "请输入项目名称";
    if (!startDate) errs.startDate = "请选择开始时间";
    if (description.length > 200) errs.description = "描述不能超过 200 字";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => { if (!validate()) return; setShowSaveConfirm(true); };
  const handleConfirmSave = () => { setShowSaveConfirm(false); navigate("/projects"); };

  return (
    <div className="flex flex-col gap-[20px]">

      {/* ── 基础信息 ── */}
      <SectionCard icon="📋" title="基础信息">
        <div className="grid grid-cols-2 gap-[20px]">
          <Field label="项目名称" required>
            <input value={projectName} onChange={(e) => { setProjectName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
              placeholder="请输入项目名称"
              className={`h-[42px] px-[12px] rounded-[10px] border ${errors.name ? "border-[#ff4d4f] bg-[#fff2f0]" : "border-[#efefef] bg-[#f4f4f4]"} text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors`} />
            {errors.name && <p className="text-[#ff4d4f] text-[12px]">{errors.name}</p>}
          </Field>
          <Field label="开���时间" required>
            <input type="date" value={startDate} max={TODAY}
              onChange={(e) => { setStartDate(e.target.value); setErrors((p) => ({ ...p, startDate: "" })); }}
              className={`h-[42px] px-[12px] rounded-[10px] border ${errors.startDate ? "border-[#ff4d4f] bg-[#fff2f0]" : "border-[#efefef] bg-[#f4f4f4]"} text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors`} />
            {errors.startDate && <p className="text-[#ff4d4f] text-[12px]">{errors.startDate}</p>}
          </Field>
          <div className="col-span-2">
            <Field label="项目描述" hint="（选填，200字内）">
              <div className="relative">
                <textarea value={description} onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }}
                  placeholder="请简要描述项目目标、背景及主要内容…" rows={3}
                  className={`w-full px-[12px] py-[10px] rounded-[10px] border ${description.length > 200 ? "border-[#ff4d4f] bg-[#fff2f0]" : "border-[#efefef] bg-[#f4f4f4]"} text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors resize-none`} />
                <span className={`absolute bottom-[10px] right-[12px] text-[11px] ${description.length > 200 ? "text-[#ff4d4f]" : "text-[#9a9fa5]"}`}>{description.length}/200</span>
              </div>
              {description.length > 200 && <p className="text-[#ff4d4f] text-[12px]">描述不能超过 200 字</p>}
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* ── 关联员工 ── */}
      <SectionCard icon="👥" title={`关联员工${selectedEmployees.length > 0 ? `（已选 ${selectedEmployees.length} 人）` : ""}`}>
        <div className="flex flex-col gap-[16px]">
          <EmployeeSearch selected={selectedEmployees} onAdd={(emp) => setSelectedEmployees((prev) => [...prev, emp])} />
          {selectedEmployees.length > 0 && (
            <div className="rounded-[12px] border border-[#f4f4f4] overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f4f4f4]">
                    {["序号", "姓名", "工号", "部门", "操作"].map((h) => (
                      <th key={h} className="text-left px-[14px] py-[10px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedEmployees.map((emp, i) => (
                    <tr key={emp.employeeId} className="border-t border-[#f4f4f4] hover:bg-[#fafafa] transition-colors">
                      <td className="px-[14px] py-[12px] text-[#9a9fa5] text-[13px]">{i + 1}</td>
                      <td className="px-[14px] py-[12px]">
                        <div className="flex items-center gap-[8px]">
                          <div className="w-[26px] h-[26px] rounded-full bg-[#272b30] flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">{emp.name.slice(-1)}</div>
                          <span className="text-[#272b30] text-[13px] font-semibold">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-[14px] py-[12px] text-[#6f767e] text-[13px] font-mono">{emp.employeeId}</td>
                      <td className="px-[14px] py-[12px] text-[#6f767e] text-[13px]">{emp.department}</td>
                      <td className="px-[14px] py-[12px]">
                        <button onClick={() => handleRemoveEmployee(emp.employeeId)}
                          className="w-[28px] h-[28px] rounded-[7px] bg-[#fff2f0] text-[#ff4d4f] hover:bg-[#ffccc7] transition-colors flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="bg-[#e6f9f0] rounded-[10px] px-[14px] py-[10px]">
            <p className="text-[#0d9f5f] text-[12px] leading-[18px]">
              💡 <span className="text-[#272b30] font-semibold">员工类型与系数说明：</span>员工的正式/兼职类型及关联系数将在「月度总结」页面按月独立配置，系数范围：正式员工 0.60~0.80，兼职员工 0.40~0.60，系统自动生成并支持手动调整。
            </p>
          </div>
          {selectedEmployees.length === 0 && (
            <div className="flex flex-col items-center py-[24px] text-[#9a9fa5]">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="mb-[8px] opacity-40">
                <circle cx="18" cy="13" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 30c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-[13px]">暂未关联员工，请使用上方搜索框添加</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── 关联设备 ── */}
      <SectionCard icon="💻" title={`关联设备${selectedDevices.length > 0 ? `（已选 ${selectedDevices.length} 台）` : ""}`}>
        <div className="flex flex-col gap-[16px]">
          <DeviceSearch selected={selectedDevices} onAdd={(dev) => setSelectedDevices((prev) => [...prev, dev])} />
          {selectedDevices.length > 0 && (
            <div className="rounded-[12px] border border-[#f4f4f4] overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f4f4f4]">
                    {["序号", "设备名称", "设备编号", "类别", "折旧单价", "操作"].map((h) => (
                      <th key={h} className="text-left px-[14px] py-[10px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedDevices.map((dev, i) => (
                    <tr key={dev.deviceId} className="border-t border-[#f4f4f4] hover:bg-[#fafafa] transition-colors">
                      <td className="px-[14px] py-[12px] text-[#9a9fa5] text-[13px]">{i + 1}</td>
                      <td className="px-[14px] py-[12px] text-[#272b30] text-[13px] font-semibold">{dev.name}</td>
                      <td className="px-[14px] py-[12px] text-[#6f767e] text-[13px] font-mono">{dev.deviceId}</td>
                      <td className="px-[14px] py-[12px]">
                        <span className="px-[7px] py-[3px] rounded-[5px] bg-[#f4f4f4] text-[#6f767e] text-[11px] font-semibold">{dev.category}</span>
                      </td>
                      <td className="px-[14px] py-[12px]">
                        <span className="text-[#0d9f5f] text-[13px] font-semibold">¥{dev.depreciationRate}/h</span>
                      </td>
                      <td className="px-[14px] py-[12px]">
                        <button onClick={() => handleRemoveDevice(dev.deviceId)}
                          className="w-[28px] h-[28px] rounded-[7px] bg-[#fff2f0] text-[#ff4d4f] hover:bg-[#ffccc7] transition-colors flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedDevices.length === 0 && (
            <div className="flex flex-col items-center py-[24px] text-[#9a9fa5]">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="mb-[8px] opacity-40">
                <rect x="4" y="9" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 9V7a2 2 0 012-2h8a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <p className="text-[13px]">暂未关联设备，请使用上方搜索框添加</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Footer Buttons ── */}
      <div className="flex items-center justify-between pb-[8px]">
        <button onClick={() => navigate("/projects")}
          className="flex items-center gap-[7px] h-[44px] px-[20px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 10.5L5.5 7 9 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          返回列表
        </button>
        <button onClick={handleSave}
          className="flex items-center gap-[7px] h-[44px] px-[24px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold hover:bg-[#1a1d1f] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          保存项目
        </button>
      </div>

      {showSaveConfirm && (
        <SaveConfirmModal name={projectName} startDate={startDate}
          empCount={selectedEmployees.length} devCount={selectedDevices.length}
          onConfirm={handleConfirmSave} onCancel={() => setShowSaveConfirm(false)} />
      )}
    </div>
  );
}

// ─── Showcase View ────────────────────────────────────────────────────────────
// ─── Page Export ──────────────────────────────────────────────────────────────
export function CreateProjectPage() {
  return (
    <div className="px-[40px] py-[40px]">
      <div className="flex items-center justify-between mb-[28px]">
        <h1 className="font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">创建项目</h1>
      </div>
      <CreateProjectMain />
    </div>
  );
}
