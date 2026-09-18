import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { appConfig } from '@/lib/app-config';
import { mockUser, mockTwoFactorProfile } from '@/lib/mock-data';
import type { User, TwoFactorProfile, UpdateProfileRequest } from '@/types/api';

let currentMockUser = { ...mockUser };
let currentMockTwoFactorProfile = { ...mockTwoFactorProfile };

export const userService = {
  async getProfile(): Promise<User> {
    if (appConfig.mockMode) {
      return currentMockUser;
    }
    return apiClient.get<User>(API_ENDPOINTS.profile);
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    if (appConfig.mockMode) {
      if (data.name !== undefined) {
        currentMockUser = { ...currentMockUser, name: data.name };
      }
      return currentMockUser;
    }
    return apiClient.patch<User>(API_ENDPOINTS.profile, data);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<User> {
    if (appConfig.mockMode) {
      return currentMockUser;
    }
    return apiClient.patch<User>(API_ENDPOINTS.profile, { password: newPassword, currentPassword });
  },

  async deleteAccount(email: string): Promise<void> {
    if (appConfig.mockMode) {
      return; // Simulate successful deletion
    }
    await apiClient.delete(API_ENDPOINTS.deleteProfile, {
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async getTwoFactorProfile(): Promise<TwoFactorProfile> {
    if (appConfig.mockMode) {
      return currentMockTwoFactorProfile;
    }
    return apiClient.get<TwoFactorProfile>(API_ENDPOINTS.profileTwoFactor);
  },

  async enableTwoFactorApp(code: string): Promise<void> {
    if (appConfig.mockMode) {
      currentMockTwoFactorProfile = {
        ...currentMockTwoFactorProfile,
        twoFactorMethod: 'app',
        twoFactorAppEnabled: true,
      };
      return;
    }
    await apiClient.post<void>(API_ENDPOINTS.enableTwoFactorApp, { code });
  },

  async disableTwoFactorApp(): Promise<void> {
    if (appConfig.mockMode) {
      currentMockTwoFactorProfile = {
        ...currentMockTwoFactorProfile,
        twoFactorMethod: null,
        twoFactorAppEnabled: false,
      };
      return;
    }
    await apiClient.post<void>(API_ENDPOINTS.disableTwoFactorApp);
  },
};
