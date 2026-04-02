import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type LogModule = "基础数据" | "项目管理" | "系统管理";
type LogRecord = {
  id: string;
  time: string;
  operator: string;
  module: LogModule;
  action: string;
  target: string;
  yearMonth?: string;
  content: string;
  ipAddress: string;
};

// ─── Mock Data Generator ──────────────────────────────────────────────────────
const MOCK_OPERATORS = ["admin", "张伟", "李娜", "王芳", "刘洋", "陈静"];

const MODULE_COLOR: Record<LogModule, string> = {
  "基础数据": "bg-[#e8f0fe] text-[#3b5bdb]",
  "项目管理": "bg-[#e6f9f0] text-[#0d9f5f]",
  "系统管理": "bg-[#f4f4f4] text-[#6f767e]",
};

type RichLogTemplate = {
  module: LogModule;
  action: string;
  target: string;
  yearMonth?: string;
  content: string;
};

const MOCK_TEMPLATES: RichLogTemplate[] = [
  { module: "基础数据", action: "添加员工", target: "陈静（EMP005）", content: "添加员工陈静，工号 EMP005，职位：测试工程师，入职时间：2023-05-08" },
  { module: "基础数据", action: "修改员工", target: "李娜（EMP002）", content: "修改员工李娜的职位：产品经理 → 高级产品经理" },
  { module: "基础数据", action: "删除员工", target: "赵磊（EMP006）", content: "删除员工赵磊（EMP006），操作不可撤销" },
  { module: "基础数据", action: "批量导入员工", target: "人员管理", content: "批量导入 8 名员工信息，成功 8 条，失败 0 条" },
  { module: "基础数据", action: "手动添加打卡记录", target: "张伟（EMP001）", content: "手动添加打卡记录：张伟 · 2026-02-28，数据来源：手动录入" },
  { module: "基础数据", action: "修改打卡记录", target: "王芳（EMP003）", content: "修改打卡记录：王芳 · 2026-03-01，数据来源变更为手动录入，打卡时间：08:55 → 09:02" },
  { module: "基础数据", action: "删除打卡记录", target: "刘洋（EMP004）", content: "删除打卡记录：刘洋 · 2026-03-05" },
  { module: "基础数据", action: "导入打卡记录", target: "打卡记录导入", content: "批量导入打卡记录 15 条，成功 15 条，失败 0 条，数据来源：考勤系统导出" },
  { module: "基础数据", action: "修改设备信息", target: "冲压机 A（SM001）", content: "修改设备信息：折旧单价 ¥40/h → ¥45/h" },
  { module: "基础数据", action: "启用设备", target: "裁断机 C（SM003）", content: "启用设备：裁断机 C（SM003），状态：停用 → 启用" },
  { module: "基础数据", action: "停用设备", target: "���纫机 B（SM002）", content: "停用设备：缝纫机 B（SM002），状态：启用 → 停用" },
  { module: "基础数据", action: "添加设备", target: "激光切割机（SM007）", content: "添加新设备：激光切割机（SM007），折旧单价 ¥75/h，类别：切割设备" },
  { module: "项目管理", action: "创建项目", target: "物联网平台（p15）", content: "创建项目：物联网平台，开始时间：2026-03-01，关联员工 5 人，关联设备 4 台" },
  { module: "项目管理", action: "创建月度记录", target: "数据平台 V2（p2）", yearMonth: "2026-03", content: "创建 2026年3月 月度数据记录，初始员工 5 人，设备 3 台，系数自动生成" },
  { module: "项目管理", action: "修改月度员工类型", target: "数据平台 V2（p2）", yearMonth: "2026-03", content: "修改月度员工类型：陈静（EMP005）正式员工 → 兼职员工，系数自动重新生成为 0.55" },
  { module: "项目管理", action: "修改月度员工系数", target: "供应链优化（p5）", yearMonth: "2026-03", content: "修改员工系数：孙丽（EMP007）0.44 → 0.48，类型：兼职员工" },
  { module: "项目管理", action: "切换月度设备使用状态", target: "数据平台 V2（p2）", yearMonth: "2026-03", content: "切换设备使用状态：打包机 D（SM004）启用 → 停用，当月折旧费减少 ¥3,872" },
  { module: "项目管理", action: "添加月度费用项", target: "供应链优化（p5）", yearMonth: "2026-03", content: "外包合作费用 新增：外部数据服务费，金额 ¥8,000，上传凭证 1 个" },
  { module: "项目管理", action: "删除月度费用项", target: "产品推荐引擎（p9）", yearMonth: "2026-02", content: "删除直接投入费用项：算法框架授权费 ¥5,000" },
  { module: "项目管理", action: "提交月度结算", target: "供应链优化（p5）", yearMonth: "2026-03", content: "提交 2026年3月 月度数据至待结算队列，预估结算金额 ¥187,840" },
  { module: "项目管理", action: "确认月度结算", target: "供应链优化（p5）", yearMonth: "2026-02", content: "确认完成 2026年2月 月度结算，结算金额 ¥156,320，结算时间：2026-03-03 14:15" },
  { module: "项目管理", action: "重新发起月度结算", target: "数据平台 V2（p2）", yearMonth: "2026-02", content: "（管理员）重新发起 2026年2月 月度结算，原始结算时间保留：2026-03-05 10:30" },
  { module: "项目管理", action: "上传凭证", target: "智能排班系统（p12）", yearMonth: "2026-02", content: "人工费用-周强（EMP008）上传凭证：考勤汇总.xlsx，共 1 个文件" },
  { module: "系统管理", action: "添加账号", target: "孙丽（operator_sunli）", content: "添加账号：孙丽，角色：普通用户，初始密码已发送至邮箱" },
  { module: "系统管理", action: "重置密码", target: "李娜（operator_lina）", content: "重置账号李娜的登录密码，操作者：admin" },
  { module: "系统管理", action: "停用账号", target: "周强（operator_zhouqiang）", content: "停用账号：周强（operator_zhouqiang），账号无法登录" },
  { module: "系统管理", action: "修改账号权限", target: "operator01", content: "修改账号权限：普通用户 → 分公司管理员" },
  { module: "系统管理", action: "导出操作日志", target: "操作日志", content: "导出操作日志 240 条，时间范围：2026-01-01 至 2026-03-01，格式：Excel" },
];

