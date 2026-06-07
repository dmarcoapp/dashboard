import { Mail } from 'lucide-react';
import { TopIpAggregateCard } from '@/components/dashboard/TopIpAggregateCard';
import type { TopIpAggregate } from '@/types/api';

interface TopSendersCardProps {
  senders?: TopIpAggregate[];
}

export function TopSendersCard({ senders }: TopSendersCardProps) {
  return (
    <TopIpAggregateCard
      title="Top Senders"
      tooltip="IP addresses with the highest sending activity during this period"
      icon={<Mail className="h-4 w-4" />}
      items={senders}
      emptyMessage="No sender activity this period"
      orgNameFallback="N/A"
    />
  );
}
