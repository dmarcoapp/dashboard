import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ReportsPageSkeleton() {
  return (
    <>
      {/* Mobile skeleton */}
      <div className="block md:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="h-4 w-4 rounded-sm" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
            <Skeleton className="h-4 w-40 mb-2" />
            <div className="flex items-center justify-start mb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
            <Skeleton className="h-3 w-28 mb-2" />
          </div>
        ))}
      </div>

      {/* Desktop skeleton - uses actual Table for matching column widths */}
      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50 border-b-2">
              <TableHead className="w-[44px]"><Skeleton className="h-4 w-4 rounded-sm" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-36" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="text-center font-semibold"><Skeleton className="h-4 w-12 mx-auto" /></TableHead>
              <TableHead className="text-center font-semibold"><Skeleton className="h-4 w-8 mx-auto" /></TableHead>
              <TableHead className="text-center font-semibold"><Skeleton className="h-4 w-10 mx-auto" /></TableHead>
              <TableHead className="text-center font-semibold"><Skeleton className="h-4 w-14 mx-auto" /></TableHead>
              <TableHead className="text-right font-semibold"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
              <TableHead className="text-right font-semibold"><Skeleton className="h-4 w-14 ml-auto" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4 rounded-sm" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
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