const MOCK_IPS = ["192.168.1.101", "192.168.1.102", "10.0.0.25", "172.16.0.8", "192.168.0.50"];

function pad2(n: number) { return String(n).padStart(2, "0"); }
function formatTime(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function generateLogs(): LogRecord[] {
  const logs: LogRecord[] = [];
  let cur = new Date("2026-03-21T17:45:00");
  const intervals = [3, 8, 1, 14, 5, 2, 20, 7, 11, 4, 6, 15, 3, 9, 2, 18, 1, 13, 7, 4, 12, 6, 3, 19, 8, 2, 11, 5, 16, 7];
  for (let i = 0; i < 285; i++) {
    const tpl = MOCK_TEMPLATES[i % MOCK_TEMPLATES.length];
    logs.push({
      id: `log-${i + 1}`,
      time: formatTime(cur),
      operator: MOCK_OPERATORS[i % MOCK_OPERATORS.length],
      module: tpl.module,
      action: tpl.action,
      target: tpl.target,
      yearMonth: tpl.yearMonth,
      content: tpl.content,
      ipAddress: MOCK_IPS[i % MOCK_IPS.length],
    });
    const hrs = intervals[i % intervals.length];
    const mins = (i * 17 + 3) % 60;
    cur = new Date(cur.getTime() - (hrs * 60 + mins) * 60 * 1000);
  }
  return logs;
}

const ALL_LOGS = generateLogs();

const PAGE_SIZE_PRESETS = [10, 20, 50, 100];

// ─── Pagination Component ─────────────────────────────────────────────────────
function Pagination({
  total, page, pageSize, onPage, onPageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const isPreset = PAGE_SIZE_PRESETS.includes(pageSize);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === "custom") {
      setCustomMode(true);
      setCustomInput(String(pageSize));
    } else {
      setCustomMode(false);
      onPageSize(Number(v));
      onPage(1);
    }
  };

  const applyCustom = () => {
    const n = parseInt(customInput, 10);
    if (n >= 1 && n <= 500) {
      onPageSize(n);
      onPage(1);
    }
    setCustomMode(false);
  };

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const around = new Set([1, 2, page - 1, page, page + 1, totalPages - 1, totalPages].filter(x => x >= 1 && x <= totalPages));
    const sorted = Array.from(around).sort((a, b) => a - b);
    let prev: number | null = null;
    for (const p of sorted) {
      if (prev !== null && p - prev > 1) pages.push("...");
      pages.push(p);
      prev = p;
    }
  }

  const btnBase = "w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[13px] font-semibold transition-colors";

  return (
    <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[#f4f4f4] flex-wrap gap-[12px]">
      <div className="flex items-center gap-[4px]">
        <button
          onClick={() => onPage(1)} disabled={page === 1}
          className={`${btnBase} border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed`}
          title="首页"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 10.5L5.5 7 9 3.5M5 10.5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => onPage(page - 1)} disabled={page === 1}
          className={`${btnBase} border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 10.5L5.5 7 9 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} className="w-[32px] flex justify-center items-center text-[#9a9fa5] text-[13px] select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`${btnBase} ${p === page ? "bg-[#272b30] text-white" : "border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4]"}`}
            >{p}</button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)} disabled={page >= totalPages}
          className={`${btnBase} border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3.5L8.5 7 5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => onPage(totalPages)} disabled={page >= totalPages}
          className={`${btnBase} border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed`}
          title="末页"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3.5L8.5 7 5 10.5M9 3.5V10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-[12px]">
        <span className="text-[#9a9fa5] text-[13px]">共 <span className="text-[#272b30] font-semibold">{total}</span> 条</span>
        <div className="w-[1px] h-[16px] bg-[#efefef]" />
        <div className="flex items-center gap-[6px]">
          <span className="text-[#9a9fa5] text-[13px] whitespace-nowrap">每页</span>
          {customMode ? (
            <input
              type="number"
              min={1}
              max={500}
              value={customInput}
              autoFocus
              onChange={(e) => setCustomInput(e.target.value)}
              onBlur={applyCustom}
              onKeyDown={(e) => e.key === "Enter" && applyCustom()}
              className="w-[64px] h-[30px] px-[8px] rounded-[8px] border border-[#272b30] bg-white text-[#272b30] text-[13px] text-center outline-none"
            />
          ) : (
            <div className="relative">
              <select
                value={isPreset ? pageSize : "custom"}
                onChange={handleSelectChange}
                className="h-[30px] pl-[10px] pr-[28px] rounded-[8px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold outline-none appearance-none cursor-pointer hover:border-[#272b30] transition-colors"
              >
                {PAGE_SIZE_PRESETS.map(n => <option key={n} value={n}>{n}</option>)}
                {!isPreset && <option value={pageSize}>{pageSize}</option>}
                <option value="custom">自定义</option>
              </select>
              <svg className="absolute right-[8px] top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5l3 3 3-3" stroke="#9A9FA5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <span className="text-[#9a9fa5] text-[13px]">条</span>
        </div>
        <div className="w-[1px] h-[16px] bg-[#efefef]" />
        <span className="text-[#9a9fa5] text-[13px]">第 <span className="text-[#272b30] font-semibold">{page}</span> / {totalPages} 页</span>
      </div>
    </div>
  );
}

// ─── Main Functional View ─────────────────────────────────────────────────────
function OperationLogMain() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [operatorInput, setOperatorInput] = useState("");

  const [activeStart, setActiveStart] = useState("");
  const [activeEnd, setActiveEnd] = useState("");
  const [activeOperator, setActiveOperator] = useState("");
  const [hasQueried, setHasQueried] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exportAnim, setExportAnim] = useState(false);

  const filteredLogs = useMemo(() => {
    if (!hasQueried) return ALL_LOGS;
    return ALL_LOGS.filter((r) => {
      const rDate = r.time.slice(0, 10);
      const matchStart = !activeStart || rDate >= activeStart;
      const matchEnd = !activeEnd || rDate <= activeEnd;
      const matchOp = !activeOperator || r.operator.includes(activeOperator);
      return matchStart && matchEnd && matchOp;
    });
  }, [hasQueried, activeStart, activeEnd, activeOperator]);

  const pagedLogs = useMemo(() => {
    const s = (page - 1) * pageSize;
    return filteredLogs.slice(s, s + pageSize);
  }, [filteredLogs, page, pageSize]);

  const handleQuery = () => {
    setActiveStart(startDate);
    setActiveEnd(endDate);
    setActiveOperator(operatorInput);
    setHasQueried(true);
    setPage(1);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setOperatorInput("");
    setActiveStart("");
    setActiveEnd("");
    setActiveOperator("");
    setHasQueried(false);
    setPage(1);
  };

  const handleExport = () => {
    setExportAnim(true);
    setTimeout(() => setExportAnim(false), 1500);
    const csv = ["序号,操作时间,操作人,模块,操作,目标,年月,内容,IP地址",
      ...filteredLogs.map((r, i) => `${i + 1},${r.time},${r.operator},${r.module},${r.action},${r.target},${r.yearMonth || ""},"${r.content}",${r.ipAddress}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "操作日志.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-[24px]">
        <div className="flex items-end justify-between flex-wrap gap-[12px]">
          <div className="flex items-end gap-[12px] flex-wrap">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[#6f767e] text-[12px] font-medium">时间范围</label>
              <div className="flex items-center gap-[8px]">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-[40px] px-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
                />
                <span className="text-[#9a9fa5] text-[12px] select-none">至</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-[40px] px-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-[#6f767e] text-[12px] font-medium">操作人</label>
              <input
                type="text"
                placeholder="请输入操作人姓名"
                value={operatorInput}
                onChange={(e) => setOperatorInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                className="h-[40px] px-[12px] w-[160px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
              />
            </div>

            <button
              onClick={handleQuery}
              className="h-[40px] px-[18px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors"
            >查询</button>
            {(hasQueried || startDate || endDate || operatorInput) && (
              <button
                onClick={handleReset}
                className="h-[40px] px-[14px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors"
              >重置</button>
            )}
          </div>

          <button
            onClick={handleExport}
            className={`flex items-center gap-[7px] h-[40px] px-[16px] rounded-[10px] border transition-colors text-[13px] font-semibold ${
              exportAnim
                ? "border-[#0d9f5f]/30 bg-[#e6f9f0] text-[#0d9f5f]"
                : "border-[#efefef] bg-white text-[#272b30] hover:bg-[#f4f4f4]"
            }`}
          >
            {exportAnim ? (
              <>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2.5 10l3.5 3.5 6.5-7" stroke="#0d9f5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                已导出
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10M5.333 6.667L8 9.333l2.667-2.666M8 9.333V2" stroke="#272B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                导出日志
              </>
            )}
          </button>
        </div>

        {hasQueried && (activeStart || activeEnd || activeOperator) && (
          <div className="flex items-center gap-[8px] mt-[14px] pt-[14px] border-t border-[#f4f4f4] flex-wrap">
            <span className="text-[#9a9fa5] text-[12px]">当前筛选：</span>
            {(activeStart || activeEnd) && (
              <span className="px-[10px] h-[24px] rounded-[6px] bg-[#f4f4f4] text-[#272b30] text-[12px] font-medium flex items-center gap-[4px]">
                📅 {activeStart || "—"} 至 {activeEnd || "—"}
              </span>
            )}
            {activeOperator && (
              <span className="px-[10px] h-[24px] rounded-[6px] bg-[#f4f4f4] text-[#272b30] text-[12px] font-medium flex items-center gap-[4px]">
                👤 {activeOperator}
              </span>
            )}
            <span className="text-[#9a9fa5] text-[12px]">共 <span className="text-[#272b30] font-semibold">{filteredLogs.length}</span> 条结果</span>
          </div>
        )}
      </div>

      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {[
                  { label: "序号", w: "w-[72px]" },
                  { label: "操作时间", w: "w-[180px]" },
                  { label: "操作人", w: "w-[100px]" },
                  { label: "模块", w: "w-[100px]" },
                  { label: "操作", w: "w-[100px]" },
                  { label: "目标", w: "w-[100px]" },
                  { label: "年月", w: "w-[100px]" },
                  { label: "内容", w: "" },
                ].map(({ label, w }) => (
                  <th key={label} className={`text-left px-[20px] py-[13px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap ${w}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedLogs.map((r, i) => {
                const globalIdx = (page - 1) * pageSize + i + 1;
                return (
                  <tr key={r.id} className="border-b border-[#f4f4f4] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-[20px] py-[14px] text-[#9a9fa5] text-[13px] whitespace-nowrap">
                      {globalIdx}
                    </td>
                    <td className="px-[20px] py-[14px] whitespace-nowrap">
                      <div className="flex flex-col gap-[1px]">
                        <span className="text-[#272b30] text-[13px] font-medium">{r.time.slice(0, 10)}</span>
                        <span className="text-[#9a9fa5] text-[12px]">{r.time.slice(11)}</span>
                      </div>
                    </td>
                    <td className="px-[20px] py-[14px] whitespace-nowrap">
                      <div className="flex items-center gap-[7px]">
                        <div className="w-[26px] h-[26px] rounded-full bg-[#272b30] flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
                          {r.operator.slice(-1)}
                        </div>
                        <span className="text-[#272b30] text-[13px] font-semibold">{r.operator}</span>
                      </div>
                    </td>
                    <td className="px-[20px] py-[14px] whitespace-nowrap">
                      <div className={`inline-flex px-[10px] h-[22px] rounded-[6px] items-center text-[11px] font-semibold ${MODULE_COLOR[r.module]}`}>
                        {r.module}
                      </div>
                    </td>
                    <td className="px-[20px] py-[14px] whitespace-nowrap">
                      <span className="text-[#272b30] text-[13px] font-semibold">{r.action}</span>
                    </td>
                    <td className="px-[20px] py-[14px] whitespace-nowrap">
                      <span className="text-[#272b30] text-[13px] font-semibold">{r.target}</span>
                    </td>
                    <td className="px-[20px] py-[14px] whitespace-nowrap">
                      <span className="text-[#272b30] text-[13px] font-semibold">{r.yearMonth || "—"}</span>
                    </td>
                    <td className="px-[20px] py-[14px]">
                      <span className="text-[#272b30] text-[13px] leading-[20px]">{r.content}</span>
                    </td>
                  </tr>
                );
              })}
              {pagedLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-[56px] text-[#9a9fa5] text-[14px]">
                    暂无符合条件的操作日志
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          total={filteredLogs.length}
          page={page}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={(s) => { setPageSize(s); setPage(1); }}
        />
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export function OperationLogPage() {
  return (
    <div className="px-[40px] py-[40px]">
      <div className="flex items-center justify-between mb-[28px]">
        <h1 className="font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">
          操作日志
        </h1>
      </div>
      <OperationLogMain />
    </div>
  );
}
