import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { fetchDevices } from "../api/devices";
import { fetchEmployees } from "../api/employees";
import { fetchProjectMonthlyList } from "../api/monthly";
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

const quickLinks = [
  { label: "人员管理", desc: "查看与维护公司员工档案", to: "/personnel", color: "bg-[#e8f0fe]" },
  { label: "设备管理", desc: "维护研发设备与折旧信息", to: "/equipment", color: "bg-[#e6f9f0]" },
  { label: "项目列表", desc: "浏览项目台账与项目详情", to: "/projects", color: "bg-[#fff8e6]" },
  { label: "月度汇总", desc: "录入并提交项目月度费用", to: "/projects/monthly", color: "bg-[#fce8f3]" },
  { label: "待结算项目", desc: "处理待结算和已结算项目", to: "/projects/pending-settlement", color: "bg-[#f0f0ff]" },
  { label: "账号管理", desc: "维护后台登录账号与状态", to: "/accounts", color: "bg-[#fff0e6]" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getProjectStatusLabel(status?: string) {
  switch (status) {
    case "IN_PROGRESS":
    case "active":
    case "ongoing":
      return "进行中";
    case "ENDED":
    case "ended":
      return "已结束";
    case "SETTLED":
    case "settled":
      return "已结算";
    default:
      return status || "未知";
  }
}

function getProjectStatusClass(status?: string) {
  switch (status) {
    case "IN_PROGRESS":
    case "active":
    case "ongoing":
      return "bg-[#e6f9f0] text-[#0d9f5f]";
    case "ENDED":
    case "ended":
      return "bg-[#fff8e6] text-[#d48806]";
    case "SETTLED":
    case "settled":
      return "bg-[#e8f0fe] text-[#3b5bdb]";
    default:
      return "bg-[#f4f4f4] text-[#6f767e]";
  }
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

        const pendingMonthlyCount = monthlyLists.flat().filter((item) => item.status === "pending_settlement" || item.status === "submitted").length;
        const settledMonthlyCount = monthlyLists.flat().filter((item) => item.status === "settled").length;
        const settlementAmount = (settlementsPage.list || []).reduce((sum, item) => sum + (item.amount || 0), 0);

        if (!cancelled) {
          setStats({
            employeeCount: employees.length,
            deviceCount: devices.length,
            projectCount: projectsPage.total || projects.length,
            activeProjectCount: projects.filter((project) => getProjectStatusLabel(project.status) === "进行中").length,
            pendingMonthlyCount,
            settledMonthlyCount,
            settlementAmount,
          });
          setRecentProjects(projects.slice(0, 5));
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

    loadDashboard();

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
        color: "bg-[#e8f0fe]",
        text: "text-[#3b5bdb]",
      },
      {
        label: "设备总数",
        value: String(stats.deviceCount),
        sub: "设备台账中的在管设备",
        color: "bg-[#e6f9f0]",
        text: "text-[#0d9f5f]",
      },
      {
        label: "项目数量",
        value: String(stats.projectCount),
        sub: `进行中 ${stats.activeProjectCount} 个`,
        color: "bg-[#fff8e6]",
        text: "text-[#d48806]",
      },
      {
        label: "待结算月度",
        value: String(stats.pendingMonthlyCount),
        sub: `已结算 ${stats.settledMonthlyCount} 条`,
        color: "bg-[#fce8f3]",
        text: "text-[#c2185b]",
      },
    ],
    [stats],
  );

  return (
    <div className="px-[40px] py-[40px]">
      <div className="mb-[28px] flex items-end justify-between gap-[16px]">
        <div>
          <h1 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">
            首页
          </h1>
          <p className="mt-[6px] text-[14px] text-[#9a9fa5]">这里展示系统当前最核心的项目和结算概况。</p>
        </div>
        <div className="rounded-[14px] bg-[#fcfcfc] px-[18px] py-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <p className="text-[12px] text-[#9a9fa5]">累计结算金额</p>
          <p className="mt-[4px] text-[22px] font-semibold text-[#272b30]">{formatCurrency(stats.settlementAmount)}</p>
        </div>
      </div>

      {error ? (
        <div className="mb-[24px] rounded-[16px] border border-[#ffd9d4] bg-[#fff3f1] px-[18px] py-[14px] text-[14px] text-[#d84c2f]">
          {error}
        </div>
      ) : null}

      <div className="mb-[32px] grid grid-cols-4 gap-[16px]">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-[16px] bg-[#fcfcfc] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className={`mb-[12px] inline-flex rounded-[8px] px-[10px] py-[4px] text-[12px] font-semibold ${item.color} ${item.text}`}>
              {item.label}
            </div>
            <p className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">
              {loading ? "--" : item.value}
            </p>
            <p className="mt-[4px] text-[13px] text-[#9a9fa5]">{loading ? "正在加载..." : item.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-[24px] grid grid-cols-[1.4fr_1fr] gap-[16px]">
        <div className="rounded-[16px] bg-[#fcfcfc] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="mb-[18px] flex items-center justify-between">
            <p className="text-[16px] font-semibold text-[#272b30]">最近项目</p>
            <Link to="/projects" className="text-[13px] font-medium text-[#2a85ff] hover:text-[#0058d8]">
              查看全部
            </Link>
          </div>

          <div className="space-y-[12px]">
            {recentProjects.length ? (
              recentProjects.map((project) => (
                <div key={project.id} className="flex items-center gap-[14px] rounded-[14px] border border-[#f4f4f4] px-[16px] py-[14px]">
                  <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[12px] bg-[#f4f4f4] text-[14px] font-semibold text-[#272b30]">
                    {project.projectName.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[#272b30]">{project.projectName}</p>
                    <p className="mt-[4px] text-[12px] text-[#9a9fa5]">
                      {project.code || "未设置编号"} · {project.startDate || "未设置开始日期"}
                    </p>
                  </div>
                  <span className={`rounded-full px-[10px] py-[6px] text-[12px] font-semibold ${getProjectStatusClass(project.status)}`}>
                    {getProjectStatusLabel(project.status)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#d9dde3] px-[18px] py-[30px] text-center text-[14px] text-[#9a9fa5]">
                {loading ? "正在加载项目数据..." : "暂时还没有项目数据"}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[16px] bg-[#fcfcfc] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <p className="mb-[18px] text-[16px] font-semibold text-[#272b30]">状态概览</p>
          <div className="space-y-[14px]">
            <div className="rounded-[14px] bg-[#f4f4f4] px-[16px] py-[14px]">
              <p className="text-[12px] text-[#9a9fa5]">活跃项目占比</p>
              <p className="mt-[6px] text-[24px] font-semibold text-[#272b30]">
                {stats.projectCount ? Math.round((stats.activeProjectCount / stats.projectCount) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-[14px] bg-[#f4f4f4] px-[16px] py-[14px]">
              <p className="text-[12px] text-[#9a9fa5]">待结算月度条数</p>
              <p className="mt-[6px] text-[24px] font-semibold text-[#272b30]">{loading ? "--" : stats.pendingMonthlyCount}</p>
            </div>
            <div className="rounded-[14px] bg-[#f4f4f4] px-[16px] py-[14px]">
              <p className="text-[12px] text-[#9a9fa5]">已结算月度条数</p>
              <p className="mt-[6px] text-[24px] font-semibold text-[#272b30]">{loading ? "--" : stats.settledMonthlyCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] bg-[#fcfcfc] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <p className="mb-[16px] text-[16px] font-semibold text-[#272b30]">快捷入口</p>
        <div className="grid grid-cols-3 gap-[12px]">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex cursor-pointer items-center gap-[14px] rounded-[12px] border border-[#f4f4f4] p-[16px] transition-all hover:border-[#e0e0e0] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              <div className={`flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-[10px] ${item.color}`}>
                <span className="text-[18px]">→</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#272b30]">{item.label}</p>
                <p className="mt-[2px] text-[12px] text-[#9a9fa5]">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
