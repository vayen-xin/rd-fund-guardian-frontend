import { apiRequest } from "./http";

export type EmployeeRecord = {
  id: number;
  companyId?: number;
  employeeId: string;
  name: string;
  gender?: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  entryDate?: string;
  createdAt?: string;
};

export type EmployeePayload = {
  employeeId: string;
  name: string;
  gender?: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  entryDate?: string;
};

export function fetchEmployees() {
  return apiRequest<EmployeeRecord[]>("/api/v1/employees");
}

export function createEmployee(payload: EmployeePayload) {
  return apiRequest<void>("/api/v1/employees", {
    method: "POST",
    body: payload,
  });
}

export function updateEmployee(id: number | string, payload: EmployeePayload) {
  return apiRequest<void>(`/api/v1/employees/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteEmployee(id: number | string) {
  return apiRequest<void>(`/api/v1/employees/${id}`, {
    method: "DELETE",
  });
}
