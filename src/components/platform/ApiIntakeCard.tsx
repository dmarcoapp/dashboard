import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2, Plus, Server, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimeDisplay } from '@/components/ui/datetime-display';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { LoadError } from '@/components/LoadError';
import { OneTimeSecretDialog } from '@/components/platform/OneTimeSecretDialog';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api-config';
import { absoluteApiUrl, describeError } from '@/lib/api-errors';
import { intakeService } from '@/services/intake-service';
import { platformService } from '@/services/platform-service';
import type { ApiIntakeKeyApi, PlatformSettingsApi } from '@/types/api';

interface ApiIntakeCardProps {
  settings: PlatformSettingsApi;
  onSaved: (settings: PlatformSettingsApi) => void;
}

function CreateKeyDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: (key: ApiIntakeKeyApi) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim() === '') {
      setError('Give the key a name, such as the server that will use it.');
      return;
    }
    setIsSaving(true);
    try {
      onCreated(await intakeService.createKey(name.trim()));
      onOpenChange(false);
    } catch (createError) {
      setError(describeError(createError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create an API key</DialogTitle>
          <DialogDescription>A key can upload reports and nothing else. Make one for each place that sends them.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="api-key-name">Name</Label>
            <Input
              id="api-key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Backup mail server"
              maxLength={100}
              autoComplete="off"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create the key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeys({ endpoint }: { endpoint: string }) {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiIntakeKeyApi[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ApiIntakeKeyApi | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setKeys(await intakeService.getKeys());
    } catch (error) {
      setLoadError(describeError(error));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = (key: ApiIntakeKeyApi) => {
    setKeys((current) => [...(current ?? []), { ...key, token: null }]);
    setNewToken(key.token);
  };

  const handleRevoke = async () => {
    if (!revoking) return;
    setIsRevoking(true);
    try {
      await intakeService.revokeKey(revoking.id);
      setKeys((current) => (current ?? []).filter((key) => key.id !== revoking.id));
      toast({ title: 'Key revoked' });
      setRevoking(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'The key was not revoked', description: describeError(error) });
    } finally {
      setIsRevoking(false);
    }
  };

  const curl = `curl --fail -X POST \\
  -H "Authorization: Bearer $DMARCO_API_KEY" \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary @report.xml.gz \\
  ${endpoint}`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Uploads</h3>
        <p className="text-sm text-muted-foreground">
          Send each report file, as XML or the gzip or zip it came in, up to 10 MB, to:
        </p>
        <code className="block break-all rounded bg-muted p-2 font-mono text-xs">POST {endpoint}</code>
        <pre className="overflow-x-auto rounded bg-muted p-3 font-mono text-xs">{curl}</pre>
        <p className="text-sm text-muted-foreground">
          The answer is 202 when the report is stored, 200 when it was stored before, and 422 with the reason when the
          file is not a report.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">API keys</h3>
        {loadError ? (
          <LoadError message={loadError} onRetry={load} />
        ) : keys === null ? (
          <Skeleton className="h-16 w-full" />
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No keys yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {keys.map((key) => (
              <li key={key.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{key.name}</p>
                  <p className="break-all font-mono text-xs text-muted-foreground">{key.preview}</p>
                  <p className="text-xs text-muted-foreground">
                    Created <DateTimeDisplay date={key.createdAt} showTimezone={false} />
                    {', '}
                    {key.lastUsedAt ? (
                      <>
                        last used <DateTimeDisplay date={key.lastUsedAt} showTimezone={false} />
                      </>
                    ) : (
                      'never used'
                    )}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setRevoking(key)} className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
        {keys !== null && (
          <Button type="button" variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create an API key
          </Button>
        )}
      </div>

      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
      <OneTimeSecretDialog
        title="Copy the API key now"
        description="Only a hash of it is kept, so it cannot be shown again. Lost, it can only be revoked and replaced."
        secret={newToken}
        onClose={() => setNewToken(null)}
      />

      <AlertDialog open={revoking !== null} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {revoking?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Uploads with this key are refused from now on. The reports it sent stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleRevoke();
              }}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? 'Revoking...' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MailGateway({ settings, onSaved }: ApiIntakeCardProps) {
  const { toast } = useToast();
  const [domain, setDomain] = useState(settings.reportAddressDomain ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'replace' | 'remove' | null>(null);
  const [isChangingSecret, setIsChangingSecret] = useState(false);

  useEffect(() => setDomain(settings.reportAddressDomain ?? ''), [settings.reportAddressDomain]);

  const isDirty = domain.trim().toLowerCase() !== (settings.reportAddressDomain ?? '');

  const handleSaveDomain = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      onSaved(await platformService.updateSettings({ reportAddressDomain: domain.trim() }));
      toast({ title: 'Report address domain saved' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save the domain', description: describeError(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const refreshSettings = async () => onSaved(await platformService.getSettings());

  const createSecret = async () => {
    setIsChangingSecret(true);
    try {
      setNewSecret(await intakeService.createGatewaySecret());
      setConfirm(null);
      await refreshSettings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'No secret was made', description: describeError(error) });
    } finally {
      setIsChangingSecret(false);
    }
  };

  const removeSecret = async () => {
    setIsChangingSecret(true);
    try {
      await intakeService.removeGatewaySecret();
      setConfirm(null);
      await refreshSettings();
      toast({ title: 'Gateway secret removed', description: 'The gateway webhook is off.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'The secret was not removed', description: describeError(error) });
    } finally {
      setIsChangingSecret(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Server className="h-4 w-4" />
          Mail gateway
        </h3>
        <p className="text-sm text-muted-foreground">
          Only for a mail server of your own, such as dmarcoapp/mail-inbound, that receives reports and posts them here
          with a signed webhook. Mailboxes and uploads need none of this.
        </p>
      </div>

      <form onSubmit={handleSaveDomain} className="space-y-2">
        <Label htmlFor="report-address-domain">Report address domain</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="report-address-domain"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="reports.example.com"
            maxLength={255}
            autoComplete="off"
            className="min-w-0 flex-1"
          />
          <Button type="submit" variant="outline" disabled={isSaving || !isDirty}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {settings.reportAddress ? (
            <>
              The gateway's report address is <span className="break-all font-mono text-xs">{settings.reportAddress}</span>.
            </>
          ) : (
            'The domain whose mail the gateway receives.'
          )}
        </p>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Webhook secret</p>
          <p className="text-sm text-muted-foreground">
            {settings.gatewaySecretSet
              ? 'Set. The gateway signs each webhook with it.'
              : 'Not set, so the gateway webhook is off.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (settings.gatewaySecretSet ? setConfirm('replace') : createSecret())}
            disabled={isChangingSecret}
          >
            {isChangingSecret && confirm === null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {settings.gatewaySecretSet ? 'Make a new secret' : 'Make a secret'}
          </Button>
          {settings.gatewaySecretSet && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm('remove')} disabled={isChangingSecret} className="text-destructive hover:text-destructive">
              Remove
            </Button>
          )}
        </div>
      </div>

      <OneTimeSecretDialog
        title="Copy the webhook secret now"
        description="Set it as the gateway's WEBHOOK_SECRET. It is stored encrypted and not shown again."
        secret={newSecret}
        onClose={() => setNewSecret(null)}
      />

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'remove' ? 'Remove the webhook secret?' : 'Make a new webhook secret?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'remove'
                ? 'The gateway webhook turns off, and the gateway cannot deliver reports until a new secret is set on both sides.'
                : 'The current secret stops working at once. Reports from the gateway are refused until it has the new one.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChangingSecret}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (confirm === 'remove') removeSecret();
                else createSecret();
              }}
              disabled={isChangingSecret}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isChangingSecret ? 'Working...' : confirm === 'remove' ? 'Remove' : 'Make a new secret'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ApiIntakeCard({ settings, onSaved }: ApiIntakeCardProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const endpoint = absoluteApiUrl(API_BASE_URL, API_ENDPOINTS.intakeReports);

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      onSaved(await platformService.updateSettings({ apiIntakeEnabled: enabled }));
      toast({ title: enabled ? 'Report intake through the API is on' : 'Report intake through the API is off' });
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
          <KeyRound className="h-5 w-5 shrink-0" />
          API
        </CardTitle>
        <CardDescription>
          Optional. Reports uploaded with an API key, and reports from a mail gateway. While this is off, uploads are
          refused, and a gateway keeps its reports to send them again later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <Label htmlFor="api-intake" className="text-base">Take reports through the API</Label>
            <p className="text-sm text-muted-foreground">Mailboxes are read either way.</p>
          </div>
          <Switch
            id="api-intake"
            checked={settings.apiIntakeEnabled}
            onCheckedChange={handleToggle}
            disabled={isSaving}
            aria-label="Toggle report intake through the API"
          />
        </div>

        {settings.apiIntakeEnabled && (
          <>
            <ApiKeys endpoint={endpoint} />
            <Separator />
            <MailGateway settings={settings} onSaved={onSaved} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
