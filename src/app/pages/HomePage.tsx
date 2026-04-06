import { ArrowRight, BarChart3, BriefcaseBusiness, ClipboardList, Cpu, ReceiptText, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { fetchDevices } from "../api/devices";
import { fetchEmployees } from "../api/employees";
import { fetchProjectMonthlyList, type ProjectMonthlyRecord } from "../api/monthly";
import { fetchAllProjects, type BackendProject } from "../api/projects";
import { fetchSettlements } from "../api/settlements";

type DashboardStats = {
  employeeCount: number;
  deviceCount: number;
  projectCount: number;
  activeProjectCount: number;
  pendingMonthlyCount: number;
  settledMonthlyCount: number;
  settlementAmount: number;
};

type StatusChartItem = {
  name: string;
  value: number;
  color: string;
};

type TrendChartItem = {
  month: string;
  amount: number;
};

const statusPalette = {
  ongoing: "#1f9d72",
  ended: "#f0a43a",
  settled: "#4f6bed",
  other: "#b7bec8",
};

const quickLinks = [
  {
    title: "人员管理",
    desc: "维护公司员工档案、部门与岗位信息。",
    to: "/personnel",
    icon: Users,
    tint: "bg-[#e9f2ff] text-[#4f6bed]",
  },
  {
    title: "设备管理",
    desc: "集中查看设备台账、型号和折旧信息。",
    to: "/equipment",
    icon: Cpu,
    tint: "bg-[#ebfff6] text-[#1f9d72]",
  },
  {
    title: "项目列表",
    desc: "快速进入项目详情，处理项目生命周期。",
    to: "/projects",
    icon: BriefcaseBusiness,
    tint: "bg-[#fff7e8] text-[#d48806]",
  },
  {
    title: "月度汇总",
    desc: "按月维护项目费用、员工和设备数据。",
    to: "/projects/monthly",
    icon: ClipboardList,
    tint: "bg-[#fff0f6] text-[#c2185b]",
  },
  {
    title: "待结算项目",
    desc: "统一处理发起待结算、结算和重新打开编辑。",
    to: "/projects/pending-settlement",
    icon: ReceiptText,
    tint: "bg-[#f2f3ff] text-[#5b5ce2]",
  },
  {
    title: "操作日志",
    desc: "回看关键操作轨迹，辅助排查和审计。",
    to: "/logs",
    icon: BarChart3,
    tint: "bg-[#f6f3ff] text-[#7950f2]",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function normalizeProjectStatus(status?: string) {
  switch (status) {
    case "IN_PROGRESS":
    case "active":
    case "ongoing":
      return "ongoing";
    case "ENDED":
    case "ended":
      return "ended";
    case "SETTLED":
    case "settled":
      return "settled";
    default:
      return "other";
  }
}

function getProjectStatusLabel(status?: string) {
  switch (normalizeProjectStatus(status)) {
    case "ongoing":
      return "进行中";
    case "ended":
      return "已结束";
    case "settled":
      return "已结算";
    default:
      return "未知";
  }
}

function getProjectStatusClass(status?: string) {
  switch (normalizeProjectStatus(status)) {
    case "ongoing":
      return "bg-[#ebfff6] text-[#1f9d72]";
    case "ended":
      return "bg-[#fff7e8] text-[#d48806]";
    case "settled":
      return "bg-[#eef2ff] text-[#4f6bed]";
    default:
      return "bg-[#f4f4f4] text-[#7d8590]";
  }
}

function buildStatusData(projects: BackendProject[]): StatusChartItem[] {
  const buckets = {
    ongoing: 0,
    ended: 0,
    settled: 0,
  };

  for (const project of projects) {
    const normalized = normalizeProjectStatus(project.status);
    if (normalized === "ongoing" || normalized === "ended" || normalized === "settled") {
      buckets[normalized] += 1;
    }
  }

  return [
    { name: "进行中", value: buckets.ongoing, color: statusPalette.ongoing },
    { name: "已结束", value: buckets.ended, color: statusPalette.ended },
    { name: "已结算", value: buckets.settled, color: statusPalette.settled },
  ].filter((item) => item.value > 0);
}

function buildTrendData(settlementItems: Array<{ yearMonth: string; amount?: number }>): TrendChartItem[] {
  const groups = new Map<string, number>();

  for (const item of settlementItems) {
    const key = item.yearMonth || "未知月份";
    groups.set(key, (groups.get(key) ?? 0) + Number(item.amount || 0));
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({
      month,
      amount,
    }));
}

function collectMonthlyStats(monthlyLists: ProjectMonthlyRecord[][]) {
  const flattened = monthlyLists.flat();

  return {
    pendingCount: flattened.filter((item) => item.status === "pending_settlement" || item.status === "submitted" || item.status === "finalized").length,
    settledCount: flattened.filter((item) => item.status === "settled").length,
  };
}

export function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    employeeCount: 0,
    deviceCount: 0,
    projectCount: 0,
    activeProjectCount: 0,
    pendingMonthlyCount: 0,
    settledMonthlyCount: 0,
    settlementAmount: 0,
  });
  const [recentProjects, setRecentProjects] = useState<BackendProject[]>([]);
  const [statusData, setStatusData] = useState<StatusChartItem[]>([]);
  const [trendData, setTrendData] = useState<TrendChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [employees, devices, projectsPage, settlementsPage] = await Promise.all([
          fetchEmployees(),
          fetchDevices(),
          fetchAllProjects(),
          fetchSettlements({ page: 1, size: 100 }),
        ]);

        const projects = projectsPage.records || [];
        const monthlyLists = await Promise.all(
          projects.map(async (project) => {
            try {
              return await fetchProjectMonthlyList(project.id);
            } catch {
              return [];
            }
          }),
        );

        const monthlyStats = collectMonthlyStats(monthlyLists);
        const settlementAmount = (settlementsPage.list || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

        if (!cancelled) {
          setStats({
            employeeCount: employees.length,
            deviceCount: devices.length,
            projectCount: projectsPage.total || projects.length,
            activeProjectCount: projects.filter((project) => normalizeProjectStatus(project.status) === "ongoing").length,
            pendingMonthlyCount: monthlyStats.pendingCount,
            settledMonthlyCount: monthlyStats.settledCount,
            settlementAmount,
          });
          setRecentProjects(projects.slice(0, 5));
          setStatusData(buildStatusData(projects));
          setTrendData(buildTrendData(settlementsPage.list || []));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "首页数据加载失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: "员工总数",
        value: String(stats.employeeCount),
        sub: "当前公司可用员工档案",
        accent: "bg-[#e9f2ff] text-[#4f6bed]",
      },
      {
        label: "设备总数",
        value: String(stats.deviceCount),
        sub: "设备台账中的在管设备",
        accent: "bg-[#ebfff6] text-[#1f9d72]",
      },
      {
        label: "项目数量",
        value: String(stats.projectCount),
        sub: `其中 ${stats.activeProjectCount} 个项目正在推进`,
        accent: "bg-[#fff7e8] text-[#d48806]",
      },
      {
        label: "待结算月份",
        value: String(stats.pendingMonthlyCount),
        sub: `累计已结算 ${stats.settledMonthlyCount} 条`,
        accent: "bg-[#fff0f6] text-[#c2185b]",
      },
    ],
    [stats],
  );

  return (
    <div className="px-[40px] py-[36px]">
      <div className="mb-[28px] flex items-end justify-between gap-[16px]">
        <div>
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">首页概览</h1>
          <p className="mt-[6px] text-[14px] text-[#8c8f94]">用更直观的方式查看项目推进、结算进度和近期重点工作。</p>
        </div>
        <div className="rounded-[18px] border border-[#f2f3f5] bg-white px-[18px] py-[16px] shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-[12px] text-[#8c8f94]">累计结算金额</p>
          <p className="mt-[4px] text-[24px] font-semibold text-[#272b30]">{formatCurrency(stats.settlementAmount)}</p>
        </div>
      </div>

      {error ? (
        <div className="mb-[24px] rounded-[16px] border border-[#ffd9d4] bg-[#fff3f1] px-[18px] py-[14px] text-[14px] text-[#d84c2f]">
          {error}
        </div>
      ) : null}

      <div className="mb-[24px] grid grid-cols-1 gap-[16px] xl:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-[20px] bg-white p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className={`inline-flex rounded-[999px] px-[10px] py-[4px] text-[12px] font-semibold ${item.accent}`}>{item.label}</div>
            <div className="mt-[16px] text-[34px] font-semibold leading-none text-[#272b30]">{loading ? "--" : item.value}</div>
            <p className="mt-[10px] text-[13px] leading-[20px] text-[#8c8f94]">{loading ? "正在加载数据..." : item.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-[24px] grid grid-cols-1 gap-[16px] xl:grid-cols-[1.2fr_0.9fr]">
        <div className="rounded-[20px] bg-white p-[24px] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-[18px] flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-[#272b30]">结算趋势</h2>
              <p className="mt-[4px] text-[13px] text-[#8c8f94]">最近 6 个结算月份的金额变化，用来判断项目收口节奏。</p>
            </div>
            <div className="rounded-[999px] bg-[#f4f7fb] px-[10px] py-[5px] text-[12px] font-medium text-[#6f767e]">按月聚合</div>
          </div>
          <div className="h-[280px]">
            {trendData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="settlementArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f6bed" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4f6bed" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#eef1f4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#8c8f94", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "结算金额"]}
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid #eef1f4",
                      boxShadow: "0 14px 34px rgba(15,23,42,0.12)",
                    }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#4f6bed" strokeWidth={3} fill="url(#settlementArea)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-[#d8dce3] text-[14px] text-[#8c8f94]">
                暂无结算趋势数据
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-[24px] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-[18px]">
            <h2 className="text-[18px] font-semibold text-[#272b30]">项目状态分布</h2>
            <p className="mt-[4px] text-[13px] text-[#8c8f94]">一眼看出当前项目是更多处于推进中、已结束还是已结算。</p>
          </div>
          <div className="flex h-[280px] flex-col justify-between gap-[12px]">
            <div className="h-[170px]">
              {statusData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={3}>
                      {statusData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} 个`, "项目数"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-[#d8dce3] text-[14px] text-[#8c8f94]">
                  暂无项目数据
                </div>
              )}
            </div>
            <div className="grid gap-[10px]">
              {[
                { label: "进行中", value: stats.activeProjectCount, color: statusPalette.ongoing },
                { label: "已结束", value: statusData.find((item) => item.name === "已结束")?.value ?? 0, color: statusPalette.ended },
                { label: "已结算", value: statusData.find((item) => item.name === "已结算")?.value ?? 0, color: statusPalette.settled },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[14px] bg-[#fafbfc] px-[14px] py-[12px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[13px] text-[#4b5563]">{item.label}</span>
                  </div>
                  <span className="text-[15px] font-semibold text-[#272b30]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-[24px] grid grid-cols-1 gap-[16px] xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[20px] bg-white p-[24px] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-[18px] flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-[#272b30]">最近项目</h2>
              <p className="mt-[4px] text-[13px] text-[#8c8f94]">优先关注最近创建或最近更新的项目，方便快速进入处理。</p>
            </div>
            <Link to="/projects" className="text-[13px] font-medium text-[#2a5bd7] hover:text-[#153eaf]">
              查看全部
            </Link>
          </div>

          <div className="space-y-[12px]">
            {recentProjects.length ? (
              recentProjects.map((project) => (
                <div key={project.id} className="flex items-center gap-[14px] rounded-[16px] border border-[#f0f2f4] px-[16px] py-[14px]">
                  <div className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[14px] bg-[#f4f6f8] text-[16px] font-semibold text-[#272b30]">
                    {project.projectName.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-[#272b30]">{project.projectName}</p>
                    <p className="mt-[4px] text-[12px] text-[#8c8f94]">
                      {project.code || "未设置项目编号"} · {project.startDate || "未设置开始日期"}
                    </p>
                  </div>
                  <span className={`rounded-[999px] px-[10px] py-[6px] text-[12px] font-semibold ${getProjectStatusClass(project.status)}`}>
                    {getProjectStatusLabel(project.status)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-[16px] border border-dashed border-[#d8dce3] px-[18px] py-[28px] text-center text-[14px] text-[#8c8f94]">
                {loading ? "正在加载项目数据..." : "暂时还没有项目数据"}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-[24px] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-[18px]">
            <h2 className="text-[18px] font-semibold text-[#272b30]">运行指标</h2>
            <p className="mt-[4px] text-[13px] text-[#8c8f94]">用几个关键比例判断系统当前工作量与结算推进程度。</p>
          </div>
          <div className="space-y-[12px]">
            <div className="rounded-[16px] bg-[#fafbfc] px-[16px] py-[14px]">
              <p className="text-[12px] text-[#8c8f94]">活跃项目占比</p>
              <p className="mt-[6px] text-[28px] font-semibold text-[#272b30]">
                {stats.projectCount ? Math.round((stats.activeProjectCount / stats.projectCount) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-[16px] bg-[#fafbfc] px-[16px] py-[14px]">
              <p className="text-[12px] text-[#8c8f94]">待结算月度条数</p>
              <p className="mt-[6px] text-[28px] font-semibold text-[#272b30]">{loading ? "--" : stats.pendingMonthlyCount}</p>
            </div>
            <div className="rounded-[16px] bg-[#fafbfc] px-[16px] py-[14px]">
              <p className="text-[12px] text-[#8c8f94]">已结算月度条数</p>
              <p className="mt-[6px] text-[28px] font-semibold text-[#272b30]">{loading ? "--" : stats.settledMonthlyCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] bg-white p-[24px] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="mb-[18px]">
          <h2 className="text-[18px] font-semibold text-[#272b30]">快捷入口</h2>
          <p className="mt-[4px] text-[13px] text-[#8c8f94]">把高频操作做成更明显的入口，减少来回切换菜单的成本。</p>
        </div>
        <div className="grid grid-cols-1 gap-[12px] md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.to}
                className="group flex items-start justify-between rounded-[18px] border border-[#f0f2f4] p-[18px] transition-all hover:-translate-y-[1px] hover:border-[#e4e8ee] hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start gap-[12px]">
                  <div className={`flex h-[44px] w-[44px] items-center justify-center rounded-[14px] ${item.tint}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-[#272b30]">{item.title}</div>
                    <p className="mt-[6px] max-w-[250px] text-[13px] leading-[20px] text-[#8c8f94]">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="mt-[4px] text-[#b2b8c2] transition-transform group-hover:translate-x-[2px]" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
