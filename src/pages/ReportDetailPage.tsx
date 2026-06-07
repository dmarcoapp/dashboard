import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { reportsService, ReportsQueryParams } from '@/services/reports-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { DispositionBadge, DispositionType } from '@/components/dashboard/DispositionBadge';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, Loader2, Calendar, Building2, Globe, Search, X, FileCode, Copy, Check, HelpCircle, Shield, Mail, Filter, Download, Server, Phone, CheckCircle2, AlertTriangle, Fingerprint, Clock3, Trash2 } from 'lucide-react';
import { ReportDetailSkeleton } from '@/components/skeletons';
import type { ReportApi, ReportRecordApi, RecordsResponse, SourceIpInfo } from '@/types/api';
import { DateRangeDisplay, DateTimeDisplay } from '@/components/ui/datetime-display';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api-client';

const DISPOSITION_OPTIONS: { value: DispositionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'none', label: 'None' },
  { value: 'quarantine', label: 'Quarantine' },
  { value: 'reject', label: 'Reject' },
];

// Helper to render aggregated DKIM fields (auth/domain/selector combined)
function DkimCell({ auth, domain, selector }: { auth: string | null; domain: string | null; selector: string | null }) {
  const auths = auth?.split('/') ?? [];
  const domains = domain?.split('/') ?? [];
  const selectors = selector?.split('/') ?? [];
  
  const count = Math.max(auths.length, domains.length, selectors.length);
  
  if (count === 0 || !auth) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Build combined entries for display
  const entries = Array.from({ length: count }, (_, i) => ({
    auth: auths[i] ?? '-',
    domain: domains[i] ?? '-',
    selector: selectors[i] ?? '-',
  }));

  // Determine overall status - if mixed pass/fail, show "mixed" (yellow)
  const normalizedAuths = auths.map(a => a.toLowerCase());
  const hasPass = normalizedAuths.includes('pass');
  const hasFail = normalizedAuths.includes('fail');
  const isMixed = hasPass && hasFail;
  
  const overallStatus = isMixed ? 'mixed' : (entries[0].auth as 'pass' | 'fail' | 'unknown');
  const hasMultiple = count > 1;

  return (
    <TouchTooltip
      side="top"
      className="max-w-xs"
      content={
        <div className="space-y-2 text-xs">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex flex-col gap-0.5 border-b border-border/50 pb-1 last:border-0 last:pb-0">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Result:</span>
                <StatusBadge status={entry.auth as 'pass' | 'fail' | 'unknown'} />
              </div>
              <div><span className="text-muted-foreground">Domain:</span> {entry.domain}</div>
              <div><span className="text-muted-foreground">Selector:</span> {entry.selector}</div>
            </div>
          ))}
        </div>
      }
    >
      <div className="flex items-center gap-1 cursor-help">
        <StatusBadge status={overallStatus} />
        {hasMultiple && (
          <Badge variant="outline" className="text-xs px-1 py-0 h-5">
            +{count - 1}
          </Badge>
        )}
      </div>
    </TouchTooltip>
  );
}

