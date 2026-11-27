import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { platformService } from '@/services/platform-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadError } from '@/components/LoadError';
import { PlatformPageSkeleton } from '@/components/skeletons';
import { ApiIntakeCard } from '@/components/platform/ApiIntakeCard';
import { MailboxesCard } from '@/components/platform/MailboxesCard';
import { TimezonePicker } from '@/components/platform/TimezonePicker';
import { useToast } from '@/hooks/use-toast';
import { describeError } from '@/lib/api-errors';
import { PLATFORM_SETTINGS_QUERY_KEY, UTC, browserTimezone } from '@/lib/timezone';
import { AlertTriangle, Inbox, Info, Loader2, Mail, Send, SlidersHorizontal } from 'lucide-react';
import type { PlatformSettingsApi, PlatformSettingsUpdate, SmtpSecurity } from '@/types/api';

const DEFAULT_PORTS: Record<SmtpSecurity, number> = { starttls: 587, tls: 465, none: 25 };

const SECURITY_LABELS: Record<SmtpSecurity, string> = {
  starttls: 'STARTTLS (port 587)',
  tls: 'TLS (port 465)',
  none: 'None (local relay only)',
};

interface SectionProps {
  settings: PlatformSettingsApi;
  onSaved: (settings: PlatformSettingsApi) => void;
}

