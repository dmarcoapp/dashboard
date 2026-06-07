import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function BlocklistPageSkeleton() {
  return (
    <>
      <div className="block md:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 min-w-0">
                <Skeleton className="h-4 w-4 mt-0.5 rounded-sm" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-8 w-8 shrink-0" />
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50 border-b-2">
              <TableHead className="font-semibold"><Skeleton className="h-4 w-4 rounded-sm" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="font-semibold"><Skeleton className="h-4 w-16" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4 rounded-sm" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
