// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
  two_factor_code?: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  refresh_token_expiration: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface EmailVerifyRequest {
  email: string;
  token: string;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetPayload {
  email: string;
  token: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// User Types
export interface User {
  id: string;
  email: string | null;
  name: string | null;
  sharedAggregatePostboxAddress: string | null;
}

export interface TwoFactorProfile {
  twoFactorMethod: string | null;
  twoFactorAppEnabled: boolean | null;
  twoFactorAppSecret: string | null;
  twoFactorAppOtpAuthUri: string | null;
  twoFactorAppQrContent: string | null;
}

export interface UpdateProfileRequest {
  name?: string | null;
  password?: string | null;
  currentPassword?: string | null;
}

export interface Notifications {
  unusualNewLoginNotificationEnabled?: boolean | null;
  weeklyOverviewNotificationEnabled?: boolean | null;
}

export interface NotificationsApi {
  unusualNewLoginNotificationEnabled: boolean;
  weeklyOverviewNotificationEnabled: boolean;
}

// Date object from API
export interface ApiDateObject {
  date: string;
  timezone_type: number;
  timezone: string;
}

// Report Types
export interface ReportApi {
  id: string;
  domainId: string | null;
  receivedAt?: ApiDateObject | string | null;
  lastChecked: ApiDateObject | null;
  lastError: string | null;
  fromAddress: string | null;
  reportingOrganization: string | null;
  reportingOrganizationEmail: string | null;
  reportingOrganizationExtraContact: string | null;
  reportId: string | null;
  isVerified: boolean | null;
  beginDate: ApiDateObject | null;
  endDate: ApiDateObject | null;
  domain: string | null;
  adkimPolicy: 'r' | 's' | null;
  aspfPolicy: 'r' | 's' | null;
  pPolicy: 'none' | 'quarantine' | 'reject' | 'unknown' | null;
  spPolicy: 'none' | 'quarantine' | 'reject' | 'unknown' | null;
  pctPolicy: number | null;
  npPolicy: 'none' | 'quarantine' | 'reject' | 'unknown' | null;
  sumCount: number | null;
  dmarcCompliance: number | null;
  spfCompliance: number | null;
  dkimCompliance: number | null;
}

export interface SourceIpInfo {
  orgName: string | null;
  orgCountry: string | null;
  orgAbuseEmail: string | null;
  orgTechEmail: string | null;
}

export interface ReportRecordApi {
  id: string;
  reportId: string | null;
  sourceIp: string | null;
  sourceIpInfo: SourceIpInfo | null;
  count: number | null;
  disposition: 'none' | 'quarantine' | 'reject' | 'unknown' | null;
  dkimAlign: 'fail' | 'pass' | 'unknown' | null;
  spfAlign: 'fail' | 'pass' | 'unknown' | null;
  dkimAuth: string | null;
  dkimDomain: string | null;
  dkimSelector: string | null;
  spfAuth: string | null;
  spfDomain: string | null;
}

export interface PaginationMetaApi {
  pageCount: number;
  totalCount: number;
  filterableFields: string[];
  sortableFields: string[];
}

export interface ReportsResponse {
  items: ReportApi[];
  meta: PaginationMetaApi;
}

export interface RecordsResponse {
  items: ReportRecordApi[];
  meta: PaginationMetaApi;
}

export interface BulkDeleteReportsRequest {
  ids: string[];
}

export interface BulkDeleteReportsResponse {
  deletedCount: number;
}

// Dashboard/Stats Types
export interface ComplianceData {
  dmarc: number;
  dkim: number;
  spf: number;
}

export interface TopIpAggregate {
  sourceIp: string | null;
  count: number;
  sourceIpInfo: SourceIpInfo;
}

export interface TopReportingOrganizationAggregate {
  reportingOrganization: string | null;
  count: number;
}

export interface SourceCountryDistributionItem {
  country: string | null;
  count: number;
}

export interface DashboardApi {
  reportCount: number;
  reportTrend: number;
  messageCount: number;
  messageTrend: number;
  passRate: number; // 0-1 float
  passTrend: number;
  threatsBlockedCount: number;
  threatsBlockedTrend: number;
  messageCountByDate: Record<string, number>; // { "YYYY-MM-DD": count }
  threatCountByDate: Record<string, number>; // { "YYYY-MM-DD": count }
  compliance: ComplianceData;
  complianceTrend: ComplianceData;
  newDomainCount: number;
  newDomainTrend: number;
  newDomains: string[];
  topOffenders: TopIpAggregate[];
  topSenders: TopIpAggregate[];
  topReportingOrganizations: TopReportingOrganizationAggregate[];
  sourceCountryDistribution: SourceCountryDistributionItem[];
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}
