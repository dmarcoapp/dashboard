import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export type FilterOperator = 'eq' | 'neq' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'lt' | 'lte' | 'gt' | 'gte';

export interface FilterValue {
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface UseUrlFiltersOptions {
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  defaultPageSize?: number;
}

export function useUrlFilters(options: UseUrlFiltersOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { defaultSort = { field: 'endDate', direction: 'desc' }, defaultPageSize = 25 } = options;

  // Parse filters from URL
  const filters = useMemo(() => {
    const result: FilterValue[] = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter.')) {
        const parts = key.replace('filter.', '').split('.');
        const operator = parts[0] as FilterOperator;
        const field = parts.slice(1).join('.');
        if (operator && field) {
          result.push({ field, operator, value });
        }
      }
    });
    return result;
  }, [searchParams]);

  // Parse sort from URL
  const sort = useMemo(() => {
    const sortField = searchParams.get('sort') || defaultSort.field;
    const sortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || defaultSort.direction;
    return { field: sortField, direction: sortDir };
  }, [searchParams, defaultSort.field, defaultSort.direction]);

  // Parse pagination from URL
  const pagination = useMemo(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || defaultPageSize.toString(), 10);
    return { page, pageSize };
  }, [searchParams, defaultPageSize]);

  // Add or update a filter (supports single or multiple filters)
  const setFilter = useCallback((filterOrFilters: FilterValue | FilterValue[]) => {
    const filtersArray = Array.isArray(filterOrFilters) ? filterOrFilters : [filterOrFilters];
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      filtersArray.forEach(filter => {
        const key = `filter.${filter.operator}.${filter.field}`;
        newParams.set(key, filter.value);
      });
      newParams.set('page', '1'); // Reset to page 1 when filtering
      return newParams;
    });
  }, [setSearchParams]);

  // Remove a specific filter (supports single or multiple)
  const removeFilter = useCallback((fieldOrFields: string | { field: string; operator: FilterOperator }[], operator?: FilterOperator) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (typeof fieldOrFields === 'string' && operator) {
        const key = `filter.${operator}.${fieldOrFields}`;
        newParams.delete(key);
      } else if (Array.isArray(fieldOrFields)) {
        fieldOrFields.forEach(({ field, operator: op }) => {
          const key = `filter.${op}.${field}`;
          newParams.delete(key);
        });
      }
      newParams.set('page', '1');
      return newParams;
    });
  }, [setSearchParams]);

  // Remove all filters for a field
  const removeFieldFilters = useCallback((field: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      const keysToDelete: string[] = [];
      newParams.forEach((_, key) => {
        if (key.startsWith('filter.') && key.endsWith(`.${field}`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => newParams.delete(key));
      newParams.set('page', '1');
      return newParams;
    });
  }, [setSearchParams]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      const keysToDelete: string[] = [];
      newParams.forEach((_, key) => {
        if (key.startsWith('filter.')) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => newParams.delete(key));
      newParams.set('page', '1');
      return newParams;
    });
  }, [setSearchParams]);

  // Set sort
  const setSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('sort', field);
      newParams.set('sortDir', direction);
      newParams.set('page', '1');
      return newParams;
    });
  }, [setSearchParams]);

  // Set page
  const setPage = useCallback((page: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', page.toString());
      return newParams;
    });
  }, [setSearchParams]);

  // Set page size
  const setPageSize = useCallback((pageSize: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('pageSize', pageSize.toString());
      newParams.set('page', '1');
      return newParams;
    });
  }, [setSearchParams]);

  // Get filter value for a specific field/operator
  const getFilterValue = useCallback((field: string, operator: FilterOperator): string | undefined => {
    return filters.find(f => f.field === field && f.operator === operator)?.value;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = filters.length > 0;

  // Convert filters to API format
  const filtersToApiFormat = useCallback((): Record<string, string> => {
    const result: Record<string, string> = {};
    filters.forEach(f => {
      result[`${f.operator}:${f.field}`] = f.value;
    });
    return result;
  }, [filters]);

  return {
    filters,
    sort,
    pagination,
    setFilter,
    removeFilter,
    removeFieldFilters,
    clearFilters,
    setSort,
    setPage,
    setPageSize,
    getFilterValue,
    hasActiveFilters,
    filtersToApiFormat,
  };
}
