import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  description?: string;
  invertTrend?: boolean;
  tooltip?: string;
}

export function StatCard({ title, value, trend, icon, description, invertTrend = false, tooltip }: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-4 w-4" />;
    return trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground';
    const isPositive = trend! > 0;
    const isGood = invertTrend ? !isPositive : isPositive;
    return isGood ? 'text-success' : 'text-destructive';
  };

  return (
    <Card className="h-[168px] md:h-[176px] flex flex-col min-w-0">
      <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex items-center gap-1.5">
          <CardTitle className="truncate text-sm font-medium leading-tight">{title}</CardTitle>
          {tooltip && (
            <TouchTooltip content={<p>{tooltip}</p>} side="top" className="max-w-xs">
              <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-help" />
            </TouchTooltip>
          )}
        </div>
        <div className="h-8 w-8 xl:h-9 xl:w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {(trend !== undefined || description) && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend !== undefined && (
              <span className={cn('flex items-center text-xs font-medium', getTrendColor())}>
                {getTrendIcon()}
                <span className="ml-1">{Math.round(Math.abs(trend) * 100) / 100}%</span>
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
