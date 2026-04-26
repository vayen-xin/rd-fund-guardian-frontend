import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchCurrentUser, type CurrentUser } from "../api/auth";
import { fetchMonthlyDetail, fetchProjectMonthlyList, submitMonthlyDetail, type MonthlyDetail } from "../api/monthly";
import { fetchAllProjects } from "../api/projects";
import { confirmSettlement, reopenSettlement } from "../api/settlements";

type SettlementRow = {
  projectId: number;
  projectName: string;
  yearMonth: string;
  status: string;
  amount: number;
  updatedAt?: string;
  projectStartDate?: string;
  hasMonthlyData: boolean;
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "missing":
      return "未录入";
    case "settled":
      return "已结算";
    case "finalized":
      return "待结算";
    default:
      return "编辑中";
  }
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "missing":
      return "bg-[#f4f4f4] text-[#6f767e]";
    case "settled":
      return "bg-[#e6f9f0] text-[#0d9f5f]";
    case "finalized":
      return "bg-[#fff4e0] text-[#d48806]";
    default:
      return "bg-[#e8f4ff] text-[#1677ff]";
  }
}

function formatMoney(value: number) {
  return `¥ ${Number(value || 0).toFixed(2)}`;
}

function getProjectMonth(startDate?: string) {
  return startDate ? String(startDate).slice(0, 7) : getCurrentMonth();
}

function getFeeCategoryLabel(code: string) {
  switch (code) {
    case "labor":
      return "人员人工费用";
    case "direct":
      return "直接投入费用";
    case "deprec":
      return "折旧费用与长期待摊费用";
    case "intangible":
      return "无形资产摊销费用";
    case "design":
      return "设计费用";
    case "equip":
      return "装备调试费用与试验费用";
    case "outsource":
      return "委托外部研究开发费用";
    case "other":
      return "其他费用";
    default:
      return code;
  }
}

