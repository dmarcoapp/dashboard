import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { describeError } from '@/lib/api-errors';
import { AFTER_IMPORT_LABELS } from '@/lib/mailbox-options';
import { intakeService } from '@/services/intake-service';
import type { MailboxAfterImport, MailboxApi, MailboxInput, MailboxSecurity } from '@/types/api';

const DEFAULT_PORTS: Record<MailboxSecurity, number> = { tls: 993, starttls: 143 };

const SECURITY_LABELS: Record<MailboxSecurity, string> = {
  tls: 'TLS, usually port 993',
  starttls: 'STARTTLS, usually port 143',
};

interface MailboxDialogProps {
  // The mailbox to change, or null to add one.
  mailbox: MailboxApi | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (mailbox: MailboxApi) => void;
}

interface FormState {
  name: string;
  host: string;
  security: MailboxSecurity;
  port: string;
  username: string;
  password: string;
  folder: string;
  reportAddress: string;
  afterImport: MailboxAfterImport;
  moveToFolder: string;
  enabled: boolean;
  pollIntervalMinutes: string;
  firstImportDays: string;
}

const initialState = (mailbox: MailboxApi | null): FormState => ({
  name: mailbox?.name ?? '',
  host: mailbox?.host ?? '',
  security: mailbox?.security ?? 'tls',
  port: String(mailbox?.port ?? DEFAULT_PORTS.tls),
  username: mailbox?.username ?? '',
  password: '',
  folder: mailbox?.folder ?? 'INBOX',
  reportAddress: mailbox?.reportAddress ?? '',
  afterImport: mailbox?.afterImport ?? 'mark_seen',
  moveToFolder: mailbox?.moveToFolder ?? '',
  enabled: mailbox?.enabled ?? true,
  pollIntervalMinutes: String(mailbox?.pollIntervalMinutes ?? 15),
  firstImportDays: String(mailbox?.firstImportDays ?? 30),
});

const parseInteger = (value: string, min: number, max: number): number | null => {
  if (!/^\d+$/.test(value.trim())) return null;
  const number = Number.parseInt(value, 10);
  return number >= min && number <= max ? number : null;
};

