import { useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, type CurrentUser } from "../api/auth";
import { fetchMonthlyDetail, fetchProjectMonthlyList, type MonthlyDetail } from "../api/monthly";
import { fetchAllProjects } from "../api/projects";
import { confirmSettlement, reopenSettlement } from "../api/settlements";

type SettlementRow = {
  projectId: number;
  projectName: string;
  yearMonth: string;
  status: string;
  amount: number;
  updatedAt?: string;
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getStatusLabel(status?: string) {
  switch (status) {
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
    case "settled":
      return "bg-[#e6f9f0] text-[#0d9f5f]";
    case "finalized":
      return "bg-[#fff4e0] text-[#d48806]";
    default:
      return "bg-[#f4f4f4] text-[#9a9fa5]";
  }
}

function formatMoney(value: number) {
  return `¥ ${Number(value || 0).toFixed(2)}`;
}

function DetailModal({
  row,
  detail,
  loading,
  currentUser,
  acting,
  onClose,
  onConfirm,
  onReopen,
}: {
  row: SettlementRow;
  detail: MonthlyDetail | null;
  loading: boolean;
  currentUser: CurrentUser | null;
  acting: boolean;
  onClose: () => void;
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
                        <div className="text-[14px] font-semibold text-[#272b30]">{key}</div>
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
          {row.status === "finalized" ? (
            <button onClick={onConfirm} disabled={acting} className="h-[40px] rounded-[10px] bg-[#272b30] px-[18px] text-[13px] font-semibold text-white disabled:opacity-50">
              {acting ? "处理中..." : "确认结算"}
            </button>
          ) : null}
          {row.status === "settled" && canReopen ? (
            <button onClick={onReopen} disabled={acting} className="h-[40px] rounded-[10px] bg-[#d48806] px-[18px] text-[13px] font-semibold text-white disabled:opacity-50">
              {acting ? "处理中..." : "重新结算"}
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
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [selectedRow, setSelectedRow] = useState<SettlementRow | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<MonthlyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "finalized" | "settled">("all");

  async function loadPage() {
    setLoading(true);
    setPageError("");
    try {
      const [user, projectPage] = await Promise.all([fetchCurrentUser(), fetchAllProjects()]);
      setCurrentUser(user);

      const monthlyLists = await Promise.all(projectPage.records.map((project) => fetchProjectMonthlyList(project.id)));
      const nextRows: SettlementRow[] = [];

      projectPage.records.forEach((project, index) => {
        const match = monthlyLists[index].find((item) => String(item.workMonth).slice(0, 7) === selectedMonth);
        if (!match) {
          return;
        }
        if (user.role !== "admin" && user.role !== "branch_admin" && match.status !== "finalized") {
          return;
        }
        nextRows.push({
          projectId: project.id,
          projectName: project.projectName,
          yearMonth: selectedMonth,
          status: match.status,
          amount: Number(match.grandTotal || 0),
          updatedAt: match.updatedAt,
        });
      });

      setRows(nextRows);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "待结算页面加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedRow) {
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
    if (filter === "all") {
      return rows;
    }
    return rows.filter((item) => item.status === filter);
  }, [filter, rows]);

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
          <p className="mt-[4px] text-[13px] text-[#9a9fa5]">按月份查看待结算和已结算项目，并支持重新结算。</p>
        </div>
        <div className="flex items-center gap-[10px]">
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="h-[42px] rounded-[10px] border border-[#efefef] bg-[#fcfcfc] px-[12px] text-[13px] text-[#272b30] outline-none"
          />
          {(currentUser?.role === "admin" || currentUser?.role === "branch_admin") ? (
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as "all" | "finalized" | "settled")}
              className="h-[42px] rounded-[10px] border border-[#efefef] bg-[#fcfcfc] px-[12px] text-[13px] text-[#272b30] outline-none"
            >
              <option value="all">全部</option>
              <option value="finalized">待结算</option>
              <option value="settled">已结算</option>
            </select>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-[24px]">
        {pageError ? (
          <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#ad6800]">{pageError}</div>
        ) : null}

        <div className="overflow-hidden rounded-[16px] bg-[#fcfcfc] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  {["项目名称", "月份", "金额", "状态", "更新时间", "操作"].map((header) => (
                    <th key={header} className="px-[20px] py-[12px] text-left text-[12px] font-semibold whitespace-nowrap text-[#6f767e]">
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
                      当前月份暂无可结算数据
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
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
                              重新结算
                            </button>
                          ) : null}
                          <button
                            onClick={() => setSelectedRow(row)}
                            className="h-[30px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#272b30]"
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
          onConfirm={() => void handleConfirm(selectedRow)}
          onReopen={() => void handleReopen(selectedRow)}
        />
      ) : null}
    </div>
  );
}
