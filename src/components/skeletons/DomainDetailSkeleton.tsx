import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DomainDetailSkeleton() {
  return (
    <div className="space-y-4 min-w-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
        <div className="flex items-start gap-3 md:gap-4">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-28 self-start sm:self-auto" />
      </div>

      {/* DMARC Record Card */}
      <Card className="min-w-0 max-w-full overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Policy & Alignment Cards */}
      <div className="grid gap-4 md:grid-cols-2 min-w-0">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-4 md:p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="grid gap-3 md:gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1 p-3 rounded-lg border bg-muted/30">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-4 md:p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-40 mt-1" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="grid gap-3 md:gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-1 p-3 rounded-lg border bg-muted/30">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reporting Configuration */}
      <Card className="min-w-0 max-w-full overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-40 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="grid gap-4 md:grid-cols-2 min-w-0">
            <div className="min-w-0 overflow-hidden">
              <Skeleton className="h-4 w-36 mb-2" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