export function MailboxDialog({ mailbox, open, onOpenChange, onSaved }: MailboxDialogProps) {
  const [form, setForm] = useState<FormState>(() => initialState(mailbox));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialState(mailbox));
      setError(null);
    }
  }, [open, mailbox]);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  // A port nobody chose follows the kind of security.
  const handleSecurityChange = (value: string) => {
    const next = value as MailboxSecurity;
    setForm((current) => ({
      ...current,
      security: next,
      port: current.port === '' || current.port === String(DEFAULT_PORTS[current.security]) ? String(DEFAULT_PORTS[next]) : current.port,
    }));
  };

  const validate = (): MailboxInput | string => {
    if (form.name.trim() === '') return 'Give the mailbox a name.';
    if (form.host.trim() === '') return 'Enter the IMAP server.';
    if (form.username.trim() === '') return 'Enter the username.';
    if (mailbox === null && form.password === '') return 'Enter the password.';
    if (/[\r\n]/.test(form.password)) return 'A password cannot hold a line break.';
    const port = parseInteger(form.port, 1, 65535);
    if (port === null) return 'Enter a port between 1 and 65535.';
    const interval = parseInteger(form.pollIntervalMinutes, 5, 1440);
    if (interval === null) return 'Read the mailbox every 5 to 1440 minutes.';
    const firstImportDays = parseInteger(form.firstImportDays, 0, 365);
    if (firstImportDays === null) return 'Go back 0 to 365 days on the first read.';
    const folder = form.folder.trim() || 'INBOX';
    if (/[*%]/.test(folder)) return 'A folder name cannot hold * or %.';
    if (form.afterImport === 'move') {
      const target = form.moveToFolder.trim();
      if (target === '') return 'Name the folder to move reports to.';
      if (/[*%]/.test(target)) return 'A folder name cannot hold * or %.';
      if (target === folder) return 'Reports cannot be moved to the folder they are read from.';
    }

    return {
      name: form.name.trim(),
      host: form.host.trim(),
      security: form.security,
      port,
      username: form.username.trim(),
      ...(form.password !== '' ? { password: form.password } : {}),
      folder,
      reportAddress: form.reportAddress.trim(),
      afterImport: form.afterImport,
      ...(form.afterImport === 'move' ? { moveToFolder: form.moveToFolder.trim() } : {}),
      enabled: form.enabled,
      pollIntervalMinutes: interval,
      firstImportDays,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const input = validate();
    if (typeof input === 'string') {
      setError(input);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const saved = mailbox ? await intakeService.updateMailbox(mailbox.id, input) : await intakeService.createMailbox(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (saveError) {
      setError(describeError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mailbox ? `Edit ${mailbox.name}` : 'Add a mailbox'}</DialogTitle>
          <DialogDescription>
            DMARCo reads the mailbox over IMAP and stores the reports it finds. Other mail stays as it is.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {mailbox?.passwordUnreadable && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The stored password was encrypted with another APP_ENCRYPTION_KEY. Enter it again.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="mailbox-name">Name</Label>
            <Input
              id="mailbox-name"
              value={form.name}
              onChange={(event) => set('name', event.target.value)}
              placeholder="DMARC reports"
              maxLength={100}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div className="space-y-2">
              <Label htmlFor="mailbox-host">IMAP server</Label>
              <Input
                id="mailbox-host"
                value={form.host}
                onChange={(event) => set('host', event.target.value)}
                placeholder="imap.example.com"
                maxLength={255}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailbox-port">Port</Label>
              <Input
                id="mailbox-port"
                type="number"
                inputMode="numeric"
                min={1}
                max={65535}
                value={form.port}
                onChange={(event) => set('port', event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mailbox-security">Encryption</Label>
            <Select value={form.security} onValueChange={handleSecurityChange}>
              <SelectTrigger id="mailbox-security">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SECURITY_LABELS) as MailboxSecurity[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {SECURITY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The server's certificate is always checked. There is no unencrypted option.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mailbox-username">Username</Label>
              <Input
                id="mailbox-username"
                value={form.username}
                onChange={(event) => set('username', event.target.value)}
                maxLength={255}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailbox-password">Password</Label>
              <Input
                id="mailbox-password"
                type="password"
                value={form.password}
                onChange={(event) => set('password', event.target.value)}
                placeholder={mailbox && !mailbox.passwordUnreadable ? 'Stored, leave empty to keep it' : ''}
                maxLength={1024}
                autoComplete="new-password"
              />
            </div>
          </div>
          <p className="-mt-2 text-sm text-muted-foreground">
            An app password, if the provider offers one. It is stored encrypted and never shown again.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mailbox-folder">Folder</Label>
              <Input
                id="mailbox-folder"
                value={form.folder}
                onChange={(event) => set('folder', event.target.value)}
                placeholder="INBOX"
                maxLength={255}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailbox-report-address">Report address (optional)</Label>
              <Input
                id="mailbox-report-address"
                type="email"
                value={form.reportAddress}
                onChange={(event) => set('reportAddress', event.target.value)}
                placeholder="dmarc@example.com"
                maxLength={255}
                autoComplete="off"
              />
            </div>
          </div>
          <p className="-mt-2 text-sm text-muted-foreground">
            The address that DMARC records send reports to, if it lands in this mailbox. It is offered when you add a
            domain.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mailbox-after-import">Once a report is stored</Label>
              <Select value={form.afterImport} onValueChange={(value) => set('afterImport', value as MailboxAfterImport)}>
                <SelectTrigger id="mailbox-after-import">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AFTER_IMPORT_LABELS) as MailboxAfterImport[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {AFTER_IMPORT_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.afterImport === 'move' && (
              <div className="space-y-2">
                <Label htmlFor="mailbox-move-to">Move to folder</Label>
                <Input
                  id="mailbox-move-to"
                  value={form.moveToFolder}
                  onChange={(event) => set('moveToFolder', event.target.value)}
                  placeholder="Processed"
                  maxLength={255}
                  autoComplete="off"
                />
              </div>
            )}
          </div>
          {form.afterImport === 'delete' && (
            <p className="-mt-2 text-sm text-muted-foreground">
              DMARCo never expunges, so the mail client or the server removes the message later.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mailbox-interval">Read every</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="mailbox-interval"
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={1440}
                  value={form.pollIntervalMinutes}
                  onChange={(event) => set('pollIntervalMinutes', event.target.value)}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailbox-first-import">On the first read, go back</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="mailbox-first-import"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={365}
                  value={form.firstImportDays}
                  onChange={(event) => set('firstImportDays', event.target.value)}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">days, 0 for all mail</span>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <div className="space-y-1">
              <Label htmlFor="mailbox-enabled" className="text-base">Read this mailbox</Label>
              <p className="text-sm text-muted-foreground">Switched off, the mailbox is kept but not read.</p>
            </div>
            <Switch
              id="mailbox-enabled"
              checked={form.enabled}
              onCheckedChange={(checked) => set('enabled', checked)}
              aria-label="Toggle reading this mailbox"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mailbox ? 'Save' : 'Add the mailbox'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
