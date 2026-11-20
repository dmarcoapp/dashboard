import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PlatformPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64 rounded-md" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-4 w-80 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
