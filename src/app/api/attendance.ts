import { apiEnv } from "./env";
import { apiRequest, readStoredToken } from "./http";

export type AttendanceRecord = {
  id: number;
  employeeId: string;
  name: string;
  projectCode: string;
  projectName?: string;
  date: string;
  duration: number;
  source: string;
};

export type AttendancePageResponse = {
  list: AttendanceRecord[];
  page: number;
  size: number;
  total: number;
};

export type AttendanceSavePayload = {
  employeeId: string;
  name: string;
  projectCode: string;
  date: string;
  duration: number;
};

export type AttendanceLookup = {
  employeeId?: string;
  name?: string;
  department?: string;
  exactMatch?: boolean;
  hint?: string;
};

export type AttendanceImportRow = {
  employeeId: string;
  name: string;
  projectCode: string;
  projectName?: string;
  date: string;
  duration: number;
  source?: string;
};

export type AttendanceImportPreview = {
  successCount: number;
  failedCount: number;
  rows: AttendanceImportRow[];
};

export function fetchAttendance(params: {
  page: number;
  size: number;
  employeeId?: string;
  name?: string;
  projectCode?: string;
  startDate?: string;
  endDate?: string;
}) {
  const search = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });
  if (params.employeeId) search.set("employeeId", params.employeeId);
  if (params.name) search.set("name", params.name);
  if (params.projectCode) search.set("projectCode", params.projectCode);
  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);
  return apiRequest<AttendancePageResponse>(`/api/v1/attendance?${search.toString()}`);
}

export function lookupAttendanceEmployee(params: { employeeId?: string; name?: string }) {
  const search = new URLSearchParams();
  if (params.employeeId) search.set("employeeId", params.employeeId);
  if (params.name) search.set("name", params.name);
  return apiRequest<AttendanceLookup>(`/api/v1/attendance/lookup?${search.toString()}`);
}

export function previewAttendanceImport(file: File, month: string) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<AttendanceImportPreview>(`/api/v1/attendance/preview?month=${encodeURIComponent(month)}`, {
    method: "POST",
    body: formData,
  });
}

export function confirmAttendanceImport(rows: AttendanceImportRow[]) {
  return apiRequest<void>("/api/v1/attendance/confirm", {
    method: "POST",
    body: { rows },
  });
}

export function createAttendance(payload: AttendanceSavePayload) {
  return apiRequest<void>("/api/v1/attendance", {
    method: "POST",
    body: payload,
  });
}

export function updateAttendance(id: number | string, payload: AttendanceSavePayload) {
  return apiRequest<void>(`/api/v1/attendance/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteAttendance(id: number | string) {
  return apiRequest<void>(`/api/v1/attendance/${id}`, {
    method: "DELETE",
  });
}

export async function downloadAttendanceTemplate(params?: { projectId?: number | string; month?: string }) {
  const search = new URLSearchParams();
  if (params?.projectId) search.set("projectId", String(params.projectId));
  if (params?.month) search.set("month", params.month);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const response = await fetch(`${apiEnv.baseUrl}/api/v1/attendance/template${suffix}`, {
    headers: {
      Authorization: `Bearer ${readStoredToken()}`,
    },
  });
  if (!response.ok) {
    throw new Error("下载模板失败");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "打卡导入模板.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}
