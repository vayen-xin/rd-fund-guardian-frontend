import { apiEnv } from "./env";
import { readStoredToken } from "./http";

async function downloadAuditFile(path: string, fileName: string) {
  const response = await fetch(`${apiEnv.baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${readStoredToken()}`,
    },
  });

  if (!response.ok) {
    let message = "下载审计文件失败";
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // ignore parse error and keep generic message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadAuditWorkbook(projectId: number | string, year: number) {
  return downloadAuditFile(
    `/api/v1/projects/${projectId}/audit-exports/workbook?year=${year}`,
    `附件二-研发工资明细表-${year}.xlsx`,
  );
}

export function downloadAuditPackage(projectId: number | string, year: number) {
  return downloadAuditFile(
    `/api/v1/projects/${projectId}/audit-exports/package?year=${year}`,
    `审计材料包-${year}.zip`,
  );
}

export function downloadProjectLedger(projectId: number | string, startMonth: string, endMonth: string) {
  return downloadAuditFile(
    `/api/v1/projects/${projectId}/audit-exports/ledger?startMonth=${encodeURIComponent(startMonth)}&endMonth=${encodeURIComponent(endMonth)}`,
    `研发支出辅助账-${startMonth}-${endMonth}.xlsx`,
  );
}

export function downloadCompanyWageWorkbook(startMonth: string, endMonth: string, companyId?: number | string) {
  const companyPart = companyId == null ? "" : `&companyId=${encodeURIComponent(String(companyId))}`;
  return downloadAuditFile(
    `/api/v1/audit-exports/company-wages/workbook?startMonth=${encodeURIComponent(startMonth)}&endMonth=${encodeURIComponent(endMonth)}${companyPart}`,
    `附件二-研发工资明细表-${startMonth}-${endMonth}.xlsx`,
  );
}
