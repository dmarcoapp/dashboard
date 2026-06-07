import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, CircleCheckBig, CircleX, ShieldCheck, ShieldAlert, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { domainsService } from '@/services/domains-service';
import { DateTimeDisplay } from '@/components/ui/datetime-display';
import { AddDomainDialog } from '@/components/domains/AddDomainDialog';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import { DomainsPageSkeleton } from '@/components/skeletons';
import type { DomainApi, DomainsResponse, ProtectionLevel } from '@/types/domain';

type SortDirection = 'asc' | 'desc';
type SortField = 'domain' | 'createdAt' | 'lastChecked' | 'protectionLevel';

const getProtectionMeta = (level: ProtectionLevel) => {
  if (level === 'strong') {
    return { label: 'Strong', className: 'text-success', Icon: ShieldCheck };
  }
  if (level === 'moderate') {
    return { label: 'Moderate', className: 'text-warning', Icon: ShieldAlert };
  }
  return { label: 'Weak', className: 'text-destructive', Icon: CircleX };
};

const renderProtectionLevel = (level: ProtectionLevel, iconClassName: string) => {
  const protectionMeta = getProtectionMeta(level);
  return (
    <div className={`inline-flex items-center gap-1.5 ${protectionMeta.className}`}>
      <protectionMeta.Icon className={iconClassName} />
      <span>{protectionMeta.label}</span>
    </div>
  );
};

export default function DomainsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [domains, setDomains] = useState<DomainApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Parse URL params
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
  const sortField = (searchParams.get('sort') || 'domain') as SortField;
  const sortDirection = (searchParams.get('sortDir') || 'asc') as SortDirection;

  const handleSort = (field: SortField) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (field === sortField) {
        newParams.set('sortDir', sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        newParams.set('sort', field);
        newParams.set('sortDir', 'asc');
      }
      newParams.set('page', '1');
      return newParams;
    });
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearch !== searchQuery) {
        setDebouncedSearch(searchQuery);
        // Reset to page 1 when search changes
        if (searchQuery !== '') {
          setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('page', '1');
            return newParams;
          });
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch, setSearchParams]);

  useEffect(() => {
    const fetchDomains = async () => {
      setLoading(true);
      setError(null);
      try {
        const filter: Record<string, string> = {};
        if (debouncedSearch) {
          filter['contains:domain'] = debouncedSearch;
        }
        
        const response: DomainsResponse = await domainsService.getDomains({
          page: currentPage,
          pageSize,
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          sort: { [sortField]: sortDirection },
        });
        
        setDomains(response.items);
        setTotalPages(response.meta.pageCount);
        setTotalCount(response.meta.totalCount);
      } catch (err) {
        setError('Failed to load domains');
        console.error('Error fetching domains:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, [currentPage, pageSize, debouncedSearch, sortField, sortDirection]);

  const handleDomainClick = (domain: DomainApi) => {
    navigate(`/domains/${domain.id}`);
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', page.toString());
      return newParams;
    });
  };

  const handlePageSizeChange = (size: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('pageSize', size);
      newParams.set('page', '1');
      return newParams;
    });
  };

  const renderPaginationItems = () => {
    const items: React.ReactNode[] = [];
    
    items.push(
      <PaginationItem key={1}>
        <PaginationLink 
          isActive={1 === currentPage} 
          onClick={() => handlePageChange(1)}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    if (start > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={i === currentPage} 
            onClick={() => handlePageChange(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    if (end < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            isActive={totalPages === currentPage} 
            onClick={() => handlePageChange(totalPages)}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Domains</h1>
          <p className="text-sm md:text-base text-muted-foreground">List of your domains extracted from the DMARC reports</p>
        </div>
        <AddDomainDialog />
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle className="text-lg md:text-xl">All Domains</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Quick search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="h-9" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {loading ? (
            <DomainsPageSkeleton />
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : (
            <div className="animate-fade-in">
              {/* Mobile card view */}
              <div className="block md:hidden space-y-3">
                {domains.map((domain) => (
                  <div 
                    key={domain.id}
                    onClick={() => handleDomainClick(domain)}
                    className="p-4 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-medium truncate">{domain.domain || 'Unknown'}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                        {renderProtectionLevel(domain.protectionLevel, 'h-3.5 w-3.5')}
                        <div className="flex items-center gap-1.5">
                          <div className={domain.isConfiguredCorrectly ? "text-success" : "text-destructive"}>
                            {domain.isConfiguredCorrectly
                              ? <CircleCheckBig className="h-3.5 w-3.5" />
                              : <CircleX className="h-3.5 w-3.5" />
                            }
                          </div>
                          <span>{domain.isConfiguredCorrectly ? 'Configured' : 'Not configured'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground/70">Checked:</span>
                        {domain.lastChecked 
                          ? <DateTimeDisplay date={domain.lastChecked} />
                          : 'Never'
                        }
                      </div>
                    </div>
                  </div>
                ))}
                {domains.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    {debouncedSearch ? 'No domains match your search' : 'No domains found'}
                  </div>
                )}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-muted/50 border-b-2">
                      <TableHead 
                        className="font-semibold cursor-pointer hover:bg-muted/80 select-none"
                        onClick={() => handleSort('domain')}
                      >
                        <div className="flex items-center">
                          Domain
                          {getSortIcon('domain')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold cursor-pointer hover:bg-muted/80 select-none"
                        onClick={() => handleSort('protectionLevel')}
                      >
                        <div className="flex items-center">
                          Protection Level
                          {getSortIcon('protectionLevel')}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">Configured Correctly for DMARCo</TableHead>
                      <TableHead 
                        className="font-semibold cursor-pointer hover:bg-muted/80 select-none"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          First seen
                          {getSortIcon('createdAt')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold cursor-pointer hover:bg-muted/80 select-none"
                        onClick={() => handleSort('lastChecked')}
                      >
                        <div className="flex items-center">
                          Last Checked
                          {getSortIcon('lastChecked')}
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                        <TableRow 
                          key={domain.id}
                          className="cursor-pointer"
                          onClick={() => handleDomainClick(domain)}
                        >
                          <TableCell className="font-bold">
                            {domain.domain || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {renderProtectionLevel(domain.protectionLevel, 'h-4 w-4')}
                          </TableCell>
                          <TableCell>
                            <TouchTooltip
                              content={domain.isConfiguredCorrectly ? "Configured correctly" : "Not configured correctly"}
                              side="top"
                            >
                              <div className={`inline-flex ${domain.isConfiguredCorrectly ? "text-success" : "text-destructive"}`}>
                                {domain.isConfiguredCorrectly
                                  ? <CircleCheckBig className="h-4 w-4" />
                                  : <CircleX className="h-4 w-4" />
                                }
                              </div>
                            </TouchTooltip>
                          </TableCell>
                          <TableCell>
                            {domain.createdAt 
                              ? <DateTimeDisplay date={domain.createdAt} />
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {domain.lastChecked 
                              ? <DateTimeDisplay date={domain.lastChecked} />
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {domains.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {debouncedSearch ? 'No domains match your search' : 'No domains found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground hidden sm:inline">Items per page:</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">
                    ({totalCount} total)
                  </span>
                </div>
                {totalPages > 1 && (
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={`${currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} h-8 px-2 sm:px-3`}
                        />
                      </PaginationItem>
                      
                      <span className="flex items-center text-sm px-2 sm:hidden">
                        {currentPage} / {totalPages}
                      </span>
                      
                      <div className="hidden sm:flex">
                        {renderPaginationItems()}
                      </div>
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={`${currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} h-8 px-2 sm:px-3`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                </Pagination>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
