import { useEffect, useState } from 'react';
import { statsService } from '@/services/stats-service';
import { StatCard } from '@/components/dashboard/StatCard';
import { ComplianceCard } from '@/components/dashboard/ComplianceCard';
import { NewDomainsCard } from '@/components/dashboard/NewDomainsCard';
import { NewDomainsListCard } from '@/components/dashboard/NewDomainsListCard';
import { TopOffendersCard } from '@/components/dashboard/TopOffendersCard';
import { TopSendersCard } from '@/components/dashboard/TopSendersCard';
import { TopReportingOrganizationsCard } from '@/components/dashboard/TopReportingOrganizationsCard';
import { SourceCountryDistributionCard } from '@/components/dashboard/SourceCountryDistributionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/skeletons';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileText, Mail, CheckCircle, ShieldAlert, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import type { DashboardApi } from '@/types/api';

const PERIOD_OPTIONS = [7, 14, 30] as const;
const PERIOD_STORAGE_KEY = 'dashboard-period-days';
const TICK_DAY_STEP: Record<number, number> = {
  7: 1,
  14: 2,
};
const formatChartDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

const parseIsoDateUtc = (value: string): Date => new Date(`${value}T00:00:00Z`);

const toIsoDateUtc = (date: Date): string => date.toISOString().slice(0, 10);

const getStoredPeriod = (): number => {
  const stored = localStorage.getItem(PERIOD_STORAGE_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (PERIOD_OPTIONS.includes(parsed as typeof PERIOD_OPTIONS[number])) {
      return parsed;
    }
  }
  return 7;
};

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<DashboardApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState<number>(getStoredPeriod);

  const handlePeriodChange = (days: number) => {
    setPeriodDays(days);
    localStorage.setItem(PERIOD_STORAGE_KEY, days.toString());
  };

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await statsService.getStats(periodDays);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [periodDays]);

  // Transform messageCountByDate/threatCountByDate objects to array for the chart
  const chartData = (() => {
    const messageByDate = stats?.messageCountByDate ?? {};
    const threatByDate = stats?.threatCountByDate ?? {};
    const dateKeys = Array.from(
      new Set([...Object.keys(messageByDate), ...Object.keys(threatByDate)])
    ).sort();

    if (dateKeys.length === 0) {
      return [];
    }

    const fullDateRange: string[] = [];
    const start = parseIsoDateUtc(dateKeys[0]);
    const end = parseIsoDateUtc(dateKeys[dateKeys.length - 1]);

    for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      fullDateRange.push(toIsoDateUtc(cursor));
    }

    return fullDateRange.map((date) => ({
      date,
      messages: messageByDate[date] ?? 0,
      threats: threatByDate[date] ?? 0,
    }));
  })();

  const xAxisTicks = (() => {
    const step = periodDays === 30 ? (isMobile ? 5 : 3) : (TICK_DAY_STEP[periodDays] ?? 1);
    const ticks = chartData
      .filter((_, index) => index % step === 0)
      .map((item) => item.date);

    const lastDate = chartData[chartData.length - 1]?.date;
    if (lastDate && ticks[ticks.length - 1] !== lastDate) {
      ticks.push(lastDate);
    }

    return ticks;
  })();

  const lastInternalDate = chartData.length > 1 ? chartData[chartData.length - 2].date : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Gain an overview of who is sending emails using your domains</p>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((days) => (
            <Button
              key={days}
              variant={periodDays === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(days)}
            >
              {days} days
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="animate-fade-in space-y-4 min-w-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 [&>*]:min-w-0">
            <StatCard
              title="Total Reports"
              value={stats?.reportCount ?? 0}
              trend={stats?.reportTrend}
              icon={<FileText className="h-4 w-4" />}
              description="vs last period"
              tooltip="Number of DMARC aggregate reports received from email providers"
            />
            <StatCard
              title="Total Messages"
              value={stats?.messageCount ?? 0}
              trend={stats?.messageTrend}
              icon={<Mail className="h-4 w-4" />}
              description="vs last period"
              tooltip="Total emails analyzed across all DMARC reports"
            />
            <StatCard
              title="Pass Rate"
              value={`${((stats?.passRate ?? 0) * 100).toFixed(1)}%`}
              trend={stats?.passTrend}
              icon={<CheckCircle className="h-4 w-4" />}
              description="vs last period"
              tooltip="Percentage of emails that passed DMARC authentication"
            />
            <StatCard
              title="Threats Blocked"
              value={stats?.threatsBlockedCount ?? 0}
              trend={stats?.threatsBlockedTrend}
              icon={<ShieldAlert className="h-4 w-4" />}
              description="vs last period"
              invertTrend
              tooltip="Emails rejected or quarantined due to DMARC rules"
            />
            <NewDomainsCard
              count={stats?.newDomainCount}
              trend={stats?.newDomainTrend}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3 [&>*]:min-w-0">
            <ComplianceCard
              compliance={stats?.compliance}
              complianceTrend={stats?.complianceTrend}
            />
            <TopSendersCard senders={stats?.topSenders} />
            <TopOffendersCard offenders={stats?.topOffenders} />
            <TopReportingOrganizationsCard organizations={stats?.topReportingOrganizations} />
            <SourceCountryDistributionCard items={stats?.sourceCountryDistribution} />
            <NewDomainsListCard domains={stats?.newDomains} />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">Message Volume</CardTitle>
                <TouchTooltip
                  content={<p>Daily email volume over the selected time period</p>}
                  side="top"
                  className="max-w-xs"
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TouchTooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] md:h-[375px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -30, right: 20 }}>
                    <defs>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      ticks={xAxisTicks}
                      interval={0}
                      tickFormatter={formatChartDate}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="messages" name="Messages" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorMessages)" />
                    <Area type="monotone" dataKey="threats" name="Threats" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorThreats)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
