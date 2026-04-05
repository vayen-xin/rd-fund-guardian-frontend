import { apiRequest } from "./http";

export type SettlementRecord = {
  id: number;
  projectId: number;
  projectName: string;
  yearMonth: string;
  status: string;
  amount?: number;
  settledAt?: string;
};

export type SettlementPage = {
  list: SettlementRecord[];
  page: number;
  size: number;
  total: number;
};

export function fetchSettlements(params: { page: number; size: number; status?: string; yearMonth?: string }) {
  const search = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.yearMonth) {
    search.set("yearMonth", params.yearMonth);
  }
  return apiRequest<SettlementPage>(`/api/v1/settlements?${search.toString()}`);
}

export function confirmSettlement(projectId: number | string, yearMonth: string) {
  return apiRequest<void>(`/api/v1/settlements/${projectId}/confirm`, {
    method: "POST",
    body: { yearMonth },
  });
}

export function reopenSettlement(projectId: number | string, yearMonth: string, reason?: string) {
  return apiRequest<void>(`/api/v1/settlements/${projectId}/reopen`, {
    method: "POST",
    body: { yearMonth, reason },
  });
}
