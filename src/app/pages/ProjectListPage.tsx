import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
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

function normalizeStatus(status?: string): UiProjectStatus {
  switch (status) {
    case "settled":
    case "已结算":
      return "已结算";
    case "ended":
    case "已结束":
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

function StatusBadge({ status }: { status: UiProjectStatus }) {
  const styleMap: Record<UiProjectStatus, string> = {
    进行中: "bg-[#e6f9f0] text-[#0d9f5f] border border-[#b7ebc6]",
    已结束: "bg-[#fff7e6] text-[#ad6800] border border-[#ffe7ba]",
    已结算: "bg-[#f0f5ff] text-[#1d39c4] border border-[#d6e4ff]",
  };

  return <span className={`inline-flex items-center px-[10px] h-[28px] rounded-[999px] text-[12px] font-semibold ${styleMap[status]}`}>{status}</span>;
}

function PanelCard({ children }: { children: ReactNode }) {
  return <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">{children}</div>;
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative w-[920px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-48px)] overflow-hidden rounded-[20px] bg-white shadow-[0_16px_64px_rgba(0,0,0,0.18)] flex flex-col">
        <div className="px-[28px] py-[22px] border-b border-[#f4f4f4] flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-[#272b30]">项目详情</h2>
            <p className="text-[13px] text-[#9a9fa5] mt-[4px]">查看项目基础信息、关联资源和操作记录。</p>
          </div>
          <button onClick={onClose} className="w-[36px] h-[36px] rounded-[10px] hover:bg-[#f4f4f4] text-[#6f767e] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-[28px]">
          {loading ? (
            <div className="py-[60px] text-center text-[#9a9fa5] text-[14px]">项目详情加载中...</div>
          ) : error ? (
            <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[#ad6800] text-[13px]">{error}</div>
          ) : !project ? (
            <div className="py-[60px] text-center text-[#9a9fa5] text-[14px]">暂无项目详情</div>
          ) : (
            <div className="flex flex-col gap-[20px]">
              <PanelCard>
                <div className="grid grid-cols-2 gap-[18px] p-[24px]">
                  {[
                    { label: "项目名称", value: project.projectName },
                    { label: "项目编号", value: project.code || `P-${project.id}` },
                    { label: "开始时间", value: project.startDate },
                    { label: "结束时间", value: project.endDate || "-" },
                    { label: "项目状态", value: normalizeStatus(project.status) },
                    { label: "结算金额", value: project.settlementAmount ? `¥ ${project.settlementAmount.toFixed(2)}` : "-" },
                    { label: "项目负责人", value: project.managerName || "-" },
                    { label: "负责人电话", value: project.managerPhone || "-" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-[6px]">
                      <span className="text-[12px] text-[#9a9fa5]">{item.label}</span>
                      <span className="text-[14px] text-[#272b30] font-semibold">{item.value}</span>
                    </div>
                  ))}

                  <div className="col-span-2 flex flex-col gap-[6px]">
                    <span className="text-[12px] text-[#9a9fa5]">项目描述</span>
                    <p className="text-[14px] text-[#4f5660] leading-[24px]">{project.description || "暂无项目描述"}</p>
                  </div>
                </div>
              </PanelCard>

              <div className="grid grid-cols-2 gap-[20px]">
                <PanelCard>
                  <div className="px-[24px] py-[18px] border-b border-[#f4f4f4] flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-[#272b30]">关联员工</h3>
                    <span className="text-[12px] text-[#9a9fa5]">{project.employees.length} 人</span>
                  </div>
                  <div className="p-[24px] flex flex-col gap-[12px]">
                    {project.employees.length === 0 ? (
                      <p className="text-[13px] text-[#9a9fa5]">暂无关联员工</p>
                    ) : (
                      project.employees.map((employee) => (
                        <div key={employee.id} className="rounded-[12px] bg-[#fafafa] px-[14px] py-[12px]">
                          <div className="text-[14px] font-semibold text-[#272b30]">{employee.employeeName}</div>
                          <div className="text-[12px] text-[#9a9fa5] mt-[4px]">
                            {employee.department || "未设置部门"}
                            {employee.employeeType ? ` · ${employee.employeeType}` : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PanelCard>

                <PanelCard>
                  <div className="px-[24px] py-[18px] border-b border-[#f4f4f4] flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-[#272b30]">关联设备</h3>
                    <span className="text-[12px] text-[#9a9fa5]">{project.devices.length} 台</span>
                  </div>
                  <div className="p-[24px] flex flex-col gap-[12px]">
                    {project.devices.length === 0 ? (
                      <p className="text-[13px] text-[#9a9fa5]">暂无关联设备</p>
                    ) : (
                      project.devices.map((device) => (
                        <div key={device.id} className="rounded-[12px] bg-[#fafafa] px-[14px] py-[12px]">
                          <div className="text-[14px] font-semibold text-[#272b30]">{device.deviceName || `设备 ${device.deviceId}`}</div>
                          <div className="text-[12px] text-[#9a9fa5] mt-[4px]">
                            {device.model || "未设置型号"}
                            {typeof device.dailyDepreciation === "number" ? ` · 日折旧 ${device.dailyDepreciation}` : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PanelCard>
              </div>

              <PanelCard>
                <div className="px-[24px] py-[18px] border-b border-[#f4f4f4]">
                  <h3 className="text-[16px] font-semibold text-[#272b30]">操作日志</h3>
                </div>
                <div className="p-[24px] flex flex-col gap-[14px]">
                  {project.logs.length === 0 ? (
                    <p className="text-[13px] text-[#9a9fa5]">暂无操作日志</p>
                  ) : (
                    project.logs.map((log) => (
                      <div key={log.id} className="rounded-[12px] bg-[#fafafa] px-[16px] py-[14px]">
                        <div className="text-[13px] font-semibold text-[#272b30]">{log.action || "项目操作"}</div>
                        <div className="text-[12px] text-[#9a9fa5] mt-[6px]">
                          {log.createdAt || "-"}
                          {log.remark ? ` · ${log.remark}` : ""}
                        </div>
                      </div>
                    ))
                  )}
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

  const loadProjects = async (targetPage = page, targetName = activeName) => {
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
  };

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

    fetchProjectDetail(detailId)
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

  const handleSearch = () => {
    setActiveName(searchName.trim());
    setPage(1);
  };

  const handleReset = () => {
    setSearchName("");
    setActiveName("");
    setStatusFilter("全部");
    setPage(1);
  };

  const handleEndProject = async (projectId: number) => {
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
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-[24px]">
      {pageError && (
        <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[#ad6800] text-[13px]">
          {pageError}
        </div>
      )}

      <PanelCard>
        <div className="p-[20px] flex items-end justify-between flex-wrap gap-[12px]">
          <div className="flex items-end gap-[12px] flex-wrap">
            <div className="flex flex-col gap-[5px]">
              <label className="text-[#6f767e] text-[12px] font-medium">项目名称</label>
              <input
                value={searchName}
                onChange={(event) => setSearchName(event.target.value)}
                placeholder="输入项目名称搜索"
                className="h-[40px] w-[220px] px-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[#6f767e] text-[12px] font-medium">项目状态</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "全部" | UiProjectStatus)}
                className="h-[40px] px-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] font-semibold outline-none"
              >
                {["全部", "进行中", "已结束", "已结算"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSearch}
              className="h-[40px] px-[18px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors"
            >
              查询
            </button>
            <button
              onClick={handleReset}
              className="h-[40px] px-[14px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors"
            >
              重置
            </button>
          </div>

          <button
            onClick={() => navigate("/projects/create")}
            className="flex items-center gap-[7px] h-[40px] px-[14px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            创建项目
          </button>
        </div>
      </PanelCard>

      <PanelCard>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {["序号", "项目名称", "项目编号", "开始时间", "结束时间", "状态", "描述", "操作"].map((header) => (
                  <th key={header} className="text-left px-[20px] py-[13px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-[56px] text-[#9a9fa5] text-[14px]">
                    项目列表加载中...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-[56px] text-[#9a9fa5] text-[14px]">
                    暂无符合条件的项目
                  </td>
                </tr>
              ) : (
                projects.map((project, index) => (
                  <tr key={project.id} className="border-b border-[#f4f4f4] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-[20px] py-[16px] text-[#9a9fa5] text-[13px]">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-[20px] py-[16px] text-[#272b30] text-[13px] font-semibold">{project.name}</td>
                    <td className="px-[20px] py-[16px] text-[#6f767e] text-[13px] font-mono">{project.code}</td>
                    <td className="px-[20px] py-[16px] text-[#6f767e] text-[13px] whitespace-nowrap">{project.startDate}</td>
                    <td className="px-[20px] py-[16px] text-[#6f767e] text-[13px] whitespace-nowrap">{project.endDate || "-"}</td>
                    <td className="px-[20px] py-[16px]">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-[20px] py-[16px] text-[#6f767e] text-[13px] max-w-[260px]">
                      <div className="line-clamp-2">{project.description}</div>
                    </td>
                    <td className="px-[20px] py-[16px]">
                      <div className="flex items-center gap-[8px]">
                        {project.status === "进行中" && (
                          <button
                            onClick={() => void handleEndProject(project.id)}
                            disabled={endingId === project.id}
                            className="px-[10px] h-[30px] rounded-[8px] border border-[#d48806]/30 bg-[#fff4e0] text-[#d48806] text-[12px] font-semibold hover:bg-[#ffe8a0] transition-colors disabled:opacity-50"
                          >
                            {endingId === project.id ? "处理中..." : "结束"}
                          </button>
                        )}
                        {project.status === "已结束" && (
                          <button
                            onClick={() => navigate("/projects/pending-settlement")}
                            className="px-[10px] h-[30px] rounded-[8px] border border-[#0d9f5f]/30 bg-[#e6f9f0] text-[#0d9f5f] text-[12px] font-semibold hover:bg-[#c8f0dd] transition-colors"
                          >
                            去结算
                          </button>
                        )}
                        <button
                          onClick={() => setDetailId(project.id)}
                          className="px-[10px] h-[30px] rounded-[8px] border border-[#efefef] bg-white text-[#272b30] text-[12px] font-semibold hover:bg-[#f4f4f4] transition-colors"
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

        <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[#f4f4f4]">
          <p className="text-[#9a9fa5] text-[13px]">
            共 <span className="text-[#272b30] font-semibold">{total}</span> 个项目 · 第 {page} / {totalPages} 页
          </p>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => void loadProjects(page - 1, activeName)}
              disabled={page <= 1 || loading}
              className="h-[34px] px-[12px] rounded-[8px] border border-[#efefef] bg-white text-[#6f767e] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors disabled:opacity-40"
            >
              上一页
            </button>
            <button
              onClick={() => void loadProjects(page + 1, activeName)}
              disabled={page >= totalPages || loading}
              className="h-[34px] px-[12px] rounded-[8px] border border-[#efefef] bg-white text-[#6f767e] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      </PanelCard>

      {detailId != null && (
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
      )}
    </div>
  );
}

export function ProjectListPage() {
  return (
    <div className="px-[40px] py-[40px]">
      <div className="flex items-center justify-between mb-[28px]">
        <h1 className="font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">项目列表</h1>
      </div>
      <ProjectListMain />
    </div>
  );
}
