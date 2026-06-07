import { Globe, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchTooltip } from '@/components/ui/touch-tooltip';

interface NewDomainsListCardProps {
  domains?: string[];
}

export function NewDomainsListCard({ domains = [] }: NewDomainsListCardProps) {
  return (
    <Card className="h-[260px] md:h-[280px] flex flex-col min-w-0">
      <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex items-center gap-1.5">
          <CardTitle className="truncate text-sm font-medium leading-tight">New domains</CardTitle>
          <TouchTooltip content={<p>Domains first seen during the selected time period</p>} side="top">
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-help" />
          </TouchTooltip>
        </div>
        <div className="h-8 w-8 xl:h-9 xl:w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Globe className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {domains.length === 0 ? (
          <p className="text-sm text-muted-foreground">No new domains this period</p>
        ) : (
          <div className="space-y-1.5 overflow-y-auto pr-1 max-h-full">
            {domains.map((domain, index) => (
              <div key={`${domain}-${index}`} className="h-5 min-w-0">
                <p className="block truncate text-sm leading-5 text-white">{domain}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
