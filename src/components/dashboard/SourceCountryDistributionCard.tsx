import { Globe2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import type { SourceCountryDistributionItem } from '@/types/api';

interface SourceCountryDistributionCardProps {
  items?: SourceCountryDistributionItem[];
}

export function SourceCountryDistributionCard({ items }: SourceCountryDistributionCardProps) {
  const sortedItems = [...(items ?? [])].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  return (
    <Card className="h-[260px] md:h-[280px] flex flex-col min-w-0">
      <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex items-center gap-1.5">
          <CardTitle className="truncate text-sm font-medium leading-tight">Source country distribution</CardTitle>
          <TouchTooltip content={<p>Distribution of source countries found in DMARC records</p>} side="top">
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-help" />
          </TouchTooltip>
        </div>
        <div className="h-8 w-8 xl:h-9 xl:w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Globe2 className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {sortedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No source country data</p>
        ) : (
          <div className="space-y-1.5 overflow-y-auto pr-1 max-h-full">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Country</span>
              <span>Count</span>
            </div>
            {sortedItems.map((item, index) => {
              const countryName = item.country && item.country.trim() ? item.country : 'Unknown';
              const count = item.count ?? 0;

              return (
                <div key={`${countryName}-${index}`} className="flex h-5 items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm leading-5 text-white">{countryName}</span>
                  </div>
                  <span className="shrink-0 text-sm font-medium leading-5 text-white">{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
