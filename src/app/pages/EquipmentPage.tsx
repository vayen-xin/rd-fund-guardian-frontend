import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Equipment = {
  id: string;
  code: string;       // 设备编号
  name: string;       // 设备名称
  depreciation: string; // 折旧单价（元/小时）
  status: "启用" | "停用";
  createdAt: string;  // 创建时间
  remark: string;     // 备注
};

const emptyEquipment = (): Omit<Equipment, "id" | "status" | "createdAt"> => ({
  code: "",
  name: "",
  depreciation: "",
  remark: "",
});

const initialEquipments: Equipment[] = [
  { id: "1",  code: "SM001", name: "全自动焊接机",   depreciation: "12.50",  status: "启用", createdAt: "2024-01-10", remark: "一号车间主焊接设备" },
  { id: "2",  code: "SM002", name: "数控铣床",       depreciation: "8.00",   status: "启用", createdAt: "2024-01-15", remark: "" },
  { id: "3",  code: "SM003", name: "激光切割机",     depreciation: "20.00",  status: "启用", createdAt: "2024-02-03", remark: "精密切割用途" },
  { id: "4",  code: "SM004", name: "液压压力机",     depreciation: "6.50",   status: "停用", createdAt: "2024-02-18", remark: "维修中暂停使用" },
  { id: "5",  code: "SM005", name: "三坐标测量仪",   depreciation: "15.00",  status: "启用", createdAt: "2024-03-01", remark: "质检部专用" },
  { id: "6",  code: "SM006", name: "注塑成型机",     depreciation: "9.00",   status: "启用", createdAt: "2024-03-12", remark: "" },
  { id: "7",  code: "SM007", name: "工业机器人臂",   depreciation: "25.00",  status: "启用", createdAt: "2024-04-05", remark: "组装线自动化" },
  { id: "8",  code: "SM008", name: "超声波清洗机",   depreciation: "3.50",   status: "停用", createdAt: "2024-04-20", remark: "待采购零件" },
  { id: "9",  code: "SM009", name: "空气压缩机",     depreciation: "4.00",   status: "启用", createdAt: "2024-05-08", remark: "" },
  { id: "10", code: "SM010", name: "电子显微镜",     depreciation: "30.00",  status: "启用", createdAt: "2024-05-20", remark: "研发部专用设备" },
  { id: "11", code: "SM011", name: "螺旋输送机",     depreciation: "5.00",   status: "启用", createdAt: "2024-06-01", remark: "" },
  { id: "12", code: "SM012", name: "热处理炉",       depreciation: "11.00",  status: "停用", createdAt: "2024-06-15", remark: "年度检修中" },
  { id: "13", code: "SM013", name: "高精度车床",     depreciation: "14.00",  status: "启用", createdAt: "2024-07-03", remark: "精加工专用" },
  { id: "14", code: "SM014", name: "磁力研磨机",     depreciation: "7.00",   status: "启用", createdAt: "2024-07-18", remark: "" },
  { id: "15", code: "SM015", name: "工业冷水机",     depreciation: "6.00",   status: "启用", createdAt: "2024-08-02", remark: "配套液压系统" },
  { id: "16", code: "SM016", name: "涂装喷漆设备",   depreciation: "8.50",   status: "停用", createdAt: "2024-08-20", remark: "涂层材料缺货" },
  { id: "17", code: "SM017", name: "气动打磨机",     depreciation: "2.50",   status: "启用", createdAt: "2024-09-05", remark: "" },
  { id: "18", code: "SM018", name: "精密冲压机",     depreciation: "16.00",  status: "启用", createdAt: "2024-09-22", remark: "新引进设备" },
];

const PAGE_SIZE = 10;

