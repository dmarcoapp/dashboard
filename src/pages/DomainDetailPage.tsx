import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Mail, Clock, Calendar, XCircle, Info, Copy, Check, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import { domainsService } from '@/services/domains-service';
import { parseDmarcRecord, getPolicyDescription, getAlignmentDescription, getFailureOptionsDescription } from '@/lib/dmarc-parser';
import { DateTimeDisplay } from '@/components/ui/datetime-display';
import { DomainDetailSkeleton } from '@/components/skeletons';
import type { DomainApi, ProtectionLevel } from '@/types/domain';

export default function DomainDetailPage() {
  const { domain: domainId } = useParams<{ domain: string }>();
  const navigate = useNavigate();
  const [domain, setDomain] = useState<DomainApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDomain = async () => {
      if (!domainId) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await domainsService.getDomainById(domainId);
        setDomain(response);
      } catch (err) {
        setError('Failed to load domain details');
        console.error('Error fetching domain:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDomain();
  }, [domainId]);

  const handleCopyRecord = async () => {
    if (domain?.dmarcRecord) {
      await navigator.clipboard.writeText(domain.dmarcRecord);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parsedRecord = domain?.dmarcRecord ? parseDmarcRecord(domain.dmarcRecord) : null;

  const PolicyStrengthBadge = ({ level }: { level: ProtectionLevel }) => {
    switch (level) {
      case 'strong':
        return <Badge className="text-md font-bold bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 w-fit">Strong Protection</Badge>;
      case 'moderate':
        return <Badge className="text-md font-bold bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20 w-fit">Moderate Protection</Badge>;
      default:
        return <Badge className="text-md font-bold bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 w-fit">Weak Protection</Badge>;
    }
  };


  if (loading) {
    return <DomainDetailSkeleton />;
  }

  if (error || !domain) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/domains')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Domains
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {error || 'Domain not found'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0 max-w-full overflow-hidden animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
        <div className="flex items-start gap-3 md:gap-4">
          <Button variant="ghost" size="icon" className="shrink-0 mt-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">{domain.domain}</h1>
              <PolicyStrengthBadge level={domain.protectionLevel} />
            </div>
            <div className="flex flex-col gap-1 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate">Last checked: {domain.lastChecked ? <DateTimeDisplay date={domain.lastChecked} /> : 'Never'}</span>
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate">First seen: {domain.createdAt ? <DateTimeDisplay date={domain.createdAt} /> : '-'}</span>
              </span>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="self-start sm:self-auto"
          onClick={() => navigate(`/reports?filter.eq.domain=${encodeURIComponent(domain.domain || '')}`)}
        >
          <FileText className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">View Reports</span>
          <span className="sm:hidden">Reports</span>
        </Button>
      </div>

      {/* DMARC Record Overview */}
      <Card className="min-w-0 max-w-full overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 shrink-0" />
            <div>
              <CardTitle className="text-base md:text-lg">DMARC Record</CardTitle>
              <CardDescription className="text-xs md:text-sm">Current DMARC configuration for this domain</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
          {domain.dmarcRecord ? (
            <>
              <div className="relative max-w-full overflow-hidden">
                <div className="max-w-full overflow-x-auto rounded-lg bg-muted">
                  <pre className="p-3 pr-12 md:p-4 md:pr-12 text-xs md:text-sm font-mono whitespace-nowrap md:whitespace-pre-wrap md:break-words w-max md:w-full min-w-max md:min-w-0">
                    {domain.dmarcRecord}
                  </pre>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-muted/80"
                  onClick={handleCopyRecord}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
              <XCircle className="h-6 w-6 md:h-8 md:w-8 text-destructive mx-auto mb-2" />
              <p className="font-medium text-destructive text-sm md:text-base">No DMARC Record Found</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                This domain does not have a DMARC record configured.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {parsedRecord && (
        <>
          {/* Policy & Alignment Settings */}
          <div className="grid gap-4 md:grid-cols-2 min-w-0">
            {/* Policy Settings Card */}
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Shield className="h-4 w-4 md:h-5 md:w-5" /> Policy Settings
                </CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground">
                  How receiving servers should handle messages that fail DMARC.
                </p>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <div className="grid gap-3 md:gap-4">
                  {/* Domain Policy */}
                  <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm font-medium">Domain Policy (p)</span>
                      <TouchTooltip
                        content={<p>What receivers should do with emails that fail DMARC checks.</p>}
                        side="top"
                        className="max-w-xs"
                      >
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TouchTooltip>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">
                      <span className={parsedRecord.p === 'reject' ? 'text-success' : parsedRecord.p === 'quarantine' ? 'text-warning' : 'text-destructive'}>
                        {parsedRecord.p === 'reject' ? 'Reject' : parsedRecord.p === 'quarantine' ? 'Quarantine' : 'None'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getPolicyDescription(parsedRecord.p)}
                    </p>
                  </div>

                  {/* Subdomain Policy */}
                  <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm font-medium">Subdomain Policy (sp)</span>
                      <TouchTooltip
                        content={<p>{!parsedRecord.sp ? 'Inherits from domain policy when not specified.' : 'Policy applied to subdomains.'}</p>}
                        side="top"
                        className="max-w-xs"
                      >
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TouchTooltip>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">
                      <span className={(parsedRecord.sp || parsedRecord.p) === 'reject' ? 'text-success' : (parsedRecord.sp || parsedRecord.p) === 'quarantine' ? 'text-warning' : 'text-destructive'}>
                        {(parsedRecord.sp || parsedRecord.p) === 'reject' ? 'Reject' : (parsedRecord.sp || parsedRecord.p) === 'quarantine' ? 'Quarantine' : 'None'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getPolicyDescription(parsedRecord.sp || parsedRecord.p)}
                    </p>
                  </div>

                  {/* Policy Coverage */}
                  <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm font-medium">Policy Coverage (pct)</span>
                      <TouchTooltip
                        content={<p>Percentage of messages to which the policy applies.</p>}
                        side="top"
                        className="max-w-xs"
                      >
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TouchTooltip>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">
                      <span className={(parsedRecord.pct ?? 100) === 100 ? 'text-success' : (parsedRecord.pct ?? 100) >= 50 ? 'text-warning' : 'text-destructive'}>
                        {parsedRecord.pct ?? 100}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(parsedRecord.pct ?? 100) === 100 ? 'Full enforcement on all emails.' : `Policy applies to ${parsedRecord.pct}% of emails.`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alignment Settings Card */}
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Shield className="h-4 w-4 md:h-5 md:w-5" /> Alignment Settings
                </CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground">
                  How strictly identifiers must match.
                </p>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <div className="grid gap-3 md:gap-4">
                  {/* DKIM Alignment */}
                  <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm font-medium">DKIM Alignment</span>
                      <TouchTooltip
                        content={<p>How strictly DKIM domain must match the From domain.</p>}
                        side="top"
                        className="max-w-xs"
                      >
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TouchTooltip>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">
                      <span className={parsedRecord.adkim === 's' ? 'text-success' : 'text-warning'}>
                        {parsedRecord.adkim === 's' ? 'Strict' : 'Relaxed'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getAlignmentDescription(parsedRecord.adkim)}
                    </p>
                  </div>

                  {/* SPF Alignment */}
                  <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm font-medium">SPF Alignment</span>
                      <TouchTooltip
                        content={<p>How strictly SPF domain must match the From domain.</p>}
                        side="top"
                        className="max-w-xs"
                      >
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TouchTooltip>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">
                      <span className={parsedRecord.aspf === 's' ? 'text-success' : 'text-warning'}>
                        {parsedRecord.aspf === 's' ? 'Strict' : 'Relaxed'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getAlignmentDescription(parsedRecord.aspf)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reporting Configuration */}
          <Card className="min-w-0 max-w-full overflow-hidden">
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                <div>
                  <CardTitle className="text-base md:text-lg">Reporting Configuration</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Where DMARC reports are sent</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 min-w-0">
                <div className="min-w-0 overflow-hidden">
                  <h4 className="font-medium text-sm md:text-base mb-2">Aggregate Reports (rua)</h4>
                  {parsedRecord.rua && parsedRecord.rua.length > 0 ? (
                    <ul className="space-y-1">
                      {parsedRecord.rua.map((uri, idx) => (
                        <li key={idx} className="bg-muted rounded overflow-hidden max-w-full">
                          <div className="max-w-full overflow-x-auto">
                            <div className="text-xs md:text-sm font-mono px-2 py-1 whitespace-nowrap md:whitespace-normal md:break-all w-max md:w-full min-w-max md:min-w-0">
                              {uri}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground">Not configured</p>
                  )}
                </div>
                
                <div className="min-w-0 overflow-hidden">
                  <h4 className="font-medium text-sm md:text-base mb-2">Forensic Reports (ruf)</h4>
                  {parsedRecord.ruf && parsedRecord.ruf.length > 0 ? (
                    <ul className="space-y-1">
                      {parsedRecord.ruf.map((uri, idx) => (
                        <li key={idx} className="bg-muted rounded overflow-hidden max-w-full">
                          <div className="max-w-full overflow-x-auto">
                            <div className="text-xs md:text-sm font-mono px-2 py-1 whitespace-nowrap md:whitespace-normal md:break-all w-max md:w-full min-w-max md:min-w-0">
                              {uri}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground">Not configured</p>
                  )}
                </div>
              </div>

              {(parsedRecord.fo || parsedRecord.ri) && (
                <>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    {parsedRecord.fo && (
                      <div>
                        <h4 className="font-medium text-sm md:text-base mb-1">Failure Reporting Options (fo)</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {getFailureOptionsDescription(parsedRecord.fo)}
                        </p>
                      </div>
                    )}
                    {parsedRecord.ri && (
                      <div>
                        <h4 className="font-medium text-sm md:text-base mb-1">Reporting Interval (ri)</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {parsedRecord.ri} seconds ({Math.round(parsedRecord.ri / 3600)} hours)
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
