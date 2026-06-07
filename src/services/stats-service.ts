import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { appConfig, mockDelay } from '@/lib/app-config';
import { mockDashboard } from '@/lib/mock-data';
import { parseDashboardApi } from '@/schemas/dashboard';
import type { DashboardApi } from '@/types/api';

export const statsService = {
  async getStats(periodDays: number = 7): Promise<DashboardApi> {
    if (appConfig.mockMode) {
      await mockDelay();
      return parseDashboardApi(mockDashboard);
    }
    const response = await apiClient.get<unknown>(`${API_ENDPOINTS.dashboard}?periodDays=${periodDays}`);
    return parseDashboardApi(response);
  },
};
