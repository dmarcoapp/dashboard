import { Badge } from '@/components/ui/badge';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import { REPORT_SOURCE_META } from '@/lib/report-source';
import { cn } from '@/lib/utils';
import type { ReportSource } from '@/types/api';

interface ReportSourceBadgeProps {
  source?: ReportSource | null;
  className?: string;
}

export function ReportSourceBadge({ source, className }: ReportSourceBadgeProps) {
  if (!source) {
    return <span className="text-muted-foreground">-</span>;
  }

  const { label, description, Icon } = REPORT_SOURCE_META[source];

  return (
    <TouchTooltip side="top" content={<p className="text-xs">{description}</p>}>
      <Badge variant="outline" className={cn('gap-1 font-normal whitespace-nowrap cursor-help', className)}>
        <Icon className="h-3 w-3 shrink-0" />
        {label}
      </Badge>
    </TouchTooltip>
  );
}
