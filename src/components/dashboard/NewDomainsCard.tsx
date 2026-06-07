import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import { Globe, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewDomainsCardProps {
  count?: number;
  trend?: number;
}

export function NewDomainsCard({ count = 0, trend }: NewDomainsCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-4 w-4" />;
    return trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground';
    return trend > 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <Card className="h-[168px] md:h-[176px] flex flex-col min-w-0">
      <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex items-center gap-1.5">
          <CardTitle className="truncate text-sm font-medium leading-tight">Added Domains</CardTitle>
          <TouchTooltip
            content={<p>New domains added for DMARC monitoring during this period</p>}
            side="top"
            className="max-w-xs"
          >
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-help" />
          </TouchTooltip>
        </div>
        <div className="h-8 w-8 xl:h-9 xl:w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Globe className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
        <div className="text-3xl font-bold tracking-tight">{count}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn('flex items-center text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span className="ml-1">{Math.round(Math.abs(trend) * 100) / 100}%</span>
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
