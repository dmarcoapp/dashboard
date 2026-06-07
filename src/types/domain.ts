import type { ApiDateObject, PaginationMetaApi } from './api';

export type ProtectionLevel = 'weak' | 'moderate' | 'strong';

export interface DomainApi {
  id: string;
  domain: string | null;
  createdAt: ApiDateObject | string | null;
  lastChecked: ApiDateObject | string | null;
  dmarcRecord: string | null;
  isConfiguredCorrectly: boolean | null;
  protectionLevel: ProtectionLevel;
}

export interface DomainsResponse {
  items: DomainApi[];
  meta: PaginationMetaApi;
}

// Parsed DMARC record structure
export interface ParsedDmarcRecord {
  v?: string;           // Version (always "DMARC1")
  p?: 'none' | 'quarantine' | 'reject';  // Policy
  sp?: 'none' | 'quarantine' | 'reject'; // Subdomain policy
  rua?: string[];       // Aggregate report URIs
  ruf?: string[];       // Forensic report URIs
  adkim?: 'r' | 's';    // DKIM alignment mode
  aspf?: 'r' | 's';     // SPF alignment mode
  pct?: number;         // Percentage of messages to apply policy
  fo?: string;          // Failure reporting options
  rf?: string;          // Report format
  ri?: number;          // Reporting interval
  raw: string;          // Original raw record
}
