import { Building2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import type { TopReportingOrganizationAggregate } from '@/types/api';

interface TopReportingOrganizationsCardProps {
  organizations?: TopReportingOrganizationAggregate[];
}

export function TopReportingOrganizationsCard({ organizations }: TopReportingOrganizationsCardProps) {
  const topFive = organizations?.slice(0, 5) ?? [];

  return (
    <Card className="h-[260px] md:h-[280px] flex flex-col min-w-0">
      <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex items-center gap-1.5">
          <CardTitle className="truncate text-sm font-medium leading-tight">Top reporting organizations</CardTitle>
          <TouchTooltip content={<p>Organizations with the highest DMARC report volume during this period</p>} side="top">
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-help" />
          </TouchTooltip>
        </div>
        <div className="h-8 w-8 xl:h-9 xl:w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Building2 className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {topFive.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reporting organization activity this period</p>
        ) : (
          <div className="space-y-1.5">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Organization</span>
              <span>Reports</span>
            </div>
            {topFive.map((item, index) => {
              const organizationName = item.reportingOrganization ?? 'Unknown';
              const reportCount = item.count ?? 0;
              const hasOrganization = item.reportingOrganization !== null;

              return (
                <div key={`${organizationName}-${index}`} className="flex h-5 items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {hasOrganization ? (
                      <Link
                        to={`/reports?filter.eq.reportingOrganization=${encodeURIComponent(item.reportingOrganization ?? '')}`}
                        className="block truncate text-sm leading-5 text-white underline-offset-2 hover:underline"
                      >
                        {organizationName}
                      </Link>
                    ) : (
                      <span className="block truncate text-sm leading-5 text-white">{organizationName}</span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium leading-5 text-white">
                    {reportCount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
