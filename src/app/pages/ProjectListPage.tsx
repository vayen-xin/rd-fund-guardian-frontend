import { CalendarRange, CircleDashed, ClipboardCheck, FileSpreadsheet, FolderArchive, FolderKanban, Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { downloadAuditPackage, downloadAuditWorkbook, downloadProjectLedger } from "../api/audit-exports";
import {
  endProject,
  fetchProjectDetail,
  fetchProjectList,
  type BackendProject,
  type BackendProjectDetail,
} from "../api/projects";

type UiProjectStatus = "进行中" | "已结束" | "已结算";

type ProjectListItem = {
  id: number;
  name: string;
  code: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  status: UiProjectStatus;
};

type TrendItem = {
  month: string;
  count: number;
};

function normalizeStatus(status?: string): UiProjectStatus {
  switch (status) {
    case "settled":
    case "SETTLED":
      return "已结算";
    case "ended":
    case "ENDED":
      return "已结束";
    default:
      return "进行中";
  }
}

function toListItem(project: BackendProject): ProjectListItem {
  return {
    id: project.id,
    name: project.projectName,
    code: project.code || `P-${project.id}`,
    description: project.description || "暂无项目描述",
    startDate: project.startDate,
    endDate: project.endDate,
    status: normalizeStatus(project.status),
  };
}

function getStatusBadgeClass(status: UiProjectStatus) {
  switch (status) {
    case "进行中":
      return "bg-[#ebfff6] text-[#1f9d72] border border-[#bde9d4]";
    case "已结束":
      return "bg-[#fff7e8] text-[#d48806] border border-[#ffe2a8]";
    case "已结算":
      return "bg-[#eef2ff] text-[#4f6bed] border border-[#d8e0ff]";
    default:
      return "bg-[#f4f4f4] text-[#7d8590] border border-[#e5e7eb]";
  }
}

function buildTrendData(projects: ProjectListItem[]): TrendItem[] {
  const groups = new Map<string, number>();

  for (const project of projects) {
    const key = project.startDate?.slice(0, 7) || "未知月份";
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));
}

function PanelCard({ children }: { children: ReactNode }) {
  return <div className="rounded-[20px] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">{children}</div>;
}

function StatusBadge({ status }: { status: UiProjectStatus }) {
  return <span className={`inline-flex h-[28px] items-center rounded-[999px] px-[10px] text-[12px] font-semibold ${getStatusBadgeClass(status)}`}>{status}</span>;
}

