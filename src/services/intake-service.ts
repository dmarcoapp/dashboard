import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { appConfig, mockDelay } from '@/lib/app-config';
import { mockApiIntakeKeys, mockMailboxes, mockMailboxLog } from '@/lib/mock-data';
import { mockPlatformState } from '@/services/platform-service';
import type {
  ApiDateObject,
  ApiIntakeKeyApi,
  IntakeAddressApi,
  MailboxApi,
  MailboxInput,
  MailboxLogEntryApi,
  MailboxTestResultApi,
} from '@/types/api';

let currentMockMailboxes: MailboxApi[] = mockMailboxes.map((mailbox) => ({ ...mailbox }));
let currentMockKeys: ApiIntakeKeyApi[] = mockApiIntakeKeys.map((key) => ({ ...key }));

const DEFAULT_PORTS = { tls: 993, starttls: 143 } as const;

const mockNow = (): ApiDateObject => ({
  date: new Date().toISOString().replace('T', ' ').replace('Z', '000'),
  timezone_type: 3,
  timezone: 'UTC',
});

const randomString = (length: number): string => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};

// What the backend does with a change, for mock mode: a field left out stays,
// and an empty password keeps the stored one.
const applyMockMailboxInput = (mailbox: MailboxApi, input: MailboxInput): MailboxApi => {
  const next = { ...mailbox };
  if (input.name !== undefined) next.name = input.name.trim();
  if (input.host !== undefined) next.host = input.host.trim().toLowerCase();
  if (input.security !== undefined) {
    if (input.port === undefined && next.port === DEFAULT_PORTS[next.security]) next.port = DEFAULT_PORTS[input.security];
    next.security = input.security;
  }
  if (input.port !== undefined) next.port = input.port;
  if (input.username !== undefined) next.username = input.username.trim();
  if (input.password) next.passwordUnreadable = false;
  if (input.folder !== undefined) next.folder = input.folder.trim();
  if (input.reportAddress !== undefined) next.reportAddress = input.reportAddress.trim().toLowerCase() || null;
  if (input.afterImport !== undefined) {
    next.afterImport = input.afterImport;
    next.moveToFolder = input.afterImport === 'move' ? (input.moveToFolder?.trim() ?? null) : null;
  }
  if (input.enabled !== undefined) next.enabled = input.enabled;
  if (input.pollIntervalMinutes !== undefined) next.pollIntervalMinutes = input.pollIntervalMinutes;
  if (input.firstImportDays !== undefined) next.firstImportDays = input.firstImportDays;
  return next;
};