// Helper to render source IP with org name and tooltip
function SourceIpCell({
  ip,
  info,
  linkTo,
  className,
  showOrgName = true,
}: {
  ip: string | null;
  info: SourceIpInfo | null;
  linkTo?: string;
  className?: string;
  showOrgName?: boolean;
}) {
  if (!ip) {
    return <span className="text-muted-foreground">-</span>;
  }

  const hasInfo = info && (info.orgName || info.orgCountry || info.orgAbuseEmail || info.orgTechEmail);

  const content = linkTo ? (
    <Link
      to={linkTo}
      className={`underline-offset-2 hover:underline ${className ?? ''}`}
    >
      {ip}
      {showOrgName && info?.orgName && (
        <span className="text-muted-foreground ml-1">({info.orgName})</span>
      )}
    </Link>
  ) : (
    <span className={className}>
      {ip}
      {showOrgName && info?.orgName && (
        <span className="text-muted-foreground ml-1">({info.orgName})</span>
      )}
    </span>
  );

  if (!hasInfo) {
    return content;
  }

  return (
    <TouchTooltip
      side="top"
      className="max-w-xs font-sans"
      content={
        <div className="space-y-1 text-xs">
          {info?.orgName && (
            <p><span className="text-muted-foreground">Organization:</span> {info.orgName}</p>
          )}
          {info?.orgCountry && (
            <p><span className="text-muted-foreground">Country:</span> {info.orgCountry}</p>
          )}
          {info?.orgAbuseEmail && (
            <p><span className="text-muted-foreground">Abuse:</span> {info.orgAbuseEmail}</p>
          )}
          {info?.orgTechEmail && (
            <p><span className="text-muted-foreground">Tech:</span> {info.orgTechEmail}</p>
          )}
        </div>
      }
    >
      <span className="cursor-help">{content}</span>
    </TouchTooltip>
  );
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [report, setReport] = useState<ReportApi | null>(null);
  const [recordsData, setRecordsData] = useState<RecordsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sourceIpFilter, setSourceIpFilter] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState<DispositionType | 'all'>('all');
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [isXmlLoading, setIsXmlLoading] = useState(false);
  const [xmlDialogOpen, setXmlDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);

  const fetchXml = async () => {
    if (!id || xmlContent) return;
    setIsXmlLoading(true);
    try {
      const xml = await reportsService.getReportXml(id);
      setXmlContent(xml);
    } catch (error) {
      console.error('Failed to fetch XML:', error);
    } finally {
      setIsXmlLoading(false);
    }
  };

  const handleXmlDialogOpen = (open: boolean) => {
    setXmlDialogOpen(open);
    if (open) {
      fetchXml();
    }
  };

  const handleDeleteReport = async () => {
    if (!id) {
      return;
    }

    setIsDeletingReport(true);
    try {
      await reportsService.deleteReport(id);
      toast({ title: 'Report deleted' });
      setDeleteDialogOpen(false);
      navigate('/reports');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete report',
        description: error instanceof ApiError ? error.message : 'An error occurred.',
      });
    } finally {
      setIsDeletingReport(false);
    }
  };

  // Fetch report data only once
  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const reportData = await reportsService.getReportById(id);
        setReport(reportData);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  // Fetch records when filters/pagination change
  useEffect(() => {
    const fetchRecords = async () => {
      if (!id) return;
      setIsRecordsLoading(true);
      try {
        const params: ReportsQueryParams = { page: currentPage, pageSize };
        const filters: Record<string, string> = {};
        if (sourceIpFilter.trim()) {
          filters.sourceIp = sourceIpFilter.trim();
        }
        if (dispositionFilter !== 'all') {
          filters.disposition = dispositionFilter;
        }
        if (Object.keys(filters).length > 0) {
          params.filter = filters;
        }
        const records = await reportsService.getReportRecords(id, params);
        setRecordsData(records);
      } catch (error) {
        console.error('Failed to fetch records:', error);
      } finally {
        setIsRecordsLoading(false);
      }
    };
    fetchRecords();
  }, [id, currentPage, pageSize, sourceIpFilter, dispositionFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: string) => {
    const newSize = parseInt(size, 10);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSourceIpFilterChange = (value: string) => {
    setSourceIpFilter(value);
    setCurrentPage(1);
  };

  const clearSourceIpFilter = () => {
    setSourceIpFilter('');
    setCurrentPage(1);
  };

  const handleDispositionFilterChange = (value: DispositionType | 'all') => {
    setDispositionFilter(value);
    setCurrentPage(1);
  };

  const records = recordsData?.items ?? [];
  const totalPages = recordsData?.meta.pageCount ?? 1;

  if (isLoading) {
    return <ReportDetailSkeleton />;
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Report not found</p>
        <Button onClick={() => navigate('/reports')} className="mt-4">Back to Reports</Button>
      </div>
    );
  }

  const normalizedReportingEmail = report.reportingOrganizationEmail?.trim().toLowerCase();
  const normalizedFromAddress = report.fromAddress?.trim().toLowerCase();
  const reportIdValue = report.reportId ?? '-';
  const hasDifferentFromAddress = Boolean(
    normalizedReportingEmail &&
    normalizedFromAddress &&
    normalizedReportingEmail !== normalizedFromAddress
  );

  return (
    <div className="space-y-4 overflow-hidden animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
        <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
          <Button variant="ghost" size="icon" className="shrink-0 mt-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-3xl font-bold">Report Details</h1>
              {report.isVerified && (
                <TouchTooltip
                  side="right"
                  className="max-w-xs font-sans"
                  content={<p className="text-xs">Verified report: The sender's email address matches the report XML and belongs to the reporting organization.</p>}
                >
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-success shrink-0 cursor-help" />
                </TouchTooltip>
              )}
            </div>
            <div className="mt-1 flex flex-col gap-1">
              {reportIdValue.length > 32 ? (
                <TouchTooltip
                  side="bottom"
                  className="max-w-sm font-mono text-xs"
                  content={<p className="break-all">{reportIdValue}</p>}
                >
                  <p className="text-xs md:text-sm text-muted-foreground cursor-help">
                    <span className="lg:hidden inline-flex items-center gap-1"><Fingerprint className="h-3.5 w-3.5 shrink-0" />ID: {reportIdValue.slice(0, 32)}…</span>
                    <span className="hidden lg:inline-flex truncate items-center gap-1"><Fingerprint className="h-3.5 w-3.5 shrink-0" />ID: {reportIdValue}</span>
                  </p>
                </TouchTooltip>
              ) : (
                <p className="text-xs md:text-sm text-muted-foreground inline-flex items-center gap-1">
                  <Fingerprint className="h-3.5 w-3.5 shrink-0" />
                  ID: {reportIdValue}
                </p>
              )}
              <p className="inline-flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 shrink-0" />
                Received: <DateTimeDisplay date={report.receivedAt ?? null} />
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {report.domainId && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/domains/${report.domainId}`)}>
              <Globe className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">View Domain</span>
              <span className="sm:hidden">Domain</span>
            </Button>
          )}
          {(() => {
            const xmlTrigger = (
              <Button variant="outline" size="sm">
                <FileCode className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">View Raw XML</span>
                <span className="sm:hidden">XML</span>
              </Button>
            );

            const xmlActions = xmlContent && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(xmlContent);
                    toast({ title: "Copied to clipboard" });
                  }}
                >
                  <Copy className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([xmlContent], { type: 'application/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `dmarc-report-${report?.reportId || 'unknown'}.xml`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast({ title: "Download started" });
                  }}
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            );

            const xmlBody = (
              <ScrollArea className="h-[60vh] w-full rounded-md border">
                {isXmlLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <SyntaxHighlighter
                    language="xml"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                    }}
                    wrapLongLines
                  >
                    {xmlContent || ''}
                  </SyntaxHighlighter>
                )}
              </ScrollArea>
            );

            if (isMobile) {
              return (
                <Drawer open={xmlDialogOpen} onOpenChange={handleXmlDialogOpen}>
                  <DrawerTrigger asChild>
                    {xmlTrigger}
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader className="text-left">
                      <div className="flex items-center justify-between gap-2">
                        <DrawerTitle>Raw XML Report</DrawerTitle>
                        {xmlActions}
                      </div>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                      {xmlBody}
                    </div>
                  </DrawerContent>
                </Drawer>
              );
            }

            return (
              <Dialog open={xmlDialogOpen} onOpenChange={handleXmlDialogOpen}>
                <DialogTrigger asChild>
                  {xmlTrigger}
                </DialogTrigger>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl max-h-[80vh]">
                  <DialogHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <DialogTitle>Raw XML Report</DialogTitle>
                    {xmlActions}
                  </DialogHeader>
                  {xmlBody}
                </DialogContent>
              </Dialog>
            );
          })()}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeletingReport}
          >
            {isDeletingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            <span className="hidden sm:inline">Delete Report</span>
            <span className="sm:hidden">Delete</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 min-w-0">
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4" /> Reporting Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <p className="font-semibold text-lg md:text-xl truncate">{report.reportingOrganization}</p>
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground truncate">{report.reportingOrganizationEmail}</p>
              {hasDifferentFromAddress && (
                <TouchTooltip
                  side="top"
                  className="max-w-xs font-sans"
                  content={
                    <p className="text-xs">
                      The sender address differs: {report.fromAddress}
                    </p>
                  }
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 cursor-help" />
                </TouchTooltip>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 md:h-4 md:w-4" /> Domain
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <p className="font-semibold text-lg md:text-xl truncate">{report.domain}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" /> Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <p className="font-semibold text-lg md:text-xl">
              <DateRangeDisplay startDate={report.beginDate} endDate={report.endDate} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" /> Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <p className="font-semibold text-lg md:text-xl">{report.sumCount?.toLocaleString() ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Shield className="h-4 w-4 md:h-5 md:w-5" /> DMARC Policy Published
          </CardTitle>
          <p className="text-xs md:text-sm text-muted-foreground">
            These were the DMARC settings published in your DNS at the time and evaluated by the receiving server.
          </p>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 min-w-0">
            {/* Main Policy */}
            <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-medium">Policy Action</span>
                <TouchTooltip
                  side="top"
                  className="max-w-xs"
                  content={<p>What receivers should do with emails that fail DMARC checks.</p>}
                >
                  <HelpCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground cursor-help" />
                </TouchTooltip>
              </div>
              <div className="text-lg md:text-2xl font-bold">
                <span className={report.pPolicy === 'reject' ? 'text-success' : report.pPolicy === 'quarantine' ? 'text-warning' : 'text-destructive'}>
                  {report.pPolicy === 'reject' ? 'Reject' : report.pPolicy === 'quarantine' ? 'Quarantine' : report.pPolicy === 'none' ? 'None' : 'Unknown'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden md:block">
                {report.pPolicy === 'reject' ? 'Failing emails are blocked entirely.' : 
                 report.pPolicy === 'quarantine' ? 'Failing emails go to spam folder.' : 
                 report.pPolicy === 'none' ? 'No action taken, emails are delivered normally.' : 'Policy not recognized.'}
              </p>
            </div>

            {/* Subdomain Policy */}
            <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-medium">Subdomain</span>
                <TouchTooltip
                  side="top"
                  className="max-w-xs"
                  content={<p>How to handle emails from subdomains (e.g., mail.example.com).</p>}
                >
                  <HelpCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground cursor-help" />
                </TouchTooltip>
              </div>
              <div className="text-lg md:text-2xl font-bold">
                <span className={(report.spPolicy || report.pPolicy) === 'reject' ? 'text-success' : (report.spPolicy || report.pPolicy) === 'quarantine' ? 'text-warning' : 'text-destructive'}>
                    {report.spPolicy === 'reject' ? 'Reject' : report.spPolicy === 'quarantine' ? 'Quarantine' : report.spPolicy === 'none' ? 'None' : 'Inherit'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden md:block">
                {report.spPolicy === 'reject' ? 'Failing emails are blocked entirely.' :
                 report.spPolicy === 'quarantine' ? 'Failing emails go to spam folder.' :
                 report.spPolicy === 'none' ? 'No action taken, emails are delivered normally.' : 'Policy not recognized.'}
              </p>
            </div>

            {/* Percentage */}
            <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-medium">Coverage</span>
                <TouchTooltip
                  side="top"
                  className="max-w-xs"
                  content={<p>Percentage of failing emails the policy applies to.</p>}
                >
                  <HelpCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground cursor-help" />
                </TouchTooltip>
              </div>
              <div className="text-lg md:text-2xl font-bold">{report.pctPolicy ?? 100}%</div>
              <p className="text-xs text-muted-foreground hidden md:block">
                {(report.pctPolicy ?? 100) === 100 ? 'Full enforcement on all emails.' : `Policy applies to ${report.pctPolicy}% of failing emails.`}
              </p>
            </div>

            {/* DKIM Alignment */}
            <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-medium">DKIM Align</span>
                <TouchTooltip
                  side="top"
                  className="max-w-xs"
                  content={<p>How strictly the DKIM signature domain must match the From domain.</p>}
                >
                  <HelpCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground cursor-help" />
                </TouchTooltip>
              </div>
              <div className="text-lg md:text-2xl font-bold">
                {report.adkimPolicy === 's' ? 'Strict' : 'Relaxed'}
              </div>
              <p className="text-xs text-muted-foreground hidden md:block">
                {report.adkimPolicy === 's' ? 'Exact domain match required.' : 'Subdomains are allowed to match.'}
              </p>
            </div>

            {/* SPF Alignment */}
            <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-medium">SPF Align</span>
                <TouchTooltip
                  side="top"
                  className="max-w-xs"
                  content={<p>How strictly the SPF domain must match the From domain.</p>}
                >
                  <HelpCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground cursor-help" />
                </TouchTooltip>
              </div>
              <div className="text-lg md:text-2xl font-bold">
                {report.aspfPolicy === 's' ? 'Strict' : 'Relaxed'}
              </div>
              <p className="text-xs text-muted-foreground hidden md:block">
                {report.aspfPolicy === 's' ? 'Exact domain match required.' : 'Subdomains are allowed to match.'}
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Server className="h-4 w-4 md:h-5 md:w-5" /> Records
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by Source IP..."
                  value={sourceIpFilter}
                  onChange={(e) => handleSourceIpFilterChange(e.target.value)}
                  className="pl-9 pr-9 h-9"
                />
                {sourceIpFilter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={clearSourceIpFilter}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs md:text-sm text-muted-foreground">Disposition:</span>
              {DISPOSITION_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={dispositionFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDispositionFilterChange(option.value)}
                  className="h-7 text-xs px-2 md:px-3"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 relative">
          {isRecordsLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3">
            {records.map((record) => (
              <div key={record.id} className="p-3 rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                  <SourceIpCell
                    ip={record.sourceIp}
                    info={record.sourceIpInfo}
                    linkTo={
                      record.sourceIp
                        ? `/reports?filter.eq.records.sourceIp=${encodeURIComponent(record.sourceIp)}`
                        : undefined
                    }
                    className="font-mono text-xs truncate flex-1 min-w-0"
                    showOrgName={false}
                  />
                  <span className="text-sm text-muted-foreground shrink-0">{record.count} messages</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <DispositionBadge disposition={record.disposition} />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">DKIM:</span>
                    <DkimCell 
                      auth={record.dkimAuth} 
                      domain={record.dkimDomain} 
                      selector={record.dkimSelector} 
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">SPF:</span>
                    <StatusBadge status={record.spfAuth as 'pass' | 'fail' | 'unknown' ?? 'unknown'} />
                  </div>
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No records found
              </div>
            )}
          </div>
          
          {/* Desktop table view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50 border-b-2">
                  <TableHead className="font-semibold">Source IP</TableHead>
                  <TableHead className="text-right font-semibold">Count</TableHead>
                  <TableHead className="font-semibold">Disposition</TableHead>
                  <TableHead className="font-semibold">DKIM Align</TableHead>
                  <TableHead className="font-semibold">SPF Align</TableHead>
                  <TableHead className="font-semibold">DKIM Auth</TableHead>
                  <TableHead className="font-semibold">SPF Auth</TableHead>
                  <TableHead className="font-semibold">SPF Domain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">
                      <SourceIpCell
                        ip={record.sourceIp}
                        info={record.sourceIpInfo}
                        linkTo={
                          record.sourceIp
                            ? `/reports?filter.eq.records.sourceIp=${encodeURIComponent(record.sourceIp)}`
                            : undefined
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">{record.count}</TableCell>
                    <TableCell>
                      <DispositionBadge disposition={record.disposition} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.dkimAlign ?? 'unknown'} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.spfAlign ?? 'unknown'} />
                    </TableCell>
                    <TableCell>
                      <DkimCell 
                        auth={record.dkimAuth} 
                        domain={record.dkimDomain} 
                        selector={record.dkimSelector} 
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.spfAuth as 'pass' | 'fail' | 'unknown' ?? 'unknown'} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{record.spfDomain ?? '-'}</TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground hidden sm:inline">Items per page:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">
                ({recordsData?.meta.totalCount ?? 0} total)
              </span>
            </div>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={`${currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} h-8 px-2 sm:px-3`}
                    />
                  </PaginationItem>
                  
                  <span className="flex items-center text-sm px-2 sm:hidden">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <div className="hidden sm:flex">
                    {(() => {
                      const items: React.ReactNode[] = [];
                      
                      items.push(
                        <PaginationItem key={1}>
                          <PaginationLink 
                            isActive={1 === currentPage} 
                            onClick={() => handlePageChange(1)}
                            className="cursor-pointer"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      );
                      
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      
                      if (start > 2) {
                        items.push(
                          <PaginationItem key="ellipsis-start">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      for (let i = start; i <= end; i++) {
                        items.push(
                          <PaginationItem key={i}>
                            <PaginationLink 
                              isActive={i === currentPage} 
                              onClick={() => handlePageChange(i)}
                              className="cursor-pointer"
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      
                      if (end < totalPages - 1) {
                        items.push(
                          <PaginationItem key="ellipsis-end">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      if (totalPages > 1) {
                        items.push(
                          <PaginationItem key={totalPages}>
                            <PaginationLink 
                              isActive={totalPages === currentPage} 
                              onClick={() => handlePageChange(totalPages)}
                              className="cursor-pointer"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      
                      return items;
                    })()}
                  </div>
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={`${currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} h-8 px-2 sm:px-3`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>

      {isMobile ? (
        <Drawer
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (isDeletingReport) {
              return;
            }
            setDeleteDialogOpen(open);
          }}
        >
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Delete report?</DrawerTitle>
              <DrawerDescription>This action cannot be undone.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-2">
              <Button variant="destructive" onClick={handleDeleteReport} disabled={isDeletingReport}>
                {isDeletingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Delete report
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" disabled={isDeletingReport}>Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (isDeletingReport) {
              return;
            }
            setDeleteDialogOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete report?</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeletingReport}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteReport} disabled={isDeletingReport}>
                {isDeletingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Delete report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
