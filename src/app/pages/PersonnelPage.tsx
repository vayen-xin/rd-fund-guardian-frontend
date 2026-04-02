import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Person = {
  id: string;
  employeeId: string;
  name: string;
  gender: "男" | "女";
  joinDate: string;
  position: string;
};

const emptyPerson = (): Omit<Person, "id"> => ({
  employeeId: "",
  name: "",
  gender: "男",
  joinDate: "",
  position: "",
});

const initialPeople: Person[] = [
  { id: "1", employeeId: "EMP001", name: "张伟",  gender: "男", joinDate: "2021-03-15", position: "软件工程师" },
  { id: "2", employeeId: "EMP002", name: "李娜",  gender: "女", joinDate: "2020-07-01", position: "产品经理" },
  { id: "3", employeeId: "EMP003", name: "王芳",  gender: "女", joinDate: "2022-01-10", position: "UI 设计师" },
  { id: "4", employeeId: "EMP004", name: "刘洋",  gender: "男", joinDate: "2019-11-20", position: "数据分析师" },
  { id: "5", employeeId: "EMP005", name: "陈静",  gender: "女", joinDate: "2023-05-08", position: "测试工程师" },
];

// ─── Form Modal ───────────────────────────────────────────────────────────────
function PersonFormModal({
  title, form, onChange, onConfirm, onCancel,
}: {
  title: string;
  form: Omit<Person, "id">;
  onChange: (field: keyof Omit<Person, "id">, value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[480px] p-[32px]">
        <h3 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[#272b30] text-[18px] leading-[28px] mb-[24px]">
          {title}
        </h3>
        <div className="flex flex-col gap-[16px]">
          {([
            { label: "工号",    field: "employeeId" as const, type: "text", placeholder: "请输入工号" },
            { label: "姓名",    field: "name"       as const, type: "text", placeholder: "请输入姓名" },
            { label: "入职时间",field: "joinDate"   as const, type: "date", placeholder: "" },
            { label: "职位",    field: "position"   as const, type: "text", placeholder: "请输入职位" },
          ]).map(({ label, field, type, placeholder }) => (
            <div key={field} className="flex flex-col gap-[6px]">
              <label className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium text-[#6f767e] text-[13px] leading-[20px]">{label}</label>
              <input
                type={type} placeholder={placeholder} value={form[field]}
                onChange={(e) => onChange(field, e.target.value)}
                className="h-[44px] px-[14px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[14px] outline-none focus:border-[#272b30] transition-colors"
              />
            </div>
          ))}
          {/* 性别 */}
          <div className="flex flex-col gap-[6px]">
            <label className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium text-[#6f767e] text-[13px] leading-[20px]">性别</label>
            <div className="flex gap-[10px]">
              {(["男", "女"] as const).map((g) => (
                <button key={g} onClick={() => onChange("gender", g)}
                  className={`flex-1 h-[44px] rounded-[10px] border text-[14px] transition-colors font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium ${form.gender === g ? "border-[#272b30] bg-[#272b30] text-white" : "border-[#efefef] bg-[#f4f4f4] text-[#6f767e]"}`}
                >{g}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-[12px] mt-[28px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={onConfirm} className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold hover:bg-[#1a1d1f] transition-colors">确认</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
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
            <h3 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[#272b30] text-[18px] leading-[28px]">确认删除</h3>
            <p className="text-[#6f767e] text-[14px] leading-[22px] mt-[6px]">确定要删除 <span className="text-[#272b30] font-semibold">"{name}"</span> 吗？此操作不可撤销。</p>
          </div>
        </div>
        <div className="flex gap-[12px] mt-[24px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={onConfirm} className="flex-1 h-[44px] rounded-[10px] bg-[#ff6a55] text-white text-[14px] font-semibold hover:bg-[#e55a45] transition-colors">删除</button>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Import Modal ──────────────────────────────────────────────────────
function BatchImportModal({ onClose, onImported }: { onClose: () => void; onImported: (p: Person[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onImported([
        { id: `i-${Date.now()}-1`, employeeId: "EMP010", name: "赵磊", gender: "男", joinDate: "2024-01-05", position: "运维工程师" },
        { id: `i-${Date.now()}-2`, employeeId: "EMP011", name: "孙丽", gender: "女", joinDate: "2023-09-18", position: "前端工程师" },
        { id: `i-${Date.now()}-3`, employeeId: "EMP012", name: "周强", gender: "男", joinDate: "2022-06-30", position: "后端工程师" },
      ]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[480px] p-[32px]">
        <div className="flex items-center justify-between mb-[24px]">
          <h3 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[#272b30] text-[18px] leading-[28px]">批量导入人员</h3>
          <button onClick={onClose} className="w-[32px] h-[32px] rounded-[8px] bg-[#f4f4f4] flex items-center justify-center text-[#6f767e] hover:text-[#272b30]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
        <p className="text-[#6f767e] text-[13px] mb-[20px]">请上传 Excel 或 CSV 文件，系统将自动解析人员信息。</p>
        <div
          className={`border-2 border-dashed rounded-[12px] flex flex-col items-center justify-center gap-[12px] py-[40px] cursor-pointer transition-colors ${dragOver ? "border-[#272b30] bg-[#f4f4f4]" : "border-[#d9d9d9] bg-[#fafafa]"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => fileRef.current?.click()}
        >
          <div className="w-[48px] h-[48px] rounded-[12px] bg-[#efefef] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#6F767E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          {loading ? <p className="text-[#272b30] text-[14px] font-medium">正在解析文件…</p>
            : fileName ? <p className="text-[#272b30] text-[14px] font-medium">{fileName}</p>
            : <>
                <p className="text-[#272b30] text-[14px] font-medium">点击或拖拽文件到此处</p>
                <p className="text-[#9a9fa5] text-[12px]">支持 .xlsx、.xls、.csv 格式</p>
              </>}
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <button onClick={onClose} className="w-full mt-[24px] h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
      </div>
    </div>
  );
}

// ─── Import Preview Modal ─────────────────────────────────────────────────────
function ImportPreviewModal({ people, onClose, onConfirm }: { people: Person[]; onClose: () => void; onConfirm: (p: Person[]) => void }) {
  const [list, setList] = useState<Person[]>(people);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<Person, "id">>(emptyPerson());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[860px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-[32px] py-[24px] border-b border-[#f4f4f4]">
          <div>
            <h3 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[#272b30] text-[18px]">导入预览</h3>
            <p className="text-[#9a9fa5] text-[13px] mt-[2px]">共解析 {list.length} 条人员信息，请确认后导入</p>
          </div>
          <button onClick={onClose} className="w-[32px] h-[32px] rounded-[8px] bg-[#f4f4f4] flex items-center justify-center text-[#6f767e]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="overflow-auto flex-1 px-[32px] py-[20px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {["工号","姓名","性别","入职时间","职位","操作"].map((h) => (
                  <th key={h} className="text-left px-[12px] py-[10px] text-[#6f767e] text-[12px] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((p, i) => (
                <tr key={p.id} className={`border-b border-[#f4f4f4] ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                  <td className="px-[12px] py-[12px] text-[#6f767e] text-[13px]">{p.employeeId}</td>
                  <td className="px-[12px] py-[12px] text-[#272b30] text-[13px] font-semibold">{p.name}</td>
                  <td className="px-[12px] py-[12px]">
                    <span className={`px-[8px] py-[2px] rounded-[6px] text-[12px] font-semibold ${p.gender === "男" ? "bg-[#e8f0fe] text-[#3b5bdb]" : "bg-[#fce8f3] text-[#c2185b]"}`}>{p.gender}</span>
                  </td>
                  <td className="px-[12px] py-[12px] text-[#6f767e] text-[13px]">{p.joinDate}</td>
                  <td className="px-[12px] py-[12px]"><span className="px-[8px] py-[2px] rounded-[6px] bg-[#f4f4f4] text-[#272b30] text-[12px]">{p.position}</span></td>
                  <td className="px-[12px] py-[12px]">
                    <div className="flex gap-[8px]">
                      <button onClick={() => { setEditingId(p.id); setEditForm({ employeeId: p.employeeId, name: p.name, gender: p.gender, joinDate: p.joinDate, position: p.position }); }}
                        className="px-[10px] h-[28px] rounded-[7px] border border-[#efefef] bg-white text-[#272b30] text-[12px] font-semibold hover:bg-[#f4f4f4]">修改</button>
                      <button onClick={() => setList((prev) => prev.filter((x) => x.id !== p.id))}
                        className="px-[10px] h-[28px] rounded-[7px] border border-[#ff6a55]/20 bg-[#fff5f4] text-[#ff6a55] text-[12px] font-semibold hover:bg-[#ffe8e5]">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-[12px] px-[32px] py-[20px] border-t border-[#f4f4f4]">
          <button onClick={onClose} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={() => onConfirm(list)} disabled={list.length === 0}
            className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold hover:bg-[#1a1d1f] disabled:opacity-50 transition-colors">
            确认导入（{list.length} 条）
          </button>
        </div>
      </div>
      {editingId && (
        <PersonFormModal title="修改人员信息" form={editForm}
          onChange={(f, v) => setEditForm((prev) => ({ ...prev, [f]: v }))}
          onConfirm={() => { setList((prev) => prev.map((p) => p.id === editingId ? { ...p, ...editForm } : p)); setEditingId(null); }}
          onCancel={() => setEditingId(null)} />
      )}
    </div>
  );
}

// ─── Personnel Table ──────────────────────────────────────────────────────────
function PersonnelTable() {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<Omit<Person, "id">>(emptyPerson());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<Person, "id">>(emptyPerson());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [previewPeople, setPreviewPeople] = useState<Person[] | null>(null);

  const deletingPerson = people.find((p) => p.id === deletingId);

  return (
    <>
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-[24px] py-[20px] border-b border-[#f4f4f4]">
          <p className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[16px] text-[#272b30]">
            人员列表
            <span className="ml-[8px] px-[8px] py-[2px] rounded-[6px] bg-[#efefef] text-[#6f767e] text-[12px] font-medium">{people.length} 人</span>
          </p>
          <div className="flex gap-[10px]">
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-[6px] px-[14px] h-[38px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10M11.333 5.333L8 2 4.667 5.333M8 2v8" stroke="#272B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              批量导入
            </button>
            <button onClick={() => { setAddForm(emptyPerson()); setShowAdd(true); }}
              className="flex items-center gap-[6px] px-[14px] h-[38px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
              添加人员
            </button>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {["工号","姓名","性别","入职时间","职位","操作"].map((h) => (
                  <th key={h} className="text-left px-[20px] py-[12px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-b border-[#f4f4f4] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px] whitespace-nowrap">{p.employeeId}</td>
                  <td className="px-[20px] py-[15px] text-[#272b30] text-[13px] font-semibold whitespace-nowrap">{p.name}</td>
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <span className={`px-[8px] py-[3px] rounded-[6px] text-[12px] font-semibold ${p.gender === "男" ? "bg-[#e8f0fe] text-[#3b5bdb]" : "bg-[#fce8f3] text-[#c2185b]"}`}>{p.gender}</span>
                  </td>
                  <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px] whitespace-nowrap">{p.joinDate}</td>
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <span className="px-[8px] py-[3px] rounded-[6px] bg-[#f4f4f4] text-[#272b30] text-[12px]">{p.position}</span>
                  </td>
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <div className="flex gap-[8px]">
                      <button onClick={() => { setEditingId(p.id); setEditForm({ employeeId: p.employeeId, name: p.name, gender: p.gender, joinDate: p.joinDate, position: p.position }); }}
                        className="px-[12px] h-[30px] rounded-[8px] border border-[#efefef] bg-white text-[#272b30] text-[12px] font-semibold hover:bg-[#f4f4f4] transition-colors">修改</button>
                      <button onClick={() => setDeletingId(p.id)}
                        className="px-[12px] h-[30px] rounded-[8px] border border-[#ff6a55]/20 bg-[#fff5f4] text-[#ff6a55] text-[12px] font-semibold hover:bg-[#ffe8e5] transition-colors">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {people.length === 0 && (
                <tr><td colSpan={6} className="text-center py-[48px] text-[#9a9fa5] text-[14px]">暂无人员数据，点击「添加人员」开始添加</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <PersonFormModal title="添加人员" form={addForm} onChange={(f, v) => setAddForm((p) => ({ ...p, [f]: v }))}
        onConfirm={() => { if (!addForm.employeeId || !addForm.name) return; setPeople((prev) => [...prev, { ...addForm, id: `${Date.now()}` }]); setShowAdd(false); }}
        onCancel={() => setShowAdd(false)} />}
      {editingId && <PersonFormModal title="修改人员信息" form={editForm} onChange={(f, v) => setEditForm((p) => ({ ...p, [f]: v }))}
        onConfirm={() => { setPeople((prev) => prev.map((p) => p.id === editingId ? { ...p, ...editForm } : p)); setEditingId(null); }}
        onCancel={() => setEditingId(null)} />}
      {deletingId && deletingPerson && <DeleteModal name={deletingPerson.name}
        onConfirm={() => { setPeople((prev) => prev.filter((p) => p.id !== deletingId)); setDeletingId(null); }}
        onCancel={() => setDeletingId(null)} />}
      {showImport && <BatchImportModal onClose={() => setShowImport(false)}
        onImported={(imported) => { setShowImport(false); setPreviewPeople(imported); }} />}
      {previewPeople && <ImportPreviewModal people={previewPeople} onClose={() => setPreviewPeople(null)}
        onConfirm={(imported) => { setPeople((prev) => [...prev, ...imported]); setPreviewPeople(null); }} />}
    </>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export function PersonnelPage() {
  return (
    <div className="px-[40px] py-[40px]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-[28px]">
        <h1 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">
          人员管理
        </h1>
      </div>

      <PersonnelTable />
    </div>
  );
}
