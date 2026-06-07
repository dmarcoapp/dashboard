import { ShieldAlert } from 'lucide-react';
import { TopIpAggregateCard } from '@/components/dashboard/TopIpAggregateCard';
import type { TopIpAggregate } from '@/types/api';

interface TopOffendersCardProps {
  offenders?: TopIpAggregate[];
}

export function TopOffendersCard({ offenders }: TopOffendersCardProps) {
  return (
    <TopIpAggregateCard
      title="Top Offenders"
      tooltip="IP addresses with the most failed authentication attempts"
      icon={<ShieldAlert className="h-4 w-4" />}
      items={offenders}
      emptyMessage="No offenders detected"
      orgNameFallback="Unknown"
    />
  );
}
