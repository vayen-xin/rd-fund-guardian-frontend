import { useEffect, useMemo, useState } from "react";
import { fetchSystemLogs, type SystemLogRecord } from "../api/logs";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function getModuleClass(module?: string) {
  switch (module) {
    case "项目管理":
    case "project":
      return "bg-[#e6f9f0] text-[#0d9f5f]";
    case "账号管理":
    case "account":
    case "user":
      return "bg-[#fff8e6] text-[#d48806]";
    case "设备管理":
    case "device":
      return "bg-[#e8f0fe] text-[#3b5bdb]";
    case "人员管理":
    case "employee":
      return "bg-[#fce8f3] text-[#c2185b]";
    case "认证":
    case "权限校验":
    case "角色校验":
      return "bg-[#f4f4f4] text-[#6f767e]";
    default:
      return "bg-[#f4f4f4] text-[#6f767e]";
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "SUCCESS":
      return "成功";
    case "FAIL":
      return "失败";
    case "DENIED":
      return "拒绝";
    default:
      return "未知";
  }
}

function getStatusClass(status?: string) {
  switch (status) {
    case "SUCCESS":
      return "bg-[#e6f9f0] text-[#0d9f5f]";
    case "FAIL":
      return "bg-[#fff2f0] text-[#cf1322]";
    case "DENIED":
      return "bg-[#fff7e6] text-[#d48806]";
    default:
      return "bg-[#f4f4f4] text-[#6f767e]";
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function getOperatorLabel(record: SystemLogRecord) {
  if (record.operatorName) {
    return record.operatorName;
  }
  if (record.operatorUsername) {
    return record.operatorUsername;
  }
  return "--";
}

export function OperationLogPage() {
  const [operatorInput, setOperatorInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [operator, setOperator] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<SystemLogRecord[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setLoading(true);
      setError("");

      try {
        const pageData = await fetchSystemLogs({
          page,
          size: pageSize,
          operator: operator || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        if (!cancelled) {
          setRecords(pageData.records || []);
          setTotal(pageData.total || 0);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "日志加载失败");
          setRecords([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLogs();

    return () => {
      cancelled = true;
    };
  }, [endDate, operator, page, pageSize, startDate]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [pageSize, total]);

  function handleQuery() {
    setOperator(operatorInput.trim());
    setStartDate(startDateInput);
    setEndDate(endDateInput);
    setPage(1);
  }

  function handleReset() {
    setOperatorInput("");
    setStartDateInput("");
    setEndDateInput("");
    setOperator("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  return (
    <div className="px-[40px] py-[40px]">
      <div className="mb-[28px] flex items-center justify-between">
        <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">操作日志</h1>
      </div>

      <div className="mb-[24px] rounded-[16px] bg-[#fcfcfc] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-end gap-[12px]">
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-medium text-[#6f767e]">操作人</label>
            <input
              type="text"
              value={operatorInput}
              onChange={(event) => setOperatorInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleQuery()}
              placeholder="请输入姓名或用户名"
              className="h-[40px] w-[180px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none transition-colors focus:border-[#272b30]"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-medium text-[#6f767e]">开始日期</label>
            <input
              type="date"
              value={startDateInput}
              onChange={(event) => setStartDateInput(event.target.value)}
              className="h-[40px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none transition-colors focus:border-[#272b30]"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-medium text-[#6f767e]">结束日期</label>
            <input
              type="date"
              value={endDateInput}
              onChange={(event) => setEndDateInput(event.target.value)}
              className="h-[40px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none transition-colors focus:border-[#272b30]"
            />
          </div>

          <button
            onClick={handleQuery}
            className="h-[40px] rounded-[10px] bg-[#272b30] px-[18px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1a1d1f]"
          >
            查询
          </button>

          <button
            onClick={handleReset}
            className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[16px] text-[13px] font-semibold text-[#6f767e] transition-colors hover:bg-[#f4f4f4]"
          >
            重置
          </button>

          <div className="ml-auto flex items-center gap-[8px]">
            <span className="text-[12px] text-[#9a9fa5]">每页</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-[36px] rounded-[10px] border border-[#efefef] bg-white px-[10px] text-[13px] font-semibold text-[#272b30] outline-none transition-colors hover:border-[#272b30]"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-[20px] rounded-[16px] border border-[#ffd9d4] bg-[#fff3f1] px-[18px] py-[14px] text-[14px] text-[#d84c2f]">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[16px] bg-[#fcfcfc] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {["时间", "操作人", "模块", "动作", "状态", "详情", "IP"].map((header) => (
                  <th key={header} className="px-[20px] py-[12px] text-left text-[12px] font-semibold text-[#6f767e]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                    正在加载日志数据...
                  </td>
                </tr>
              ) : records.length ? (
                records.map((record) => (
                  <tr key={record.id} className="border-b border-[#f4f4f4] last:border-b-0 hover:bg-[#fafafa]">
                    <td className="whitespace-nowrap px-[20px] py-[14px] text-[13px] text-[#272b30]">{formatDateTime(record.createdAt)}</td>
                    <td className="px-[20px] py-[14px]">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-[#272b30]">{getOperatorLabel(record)}</span>
                        <span className="text-[12px] text-[#9a9fa5]">{record.operatorUsername || "--"}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-[20px] py-[14px]">
                      <span className={`rounded-[6px] px-[10px] py-[4px] text-[11px] font-semibold ${getModuleClass(record.module)}`}>
                        {record.module || "系统模块"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-[20px] py-[14px] text-[13px] font-semibold text-[#272b30]">{record.action || "--"}</td>
                    <td className="whitespace-nowrap px-[20px] py-[14px]">
                      <span className={`rounded-[6px] px-[10px] py-[4px] text-[11px] font-semibold ${getStatusClass(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="px-[20px] py-[14px] text-[13px] leading-[20px] text-[#272b30]">
                      <div>{record.details || "暂无详情"}</div>
                      {record.resultMessage ? <div className="mt-[4px] text-[12px] text-[#9a9fa5]">{record.resultMessage}</div> : null}
                    </td>
                    <td className="whitespace-nowrap px-[20px] py-[14px] text-[13px] text-[#6f767e]">{record.ip || "--"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-[56px] text-center text-[14px] text-[#9a9fa5]">
                    暂无符合条件的操作日志
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-[12px] border-t border-[#f4f4f4] px-[24px] py-[16px]">
          <span className="text-[13px] text-[#9a9fa5]">
            共 <span className="font-semibold text-[#272b30]">{total}</span> 条日志
          </span>

          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="h-[34px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[13px] text-[#6f767e] transition-colors hover:bg-[#f4f4f4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>
            <span className="text-[13px] text-[#6f767e]">
              第 <span className="font-semibold text-[#272b30]">{page}</span> / {totalPages} 页
            </span>
            <button
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              className="h-[34px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[13px] text-[#6f767e] transition-colors hover:bg-[#f4f4f4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
