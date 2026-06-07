import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { appConfig, mockDelay } from '@/lib/app-config';
import type {
  BlocklistBulkDeleteResponse,
  BlocklistEntryApi,
  BlocklistEntryCreate,
  BlocklistResponse,
} from '@/types/blocklist';
import type { ApiDateObject } from '@/types/api';
import { normalizeBlocklistPattern } from '@/lib/blocklist-pattern';
import { z } from 'zod';

export interface BlocklistQueryParams {
  page?: number;
  pageSize?: number;
  filter?: Record<string, string>;
  sort?: Record<string, 'asc' | 'desc'>;
}

const blocklistBulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

let mockBlocklist: BlocklistEntryApi[] = [
  {
    id: '1',
    pattern: 'mailer.example.com',
    createdAt: { date: '2025-12-01 08:45:00.000000', timezone_type: 3, timezone: 'UTC' },
  },
  {
    id: '2',
    pattern: 'no-reply@vendor.example',
    createdAt: { date: '2025-12-12 11:20:00.000000', timezone_type: 3, timezone: 'UTC' },
  },
  {
    id: '3',
    pattern: '*.tracking.example.org',
    createdAt: { date: '2025-12-20 16:05:00.000000', timezone_type: 3, timezone: 'UTC' },
  },
];

const getDateValue = (value: ApiDateObject | string | null | undefined): number | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  const parsed = new Date(value.date);
  return isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const applyDateFilter = (items: BlocklistEntryApi[], filterKey: string, filterValue: string) => {
  const target = new Date(filterValue);
  if (isNaN(target.getTime())) return items;
  const targetMs = target.getTime();

  switch (filterKey) {
    case 'gte:createdAt':
      return items.filter(item => {
        const createdAt = getDateValue(item.createdAt);
        return createdAt !== null && createdAt >= targetMs;
      });
    case 'lte:createdAt':
      return items.filter(item => {
        const createdAt = getDateValue(item.createdAt);
        return createdAt !== null && createdAt <= targetMs;
      });
    case 'gt:createdAt':
      return items.filter(item => {
        const createdAt = getDateValue(item.createdAt);
        return createdAt !== null && createdAt > targetMs;
      });
    case 'lt:createdAt':
      return items.filter(item => {
        const createdAt = getDateValue(item.createdAt);
        return createdAt !== null && createdAt < targetMs;
      });
    default:
      return items;
  }
};

export const blocklistService = {
  async getBlocklist(params: BlocklistQueryParams = {}): Promise<BlocklistResponse> {
    if (appConfig.mockMode) {
      await mockDelay();
      let filtered = [...mockBlocklist];

      if (params.filter) {
        Object.entries(params.filter).forEach(([key, value]) => {
          if (key === 'contains:pattern') {
            const search = value.toLowerCase();
            filtered = filtered.filter(entry => entry.pattern?.toLowerCase().includes(search));
          } else if (key.endsWith(':createdAt')) {
            filtered = applyDateFilter(filtered, key, value);
          }
        });
      }

      if (params.sort) {
        const [sortField, sortDirection] = Object.entries(params.sort)[0] ?? [];
        if (sortField) {
          filtered.sort((a, b) => {
            if (sortField === 'pattern') {
              const aValue = (a.pattern || '').toLowerCase();
              const bValue = (b.pattern || '').toLowerCase();
              return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }
            if (sortField === 'createdAt') {
              const aValue = getDateValue(a.createdAt) ?? 0;
              const bValue = getDateValue(b.createdAt) ?? 0;
              return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }
            return 0;
          });
        }
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
          filterableFields: ['pattern', 'createdAt'],
          sortableFields: ['pattern', 'createdAt'],
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
      ? `${API_ENDPOINTS.blocklist}?${queryString}`
      : API_ENDPOINTS.blocklist;

    return apiClient.get<BlocklistResponse>(endpoint);
  },

  async createBlocklistEntry(payload: BlocklistEntryCreate): Promise<BlocklistEntryApi> {
    const normalizedPattern = normalizeBlocklistPattern(payload.pattern);
    if (appConfig.mockMode) {
      await mockDelay();
      const entry: BlocklistEntryApi = {
        id: String(Date.now()),
        pattern: normalizedPattern,
        createdAt: new Date().toISOString(),
      };
      mockBlocklist = [entry, ...mockBlocklist];
      return entry;
    }

    return apiClient.post<BlocklistEntryApi>(API_ENDPOINTS.blocklist, { pattern: normalizedPattern });
  },

  async deleteBlocklistEntry(id: string): Promise<void> {
    if (appConfig.mockMode) {
      await mockDelay();
      mockBlocklist = mockBlocklist.filter(entry => entry.id !== id);
      return;
    }

    await apiClient.delete<void>(API_ENDPOINTS.blocklistById(id));
  },

  async deleteBlocklistEntries(ids: string[]): Promise<BlocklistBulkDeleteResponse> {
    if (ids.length === 0) {
      throw new Error('At least one blocklist ID is required');
    }

    if (appConfig.mockMode) {
      await mockDelay();
      const selected = new Set(ids);
      const beforeCount = mockBlocklist.length;
      mockBlocklist = mockBlocklist.filter((entry) => !selected.has(entry.id));
      return { deletedCount: beforeCount - mockBlocklist.length };
    }

    const payload = blocklistBulkDeleteSchema.parse({ ids });
    return apiClient.delete<BlocklistBulkDeleteResponse>(API_ENDPOINTS.blocklist, {
      body: JSON.stringify(payload),
    });
  },
};
