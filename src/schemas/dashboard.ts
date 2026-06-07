import { z } from 'zod';
import type { DashboardApi } from '@/types/api';

const EMPTY_SOURCE_IP_INFO = {
  orgName: null,
  orgCountry: null,
  orgAbuseEmail: null,
  orgTechEmail: null,
} as const;

export const sourceIpInfoSchema = z.object({
  orgName: z.string().nullable(),
  orgCountry: z.string().nullable(),
  orgAbuseEmail: z.string().nullable(),
  orgTechEmail: z.string().nullable(),
});

export const topIpAggregateSchema = z.object({
  sourceIp: z.string().nullable(),
  count: z.number(),
  sourceIpInfo: sourceIpInfoSchema
    .nullish()
    .transform((value) => value ?? { ...EMPTY_SOURCE_IP_INFO }),
});

const topReportingOrganizationSchema = z.object({
  reportingOrganization: z.string().nullable(),
  count: z.number(),
});

const sourceCountryDistributionItemSchema = z.object({
  country: z.string().nullable(),
  count: z.number(),
});

const complianceSchema = z.object({
  dmarc: z.number(),
  dkim: z.number(),
  spf: z.number(),
});

export const dashboardApiSchema = z.object({
  reportCount: z.number(),
  reportTrend: z.number(),
  messageCount: z.number(),
  messageTrend: z.number(),
  passRate: z.number(),
  passTrend: z.number(),
  threatsBlockedCount: z.number(),
  threatsBlockedTrend: z.number(),
  messageCountByDate: z.record(z.string(), z.number()),
  threatCountByDate: z.record(z.string(), z.number()),
  compliance: complianceSchema,
  complianceTrend: complianceSchema,
  newDomainCount: z.number(),
  newDomainTrend: z.number(),
  newDomains: z.array(z.string()),
  topOffenders: z.array(topIpAggregateSchema),
  topSenders: z.array(topIpAggregateSchema),
  topReportingOrganizations: z.array(topReportingOrganizationSchema),
  sourceCountryDistribution: z.array(sourceCountryDistributionItemSchema),
});

export const parseDashboardApi = (data: unknown): DashboardApi =>
  dashboardApiSchema.parse(data) as DashboardApi;
