// API Configuration
// The base URL should be configured here. Update this when you have your API URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
