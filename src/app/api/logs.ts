import { apiRequest } from "./http";

export type SystemLogRecord = {
  id: number;
  companyId?: number;
  userId?: number;
  operatorName?: string;
  operatorUsername?: string;
  module?: string;
  action?: string;
  details?: string;
  status?: string;
  resultMessage?: string;
  ip?: string;
  userAgent?: string;
  createdAt?: string;
};

export type SystemLogPage = {
  records: SystemLogRecord[];
  current: number;
  size: number;
  total: number;
};

export function fetchSystemLogs(params: {
  page: number;
  size: number;
  operator?: string;
  startDate?: string;
  endDate?: string;
}) {
  const search = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });

  if (params.operator) {
    search.set("operator", params.operator);
  }
  if (params.startDate) {
    search.set("startDate", params.startDate);
  }
  if (params.endDate) {
    search.set("endDate", params.endDate);
  }

  return apiRequest<SystemLogPage>(`/api/v1/system-logs?${search.toString()}`);
}