function DetailModal({
  row,
  detail,
  loading,
  currentUser,
  acting,
  onClose,
  onSubmit,
  onConfirm,
  onReopen,
}: {
  row: SettlementRow;
  detail: MonthlyDetail | null;
  loading: boolean;
  currentUser: CurrentUser | null;
  acting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onConfirm: () => void;
  onReopen: () => void;
}) {
  const canReopen = currentUser?.role === "branch_admin" || currentUser?.role === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex max-h-[calc(100vh-48px)] w-[980px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_16px_64px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between border-b border-[#f4f4f4] px-[28px] py-[22px]">
          <div>
            <h2 className="text-[22px] font-semibold text-[#272b30]">{row.projectName}</h2>
            <p className="mt-[4px] text-[13px] text-[#9a9fa5]">
              {row.yearMonth} · {getStatusLabel(row.status)}
            </p>
          </div>
          <button onClick={onClose} className="h-[36px] w-[36px] rounded-[10px] text-[#6f767e] transition-colors hover:bg-[#f4f4f4]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-[28px]">
          {loading ? (
            <div className="py-[60px] text-center text-[14px] text-[#9a9fa5]">结算详情加载中...</div>
          ) : !detail ? (
            <div className="py-[60px] text-center text-[14px] text-[#9a9fa5]">暂无结算详情</div>
          ) : (
            <div className="flex flex-col gap-[20px]">
              <div className="grid grid-cols-4 gap-[16px]">
                {[
                  { label: "结算状态", value: getStatusLabel(row.status) },
                  { label: "费用总额", value: formatMoney(row.amount) },
                  { label: "关联员工", value: `${detail.employees.length} 人` },
                  { label: "关联设备", value: `${detail.devices.length} 台` },
                ].map((item) => (
                  <div key={item.label} className="rounded-[14px] bg-[#fafafa] px-[16px] py-[14px]">
                    <div className="text-[12px] text-[#9a9fa5]">{item.label}</div>
                    <div className="mt-[6px] text-[18px] font-semibold text-[#272b30]">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-[16px] border border-[#f4f4f4]">
                <div className="border-b border-[#f4f4f4] px-[20px] py-[16px] font-semibold text-[#272b30]">八大费用分类</div>
                <div className="grid grid-cols-2 gap-[14px] p-[20px]">
                  {Object.entries(detail.fees || {}).map(([key, group]) => {
                    const total = [...(group.systemItems || []), ...(group.manualItems || [])].reduce((sum, item) => sum + Number(item.amount || 0), 0);
                    return (
                      <div key={key} className="rounded-[12px] bg-[#fafafa] px-[16px] py-[14px]">
                        <div className="text-[14px] font-semibold text-[#272b30]">{getFeeCategoryLabel(key)}</div>
                        <div className="mt-[6px] text-[12px] text-[#9a9fa5]">{formatMoney(total)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-[10px] border-t border-[#f4f4f4] px-[28px] py-[20px]">
          <button onClick={onClose} className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[18px] text-[13px] font-semibold text-[#6f767e]">
            关闭
          </button>
          {row.status === "draft" ? (
            <button onClick={onSubmit} disabled={acting} className="h-[40px] rounded-[10px] bg-[#1677ff] px-[18px] text-[13px] font-semibold text-white disabled:opacity-50">
              {acting ? "处理中..." : "发起待结算"}
            </button>
          ) : null}
          {row.status === "finalized" ? (
            <button onClick={onConfirm} disabled={acting} className="h-[40px] rounded-[10px] bg-[#272b30] px-[18px] text-[13px] font-semibold text-white disabled:opacity-50">
              {acting ? "处理中..." : "确认结算"}
            </button>
          ) : null}
          {row.status === "settled" && canReopen ? (
            <button onClick={onReopen} disabled={acting} className="h-[40px] rounded-[10px] bg-[#d48806] px-[18px] text-[13px] font-semibold text-white disabled:opacity-50">
              {acting ? "处理中..." : "重新打开编辑"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PendingSettlementPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [allMonths, setAllMonths] = useState(true);
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [selectedRow, setSelectedRow] = useState<SettlementRow | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<MonthlyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "draft" | "finalized" | "settled">("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  async function loadPage() {
    setLoading(true);
    setPageError("");
    try {
      const [user, projectPage] = await Promise.all([fetchCurrentUser(), fetchAllProjects()]);
      setCurrentUser(user);

      const monthlyLists = await Promise.all(projectPage.records.map((project) => fetchProjectMonthlyList(project.id)));
      const nextRows: SettlementRow[] = [];

      projectPage.records.forEach((project, index) => {
        const list = monthlyLists[index];

        if (allMonths) {
          const latest = [...(list || [])].sort((a, b) => String(b.workMonth).localeCompare(String(a.workMonth)))[0];

          nextRows.push({
            projectId: project.id,
            projectName: project.projectName,
            yearMonth: latest ? String(latest.workMonth).slice(0, 7) : getProjectMonth(project.startDate),
            status: latest ? latest.status : "missing",
            amount: latest ? Number(latest.grandTotal || 0) : 0,
            updatedAt: latest?.updatedAt,
            projectStartDate: project.startDate,
            hasMonthlyData: Boolean(latest),
          });
          return;
        }

        if (!list || list.length === 0) {
          return;
        }

        const match = list.find((item) => String(item.workMonth).slice(0, 7) === selectedMonth);
        if (!match) {
          return;
        }
        nextRows.push({
          projectId: project.id,
          projectName: project.projectName,
          yearMonth: selectedMonth,
          status: match.status,
          amount: Number(match.grandTotal || 0),
          updatedAt: match.updatedAt,
          projectStartDate: project.startDate,
          hasMonthlyData: true,
        });
      });

      setRows(
        nextRows.sort((a, b) => {
          const startCompare = String(b.projectStartDate || "").localeCompare(String(a.projectStartDate || ""));
          if (startCompare !== 0) {
            return startCompare;
          }
          const monthCompare = String(b.yearMonth || "").localeCompare(String(a.yearMonth || ""));
          if (monthCompare !== 0) {
            return monthCompare;
          }
          return b.projectId - a.projectId;
        }),
      );
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "待结算页面加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [selectedMonth, allMonths]);

  useEffect(() => {
    setPage(1);
  }, [selectedMonth, allMonths, filter]);

  useEffect(() => {
    if (!selectedRow || !selectedRow.hasMonthlyData) {
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setSelectedDetail(null);

    fetchMonthlyDetail(selectedRow.projectId, selectedRow.yearMonth)
      .then((detail) => {
        if (!cancelled) {
          setSelectedDetail(detail);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setPageError(error.message || "加载结算详情失败");
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
  }, [selectedRow]);

  const visibleRows = useMemo(() => {
    const baseRows = currentUser?.role === "user" ? rows.filter((item) => item.status !== "settled") : rows;
    if (filter === "all") {
      return baseRows;
    }
    return baseRows.filter((item) => item.status === filter);
  }, [currentUser?.role, filter, rows]);

  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      if (!row.yearMonth) return;
      map.set(row.yearMonth, (map.get(row.yearMonth) ?? 0) + Number(row.amount || 0));
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const pageRows = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return visibleRows.slice(start, start + pageSize);
  }, [page, totalPages, visibleRows]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function handleSubmit(row: SettlementRow) {
    setActing(true);
    setPageError("");
    try {
      await submitMonthlyDetail(row.projectId, row.yearMonth);
      setSelectedRow(null);
      setSelectedDetail(null);
      await loadPage();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "发起待结算失败");
    } finally {
      setActing(false);
    }
  }

  async function handleConfirm(row: SettlementRow) {
    setActing(true);
    setPageError("");
    try {
      await confirmSettlement(row.projectId, row.yearMonth);
      setSelectedRow(null);
      setSelectedDetail(null);
      await loadPage();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "确认结算失败");
    } finally {
      setActing(false);
    }
  }

  async function handleReopen(row: SettlementRow) {
    setActing(true);
    setPageError("");
    try {
      await reopenSettlement(row.projectId, row.yearMonth, "前端发起重新结算");
      setSelectedRow(null);
      setSelectedDetail(null);
      await loadPage();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "重新结算失败");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="px-[40px] py-[40px]">
      <div className="mb-[28px] flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">待结算项目</h1>
          <p className="mt-[4px] text-[13px] text-[#9a9fa5]">在这里完成发起待结算、确认结算和重新结算。</p>
        </div>
        <div className="flex items-center gap-[10px]">
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            disabled={allMonths}
            className="h-[42px] rounded-[10px] border border-[#efefef] bg-[#fcfcfc] px-[12px] text-[13px] text-[#272b30] outline-none disabled:opacity-60"
          />
          <button
            onClick={() => setAllMonths((value) => !value)}
            className={`h-[42px] rounded-[10px] border px-[12px] text-[13px] font-semibold ${
              allMonths ? "border-[#d48806] bg-[#fff4e0] text-[#d48806]" : "border-[#efefef] bg-white text-[#6f767e]"
            }`}
          >
            全部月份
          </button>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | "draft" | "finalized" | "settled")}
            className="h-[42px] rounded-[10px] border border-[#efefef] bg-[#fcfcfc] px-[12px] text-[13px] text-[#272b30] outline-none"
          >
            <option value="all">全部</option>
            <option value="draft">编辑中</option>
            <option value="finalized">待结算</option>
            <option value="settled">已结算</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-[24px]">
        {pageError ? (
          <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#ad6800]">{pageError}</div>
        ) : null}

        <div className="rounded-[16px] bg-[#fcfcfc] p-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="mb-[14px] flex items-center justify-between">
            <div>
              <div className="text-[16px] font-semibold text-[#272b30]">月度结算金额趋势</div>
              <div className="mt-[2px] text-[12px] text-[#9a9fa5]">只统计当前页面已加载的项目月度数据</div>
            </div>
            <div className="text-[12px] text-[#9a9fa5]">最近 6 个月</div>
          </div>
          <div className="h-[200px]">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 6, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#eef1f4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#8c8f94", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#8c8f94", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`\u00a5 ${Number(value || 0).toFixed(2)}`, "结算金额"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #eef1f4", boxShadow: "0 14px 34px rgba(15,23,42,0.12)" }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#4f6bed" strokeWidth={2.4} dot={{ r: 3.5 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[14px] border border-dashed border-[#d8dce3] text-[13px] text-[#9a9fa5]">
                当前数据不足，无法绘制趋势
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[16px] bg-[#fcfcfc] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  {["项目名称", "月份", "金额", "状态", "更新时间", "操作"].map((header) => (
                    <th key={header} className="whitespace-nowrap px-[20px] py-[12px] text-left text-[12px] font-semibold text-[#6f767e]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      结算数据加载中...
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      {allMonths ? "暂无可结算项目数据" : "当前月份暂无可结算数据"}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={`${row.projectId}-${row.yearMonth}`} className="border-b border-[#f4f4f4] last:border-b-0 transition-colors hover:bg-[#fafafa]">
                      <td className="px-[20px] py-[15px] text-[13px] font-semibold text-[#272b30]">{row.projectName}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{row.yearMonth}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{formatMoney(row.amount)}</td>
                      <td className="px-[20px] py-[15px]">
                        <span className={`inline-flex h-[28px] items-center rounded-[999px] px-[10px] text-[12px] font-semibold ${getStatusStyle(row.status)}`}>
                          {getStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{row.updatedAt || "-"}</td>
                      <td className="px-[20px] py-[15px]">
                        <div className="flex items-center gap-[8px]">
                          {row.status === "draft" ? (
                            <button
                              onClick={() => void handleSubmit(row)}
                              disabled={acting}
                              className="h-[30px] rounded-[8px] border border-[#1677ff]/30 bg-[#e8f4ff] px-[12px] text-[12px] font-semibold text-[#1677ff] disabled:opacity-50"
                            >
                              发起待结算
                            </button>
                          ) : null}
                          {row.status === "finalized" ? (
                            <button
                              onClick={() => void handleConfirm(row)}
                              disabled={acting}
                              className="h-[30px] rounded-[8px] border border-[#0d9f5f]/30 bg-[#e6f9f0] px-[12px] text-[12px] font-semibold text-[#0d9f5f] disabled:opacity-50"
                            >
                              结算
                            </button>
                          ) : null}
                          {row.status === "settled" && (currentUser?.role === "branch_admin" || currentUser?.role === "admin") ? (
                            <button
                              onClick={() => void handleReopen(row)}
                              disabled={acting}
                              className="h-[30px] rounded-[8px] border border-[#d48806]/30 bg-[#fff4e0] px-[12px] text-[12px] font-semibold text-[#d48806] disabled:opacity-50"
                            >
                              重新打开编辑
                            </button>
                          ) : null}
                          {row.hasMonthlyData ? (
                            <button
                              onClick={() => setSelectedRow(row)}
                              className="h-[30px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#272b30]"
                            >
                              详情
                            </button>
                          ) : (
                            <button
                              disabled
                              className="h-[30px] rounded-[8px] border border-[#efefef] bg-[#f7f7f7] px-[12px] text-[12px] font-semibold text-[#9a9fa5]"
                            >
                              暂无详情
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && visibleRows.length > 0 ? (
            <div className="flex items-center justify-between border-t border-[#f4f4f4] px-[20px] py-[14px]">
              <div className="text-[13px] text-[#9a9fa5]">
                共 <span className="font-semibold text-[#272b30]">{visibleRows.length}</span> 个项目 · 第 {Math.min(page, totalPages)} / {totalPages} 页
              </div>
              <div className="flex items-center gap-[10px]">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1}
                  className="h-[34px] rounded-[10px] border border-[#efefef] bg-white px-[14px] text-[13px] font-semibold text-[#6f767e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages}
                  className="h-[34px] rounded-[10px] border border-[#efefef] bg-white px-[14px] text-[13px] font-semibold text-[#6f767e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {selectedRow ? (
        <DetailModal
          row={selectedRow}
          detail={selectedDetail}
          loading={detailLoading}
          currentUser={currentUser}
          acting={acting}
          onClose={() => {
            setSelectedRow(null);
            setSelectedDetail(null);
          }}
          onSubmit={() => void handleSubmit(selectedRow)}
          onConfirm={() => void handleConfirm(selectedRow)}
          onReopen={() => void handleReopen(selectedRow)}
        />
      ) : null}
    </div>
  );
}
