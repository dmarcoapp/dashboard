import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
import { describeError } from '@/lib/api-errors';
import { AlertTriangle, Inbox, Info, Loader2, Mail, Send, SlidersHorizontal } from 'lucide-react';
import type { PlatformSettingsApi, PlatformSettingsUpdate, SmtpSecurity } from '@/types/api';

const DEFAULT_PORTS: Record<SmtpSecurity, number> = { starttls: 587, tls: 465, none: 25 };

const SECURITY_LABELS: Record<SmtpSecurity, string> = {
  starttls: 'STARTTLS, usually port 587',
  tls: 'TLS, usually port 465',
  none: 'None, for a relay on the same network',
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRetention(String(settings.reportRetentionDays));
    setIpLookupEnabled(settings.ipLookupEnabled);
  }, [settings.reportRetentionDays, settings.ipLookupEnabled]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const days = Number.parseInt(retention, 10);
    if (Number.isNaN(days) || days < 0 || days > 3650) {
      toast({ variant: 'destructive', title: 'Enter a number of days between 0 and 3650' });
      return;
    }

    setIsSaving(true);
    try {
      onSaved(await platformService.updateSettings({ reportRetentionDays: days, ipLookupEnabled }));
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
        <CardDescription>How long reports are kept, and what DMARCo looks up about them.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-retention">Keep reports for</Label>
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
            <p className="text-sm text-muted-foreground">0 keeps every report for good.</p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <div className="space-y-1">
              <Label htmlFor="ip-lookup" className="text-base">Look up sending IP addresses</Label>
              <p className="text-sm text-muted-foreground">
                Shows who owns each address that sends mail as your domains, and where it is. The addresses go to
                ipwho.is and to the regional internet registries. Nothing else from your reports does.
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
            <Button type="submit" disabled={isSaving}>
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
        toast({ variant: 'destructive', title: 'The test email was not sent', description: result.error ?? undefined });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'The test email was not sent', description: describeError(error) });
    } finally {
      setIsTesting(false);
    }
  };

  const testButton = (
    <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting || isDirty || !settings.mailConfigured}>
      {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Send a test email
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 shrink-0" />
          Outgoing email
        </CardTitle>
        <CardDescription>
          Optional. With a mail server set, DMARCo emails you the weekly overview and an alert when someone signs in
          from somewhere new. Without one it sends nothing, and everything else works the same.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {legacy ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Outgoing mail is {settings.mailConfigured ? 'on' : 'off'}, set by <code className="font-mono text-xs">MAILER_DSN</code>{' '}
              in the server's <code className="font-mono text-xs">.env</code>. It is sent from {settings.effectiveSenderAddress}.
            </p>
            {testButton}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {settings.smtpPasswordUnreadable && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Enter the password again</AlertTitle>
                <AlertDescription>
                  The stored password was encrypted with another APP_ENCRYPTION_KEY, so it cannot be read with this one.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP server</Label>
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
                <p className="text-sm text-muted-foreground">The password and every email travel unencrypted.</p>
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
                  placeholder={settings.smtpPasswordSet && !settings.smtpPasswordUnreadable ? 'Stored, leave empty to keep it' : ''}
                  autoComplete="new-password"
                  maxLength={1024}
                  disabled={host.trim() === ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender-address">Sender address</Label>
              <Input
                id="sender-address"
                type="email"
                value={sender}
                onChange={(event) => setSender(event.target.value)}
                placeholder={settings.defaultSenderAddress}
                maxLength={255}
              />
              <p className="text-sm text-muted-foreground">Left empty, emails come from {settings.defaultSenderAddress}.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving || !isDirty}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              {isDirty && (
                <Button type="button" variant="ghost" onClick={reset} disabled={isSaving}>
                  Discard changes
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
                  Remove the password
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              The test email goes to {user?.email ?? 'your address'}, through the saved settings.
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
            Report intake
          </CardTitle>
          <CardDescription>Mailboxes and API keys need the key that DMARCo encrypts passwords with.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Reports come in through the mail gateway, which is {settings.apiIntakeEnabled ? 'on' : 'off'}, set by{' '}
            <code className="font-mono text-xs">APP_INBOUND_REPORT_EMAIL_WEBHOOK_SECRET</code> in the server's{' '}
            <code className="font-mono text-xs">.env</code>. Once the installer has generated{' '}
            <code className="font-mono text-xs">APP_ENCRYPTION_KEY</code>, mailboxes and API keys are set up here.
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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab: Tab = TABS.includes(requestedTab as Tab) ? (requestedTab as Tab) : 'general';
  const [settings, setSettings] = useState<PlatformSettingsApi | null>(null);
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Platform</h1>
        <p className="text-muted-foreground">Settings of this DMARCo installation</p>
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
              <AlertTitle>The settings still come from the server's .env</AlertTitle>
              <AlertDescription>
                Run the installer again on the server to finish the upgrade. It generates the key DMARCo encrypts
                passwords with, moves these settings here, and removes them from <code className="font-mono text-xs">.env</code>.
              </AlertDescription>
            </Alert>
          )}

          {settings.unusedEnvironment.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Some lines of .env are no longer read</AlertTitle>
              <AlertDescription>
                These settings are kept here now, so the lines can go from the server's{' '}
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
              <TabsTrigger value="intake">Report intake</TabsTrigger>
              <TabsTrigger value="email">Outgoing email</TabsTrigger>
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
