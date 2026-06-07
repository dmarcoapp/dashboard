import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pass' | 'fail' | 'none' | 'mixed' | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  
  const variants: Record<string, { className: string; label: string }> = {
    pass: {
      className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
      label: 'Pass',
    },
    fail: {
      className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
      label: 'Fail',
    },
    mixed: {
      className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
      label: 'Mixed',
    },
    none: {
      className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
      label: 'None',
    },
  };

  const variant = variants[normalizedStatus] || variants.none;

  return (
    <Badge 
      variant="outline" 
      className={cn(variant.className, className)}
    >
      {variant.label}
    </Badge>
  );
}