function GeneralSection({ settings, onSaved }: SectionProps) {
  const { toast } = useToast();
  const legacy = settings.mode === 'legacy';
  const [retention, setRetention] = useState(String(settings.reportRetentionDays));
  const [ipLookupEnabled, setIpLookupEnabled] = useState(settings.ipLookupEnabled);
  const [displayTimezone, setDisplayTimezone] = useState(settings.displayTimezone);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty =
    retention !== String(settings.reportRetentionDays) ||
    ipLookupEnabled !== settings.ipLookupEnabled ||
    displayTimezone !== settings.displayTimezone;
  const ownTimezone = browserTimezone();

  useEffect(() => {
    setRetention(String(settings.reportRetentionDays));
    setIpLookupEnabled(settings.ipLookupEnabled);
    setDisplayTimezone(settings.displayTimezone);
  }, [settings.reportRetentionDays, settings.ipLookupEnabled, settings.displayTimezone]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const days = Number.parseInt(retention, 10);
    if (Number.isNaN(days) || days < 0 || days > 3650) {
      toast({ variant: 'destructive', title: 'Enter a number of days between 0 and 3650' });
      return;
    }

    setIsSaving(true);
    try {
      onSaved(await platformService.updateSettings({ reportRetentionDays: days, ipLookupEnabled, displayTimezone }));
      toast({ title: 'Settings saved' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save the settings', description: describeError(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 shrink-0" />
          General
        </CardTitle>
        <CardDescription>Report retention, sender lookups, and the time zone</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-retention">Report Retention</Label>
            <div className="flex items-center gap-2">
              <Input
                id="report-retention"
                type="number"
                inputMode="numeric"
                min={0}
                max={3650}
                value={retention}
                onChange={(event) => setRetention(event.target.value)}
                disabled={legacy}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-sm text-muted-foreground">0 keeps reports indefinitely.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-timezone">Time Zone</Label>
            <div className="flex flex-wrap items-center gap-2">
              <TimezonePicker
                id="display-timezone"
                value={displayTimezone}
                onChange={setDisplayTimezone}
                disabled={legacy}
              />
              {!legacy && ownTimezone !== displayTimezone && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setDisplayTimezone(ownTimezone)}>
                  Use {ownTimezone.replace(/_/g, ' ')}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Dates and times are shown in this zone{displayTimezone === UTC ? '' : ', and in UTC on hover'}. They are
              stored in UTC.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <div className="space-y-1">
              <Label htmlFor="ip-lookup" className="text-base">IP Address Lookup</Label>
              <p className="text-sm text-muted-foreground">
                Resolves the owner and country of sending IP addresses via ipwho.is and the regional internet
                registries. Only the IP addresses are sent.
              </p>
            </div>
            <Switch
              id="ip-lookup"
              checked={ipLookupEnabled}
              onCheckedChange={setIpLookupEnabled}
              disabled={legacy}
              aria-label="Toggle IP address lookups"
            />
          </div>

          {!legacy && (
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function EmailSection({ settings, onSaved }: SectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const legacy = settings.mode === 'legacy';

  const [host, setHost] = useState(settings.smtpHost ?? '');
  const [security, setSecurity] = useState<SmtpSecurity>(settings.smtpSecurity ?? 'starttls');
  const [port, setPort] = useState(String(settings.smtpPort ?? DEFAULT_PORTS.starttls));
  const [username, setUsername] = useState(settings.smtpUsername ?? '');
  const [password, setPassword] = useState('');
  const [sender, setSender] = useState(settings.senderAddress ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const reset = useCallback(() => {
    setHost(settings.smtpHost ?? '');
    setSecurity(settings.smtpSecurity ?? 'starttls');
    setPort(String(settings.smtpPort ?? DEFAULT_PORTS.starttls));
    setUsername(settings.smtpUsername ?? '');
    setPassword('');
    setSender(settings.senderAddress ?? '');
  }, [settings]);

  useEffect(reset, [reset]);

  const isDirty =
    host.trim() !== (settings.smtpHost ?? '') ||
    (host.trim() !== '' &&
      (security !== (settings.smtpSecurity ?? 'starttls') ||
        port !== String(settings.smtpPort ?? DEFAULT_PORTS.starttls) ||
        username.trim() !== (settings.smtpUsername ?? ''))) ||
    password !== '' ||
    sender.trim() !== (settings.senderAddress ?? '');

  // A port nobody chose follows the kind of security.
  const handleSecurityChange = (value: string) => {
    const next = value as SmtpSecurity;
    if (port === '' || port === String(DEFAULT_PORTS[security])) {
      setPort(String(DEFAULT_PORTS[next]));
    }
    setSecurity(next);
  };

  const save = async (update: PlatformSettingsUpdate, done: string) => {
    setIsSaving(true);
    try {
      onSaved(await platformService.updateSettings(update));
      toast({ title: done });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save the settings', description: describeError(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (host.trim() === '') {
      await save({ smtpHost: '', senderAddress: sender.trim() }, 'Settings saved');
      return;
    }

    const portNumber = Number.parseInt(port, 10);
    if (Number.isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      toast({ variant: 'destructive', title: 'Enter a port between 1 and 65535' });
      return;
    }

    await save(
      {
        smtpHost: host.trim(),
        smtpSecurity: security,
        smtpPort: portNumber,
        smtpUsername: username.trim(),
        senderAddress: sender.trim(),
        ...(password !== '' ? { smtpPassword: password } : {}),
      },
      'Settings saved',
    );
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await platformService.sendTestEmail();
      if (result.sent) {
        toast({ title: 'Test email sent', description: `Check the inbox of ${result.recipient}.` });
      } else {
        toast({ variant: 'destructive', title: 'Failed to send the test email', description: result.error ?? undefined });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to send the test email', description: describeError(error) });
    } finally {
      setIsTesting(false);
    }
  };

  const testButton = (
    <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting || isDirty || !settings.mailConfigured}>
      {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Send Test Email
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 shrink-0" />
          Outgoing Email
        </CardTitle>
        <CardDescription>Optional SMTP server for the weekly overview and sign-in alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {legacy ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {settings.mailConfigured ? 'Enabled' : 'Disabled'} by <code className="font-mono text-xs">MAILER_DSN</code> in{' '}
              <code className="font-mono text-xs">.env</code>. Sender: {settings.effectiveSenderAddress}.
            </p>
            {testButton}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {settings.smtpPasswordUnreadable && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Password unreadable</AlertTitle>
                <AlertDescription>It was encrypted with a different APP_ENCRYPTION_KEY. Enter it again.</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Server</Label>
                <Input
                  id="smtp-host"
                  value={host}
                  onChange={(event) => setHost(event.target.value)}
                  placeholder="smtp.example.com"
                  autoComplete="off"
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={65535}
                  value={port}
                  onChange={(event) => setPort(event.target.value)}
                  disabled={host.trim() === ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-security">Encryption</Label>
              <Select value={security} onValueChange={handleSecurityChange} disabled={host.trim() === ''}>
                <SelectTrigger id="smtp-security">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SECURITY_LABELS) as SmtpSecurity[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {SECURITY_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {security === 'none' && host.trim() !== '' && (
                <p className="text-sm text-muted-foreground">Credentials and messages are sent unencrypted.</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-username">Username</Label>
                <Input
                  id="smtp-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="off"
                  maxLength={255}
                  disabled={host.trim() === ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={settings.smtpPasswordSet && !settings.smtpPasswordUnreadable ? 'Leave empty to keep the current password' : ''}
                  autoComplete="new-password"
                  maxLength={1024}
                  disabled={host.trim() === ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender-address">Sender Address</Label>
              <Input
                id="sender-address"
                type="email"
                value={sender}
                onChange={(event) => setSender(event.target.value)}
                placeholder={settings.defaultSenderAddress}
                maxLength={255}
              />
              <p className="text-sm text-muted-foreground">Defaults to {settings.defaultSenderAddress}.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving || !isDirty}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              {isDirty && (
                <Button type="button" variant="ghost" onClick={reset} disabled={isSaving}>
                  Discard Changes
                </Button>
              )}
              {testButton}
              {settings.smtpPasswordSet && !isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => save({ smtpPassword: '' }, 'Password removed')}
                  disabled={isSaving}
                >
                  Remove Password
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              The test email is sent to {user?.email ?? 'your address'} using the saved settings.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function IntakeSection({ settings, onSaved }: SectionProps) {
  if (settings.mode === 'legacy') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 shrink-0" />
            Report Intake
          </CardTitle>
          <CardDescription>Mailboxes and the API require APP_ENCRYPTION_KEY</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Webhook {settings.webhookEnabled ? 'enabled' : 'disabled'} by{' '}
            <code className="font-mono text-xs">APP_INBOUND_REPORT_EMAIL_WEBHOOK_SECRET</code> in{' '}
            <code className="font-mono text-xs">.env</code>. Run the installer to generate{' '}
            <code className="font-mono text-xs">APP_ENCRYPTION_KEY</code> and manage report intake here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <MailboxesCard />
      <ApiIntakeCard settings={settings} onSaved={onSaved} />
    </div>
  );
}

const TABS = ['general', 'intake', 'email'] as const;
type Tab = (typeof TABS)[number];

export default function PlatformPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab: Tab = TABS.includes(requestedTab as Tab) ? (requestedTab as Tab) : 'general';
  const [settings, setStoredSettings] = useState<PlatformSettingsApi | null>(null);
  // Every date on screen reads the time zone from the query cache.
  const setSettings = useCallback(
    (next: PlatformSettingsApi) => {
      setStoredSettings(next);
      queryClient.setQueryData(PLATFORM_SETTINGS_QUERY_KEY, next);
    },
    [queryClient],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setSettings(await platformService.getSettings());
    } catch (error) {
      setLoadError(describeError(error));
    } finally {
      setIsLoading(false);
    }
  }, [setSettings]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Platform</h1>
        <p className="text-muted-foreground">Manage installation-wide settings</p>
      </div>

      {isLoading ? (
        <PlatformPageSkeleton />
      ) : loadError || !settings ? (
        <LoadError message={loadError ?? 'The settings could not be loaded.'} onRetry={load} />
      ) : (
        <>
          {settings.mode === 'legacy' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Settings are read from .env</AlertTitle>
              <AlertDescription>
                Run the installer to finish the upgrade. It generates <code className="font-mono text-xs">APP_ENCRYPTION_KEY</code>{' '}
                and moves these settings into the database.
              </AlertDescription>
            </Alert>
          )}

          {settings.unusedEnvironment.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Unused .env settings</AlertTitle>
              <AlertDescription>
                These are stored in the database now and can be removed from{' '}
                <code className="font-mono text-xs">.env</code>:{' '}
                {settings.unusedEnvironment.map((name, index) => (
                  <span key={name}>
                    {index > 0 && ', '}
                    <code className="font-mono text-xs">{name}</code>
                  </span>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            value={tab}
            onValueChange={(value) => setSearchParams(value === 'general' ? {} : { tab: value }, { replace: true })}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="intake">Report Intake</TabsTrigger>
              <TabsTrigger value="email">Outgoing Email</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <GeneralSection settings={settings} onSaved={setSettings} />
            </TabsContent>
            <TabsContent value="intake">
              <IntakeSection settings={settings} onSaved={setSettings} />
            </TabsContent>
            <TabsContent value="email">
              <EmailSection settings={settings} onSaved={setSettings} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
