import { apiRequest } from "./http";

export type DeviceRecord = {
  id: number;
  companyId?: number;
  deviceName: string;
  model?: string;
  specification?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  dailyDepreciation?: number;
  monthlyRental?: number;
  status?: string;
  notes?: string;
  createdAt?: string;
};

export type DevicePayload = {
  deviceName: string;
  model?: string;
  specification?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  dailyDepreciation?: number;
  monthlyRental?: number;
  status?: string;
  notes?: string;
};

export function fetchDevices() {
  return apiRequest<DeviceRecord[]>("/api/v1/devices");
}

export function createDevice(payload: DevicePayload) {
  return apiRequest<void>("/api/v1/devices", {
    method: "POST",
    body: payload,
  });
}

export function updateDevice(id: number | string, payload: DevicePayload) {
  return apiRequest<void>(`/api/v1/devices/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteDevice(id: number | string) {
  return apiRequest<void>(`/api/v1/devices/${id}`, {
    method: "DELETE",
  });
}
