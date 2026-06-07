import type { ApiDateObject, PaginationMetaApi } from './api';

export interface BlocklistEntryApi {
  id: string;
  pattern: string | null;
  createdAt: ApiDateObject | string | null;
}

export interface BlocklistEntryCreate {
  pattern: string;
}

export interface BlocklistResponse {
  items: BlocklistEntryApi[];
  meta: PaginationMetaApi;
}

export interface BlocklistBulkDeleteRequest {
  ids: string[];
}

export interface BlocklistBulkDeleteResponse {
  deletedCount: number;
}