// ─── Form Modal（添加 / 编辑）────────────────────────────────────────────────
function EquipmentFormModal({
  title, form, onChange, onConfirm, onCancel,
}: {
  title: string;
  form: Omit<Equipment, "id" | "status" | "createdAt">;
  onChange: (field: keyof Omit<Equipment, "id" | "status" | "createdAt">, value: string) => void;
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
            { label: "设备编号", field: "code"          as const, placeholder: "请输入设备编号，如 SM001" },
            { label: "设备名称", field: "name"          as const, placeholder: "请输入设备名称" },
            { label: "折旧单价（元/小时）", field: "depreciation" as const, placeholder: "请输入单价，如 12.50" },
          ]).map(({ label, field, placeholder }) => (
            <div key={field} className="flex flex-col gap-[6px]">
              <label className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium text-[#6f767e] text-[13px] leading-[20px]">
                {label}
              </label>
              <input
                type={field === "depreciation" ? "number" : "text"}
                placeholder={placeholder}
                value={form[field]}
                min={field === "depreciation" ? "0" : undefined}
                step={field === "depreciation" ? "0.01" : undefined}
                onChange={(e) => onChange(field, e.target.value)}
                className="h-[44px] px-[14px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[14px] outline-none focus:border-[#272b30] transition-colors"
              />
            </div>
          ))}
          {/* 备注 */}
          <div className="flex flex-col gap-[6px]">
            <label className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium text-[#6f767e] text-[13px] leading-[20px]">
              备注
            </label>
            <textarea
              placeholder="请输入备注（选填）"
              value={form.remark}
              rows={3}
              onChange={(e) => onChange("remark", e.target.value)}
              className="px-[14px] py-[10px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[14px] outline-none focus:border-[#272b30] transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex gap-[12px] mt-[28px]">
          <button
            onClick={onCancel}
            className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold hover:bg-[#f4f4f4] transition-colors"
          >取消</button>
          <button
            onClick={onConfirm}
            className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold hover:bg-[#1a1d1f] transition-colors"
          >确认</button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Confirm Modal（启用 / 禁用 确认）──────────────────────────────────
function StatusConfirmModal({
  equipment, onConfirm, onCancel,
}: {
  equipment: Equipment;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isEnable = equipment.status === "停用"; // 当前停用 → 要启用
  const actionText = isEnable ? "启用" : "禁用";
  const accentColor = isEnable ? "#0d9f5f" : "#ff6a55";
  const bgColor    = isEnable ? "#e6f9f0" : "#fff5f4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[400px] p-[32px]">
        <div className="flex items-start gap-[16px] mb-[16px]">
          <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bgColor }}>
            {isEnable ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11l5 5 9-9" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke={accentColor} strokeWidth="1.8" />
                <path d="M11 7v5M11 15v.5" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[#272b30] text-[18px] leading-[28px]">
              确认{actionText}
            </h3>
            <p className="text-[#6f767e] text-[14px] leading-[22px] mt-[6px]">
              确定要{actionText}设备{" "}
              <span className="text-[#272b30] font-semibold">「{equipment.name}」</span>{" "}
              吗？
            </p>
          </div>
        </div>
        <div className="flex gap-[12px] mt-[24px]">
          <button
            onClick={onCancel}
            className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors"
          >取消</button>
          <button
            onClick={onConfirm}
            style={{ backgroundColor: accentColor }}
            className="flex-1 h-[44px] rounded-[10px] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
          >确认{actionText}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  total, page, onPage,
}: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[#f4f4f4]">
      <p className="text-[#9a9fa5] text-[13px]">
        共 {total} 条，第 {page} / {totalPages} 页
      </p>
      <div className="flex items-center gap-[6px]">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="w-[32px] h-[32px] rounded-[8px] border border-[#efefef] bg-white flex items-center justify-center text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-[32px] h-[32px] flex items-center justify-center text-[#9a9fa5] text-[13px]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-[32px] h-[32px] rounded-[8px] text-[13px] font-semibold transition-colors ${
                p === page
                  ? "bg-[#272b30] text-white"
                  : "border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4]"
              }`}
            >{p}</button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="w-[32px] h-[32px] rounded-[8px] border border-[#efefef] bg-white flex items-center justify-center text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Equipment Table（功能视图）───────────────────────────────────────────────
function EquipmentTable() {
  const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"全部" | "启用" | "停用">("全部");
  const [page, setPage] = useState(1);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyEquipment());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEquipment());

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const togglingEquipment = equipments.find((e) => e.id === togglingId) ?? null;

  // ── Filtered + Paginated ──
  const filtered = useMemo(() => {
    return equipments.filter((e) => {
      const matchSearch =
        search === "" ||
        e.code.toLowerCase().includes(search.toLowerCase()) ||
        e.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "全部" || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [equipments, search, statusFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleFilterChange = (val: typeof statusFilter) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleAddConfirm = () => {
    if (!addForm.code || !addForm.name || !addForm.depreciation) return;
    const now = new Date().toISOString().slice(0, 10);
    setEquipments((prev) => [
      ...prev,
      { ...addForm, id: `${Date.now()}`, status: "启用", createdAt: now },
    ]);
    setShowAdd(false);
  };

  const handleEditConfirm = () => {
    if (!editForm.code || !editForm.name || !editForm.depreciation) return;
    setEquipments((prev) =>
      prev.map((e) => (e.id === editingId ? { ...e, ...editForm } : e))
    );
    setEditingId(null);
  };

  const handleToggleStatus = () => {
    if (!togglingId) return;
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === togglingId
          ? { ...e, status: e.status === "启用" ? "停用" : "启用" }
          : e
      )
    );
    setTogglingId(null);
  };

  return (
    <>
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-[24px] py-[20px] border-b border-[#f4f4f4] gap-[16px] flex-wrap">
          <div className="flex items-center gap-[10px] flex-1 min-w-0">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-[280px]">
              <svg className="absolute left-[12px] top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M6.25 10.5a4.25 4.25 0 100-8.5 4.25 4.25 0 000 8.5zM12 12l-2.5-2.5" stroke="#9A9FA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="text"
                placeholder="搜索设备编号或名称"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
              />
            </div>
            {/* 状态筛选 */}
            <div className="flex gap-[4px] bg-[#f4f4f4] rounded-[10px] p-[3px]">
              {(["全部", "启用", "停用"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleFilterChange(s)}
                  className={`px-[12px] h-[30px] rounded-[8px] text-[13px] font-semibold transition-colors ${
                    statusFilter === s
                      ? "bg-white text-[#272b30] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      : "text-[#6f767e] hover:text-[#272b30]"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          {/* 添加设备 */}
          <button
            onClick={() => { setAddForm(emptyEquipment()); setShowAdd(true); }}
            className="flex items-center gap-[6px] px-[14px] h-[38px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            添加设备
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {["设备编号", "设备名称", "折旧单价", "状态", "创建时间", "操作"].map((h) => (
                  <th key={h} className="text-left px-[20px] py-[12px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((e) => (
                <tr key={e.id} className="border-b border-[#f4f4f4] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px] whitespace-nowrap font-mono">{e.code}</td>
                  <td className="px-[20px] py-[15px] text-[#272b30] text-[13px] font-semibold whitespace-nowrap">{e.name}</td>
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <span className="text-[#272b30] text-[13px]">
                      ¥ {parseFloat(e.depreciation).toFixed(2)}
                      <span className="text-[#9a9fa5] text-[12px] ml-[2px]">/小时</span>
                    </span>
                  </td>
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <button
                      onClick={() => setTogglingId(e.id)}
                      className={`flex items-center gap-[5px] px-[10px] py-[4px] rounded-[8px] text-[12px] font-semibold transition-all hover:opacity-80 ${
                        e.status === "启用"
                          ? "bg-[#e6f9f0] text-[#0d9f5f]"
                          : "bg-[#f4f4f4] text-[#9a9fa5]"
                      }`}
                    >
                      <span className={`w-[6px] h-[6px] rounded-full ${e.status === "启用" ? "bg-[#0d9f5f]" : "bg-[#9a9fa5]"}`} />
                      {e.status}
                    </button>
                  </td>
                  <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px] whitespace-nowrap">{e.createdAt}</td>
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <button
                      onClick={() => {
                        setEditingId(e.id);
                        setEditForm({ code: e.code, name: e.name, depreciation: e.depreciation, remark: e.remark });
                      }}
                      className="px-[12px] h-[30px] rounded-[8px] border border-[#efefef] bg-white text-[#272b30] text-[12px] font-semibold hover:bg-[#f4f4f4] transition-colors"
                    >修改</button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-[48px] text-[#9a9fa5] text-[14px]">
                    暂无符合条件的设备数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination total={filtered.length} page={page} onPage={setPage} />
      </div>

      {/* Modals */}
      {showAdd && (
        <EquipmentFormModal
          title="添加设备"
          form={addForm}
          onChange={(f, v) => setAddForm((p) => ({ ...p, [f]: v }))}
          onConfirm={handleAddConfirm}
          onCancel={() => setShowAdd(false)}
        />
      )}
      {editingId && (
        <EquipmentFormModal
          title="修改设备信息"
          form={editForm}
          onChange={(f, v) => setEditForm((p) => ({ ...p, [f]: v }))}
          onConfirm={handleEditConfirm}
          onCancel={() => setEditingId(null)}
        />
      )}
      {togglingId && togglingEquipment && (
        <StatusConfirmModal
          equipment={togglingEquipment}
          onConfirm={handleToggleStatus}
          onCancel={() => setTogglingId(null)}
        />
      )}
    </>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export function EquipmentPage() {
  return (
    <div className="px-[40px] py-[40px]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-[28px]">
        <h1 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">
          设备管理
        </h1>
      </div>

      <EquipmentTable />
    </div>
  );
}
