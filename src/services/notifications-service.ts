import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { appConfig } from '@/lib/app-config';
import { mockNotificationSettings } from '@/lib/mock-data';
import type { Notifications, NotificationsApi } from '@/types/api';

let currentMockNotificationSettings: NotificationsApi = { ...mockNotificationSettings };

export const notificationsService = {
  async getSettings(): Promise<NotificationsApi> {
    if (appConfig.mockMode) {
      return currentMockNotificationSettings;
    }
    return apiClient.get<NotificationsApi>(API_ENDPOINTS.notifications);
  },

  async updateSettings(data: Notifications): Promise<NotificationsApi> {
    if (appConfig.mockMode) {
      currentMockNotificationSettings = {
        ...currentMockNotificationSettings,
        ...data,
      };
      return currentMockNotificationSettings;
    }
    return apiClient.patch<NotificationsApi>(API_ENDPOINTS.notifications, data);
  },
};
