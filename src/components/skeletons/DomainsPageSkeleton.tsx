import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function DomainsPageSkeleton() {
  return (
    <>
      {/* Mobile skeleton */}
      <div className="block md:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-2 mb-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop skeleton - uses actual Table for matching column widths */}
      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50 border-b-2">
              <TableHead className="font-semibold"><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-28" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-44" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-4" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[70px]" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </>
  );
}
