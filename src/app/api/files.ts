import { apiEnv } from "./env";
import { apiRequest, readStoredToken } from "./http";

export type UploadedFile = {
  id: number;
  fileName: string;
  fileUrl: string;
  category: string;
  yearMonth: string;
};

export function uploadVoucherFile(params: {
  projectId: number | string;
  yearMonth: string;
  category: string;
  file: File;
}) {
  const formData = new FormData();
  formData.append("projectId", String(params.projectId));
  formData.append("yearMonth", params.yearMonth);
  formData.append("category", params.category);
  formData.append("file", params.file);
  return apiRequest<UploadedFile>("/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });
}

export function deleteVoucherFile(fileId: number | string) {
  return apiRequest<void>(`/api/v1/files/${fileId}`, {
    method: "DELETE",
  });
}

export async function downloadVoucherFile(fileId: number | string, fileName: string) {
  const response = await fetch(`${apiEnv.baseUrl}/api/v1/files/${fileId}`, {
    headers: {
      Authorization: `Bearer ${readStoredToken()}`,
    },
  });
  if (!response.ok) {
    throw new Error("下载凭证失败");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
