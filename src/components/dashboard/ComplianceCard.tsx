import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import { TrendingUp, TrendingDown, Minus, Info, Shield, Key, Mail, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplianceGaugeProps {
  label: string;
  value: number; // 0-1 float
  trend?: number;
  icon: React.ReactNode;
}

function ComplianceGauge({ label, value, trend, icon }: ComplianceGaugeProps) {
  const percentage = Math.round(value * 100);
  
  const getColor = () => {
    if (percentage >= 90) return { stroke: 'hsl(var(--success))', text: 'text-success' };
    if (percentage >= 50) return { stroke: 'hsl(var(--muted-foreground))', text: 'text-gray' };
    return { stroke: 'hsl(var(--destructive))', text: 'text-destructive' };
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-3 w-3" />;
    return trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground';
    return trend > 0 ? 'text-success' : 'text-destructive';
  };

  const colors = getColor();
  
  // SVG arc calculation
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-12 w-20 sm:h-14 sm:w-24 md:h-16 md:w-28">
        <svg 
          viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`} 
          className="w-full h-full overflow-visible"
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
          <span className={cn('text-lg font-bold sm:text-xl md:text-2xl', colors.text)}>
            {percentage}%
          </span>
        </div>
      </div>
      
      {/* Label and trend */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1 text-muted-foreground sm:gap-1.5">
          {icon}
          <span className="text-xs font-medium md:text-sm">{label}</span>
        </div>
        {trend !== undefined && (
          <span className={cn('flex items-center text-xs', getTrendColor())}>
            {getTrendIcon()}
            <span className="ml-0.5">{trend >= 0 ? '+' : ''}{Math.round(trend * 10) / 10}%</span>
          </span>
        )}
      </div>
    </div>
  );
}

interface ComplianceCardProps {
  compliance?: {
    dmarc: number;
    dkim: number;
    spf: number;
  };
  complianceTrend?: {
    dmarc: number;
    dkim: number;
    spf: number;
  };
}

export function ComplianceCard({ compliance, complianceTrend }: ComplianceCardProps) {
  // Calculate overall average
  const avgCompliance = compliance 
    ? (compliance.dmarc + compliance.dkim + compliance.spf) / 3 
    : 0;
  const overallPercentage = Math.round(avgCompliance * 100);
  
  const getOverallColor = () => {
    if (overallPercentage >= 90) return 'text-success';
    if (overallPercentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className="h-[260px] md:h-[280px] flex flex-col min-w-0">
      <CardHeader className="pb-2 md:pb-3">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5">
            <CardTitle className="truncate text-sm font-medium leading-tight">Average Compliance</CardTitle>
            <TouchTooltip
              content={<p>Average pass rates for DMARC, DKIM, and SPF authentication across all your domains</p>}
              side="top"
              className="max-w-xs"
            >
              <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-help" />
            </TouchTooltip>
          </div>
          <div className="h-8 w-8 xl:h-9 xl:w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Gauge className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center py-4 md:py-6">
        <div className="grid w-full max-w-md grid-cols-3 gap-2 sm:gap-4 md:gap-8">
          <ComplianceGauge 
            label="DMARC" 
            value={compliance?.dmarc ?? 0} 
            trend={complianceTrend?.dmarc}
            icon={<Shield className="h-3.5 w-3.5" />}
          />
          <ComplianceGauge 
            label="DKIM" 
            value={compliance?.dkim ?? 0} 
            trend={complianceTrend?.dkim}
            icon={<Key className="h-3.5 w-3.5" />}
          />
          <ComplianceGauge 
            label="SPF" 
            value={compliance?.spf ?? 0} 
            trend={complianceTrend?.spf}
            icon={<Mail className="h-3.5 w-3.5" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}
