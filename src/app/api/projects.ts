import { apiRequest } from "./http";

export type BackendProject = {
  id: number;
  companyId?: number;
  projectName: string;
  code?: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  createdAt?: string;
};

export type BackendProjectListPage = {
  records: BackendProject[];
  current: number;
  size: number;
  total: number;
};

export type BackendOptionItem = {
  id: number;
  code: string;
  name: string;
  extra?: string;
};

export type BackendProjectDetail = {
  id: number;
  projectName: string;
  code?: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  managerName?: string;
  managerPhone?: string;
  settlementAmount?: number;
  employees: Array<{
    id: number;
    employeeId?: number | string;
    employeeName: string;
    employeeType?: string;
    department?: string;
  }>;
  devices: Array<{
    id: number;
    deviceId?: number | string;
    deviceName?: string;
    model?: string;
    dailyDepreciation?: number;
  }>;
  logs: Array<{
    id: number;
    createdAt?: string;
    action?: string;
    operatorId?: number;
    remark?: string;
  }>;
};

export type CreateProjectPayload = {
  projectName: string;
  code: string;
  startDate: string;
  description?: string;
  managerName?: string;
  managerPhone?: string;
  employeeIds: number[];
  deviceIds: number[];
};

export function fetchProjectList(params: {
  page: number;
  size: number;
  status?: string;
  name?: string;
}) {
  const search = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.name) {
    search.set("name", params.name);
  }
  return apiRequest<BackendProjectListPage>(`/api/v1/projects?${search.toString()}`);
}

export function fetchProjectDetail(id: number | string) {
  return apiRequest<BackendProjectDetail>(`/api/v1/projects/${id}`);
}

export function fetchEmployeeOptions(keyword = "") {
  const search = new URLSearchParams();
  if (keyword) {
    search.set("keyword", keyword);
  }
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiRequest<BackendOptionItem[]>(`/api/v1/employees/options${suffix}`);
}

export function fetchDeviceOptions(keyword = "") {
  const search = new URLSearchParams();
  if (keyword) {
    search.set("keyword", keyword);
  }
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiRequest<BackendOptionItem[]>(`/api/v1/devices/options${suffix}`);
}

export function createProject(payload: CreateProjectPayload) {
  return apiRequest<void>("/api/v1/projects", {
    method: "POST",
    body: payload,
  });
}

export function endProject(id: number | string) {
  return apiRequest<void>(`/api/v1/projects/${id}/end`, {
    method: "PUT",
  });
}

export function fetchAllProjects() {
  return fetchProjectList({
    page: 1,
    size: 100,
  });
}
