import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Checkbox } from '@/components/ui/checkbox';
import { blocklistService, BlocklistQueryParams } from '@/services/blocklist-service';
import { AddBlocklistDialog } from '@/components/blocklist/AddBlocklistDialog';
import { DateTimeDisplay } from '@/components/ui/datetime-display';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useIsMobile } from '@/hooks/use-mobile';
import { BlocklistPageSkeleton } from '@/components/skeletons';
import { toast } from '@/hooks/use-toast';
import type { BlocklistEntryApi, BlocklistResponse } from '@/types/blocklist';

type SortField = 'pattern' | 'createdAt';

interface DeleteBlocklistEntryControlProps {
  entry: BlocklistEntryApi;
  deletingId: string | null;
  disabled?: boolean;
  isMobile: boolean;
  onDelete: (entry: BlocklistEntryApi) => void;
}

function DeleteBlocklistEntryControl({ entry, deletingId, disabled = false, isMobile, onDelete }: DeleteBlocklistEntryControlProps) {
  const [open, setOpen] = useState(false);
  const isDeleting = deletingId === entry.id;
  const isDisabled = disabled || isDeleting;

  const trigger = (
    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isDisabled}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  const handleDeleteClick = () => {
    if (isDisabled) {
      return;
    }
    onDelete(entry);
    setOpen(false);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {trigger}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Remove blocklist entry?</DrawerTitle>
            <DrawerDescription>
              This will allow reports from this sender to be accepted again.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="pt-2">
            <Button
              onClick={handleDeleteClick}
              disabled={isDisabled}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isDeleting}>Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove blocklist entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This will allow reports from this sender to be accepted again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteClick}
            disabled={isDisabled}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function BlocklistPage() {
  const isMobile = useIsMobile();
  const [data, setData] = useState<BlocklistResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const urlFilters = useUrlFilters({
    defaultSort: { field: 'createdAt', direction: 'desc' },
    defaultPageSize: 25,
  });

  const { sort, pagination, setSort, setPage, setPageSize, filtersToApiFormat, setFilter, removeFilter, getFilterValue } = urlFilters;

  const currentPatternFilter = getFilterValue('pattern', 'contains') ?? '';

  useEffect(() => {
    if (currentPatternFilter !== debouncedSearch) {
      setSearchQuery(currentPatternFilter);
      setDebouncedSearch(currentPatternFilter);
    }
  }, [currentPatternFilter, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearch !== searchQuery) {
        setDebouncedSearch(searchQuery);
        const trimmed = searchQuery.trim();
        if (trimmed) {
          setFilter({ field: 'pattern', operator: 'contains', value: trimmed });
        } else {
          removeFilter('pattern', 'contains');
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearch, removeFilter, searchQuery, setFilter]);

  const handleSort = (field: SortField) => {
    if (sort.field === field) {
      setSort(field, sort.direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field, field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground/50" />;
    }
    return sort.direction === 'asc'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  useEffect(() => {
    const fetchBlocklist = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams: BlocklistQueryParams = {
          page: pagination.page,
          pageSize: pagination.pageSize,
        };

        const apiFilters = filtersToApiFormat();
        if (Object.keys(apiFilters).length > 0) {
          queryParams.filter = apiFilters;
        }

        queryParams.sort = { [sort.field]: sort.direction };

        const response = await blocklistService.getBlocklist(queryParams);
        const pageCount = Math.max(1, response.meta.pageCount);

        if (pagination.page > pageCount) {
          setPage(pageCount);
          return;
        }

        setData(response);
        setSelectedEntryIds((prev) => prev.filter((id) => response.items.some((entry) => entry.id === id)));
      } catch (fetchError) {
        console.error('Failed to fetch blocklist:', fetchError);
        setError('Failed to load blocklist entries.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocklist();
  }, [filtersToApiFormat, pagination, refreshKey, setPage, sort]);

  const handleCreated = () => {
    setPage(1);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDelete = async (entry: BlocklistEntryApi) => {
    setDeletingId(entry.id);
    setError(null);
    try {
      await blocklistService.deleteBlocklistEntry(entry.id);
      setSelectedEntryIds((prev) => prev.filter((id) => id !== entry.id));
      setRefreshKey((prev) => prev + 1);
      toast({ title: 'Blocklist entry removed' });
    } catch (deleteError) {
      console.error('Failed to delete blocklist entry:', deleteError);
      setError('Failed to delete blocklist entry.');
    } finally {
      setDeletingId(null);
    }
  };

  const visibleEntryIds = useMemo(() => data?.items.map((entry) => entry.id) ?? [], [data?.items]);
  const selectedVisibleCount = useMemo(
    () => visibleEntryIds.filter((id) => selectedEntryIds.includes(id)).length,
    [selectedEntryIds, visibleEntryIds]
  );
  const allVisibleSelected = visibleEntryIds.length > 0 && selectedVisibleCount === visibleEntryIds.length;
  const partiallyVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  const isMutating = deletingId !== null || isDeletingBulk;

  const toggleEntrySelection = (entryId: string, checked: boolean) => {
    setSelectedEntryIds((prev) => {
      if (checked) {
        return prev.includes(entryId) ? prev : [...prev, entryId];
      }
      return prev.filter((id) => id !== entryId);
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedEntryIds((prev) => Array.from(new Set([...prev, ...visibleEntryIds])));
      return;
    }

    setSelectedEntryIds((prev) => prev.filter((id) => !visibleEntryIds.includes(id)));
  };

  const handleBulkDelete = async () => {
    if (selectedEntryIds.length === 0) {
      return;
    }

    setIsDeletingBulk(true);
    setError(null);

    try {
      const response = await blocklistService.deleteBlocklistEntries(selectedEntryIds);
      setIsBulkDeleteOpen(false);
      setSelectedEntryIds([]);
      setRefreshKey((prev) => prev + 1);
      toast({ title: `${response.deletedCount} blocklist entries removed` });
    } catch (deleteError) {
      console.error('Failed to bulk delete blocklist entries:', deleteError);
      setError('Failed to delete selected blocklist entries.');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const totalPages = data?.meta.pageCount ?? 1;
  const currentPage = pagination.page;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Blocklist</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            List of your ignored sender patterns
          </p>
        </div>
        <AddBlocklistDialog onCreated={handleCreated} />
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle className="text-lg md:text-xl">All Blocklist Entries</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Quick search..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="h-9 flex items-center justify-end">
              {selectedEntryIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isMutating}
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  {isDeletingBulk ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete {selectedEntryIds.length} selected
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {isLoading ? (
            <BlocklistPageSkeleton />
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : (
            <div className="animate-fade-in">
              <div className="block md:hidden space-y-3">
                {data?.items.map((entry) => (
                  <div key={entry.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <Checkbox
                          checked={selectedEntryIds.includes(entry.id)}
                          onCheckedChange={(checked) => toggleEntrySelection(entry.id, Boolean(checked))}
                          disabled={isMutating}
                          className="mt-0.5 border-muted-foreground/50 data-[state=checked]:border-muted-foreground data-[state=checked]:bg-muted-foreground data-[state=checked]:text-background"
                          aria-label={`Select blocklist entry ${entry.id}`}
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{entry.pattern || 'Unknown pattern'}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {entry.createdAt ? <DateTimeDisplay date={entry.createdAt} /> : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <DeleteBlocklistEntryControl
                        entry={entry}
                        deletingId={deletingId}
                        disabled={isMutating}
                        isMobile={isMobile}
                        onDelete={handleDelete}
                      />
                    </div>
                  </div>
                ))}
                {(!data?.items || data.items.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    No blocklist entries found
                  </div>
                )}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-muted/50 border-b-2">
                      <TableHead className="w-[44px]">
                        <Checkbox
                          checked={allVisibleSelected ? true : partiallyVisibleSelected ? 'indeterminate' : false}
                          onCheckedChange={(checked) => toggleSelectAllVisible(Boolean(checked))}
                          disabled={isMutating || visibleEntryIds.length === 0}
                          className="border-muted-foreground/50 data-[state=checked]:border-muted-foreground data-[state=checked]:bg-muted-foreground data-[state=checked]:text-background"
                          aria-label="Select all visible blocklist entries"
                        />
                      </TableHead>
                      <TableHead
                        className="font-semibold cursor-pointer hover:bg-muted/80 select-none"
                        onClick={() => handleSort('pattern')}
                      >
                        <div className="flex items-center">
                          Pattern
                          {getSortIcon('pattern')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold cursor-pointer hover:bg-muted/80 select-none"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Created At
                          {getSortIcon('createdAt')}
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEntryIds.includes(entry.id)}
                            onCheckedChange={(checked) => toggleEntrySelection(entry.id, Boolean(checked))}
                            disabled={isMutating}
                            className="border-muted-foreground/50 data-[state=checked]:border-muted-foreground data-[state=checked]:bg-muted-foreground data-[state=checked]:text-background"
                            aria-label={`Select blocklist entry ${entry.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{entry.pattern || 'Unknown pattern'}</TableCell>
                        <TableCell>
                          {entry.createdAt ? <DateTimeDisplay date={entry.createdAt} /> : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteBlocklistEntryControl
                            entry={entry}
                            deletingId={deletingId}
                            disabled={isMutating}
                            isMobile={isMobile}
                            onDelete={handleDelete}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.items || data.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No blocklist entries found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground hidden sm:inline">Items per page:</span>
                  <Select value={pagination.pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value, 10))}>
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
                  <span className="text-muted-foreground">({data?.meta.totalCount ?? 0} total)</span>
                </div>
                {totalPages > 1 && (
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && setPage(currentPage - 1)}
                          className={`${currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} h-8 px-2 sm:px-3`}
                        />
                      </PaginationItem>

                      <span className="flex items-center text-sm px-2 sm:hidden">
                        {currentPage} / {totalPages}
                      </span>

                      <div className="hidden sm:flex">
                        {(() => {
                          const items: React.ReactNode[] = [];
                          items.push(
                            <PaginationItem key={1}>
                              <PaginationLink
                                isActive={1 === currentPage}
                                onClick={() => setPage(1)}
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
                                  onClick={() => setPage(i)}
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
                                  onClick={() => setPage(totalPages)}
                                  className="cursor-pointer"
                                >
                                  {totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          return items;
                        })()}
                      </div>

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => currentPage < totalPages && setPage(currentPage + 1)}
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

      {isMobile ? (
        <Drawer open={isBulkDeleteOpen} onOpenChange={(open) => !isDeletingBulk && setIsBulkDeleteOpen(open)}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Delete selected blocklist entries?</DrawerTitle>
              <DrawerDescription>
                This will remove {selectedEntryIds.length} selected blocklist entr{selectedEntryIds.length === 1 ? 'y' : 'ies'}.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-2">
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeletingBulk}>
                {isDeletingBulk ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Delete selected
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" disabled={isDeletingBulk}>Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isBulkDeleteOpen} onOpenChange={(open) => !isDeletingBulk && setIsBulkDeleteOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete selected blocklist entries?</DialogTitle>
              <DialogDescription>
                This will remove {selectedEntryIds.length} selected blocklist entr{selectedEntryIds.length === 1 ? 'y' : 'ies'}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)} disabled={isDeletingBulk}>Cancel</Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeletingBulk}>
                {isDeletingBulk ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Delete selected
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