function ProjectDetailModal({
  project,
  loading,
  error,
  onClose,
}: {
  project: BackendProjectDetail | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [ledgerStartMonth, setLedgerStartMonth] = useState("2024-01");
  const [ledgerEndMonth, setLedgerEndMonth] = useState("2024-10");
  const [exportingType, setExportingType] = useState<"workbook" | "package" | null>(null);
  const [exportingLedger, setExportingLedger] = useState(false);
  const [exportError, setExportError] = useState("");

  async function handleExport(type: "workbook" | "package") {
    if (!project) {
      return;
    }
    setExportError("");
    setExportingType(type);
    try {
      if (type === "workbook") {
        await downloadAuditWorkbook(project.id, exportYear);
      } else {
        await downloadAuditPackage(project.id, exportYear);
      }
    } catch (downloadError) {
      setExportError(downloadError instanceof Error ? downloadError.message : "导出失败");
    } finally {
      setExportingType(null);
    }
  }

  async function handleLedgerExport() {
    if (!project) {
      return;
    }
    setExportError("");
    setExportingLedger(true);
    try {
      await downloadProjectLedger(project.id, ledgerStartMonth, ledgerEndMonth);
    } catch (downloadError) {
      setExportError(downloadError instanceof Error ? downloadError.message : "导出失败");
    } finally {
      setExportingLedger(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative flex max-h-[calc(100vh-48px)] w-[960px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_18px_64px_rgba(15,23,42,0.2)]">
        <div className="flex items-center justify-between border-b border-[#f2f3f5] px-[28px] py-[22px]">
          <div>
            <h2 className="text-[22px] font-semibold text-[#272b30]">项目详情</h2>
            <p className="mt-[4px] text-[13px] text-[#8c8f94]">查看项目基础信息、关联资源和最近操作记录。</p>
          </div>
          <button onClick={onClose} className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[#6f767e] hover:bg-[#f4f4f4]">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto p-[28px]">
          {loading ? (
            <div className="py-[60px] text-center text-[14px] text-[#8c8f94]">项目详情加载中...</div>
          ) : error ? (
            <div className="rounded-[14px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#d46b08]">{error}</div>
          ) : !project ? (
            <div className="py-[60px] text-center text-[14px] text-[#8c8f94]">暂无项目详情</div>
          ) : (
            <div className="flex flex-col gap-[20px]">
              <PanelCard>
                <div className="grid grid-cols-2 gap-[18px] p-[24px]">
                  {[
                    { label: "项目名称", value: project.projectName },
                    { label: "项目编号", value: project.code || `P-${project.id}` },
                    { label: "开始时间", value: project.startDate || "-" },
                    { label: "结束时间", value: project.endDate || "-" },
                    { label: "项目状态", value: normalizeStatus(project.status) },
                    { label: "结算金额", value: typeof project.settlementAmount === "number" ? `¥ ${project.settlementAmount.toFixed(2)}` : "-" },
                    { label: "项目负责人", value: project.managerName || "-" },
                    { label: "联系电话", value: project.managerPhone || "-" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-[12px] text-[#8c8f94]">{item.label}</div>
                      <div className="mt-[6px] text-[14px] font-semibold text-[#272b30]">{item.value}</div>
                    </div>
                  ))}

                  <div className="col-span-2">
                    <div className="text-[12px] text-[#8c8f94]">项目描述</div>
                    <p className="mt-[6px] text-[14px] leading-[24px] text-[#4b5563]">{project.description || "暂无项目描述"}</p>
                  </div>
                </div>
              </PanelCard>

              <div className="grid grid-cols-1 gap-[20px] xl:grid-cols-2">
                <PanelCard>
                  <div className="flex items-center justify-between border-b border-[#f2f3f5] px-[24px] py-[18px]">
                    <h3 className="text-[16px] font-semibold text-[#272b30]">关联员工</h3>
                    <span className="text-[12px] text-[#8c8f94]">{project.employees.length} 人</span>
                  </div>
                  <div className="p-[24px]">
                    <div className="flex max-h-[280px] flex-col gap-[12px] overflow-y-auto">
                      {project.employees.length === 0 ? (
                        <div className="rounded-[12px] border border-dashed border-[#d8dce3] px-[14px] py-[16px] text-[13px] text-[#8c8f94]">暂无关联员工</div>
                      ) : (
                        project.employees.map((employee) => (
                          <div key={employee.id} className="rounded-[14px] bg-[#fafbfc] px-[14px] py-[12px]">
                            <div className="text-[14px] font-semibold text-[#272b30]">{employee.employeeName}</div>
                            <div className="mt-[4px] text-[12px] text-[#8c8f94]">
                              {employee.department || "未设置部门"}
                              {employee.employeeType ? ` · ${employee.employeeType}` : ""}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PanelCard>

                <PanelCard>
                  <div className="flex items-center justify-between border-b border-[#f2f3f5] px-[24px] py-[18px]">
                    <h3 className="text-[16px] font-semibold text-[#272b30]">关联设备</h3>
                    <span className="text-[12px] text-[#8c8f94]">{project.devices.length} 台</span>
                  </div>
                  <div className="p-[24px]">
                    <div className="flex max-h-[280px] flex-col gap-[12px] overflow-y-auto">
                      {project.devices.length === 0 ? (
                        <div className="rounded-[12px] border border-dashed border-[#d8dce3] px-[14px] py-[16px] text-[13px] text-[#8c8f94]">暂无关联设备</div>
                      ) : (
                        project.devices.map((device) => (
                          <div key={device.id} className="rounded-[14px] bg-[#fafbfc] px-[14px] py-[12px]">
                            <div className="text-[14px] font-semibold text-[#272b30]">{device.deviceName || `设备 ${device.deviceId}`}</div>
                            <div className="mt-[4px] text-[12px] text-[#8c8f94]">
                              {device.model || "未设置型号"}
                              {typeof device.dailyDepreciation === "number" ? ` · 日折旧 ${device.dailyDepreciation}` : ""}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PanelCard>
              </div>

              <PanelCard>
                <div className="border-b border-[#f2f3f5] px-[24px] py-[18px]">
                  <h3 className="text-[16px] font-semibold text-[#272b30]">审计导出</h3>
                  <p className="mt-[4px] text-[12px] text-[#8c8f94]">按年度导出审计 Excel 或完整材料包，方便测试和交付。</p>
                </div>
                <div className="flex flex-wrap items-end gap-[12px] p-[24px]">
                  <div className="flex min-w-[180px] flex-col gap-[6px]">
                    <label className="text-[12px] font-medium text-[#6f767e]">导出年份</label>
                    <input
                      type="number"
                      min={2000}
                      max={2100}
                      value={exportYear}
                      onChange={(event) => setExportYear(Number(event.target.value) || new Date().getFullYear())}
                      className="h-[42px] rounded-[12px] border border-[#efefef] bg-[#f7f8fa] px-[12px] text-[13px] text-[#272b30] outline-none"
                    />
                  </div>
                  <button
                    onClick={() => void handleExport("workbook")}
                    disabled={!project || exportingType != null}
                    className="inline-flex h-[42px] items-center gap-[8px] rounded-[12px] border border-[#d8dce3] bg-white px-[14px] text-[13px] font-semibold text-[#272b30] disabled:opacity-50"
                  >
                    <FileSpreadsheet size={16} />
                    {exportingType === "workbook" ? "导出中..." : "导出 Excel"}
                  </button>
                  <button
                    onClick={() => void handleExport("package")}
                    disabled={!project || exportingType != null}
                    className="inline-flex h-[42px] items-center gap-[8px] rounded-[12px] bg-[#272b30] px-[14px] text-[13px] font-semibold text-white disabled:opacity-50"
                  >
                    <FolderArchive size={16} />
                    {exportingType === "package" ? "打包中..." : "下载材料包"}
                  </button>
                  <div className="basis-full grid grid-cols-1 gap-[12px] rounded-[14px] border border-[#eef1f4] bg-[#fafbfc] p-[14px] xl:grid-cols-[180px_180px_auto]">
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-[12px] font-medium text-[#6f767e]">辅助账开始月份</label>
                      <input
                        type="month"
                        value={ledgerStartMonth}
                        onChange={(event) => setLedgerStartMonth(event.target.value)}
                        className="h-[42px] rounded-[12px] border border-[#efefef] bg-white px-[12px] text-[13px] text-[#272b30] outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-[12px] font-medium text-[#6f767e]">辅助账结束月份</label>
                      <input
                        type="month"
                        value={ledgerEndMonth}
                        onChange={(event) => setLedgerEndMonth(event.target.value)}
                        className="h-[42px] rounded-[12px] border border-[#efefef] bg-white px-[12px] text-[13px] text-[#272b30] outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => void handleLedgerExport()}
                        disabled={!project || exportingLedger || normalizeStatus(project.status) === "进行中"}
                        className="inline-flex h-[42px] items-center gap-[8px] rounded-[12px] border border-[#d8dce3] bg-white px-[14px] text-[13px] font-semibold text-[#272b30] disabled:opacity-50"
                      >
                        <FileSpreadsheet size={16} />
                        {exportingLedger ? "导出中..." : "导出研发支出辅助账"}
                      </button>
                    </div>
                  </div>
                  {exportError ? (
                    <div className="basis-full rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[12px] py-[10px] text-[12px] text-[#d46b08]">
                      {exportError}
                    </div>
                  ) : null}
                </div>
              </PanelCard>

              <PanelCard>
                <div className="border-b border-[#f2f3f5] px-[24px] py-[18px]">
                  <h3 className="text-[16px] font-semibold text-[#272b30]">最近操作日志</h3>
                </div>
                <div className="p-[24px]">
                  <div className="flex max-h-[260px] flex-col gap-[12px] overflow-y-auto">
                    {project.logs.length === 0 ? (
                      <div className="rounded-[12px] border border-dashed border-[#d8dce3] px-[14px] py-[16px] text-[13px] text-[#8c8f94]">暂无操作日志</div>
                    ) : (
                      project.logs.map((log) => (
                        <div key={log.id} className="rounded-[14px] bg-[#fafbfc] px-[14px] py-[12px]">
                          <div className="text-[14px] font-semibold text-[#272b30]">{log.action || "项目操作"}</div>
                          <div className="mt-[4px] text-[12px] text-[#8c8f94]">
                            {log.createdAt || "-"}
                            {log.remark ? ` · ${log.remark}` : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </PanelCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectListMain() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"全部" | UiProjectStatus>("全部");
  const [searchName, setSearchName] = useState("");
  const [activeName, setActiveName] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [endingId, setEndingId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailProject, setDetailProject] = useState<BackendProjectDetail | null>(null);

  const backendStatus = useMemo(() => {
    switch (statusFilter) {
      case "已结束":
        return "ended";
      case "已结算":
        return "settled";
      case "进行中":
        return "ongoing";
      default:
        return undefined;
    }
  }, [statusFilter]);

  const summary = useMemo(() => {
    const ongoing = projects.filter((project) => project.status === "进行中").length;
    const ended = projects.filter((project) => project.status === "已结束").length;
    const settled = projects.filter((project) => project.status === "已结算").length;

    return {
      ongoing,
      ended,
      settled,
      trend: buildTrendData(projects),
    };
  }, [projects]);

  async function loadProjects(targetPage = page, targetName = activeName) {
    setLoading(true);
    setPageError("");
    try {
      const data = await fetchProjectList({
        page: targetPage,
        size: pageSize,
        status: backendStatus,
        name: targetName || undefined,
      });
      setProjects(data.records.map(toListItem));
      setTotal(data.total);
      setPage(data.current);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "项目列表加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects(1, activeName);
  }, [backendStatus, activeName]);

  useEffect(() => {
    if (detailId == null) {
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    setDetailProject(null);

    void fetchProjectDetail(detailId)
      .then((data) => {
        if (!cancelled) {
          setDetailProject(data);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setDetailError(error.message || "项目详情加载失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [detailId]);

  async function handleEndProject(projectId: number) {
    setEndingId(projectId);
    setPageError("");
    try {
      await endProject(projectId);
      await loadProjects(page, activeName);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "结束项目失败");
    } finally {
      setEndingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-[20px]">
      {pageError ? (
        <div className="rounded-[14px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#d46b08]">{pageError}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-[16px] xl:grid-cols-[1.15fr_0.85fr]">
        <PanelCard>
          <div className="grid grid-cols-1 gap-[14px] p-[22px] md:grid-cols-3">
            <div className="rounded-[18px] bg-[#fafbfc] px-[18px] py-[16px]">
              <div className="flex items-center gap-[10px] text-[13px] text-[#8c8f94]">
                <FolderKanban size={16} />
                当前页项目
              </div>
              <div className="mt-[10px] text-[30px] font-semibold text-[#272b30]">{projects.length}</div>
            </div>
            <div className="rounded-[18px] bg-[#fafbfc] px-[18px] py-[16px]">
              <div className="flex items-center gap-[10px] text-[13px] text-[#8c8f94]">
                <CircleDashed size={16} />
                进行中
              </div>
              <div className="mt-[10px] text-[30px] font-semibold text-[#272b30]">{summary.ongoing}</div>
            </div>
            <div className="rounded-[18px] bg-[#fafbfc] px-[18px] py-[16px]">
              <div className="flex items-center gap-[10px] text-[13px] text-[#8c8f94]">
                <ClipboardCheck size={16} />
                已结算
              </div>
              <div className="mt-[10px] text-[30px] font-semibold text-[#272b30]">{summary.settled}</div>
            </div>
          </div>
        </PanelCard>

        <PanelCard>
          <div className="p-[22px]">
            <div className="mb-[14px] flex items-center gap-[10px]">
              <CalendarRange size={16} className="text-[#6f767e]" />
              <div>
                <div className="text-[16px] font-semibold text-[#272b30]">项目启动趋势</div>
                <div className="mt-[2px] text-[12px] text-[#8c8f94]">当前筛选结果中，最近 6 个月新增项目分布。</div>
              </div>
            </div>
            <div className="h-[190px]">
              {summary.trend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.trend} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#eef1f4" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "#8c8f94", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "#8c8f94", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`${value} 个`, "项目数"]}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid #eef1f4",
                        boxShadow: "0 14px 34px rgba(15,23,42,0.12)",
                      }}
                    />
                    <Bar dataKey="count" fill="#4f6bed" radius={[8, 8, 0, 0]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-[#d8dce3] text-[13px] text-[#8c8f94]">
                  当前没有可展示的趋势数据
                </div>
              )}
            </div>
          </div>
        </PanelCard>
      </div>

      <PanelCard>
        <div className="flex flex-wrap items-end justify-between gap-[12px] p-[20px]">
          <div className="flex flex-wrap items-end gap-[12px]">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-medium text-[#6f767e]">项目名称</label>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-[12px] top-[13px] text-[#9aa1ab]" />
                <input
                  value={searchName}
                  onChange={(event) => setSearchName(event.target.value)}
                  placeholder="输入项目名称搜索"
                  className="h-[42px] w-[240px] rounded-[12px] border border-[#efefef] bg-[#f7f8fa] pl-[34px] pr-[12px] text-[13px] text-[#272b30] outline-none transition-colors focus:border-[#272b30]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-medium text-[#6f767e]">项目状态</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "全部" | UiProjectStatus)}
                className="h-[42px] rounded-[12px] border border-[#efefef] bg-[#f7f8fa] px-[12px] text-[13px] text-[#272b30] outline-none"
              >
                {["全部", "进行中", "已结束", "已结算"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setActiveName(searchName.trim());
                setPage(1);
              }}
              className="h-[42px] rounded-[12px] bg-[#272b30] px-[18px] text-[13px] font-semibold text-white"
            >
              查询
            </button>
            <button
              onClick={() => {
                setSearchName("");
                setActiveName("");
                setStatusFilter("全部");
                setPage(1);
              }}
              className="h-[42px] rounded-[12px] border border-[#efefef] bg-white px-[16px] text-[13px] font-semibold text-[#6f767e]"
            >
              重置
            </button>
          </div>

          <button
            onClick={() => navigate("/projects/create")}
            className="h-[42px] rounded-[12px] bg-[#272b30] px-[16px] text-[13px] font-semibold text-white"
          >
            创建项目
          </button>
        </div>
      </PanelCard>

      <PanelCard>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f7f8fa]">
                {["序号", "项目名称", "项目编号", "开始时间", "结束时间", "状态", "描述", "操作"].map((header) => (
                  <th key={header} className="px-[20px] py-[14px] text-left text-[12px] font-semibold text-[#6f767e]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-[56px] text-center text-[14px] text-[#8c8f94]">
                    项目列表加载中...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-[56px] text-center text-[14px] text-[#8c8f94]">
                    暂无符合条件的项目
                  </td>
                </tr>
              ) : (
                projects.map((project, index) => (
                  <tr key={project.id} className="border-b border-[#f2f3f5] transition-colors hover:bg-[#fafbfc] last:border-b-0">
                    <td className="px-[20px] py-[16px] text-[13px] text-[#8c8f94]">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-[20px] py-[16px] text-[14px] font-semibold text-[#272b30]">{project.name}</td>
                    <td className="px-[20px] py-[16px] font-mono text-[13px] text-[#6f767e]">{project.code}</td>
                    <td className="px-[20px] py-[16px] text-[13px] text-[#6f767e]">{project.startDate}</td>
                    <td className="px-[20px] py-[16px] text-[13px] text-[#6f767e]">{project.endDate || "-"}</td>
                    <td className="px-[20px] py-[16px]">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="max-w-[280px] px-[20px] py-[16px] text-[13px] leading-[22px] text-[#6f767e]">
                      <div className="line-clamp-2">{project.description}</div>
                    </td>
                    <td className="px-[20px] py-[16px]">
                      <div className="flex items-center gap-[8px]">
                        {project.status === "进行中" ? (
                          <button
                            onClick={() => void handleEndProject(project.id)}
                            disabled={endingId === project.id}
                            className="h-[30px] rounded-[9px] bg-[#fff4e0] px-[10px] text-[12px] font-semibold text-[#d48806] disabled:opacity-50"
                          >
                            {endingId === project.id ? "处理中..." : "结束"}
                          </button>
                        ) : project.status === "已结束" ? (
                          <button
                            onClick={() => navigate("/projects/pending-settlement")}
                            className="h-[30px] rounded-[9px] bg-[#ebfff6] px-[10px] text-[12px] font-semibold text-[#1f9d72]"
                          >
                            去结算
                          </button>
                        ) : null}
                        <button
                          onClick={() => setDetailId(project.id)}
                          className="h-[30px] rounded-[9px] border border-[#efefef] bg-white px-[10px] text-[12px] font-semibold text-[#272b30]"
                        >
                          详情
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#f2f3f5] px-[24px] py-[16px]">
          <p className="text-[13px] text-[#8c8f94]">
            共 <span className="font-semibold text-[#272b30]">{total}</span> 个项目 · 第 {page} / {totalPages} 页
          </p>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => void loadProjects(page - 1, activeName)}
              disabled={page <= 1 || loading}
              className="h-[36px] rounded-[10px] border border-[#efefef] bg-white px-[12px] text-[13px] font-semibold text-[#6f767e] disabled:opacity-40"
            >
              上一页
            </button>
            <button
              onClick={() => void loadProjects(page + 1, activeName)}
              disabled={page >= totalPages || loading}
              className="h-[36px] rounded-[10px] border border-[#efefef] bg-white px-[12px] text-[13px] font-semibold text-[#6f767e] disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      </PanelCard>

      {detailId != null ? (
        <ProjectDetailModal
          project={detailProject}
          loading={detailLoading}
          error={detailError}
          onClose={() => {
            setDetailId(null);
            setDetailProject(null);
            setDetailError("");
          }}
        />
      ) : null}
    </div>
  );
}

export function ProjectListPage() {
  return (
    <div className="px-[40px] py-[36px]">
      <div className="mb-[24px]">
        <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">项目列表</h1>
        <p className="mt-[6px] text-[14px] text-[#8c8f94]">除了表格，本页额外展示项目推进分布和启动节奏，方便快速判断当前项目池状态。</p>
      </div>
      <ProjectListMain />
    </div>
  );
}
