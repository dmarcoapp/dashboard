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
  register: '/v1/auth/register',
  logout: '/v1/user/logout',
  refreshToken: '/v1/auth/token_refresh',
  emailVerify: '/v1/auth/verify',
  resendVerification: '/v1/auth/request_verification_resend',
  passwordResetRequest: '/v1/auth/request_password_reset',
  passwordReset: '/v1/auth/reset_password',
  
  // User/Profile
  profile: '/v1/user/profile',
  profileTwoFactor: '/v1/user/profile/2fa',
  deleteProfile: '/v1/user/profile',
  enableTwoFactorApp: '/v1/user/profile/2fa/app/enable',
  disableTwoFactorApp: '/v1/user/profile/2fa/app/disable',
  notifications: '/v1/user/notifications',
  
  // Reports
  reports: '/v1/dmarc/reports',
  reportById: (id: string) => `/v1/dmarc/reports/${id}`,
  reportRecords: (reportId: string) => `/v1/dmarc/reports/${reportId}/records`,
  reportXml: (reportId: string) => `/v1/dmarc/reports/${reportId}/xml`,
  
  // Domains
  domains: '/v1/dmarc/domains',
  domainById: (id: string) => `/v1/dmarc/domains/${id}`,

  // Blocklist
  blocklist: '/v1/user/blocklist',
  blocklistById: (id: string) => `/v1/user/blocklist/${id}`,
  
  // Dashboard
  dashboard: '/v1/user/dashboard',
} as const;
