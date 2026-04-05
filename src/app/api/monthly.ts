import { apiRequest } from "./http";

export type MonthlyFeeItem = {
  categoryCode?: string;
  categoryLabel?: string;
  itemCode?: string;
  itemLabel?: string;
  label?: string;
  name?: string;
  amount?: number;
  formula?: string;
  voucherIds?: number[];
  vouchers?: string[];
  original_amount?: number;
  remark?: string;
};

export type MonthlyFeeGroup = {
  systemItems: MonthlyFeeItem[];
  manualItems: MonthlyFeeItem[];
};

export type MonthlyFees = Record<string, MonthlyFeeGroup>;

export type MonthlyFeeSchemaItem = {
  code: string;
  label: string;
};

export type MonthlyFeeSchemaCategory = {
  code: string;
  label: string;
  items: MonthlyFeeSchemaItem[];
};

export type MonthlyFeeSchema = {
  categories: MonthlyFeeSchemaCategory[];
};

export type MonthlyEmployeeItem = {
  employeeId?: number;
  employeeNo?: string;
  name: string;
  department?: string;
  employeeType?: string;
  coefficient?: number;
  hourlyRate?: number;
};

export type MonthlyDeviceItem = {
  deviceId?: number;
  deviceNo?: string;
  name?: string;
  category?: string;
  depreciationRate?: number;
  isUsed?: boolean;
};

export type MonthlyDetail = {
  projectId: number;
  yearMonth: string;
  status: string;
  settledAt?: string | null;
  grandTotal?: number;
  employees: MonthlyEmployeeItem[];
  availableEmployees?: MonthlyEmployeeItem[];
  devices: MonthlyDeviceItem[];
  availableDevices?: MonthlyDeviceItem[];
  fees: MonthlyFees;
};

export type ProjectMonthlyRecord = {
  id: number;
  projectId: number;
  workMonth: string;
  grandTotal?: number;
  status: string;
  updatedAt?: string;
};

export function fetchProjectMonthlyList(projectId: number | string) {
  return apiRequest<ProjectMonthlyRecord[]>(`/api/v1/projects/${projectId}/monthly`);
}

export function fetchMonthlyDetail(projectId: number | string, month: string) {
  return apiRequest<MonthlyDetail>(`/api/v1/projects/${projectId}/monthly/${month}`);
}

export function fetchMonthlyFeeSchema() {
  return apiRequest<MonthlyFeeSchema>("/api/v1/projects/monthly-fee-schema");
}

export function saveMonthlyDetail(
  projectId: number | string,
  month: string,
  payload: { costData: string; employeeData: string; deviceData: string; grandTotal: number },
) {
  return apiRequest<void>(`/api/v1/projects/${projectId}/monthly/${month}`, {
    method: "PUT",
    body: payload,
  });
}

export function submitMonthlyDetail(projectId: number | string, month: string) {
  return apiRequest<void>(`/api/v1/projects/${projectId}/monthly/${month}/submit`, {
    method: "POST",
  });
}
