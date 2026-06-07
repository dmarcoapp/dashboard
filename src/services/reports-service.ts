import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { appConfig, mockDelay } from '@/lib/app-config';
import { mockReportsResponse, getMockReportById, mockRecordsResponse, mockReportsList } from '@/lib/mock-data';
import { z } from 'zod';
import type {
  BulkDeleteReportsResponse,
  ReportApi,
  RecordsResponse,
  ReportsResponse,
} from '@/types/api';

export interface ReportsQueryParams {
  page?: number;
  pageSize?: number;
  filter?: Record<string, string>;
  sort?: Record<string, 'asc' | 'desc'>;
}

const bulkDeleteReportsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const reportsService = {
  async getReports(params: ReportsQueryParams = {}): Promise<ReportsResponse> {
    if (appConfig.mockMode) {
      await mockDelay();
      return mockReportsResponse(params.page || 1, params.pageSize || 10);
    }

    const searchParams = new URLSearchParams();
    
    if (params.page) {
      searchParams.append('page', String(params.page));
    }
    if (params.pageSize) {
      searchParams.append('pageSize', String(params.pageSize));
    }
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        searchParams.append(`filter[${key}]`, value);
      });
    }
    if (params.sort) {
      Object.entries(params.sort).forEach(([key, value]) => {
        searchParams.append(`sort[${key}]`, value);
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.reports}?${queryString}` 
      : API_ENDPOINTS.reports;
    
    return apiClient.get<ReportsResponse>(endpoint);
  },

  async getReportById(id: string): Promise<ReportApi> {
    if (appConfig.mockMode) {
      await mockDelay();
      return getMockReportById(id);
    }
    return apiClient.get<ReportApi>(API_ENDPOINTS.reportById(id));
  },

  async getReportRecords(reportId: string, params: ReportsQueryParams = {}): Promise<RecordsResponse> {
    if (appConfig.mockMode) {
      await mockDelay();
      return mockRecordsResponse(reportId);
    }

    const searchParams = new URLSearchParams();
    
    if (params.page) {
      searchParams.append('page', String(params.page));
    }
    if (params.pageSize) {
      searchParams.append('pageSize', String(params.pageSize));
    }
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        searchParams.append(`filter[eq:${key}]`, value);
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.reportRecords(reportId)}?${queryString}` 
      : API_ENDPOINTS.reportRecords(reportId);
    
    return apiClient.get<RecordsResponse>(endpoint);
  },

  async getReportXml(reportId: string): Promise<string> {
    if (appConfig.mockMode) {
      await mockDelay();
      return `<?xml version="1.0" encoding="UTF-8"?>\n<feedback>\n  <report_metadata>\n    <org_name>Mock Organization</org_name>\n    <report_id>${reportId}</report_id>\n  </report_metadata>\n</feedback>`;
    }
    return apiClient.getText(API_ENDPOINTS.reportXml(reportId));
  },

  async deleteReport(reportId: string): Promise<void> {
    if (appConfig.mockMode) {
      await mockDelay();
      const index = mockReportsList.findIndex((report) => report.id === reportId);
      if (index !== -1) {
        mockReportsList.splice(index, 1);
      }
      return;
    }
    await apiClient.delete<void>(API_ENDPOINTS.reportById(reportId));
  },

  async deleteReports(ids: string[]): Promise<BulkDeleteReportsResponse> {
    if (ids.length === 0) {
      throw new Error('At least one report ID is required');
    }

    if (appConfig.mockMode) {
      await mockDelay();
      const selected = new Set(ids);
      const beforeCount = mockReportsList.length;
      const remaining = mockReportsList.filter((report) => !selected.has(report.id));
      const deletedCount = beforeCount - remaining.length;

      mockReportsList.splice(0, mockReportsList.length, ...remaining);
      return { deletedCount };
    }

    const payload = bulkDeleteReportsSchema.parse({ ids });

    return apiClient.delete<BulkDeleteReportsResponse>(API_ENDPOINTS.reports, {
      body: JSON.stringify(payload),
    });
  },
};
