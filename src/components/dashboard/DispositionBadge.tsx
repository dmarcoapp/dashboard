import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DispositionType = 'none' | 'reject' | 'quarantine' | string;

interface DispositionBadgeProps {
  disposition: DispositionType;
  className?: string;
}

export function DispositionBadge({ disposition, className }: DispositionBadgeProps) {
  const normalizedDisposition = disposition?.toLowerCase() ?? 'none';
  
  const variants: Record<string, { className: string; label: string }> = {
    none: {
      className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
      label: 'None',
    },
    reject: {
      className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
      label: 'Reject',
    },
    quarantine: {
      className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
      label: 'Quarantine',
    },
  };

  const variant = variants[normalizedDisposition] || variants.none;

  return (
    <Badge 
      variant="outline" 
      className={cn(variant.className, 'font-medium', className)}
    >
      {variant.label}
    </Badge>
  );
}
