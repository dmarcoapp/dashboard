import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TopIpAggregate } from '@/types/api';

interface TopIpAggregateCardProps {
  title: string;
  tooltip: string;
  icon: React.ReactNode;
  items?: TopIpAggregate[];
  emptyMessage: string;
  orgNameFallback?: string;
}

function TopIpAggregateSourceIpCell({
  item,
  orgNameFallback = 'Unknown',
}: {
  item: TopIpAggregate;
  orgNameFallback?: string;
}) {
  const displayIp = item.sourceIp ?? 'Unknown';
  const displayOrgName = item.sourceIpInfo?.orgName ?? orgNameFallback;
  const displayCountry = item.sourceIpInfo?.orgCountry ?? 'N/A';
  const displayAbuse = item.sourceIpInfo?.orgAbuseEmail ?? 'N/A';
  const displayTech = item.sourceIpInfo?.orgTechEmail ?? 'N/A';

  const content = item.sourceIp ? (
    <Link
      to={`/reports?filter.eq.records.sourceIp=${encodeURIComponent(item.sourceIp)}`}
      className="inline-block max-w-full truncate font-mono text-sm leading-5 text-white underline-offset-2 hover:underline"
    >
      {displayIp}
      <span className="ml-1 text-white">({displayOrgName})</span>
    </Link>
  ) : (
    <span className="inline-block max-w-full truncate font-mono text-sm leading-5 text-white">{displayIp}</span>
  );

  return (
    <TouchTooltip
      side="top"
      className="max-w-xs font-sans"
      content={
        <div className="space-y-1 text-xs">
          <p><span className="text-muted-foreground">Organization:</span> {displayOrgName}</p>
          <p><span className="text-muted-foreground">Country:</span> {displayCountry}</p>
          <p><span className="text-muted-foreground">Abuse:</span> {displayAbuse}</p>
          <p><span className="text-muted-foreground">Tech:</span> {displayTech}</p>
        </div>
      }
    >
      <span className="block min-w-0 cursor-help">{content}</span>
    </TouchTooltip>
  );
}

export function TopIpAggregateCard({
  title,
  tooltip,
  icon,
  items,
  emptyMessage,
  orgNameFallback = 'Unknown',
}: TopIpAggregateCardProps) {
  const topFive = items?.slice(0, 5) ?? [];

  return (
    <Card className="h-[260px] md:h-[280px] flex flex-col min-w-0">
      <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex items-center gap-1.5">
          <CardTitle className="truncate text-sm font-medium leading-tight">{title}</CardTitle>
          <TouchTooltip content={<p>{tooltip}</p>} side="top">
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-help" />
          </TouchTooltip>
        </div>
        <div className="h-8 w-8 xl:h-9 xl:w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {topFive.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-1.5">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Source IP</span>
              <span>Count</span>
            </div>
            {topFive.map((item, index) => (
              <div key={`${item.sourceIp ?? 'unknown'}-${index}`} className="flex h-5 items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <TopIpAggregateSourceIpCell item={item} orgNameFallback={orgNameFallback} />
                </div>
                <span className="shrink-0 text-sm font-medium leading-5 text-white">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
