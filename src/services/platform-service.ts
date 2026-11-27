import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { appConfig, mockDelay } from '@/lib/app-config';
import { mockPlatformSettings, mockUser } from '@/lib/mock-data';
import type { PlatformSettingsApi, PlatformSettingsUpdate, TestEmailResultApi } from '@/types/api';

let currentMockSettings: PlatformSettingsApi = { ...mockPlatformSettings };

// What the backend does with a change, for mock mode: a field left out stays,
// and an empty string clears it.
const applyMockUpdate = (settings: PlatformSettingsApi, update: PlatformSettingsUpdate): PlatformSettingsApi => {
  const next = { ...settings };

  if (update.reportRetentionDays !== undefined) next.reportRetentionDays = update.reportRetentionDays;
  if (update.ipLookupEnabled !== undefined) next.ipLookupEnabled = update.ipLookupEnabled;
  if (update.displayTimezone !== undefined) next.displayTimezone = update.displayTimezone.trim() || 'UTC';

  if (update.smtpHost !== undefined) {
    if (update.smtpHost.trim() === '') {
      Object.assign(next, {
        mailConfigured: false,
        smtpHost: null,
        smtpPort: null,
        smtpSecurity: null,
        smtpUsername: null,
        smtpPasswordSet: false,
        smtpPasswordUnreadable: false,
      });
    } else {
      next.smtpHost = update.smtpHost.trim().toLowerCase();
      next.mailConfigured = true;
    }
  }

  if (next.smtpHost !== null) {
    if (update.smtpSecurity !== undefined) next.smtpSecurity = update.smtpSecurity;
    if (update.smtpPort !== undefined) next.smtpPort = update.smtpPort;
    if (update.smtpUsername !== undefined) next.smtpUsername = update.smtpUsername.trim() || null;
    if (update.smtpPassword !== undefined) {
      next.smtpPasswordSet = update.smtpPassword !== '';
      next.smtpPasswordUnreadable = false;
    }
  }

  if (update.senderAddress !== undefined) {
    next.senderAddress = update.senderAddress.trim() || null;
    next.effectiveSenderAddress = next.senderAddress ?? next.defaultSenderAddress;
  }

  if (update.apiIntakeEnabled !== undefined) next.apiIntakeEnabled = update.apiIntakeEnabled;
  if (update.uploadEndpointEnabled !== undefined) next.uploadEndpointEnabled = update.uploadEndpointEnabled;
  if (update.webhookEnabled !== undefined) next.webhookEnabled = update.webhookEnabled;
  if (update.reportAddressDomain !== undefined) {
    const domain = update.reportAddressDomain.trim().toLowerCase();
    const localPart = settings.reportAddress?.split('@')[0] ?? 'xxxxxxxxxxxxxx';
    next.reportAddressDomain = domain || null;
    next.reportAddress = domain ? `${localPart}@${domain}` : null;
  }

  return next;
};

// The intake service changes the same settings in mock mode.
export const mockPlatformState = {
  get: (): PlatformSettingsApi => currentMockSettings,
  set: (change: Partial<PlatformSettingsApi>): void => {
    currentMockSettings = { ...currentMockSettings, ...change };
  },
};

export const platformService = {
  async getSettings(): Promise<PlatformSettingsApi> {
    if (appConfig.mockMode) {
      await mockDelay();
      return currentMockSettings;
    }
    return apiClient.get<PlatformSettingsApi>(API_ENDPOINTS.platformSettings);
  },

  async updateSettings(update: PlatformSettingsUpdate): Promise<PlatformSettingsApi> {
    if (appConfig.mockMode) {
      currentMockSettings = applyMockUpdate(currentMockSettings, update);
      return currentMockSettings;
    }
    return apiClient.patch<PlatformSettingsApi>(API_ENDPOINTS.platformSettings, update);
  },

  async sendTestEmail(): Promise<TestEmailResultApi> {
    if (appConfig.mockMode) {
      await mockDelay();
      return currentMockSettings.mailConfigured
        ? { sent: true, recipient: mockUser.email ?? '', error: null }
        : { sent: false, recipient: mockUser.email ?? '', error: 'Outgoing mail is not set up.' };
    }
    return apiClient.post<TestEmailResultApi>(API_ENDPOINTS.platformTestEmail);
  },
};
