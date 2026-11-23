// API Configuration
// The base URL comes from the runtime configuration, with the build-time
// VITE_API_BASE_URL as a fallback for local development. Without either, /api
// on this origin is the right guess, because that is where the Compose stack
// serves the API, behind the same web server as the dashboard.
import { apiBaseUrl } from './runtime-config';

export const API_BASE_URL = apiBaseUrl || '/api';

export const API_ENDPOINTS = {
  // Auth
  login: '/v1/auth/login_check',
  authStatus: '/v1/auth/status',
  logout: '/v1/user/logout',
  refreshToken: '/v1/auth/token_refresh',
  
  // User/Profile
  profile: '/v1/user/profile',
  profileTwoFactor: '/v1/user/profile/2fa',
  enableTwoFactorApp: '/v1/user/profile/2fa/app/enable',
  disableTwoFactorApp: '/v1/user/profile/2fa/app/disable',
  notifications: '/v1/user/notifications',

  // Platform
  platformSettings: '/v1/platform/settings',
  platformTestEmail: '/v1/platform/mailer/test',
  mailboxes: '/v1/platform/intake/mailboxes',
  mailboxById: (id: string) => `/v1/platform/intake/mailboxes/${id}`,
  mailboxTest: (id: string) => `/v1/platform/intake/mailboxes/${id}/test`,
  mailboxPoll: (id: string) => `/v1/platform/intake/mailboxes/${id}/poll`,
  mailboxLog: (id: string) => `/v1/platform/intake/mailboxes/${id}/log`,
  intakeKeys: '/v1/platform/intake/keys',
  intakeKeyById: (id: string) => `/v1/platform/intake/keys/${id}`,
  intakeWebhookSecret: '/v1/platform/intake/webhook-secret',
  intakeAddresses: '/v1/platform/intake/addresses',
  // Called by whatever sends reports in, not by the dashboard.
  intakeReports: '/v1/intake/reports',
  intakeWebhook: '/v1/intake/webhook',
  
  // Reports
  reports: '/v1/dmarc/reports',
  reportById: (id: string) => `/v1/dmarc/reports/${id}`,
  reportRecords: (reportId: string) => `/v1/dmarc/reports/${reportId}/records`,
  reportXml: (reportId: string) => `/v1/dmarc/reports/${reportId}/xml`,
  
  // Domains
  domains: '/v1/dmarc/domains',
  domainById: (id: string) => `/v1/dmarc/domains/${id}`,

  // Blocklist
  blocklist: '/v1/blocklist',
  blocklistById: (id: string) => `/v1/blocklist/${id}`,
  
  // Dashboard
  dashboard: '/v1/dashboard',
} as const;
