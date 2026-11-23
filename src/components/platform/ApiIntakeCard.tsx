import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, KeyRound, Loader2, Plus, Trash2, Upload, Webhook } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Badge } from '@/components/ui/badge';
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
import type { ApiIntakeKeyApi, PlatformSettingsApi, PlatformSettingsUpdate } from '@/types/api';

interface SectionProps {
  settings: PlatformSettingsApi;
  onSaved: (settings: PlatformSettingsApi) => void;
}

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Input value={value} readOnly aria-label={label} className="bg-muted pr-10 font-mono text-xs" />
      <Button type="button" variant="ghost" size="icon" onClick={handleCopy} className="absolute right-0 top-0 h-full" aria-label={`Copy ${label}`}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function Example({ children }: { children: string }) {
  return (
    <div className="space-y-2">
      <Label>Example</Label>
      <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{children}</pre>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  id,
  checked,
  disabled,
  onCheckedChange,
}: {
  icon: typeof Upload;
  title: string;
  description: string;
  id: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={`Toggle ${title}`} />
    </div>
  );
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
      setError('Enter a name.');
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
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>Keys can only upload reports.</DialogDescription>
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
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeys() {
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
      toast({ title: 'API key revoked' });
      setRevoking(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to revoke the API key', description: describeError(error) });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>API Keys</Label>
      {loadError ? (
        <LoadError message={loadError} onRetry={load} />
      ) : keys === null ? (
        <Skeleton className="h-16 w-full" />
      ) : keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No API keys yet. Uploads are refused without one.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {keys.map((key) => (
            <li key={key.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{key.name}</p>
                <p className="break-all font-mono text-xs text-muted-foreground">{key.preview}</p>
                <p className="text-xs text-muted-foreground">
                  Created <DateTimeDisplay date={key.createdAt} showTimezone={false} />
                  {' · '}
                  {key.lastUsedAt ? (
                    <>
                      Last used <DateTimeDisplay date={key.lastUsedAt} showTimezone={false} />
                    </>
                  ) : (
                    'Never used'
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
        <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      )}

      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
      <OneTimeSecretDialog
        title="API Key Created"
        description="Copy the key now. It is stored as a hash and cannot be shown again."
        secret={newToken}
        onClose={() => setNewToken(null)}
      />

      <AlertDialog open={revoking !== null} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {revoking?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Uploads with this key will be refused. Reports already received are kept.</AlertDialogDescription>
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

function UploadEndpoint({ endpoint }: { endpoint: string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Endpoint</Label>
        <CopyField value={endpoint} label="upload endpoint" />
        <p className="text-sm text-muted-foreground">
          XML, gzip, or zip, up to 10 MB. Responds 202 when stored, 200 for a duplicate, and 422 for an invalid report.
        </p>
      </div>
      <Example>{`curl -X POST ${endpoint} \\
  -H "Authorization: Bearer <api key>" \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary @report.xml.gz`}</Example>
      <ApiKeys />
    </div>
  );
}

function WebhookSettings({ settings, onSaved, endpoint }: SectionProps & { endpoint: string }) {
  const { toast } = useToast();
  const [domain, setDomain] = useState(settings.reportAddressDomain ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'rotate' | 'remove' | null>(null);
  const [isChangingSecret, setIsChangingSecret] = useState(false);

  useEffect(() => setDomain(settings.reportAddressDomain ?? ''), [settings.reportAddressDomain]);

  const isDirty = domain.trim().toLowerCase() !== (settings.reportAddressDomain ?? '');

  const handleSaveDomain = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      onSaved(await platformService.updateSettings({ reportAddressDomain: domain.trim() }));
      toast({ title: 'Report domain saved' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save the report domain', description: describeError(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const refreshSettings = async () => onSaved(await platformService.getSettings());

  const generateSecret = async () => {
    setIsChangingSecret(true);
    try {
      setNewSecret(await intakeService.createWebhookSecret());
      setConfirm(null);
      await refreshSettings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to generate a secret', description: describeError(error) });
    } finally {
      setIsChangingSecret(false);
    }
  };

  const removeSecret = async () => {
    setIsChangingSecret(true);
    try {
      await intakeService.removeWebhookSecret();
      setConfirm(null);
      await refreshSettings();
      toast({ title: 'Webhook secret removed' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to remove the secret', description: describeError(error) });
    } finally {
      setIsChangingSecret(false);
    }
  };

  return (
    <div className="space-y-4">
      {!settings.webhookSecretSet && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No secret is set. The webhook responds 503 until one is generated.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Endpoint</Label>
        <CopyField value={endpoint} label="webhook endpoint" />
      </div>

      <form onSubmit={handleSaveDomain} className="space-y-2">
        <Label htmlFor="report-address-domain">Report Domain</Label>
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
        <p className="text-sm text-muted-foreground">The domain the gateway receives reports for.</p>
      </form>

      {settings.reportAddress && (
        <div className="space-y-2">
          <Label>Reporting URI</Label>
          <CopyField value={`mailto:${settings.reportAddress}`} label="reporting URI" />
          <p className="text-sm text-muted-foreground">Use as the rua tag of your DMARC records.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Webhook Secret</Label>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
          <Badge variant={settings.webhookSecretSet ? 'secondary' : 'destructive'}>{settings.webhookSecretSet ? 'Configured' : 'Not configured'}</Badge>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => (settings.webhookSecretSet ? setConfirm('rotate') : generateSecret())}
              disabled={isChangingSecret}
            >
              {isChangingSecret && confirm === null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {settings.webhookSecretSet ? 'Rotate' : 'Generate'}
            </Button>
            {settings.webhookSecretSet && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm('remove')} disabled={isChangingSecret} className="text-destructive hover:text-destructive">
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <Example>{`POST ${endpoint}
X-Timestamp: <unix time>
X-Signature: sha256=<HMAC-SHA256(timestamp + "." + body, secret)>

{"from": "...", "to": ["${settings.reportAddress ?? '<report address>'}"], "attachments": [...]}`}</Example>

      <OneTimeSecretDialog
        title="Webhook Secret Generated"
        description="Copy the secret now and set it as the gateway's WEBHOOK_SECRET. It cannot be shown again."
        secret={newSecret}
        onClose={() => setNewSecret(null)}
      />

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'remove' ? 'Remove the webhook secret?' : 'Rotate the webhook secret?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'remove'
                ? 'The webhook responds 503 until a new secret is generated.'
                : 'The current secret stops working immediately. Update the gateway with the new one.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChangingSecret}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (confirm === 'remove') removeSecret();
                else generateSecret();
              }}
              disabled={isChangingSecret}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isChangingSecret ? 'Working...' : confirm === 'remove' ? 'Remove' : 'Rotate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ApiIntakeCard({ settings, onSaved }: SectionProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState<keyof PlatformSettingsUpdate | null>(null);
  const uploadEndpoint = absoluteApiUrl(API_BASE_URL, API_ENDPOINTS.intakeReports);
  const webhookEndpoint = absoluteApiUrl(API_BASE_URL, API_ENDPOINTS.intakeWebhook);

  const toggle = async (field: 'apiIntakeEnabled' | 'uploadEndpointEnabled' | 'webhookEnabled', enabled: boolean) => {
    setSaving(field);
    try {
      onSaved(await platformService.updateSettings({ [field]: enabled }));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save the settings', description: describeError(error) });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 shrink-0" />
            API
          </span>
          <Switch
            checked={settings.apiIntakeEnabled}
            onCheckedChange={(checked) => toggle('apiIntakeEnabled', checked)}
            disabled={saving !== null}
            aria-label="Toggle API intake"
          />
        </CardTitle>
        <CardDescription>Receive reports over HTTP, in addition to mailboxes.</CardDescription>
      </CardHeader>
      {settings.apiIntakeEnabled && (
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <SectionHeader
              icon={Upload}
              id="upload-endpoint"
              title="Upload Endpoint"
              description="Report files uploaded with an API key."
              checked={settings.uploadEndpointEnabled}
              disabled={saving !== null}
              onCheckedChange={(checked) => toggle('uploadEndpointEnabled', checked)}
            />
            {settings.uploadEndpointEnabled && <UploadEndpoint endpoint={uploadEndpoint} />}
          </div>

          <Separator />

          <div className="space-y-4">
            <SectionHeader
              icon={Webhook}
              id="webhook"
              title="Webhook"
              description="Signed reports from a mail gateway such as dmarcoapp/mail-inbound."
              checked={settings.webhookEnabled}
              disabled={saving !== null}
              onCheckedChange={(checked) => toggle('webhookEnabled', checked)}
            />
            {settings.webhookEnabled && <WebhookSettings settings={settings} onSaved={onSaved} endpoint={webhookEndpoint} />}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