export const intakeService = {
  async getMailboxes(): Promise<MailboxApi[]> {
    if (appConfig.mockMode) {
      await mockDelay();
      return [...currentMockMailboxes].sort((a, b) => a.name.localeCompare(b.name));
    }
    return apiClient.get<MailboxApi[]>(API_ENDPOINTS.mailboxes);
  },

  async createMailbox(input: MailboxInput): Promise<MailboxApi> {
    if (appConfig.mockMode) {
      const mailbox = applyMockMailboxInput(
        {
          id: crypto.randomUUID(),
          name: '',
          host: '',
          port: DEFAULT_PORTS.tls,
          security: 'tls',
          username: '',
          authMethod: 'password',
          passwordUnreadable: false,
          folder: 'INBOX',
          reportAddress: null,
          afterImport: 'mark_seen',
          moveToFolder: null,
          enabled: true,
          pollIntervalMinutes: 15,
          firstImportDays: 30,
          lastPolledAt: null,
          lastSuccessAt: null,
          lastError: null,
          consecutiveFailures: 0,
          createdAt: mockNow(),
        },
        input,
      );
      currentMockMailboxes = [...currentMockMailboxes, mailbox];
      return mailbox;
    }
    return apiClient.post<MailboxApi>(API_ENDPOINTS.mailboxes, input);
  },

  async updateMailbox(id: string, input: MailboxInput): Promise<MailboxApi> {
    if (appConfig.mockMode) {
      const current = currentMockMailboxes.find((mailbox) => mailbox.id === id);
      if (!current) throw new Error('Mailbox not found');
      const updated = applyMockMailboxInput(current, input);
      currentMockMailboxes = currentMockMailboxes.map((mailbox) => (mailbox.id === id ? updated : mailbox));
      return updated;
    }
    return apiClient.patch<MailboxApi>(API_ENDPOINTS.mailboxById(id), input);
  },

  async deleteMailbox(id: string): Promise<void> {
    if (appConfig.mockMode) {
      currentMockMailboxes = currentMockMailboxes.filter((mailbox) => mailbox.id !== id);
      return;
    }
    await apiClient.delete<void>(API_ENDPOINTS.mailboxById(id));
  },

  async testMailbox(id: string): Promise<MailboxTestResultApi> {
    if (appConfig.mockMode) {
      await mockDelay();
      const mailbox = currentMockMailboxes.find((candidate) => candidate.id === id);
      return mailbox?.lastError
        ? { ok: false, error: mailbox.lastError, messages: null, folders: [] }
        : { ok: true, error: null, messages: 42, folders: ['INBOX', 'Archive', 'Processed', 'Spam'] };
    }
    return apiClient.post<MailboxTestResultApi>(API_ENDPOINTS.mailboxTest(id));
  },

  async pollMailbox(id: string): Promise<void> {
    if (appConfig.mockMode) {
      currentMockMailboxes = currentMockMailboxes.map((mailbox) =>
        mailbox.id === id ? { ...mailbox, lastPolledAt: mockNow() } : mailbox,
      );
      return;
    }
    await apiClient.post<{ status: string }>(API_ENDPOINTS.mailboxPoll(id));
  },

  async getMailboxLog(id: string): Promise<MailboxLogEntryApi[]> {
    if (appConfig.mockMode) {
      await mockDelay();
      return id === currentMockMailboxes[0]?.id ? mockMailboxLog : [];
    }
    return apiClient.get<MailboxLogEntryApi[]>(API_ENDPOINTS.mailboxLog(id));
  },

  async getKeys(): Promise<ApiIntakeKeyApi[]> {
    if (appConfig.mockMode) {
      await mockDelay();
      return currentMockKeys;
    }
    return apiClient.get<ApiIntakeKeyApi[]>(API_ENDPOINTS.intakeKeys);
  },

  async createKey(name: string): Promise<ApiIntakeKeyApi> {
    if (appConfig.mockMode) {
      const lookup = randomString(16).toLowerCase();
      const key: ApiIntakeKeyApi = {
        id: crypto.randomUUID(),
        name: name.trim(),
        preview: `dmarco_${lookup}_…`,
        createdAt: mockNow(),
        lastUsedAt: null,
        token: null,
      };
      currentMockKeys = [...currentMockKeys, key];
      return { ...key, token: `dmarco_${lookup}_${randomString(40)}` };
    }
    return apiClient.post<ApiIntakeKeyApi>(API_ENDPOINTS.intakeKeys, { name });
  },

  async revokeKey(id: string): Promise<void> {
    if (appConfig.mockMode) {
      currentMockKeys = currentMockKeys.filter((key) => key.id !== id);
      return;
    }
    await apiClient.delete<void>(API_ENDPOINTS.intakeKeyById(id));
  },

  async createGatewaySecret(): Promise<string> {
    if (appConfig.mockMode) {
      mockPlatformState.set({ gatewaySecretSet: true });
      return randomString(48);
    }
    const { secret } = await apiClient.post<{ secret: string }>(API_ENDPOINTS.intakeGatewaySecret);
    return secret;
  },

  async removeGatewaySecret(): Promise<void> {
    if (appConfig.mockMode) {
      mockPlatformState.set({ gatewaySecretSet: false });
      return;
    }
    await apiClient.delete<void>(API_ENDPOINTS.intakeGatewaySecret);
  },

  async getAddresses(): Promise<IntakeAddressApi[]> {
    if (appConfig.mockMode) {
      await mockDelay();
      const settings = mockPlatformState.get();
      const addresses: IntakeAddressApi[] = [];
      if (settings.reportAddress && settings.apiIntakeEnabled) {
        addresses.push({ address: settings.reportAddress, kind: 'gateway', label: 'Mail gateway' });
      }
      for (const mailbox of currentMockMailboxes) {
        if (mailbox.enabled && mailbox.reportAddress) {
          addresses.push({ address: mailbox.reportAddress, kind: 'mailbox', label: mailbox.name });
        }
      }
      return addresses;
    }
    return apiClient.get<IntakeAddressApi[]>(API_ENDPOINTS.intakeAddresses);
  },
};
