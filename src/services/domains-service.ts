import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { appConfig, mockDelay } from '@/lib/app-config';
import type { DomainApi, DomainsResponse } from '@/types/domain';

export interface DomainsQueryParams {
  page?: number;
  pageSize?: number;
  filter?: Record<string, string>;
  sort?: Record<string, 'asc' | 'desc'>;
}

// Mock data for development
const mockDomains: DomainApi[] = [
  {
    id: '1',
    domain: 'example.com',
    createdAt: { date: '2025-11-15 09:00:00.000000', timezone_type: 3, timezone: 'UTC' },
    lastChecked: { date: '2025-12-28 10:00:00.000000', timezone_type: 3, timezone: 'UTC' },
    dmarcRecord: 'v=DMARC1; p=quarantine; rua=mailto:dmarc-aggregate-reports-very-long-address@example-organization-with-long-domain-name.com,mailto:secondary-dmarc-reports@another-very-long-domain-name-for-testing.org; ruf=mailto:forensics-detailed-reports@example-organization-with-long-domain-name.com; adkim=s; aspf=s; pct=100; fo=1; ri=86400',
    isConfiguredCorrectly: true,
    protectionLevel: 'moderate',
  },
  {
    id: '2',
    domain: 'foobar.com',
    createdAt: { date: '2025-10-20 14:30:00.000000', timezone_type: 3, timezone: 'UTC' },
    lastChecked: { date: '2025-12-27 15:30:00.000000', timezone_type: 3, timezone: 'UTC' },
    dmarcRecord: 'v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc-reports@foobar.com; adkim=r; aspf=r; pct=100',
    isConfiguredCorrectly: false,
    protectionLevel: 'strong',
  },
  {
    id: '3',
    domain: 'otherexample.hu',
    createdAt: { date: '2025-12-01 11:15:00.000000', timezone_type: 3, timezone: 'UTC' },
    lastChecked: { date: '2025-12-26 08:45:00.000000', timezone_type: 3, timezone: 'UTC' },
    dmarcRecord: 'v=DMARC1; p=none; rua=mailto:postmaster@otherexample.hu',
    isConfiguredCorrectly: true,
    protectionLevel: 'weak',
  },
];

export const domainsService = {
  async getDomains(params: DomainsQueryParams = {}): Promise<DomainsResponse> {
    if (appConfig.mockMode) {
      await mockDelay();
      let filtered = [...mockDomains];
      
      // Apply search filter
      if (params.filter?.['contains:domain']) {
        const search = params.filter['contains:domain'].toLowerCase();
        filtered = filtered.filter(d => d.domain?.toLowerCase().includes(search));
      }
      
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);
      
      return {
        items,
        meta: {
          pageCount: Math.ceil(filtered.length / pageSize),
          totalCount: filtered.length,
          filterableFields: ['domain'],
          sortableFields: ['domain', 'lastChecked'],
        },
      };
    }

    const searchParams = new URLSearchParams();
    
    if (params.page) {
      searchParams.append('page', String(params.page));
    }
    if (params.pageSize) {
      searchParams.append('pageSize', String(params.pageSize));
    }
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        searchParams.append(`filter[${key}]`, value);
      });
    }
    if (params.sort) {
      Object.entries(params.sort).forEach(([key, value]) => {
        searchParams.append(`sort[${key}]`, value);
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.domains}?${queryString}` 
      : API_ENDPOINTS.domains;
    
    return apiClient.get<DomainsResponse>(endpoint);
  },

  async getDomainById(id: string): Promise<DomainApi> {
    if (appConfig.mockMode) {
      await mockDelay();
      const found = mockDomains.find(d => d.id === id);
      if (found) return found;
      throw new Error('Domain not found');
    }
    return apiClient.get<DomainApi>(API_ENDPOINTS.domainById(id));
  },
};
