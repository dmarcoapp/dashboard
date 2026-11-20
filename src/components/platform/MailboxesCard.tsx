import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, Loader2, Pencil, Plus, RefreshCw, ScrollText, Trash2, Wifi } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadError } from '@/components/LoadError';
import { MailboxDialog } from '@/components/platform/MailboxDialog';
import { useToast } from '@/hooks/use-toast';
import { describeError } from '@/lib/api-errors';
import { AFTER_IMPORT_SUMMARIES } from '@/lib/mailbox-options';
import { intakeService } from '@/services/intake-service';
import type { MailboxApi, MailboxLogEntryApi, MailboxTestResultApi } from '@/types/api';

function MailboxStatus({ mailbox }: { mailbox: MailboxApi }) {
  if (!mailbox.enabled) return <Badge variant="secondary">Off</Badge>;
  if (mailbox.passwordUnreadable) return <Badge variant="destructive">Password needed</Badge>;
  if (mailbox.consecutiveFailures > 0) return <Badge variant="destructive">Failing</Badge>;
  if (!mailbox.lastSuccessAt) return <Badge variant="outline">Not read yet</Badge>;
  return <Badge className="border-transparent bg-success text-success-foreground hover:bg-success/80">Working</Badge>;
}

function MailboxLogDialog({ mailbox, onClose }: { mailbox: MailboxApi | null; onClose: () => void }) {
  const [entries, setEntries] = useState<MailboxLogEntryApi[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mailbox) return;
    setEntries(null);
    setError(null);
    intakeService
      .getMailboxLog(mailbox.id)
      .then(setEntries)
      .catch((loadError) => setError(describeError(loadError)));
  }, [mailbox]);

  return (
    <Dialog open={mailbox !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log of {mailbox?.name}</DialogTitle>
          <DialogDescription>What the latest reads found and skipped, newest first.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : entries === null ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet. Entries appear once the mailbox has been read.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {entries.map((entry, index) => (
              <li key={index} className="space-y-1 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={entry.level === 'info' ? 'outline' : entry.level === 'warning' ? 'secondary' : 'destructive'}>
                    {entry.level}
                  </Badge>
                  <DateTimeDisplay date={entry.createdAt} />
                  {typeof entry.context.uid === 'number' && <span>UID {entry.context.uid}</span>}
                </div>
                <p className="break-words text-sm">{entry.message}</p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface MailboxRowProps {
  mailbox: MailboxApi;
  onEdit: () => void;
  onDelete: () => void;
  onLog: () => void;
}

function MailboxRow({ mailbox, onEdit, onDelete, onLog }: MailboxRowProps) {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [testResult, setTestResult] = useState<MailboxTestResultApi | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      setTestResult(await intakeService.testMailbox(mailbox.id));
    } catch (error) {
      setTestResult({ ok: false, error: describeError(error), messages: null, folders: [] });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePoll = async () => {
    setIsPolling(true);
    try {
      await intakeService.pollMailbox(mailbox.id);
      toast({ title: 'The mailbox will be read shortly', description: 'Its log shows what was found.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'The mailbox was not read', description: describeError(error) });
    } finally {
      setIsPolling(false);
    }
  };

  const afterImport =
    mailbox.afterImport === 'move' && mailbox.moveToFolder
      ? `Moved to ${mailbox.moveToFolder}`
      : AFTER_IMPORT_SUMMARIES[mailbox.afterImport];

  return (
    <li className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{mailbox.name}</span>
            <MailboxStatus mailbox={mailbox} />
          </div>
          <p className="break-all text-sm text-muted-foreground">
            {mailbox.username} on {mailbox.host}:{mailbox.port}, folder {mailbox.folder}
          </p>
          <p className="text-sm text-muted-foreground">
            {mailbox.reportAddress ? (
              <>
                Reports to <span className="break-all font-mono text-xs">{mailbox.reportAddress}</span>.{' '}
              </>
            ) : null}
            Read every {mailbox.pollIntervalMinutes} minutes. {afterImport} once stored.
          </p>
          <p className="text-sm text-muted-foreground">
            {mailbox.lastPolledAt ? (
              <>
                Last read <DateTimeDisplay date={mailbox.lastPolledAt} />
                {mailbox.lastSuccessAt && mailbox.consecutiveFailures > 0 && (
                  <>
                    , last worked <DateTimeDisplay date={mailbox.lastSuccessAt} />
                  </>
                )}
                .
              </>
            ) : (
              'Not read yet.'
            )}
          </p>
        </div>
      </div>

      {mailbox.lastError && mailbox.consecutiveFailures > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {mailbox.consecutiveFailures === 1 ? 'The last read failed' : `The last ${mailbox.consecutiveFailures} reads failed`}
          </AlertTitle>
          <AlertDescription className="break-words">
            {mailbox.lastError}
            {mailbox.consecutiveFailures >= 5 && ' Until a read works again, the mailbox is tried hourly.'}
          </AlertDescription>
        </Alert>
      )}

      {testResult && (
        <Alert variant={testResult.ok ? 'default' : 'destructive'}>
          {testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertTitle>{testResult.ok ? 'Signed in' : 'The test failed'}</AlertTitle>
          <AlertDescription className="break-words">
            {testResult.ok
              ? `${mailbox.folder} holds ${testResult.messages ?? 0} ${testResult.messages === 1 ? 'message' : 'messages'}.`
              : testResult.error}
            {testResult.folders.length > 0 && (
              <span className="mt-1 block text-xs">Folders: {testResult.folders.join(', ')}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={isTesting}>
          {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
          Test
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handlePoll} disabled={isPolling || !mailbox.enabled}>
          {isPolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Read now
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onLog}>
          <ScrollText className="mr-2 h-4 w-4" />
          Log
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </div>
    </li>
  );
}

export function MailboxesCard() {
  const { toast } = useToast();
  const [mailboxes, setMailboxes] = useState<MailboxApi[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MailboxApi | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<MailboxApi | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logOf, setLogOf] = useState<MailboxApi | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setMailboxes(await intakeService.getMailboxes());
    } catch (error) {
      setLoadError(describeError(error));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDialog = (mailbox: MailboxApi | null) => {
    setEditing(mailbox);
    setDialogOpen(true);
  };

  const handleSaved = (saved: MailboxApi) => {
    setMailboxes((current) => {
      const others = (current ?? []).filter((mailbox) => mailbox.id !== saved.id);
      return [...others, saved].sort((a, b) => a.name.localeCompare(b.name));
    });
    toast({ title: editing ? 'Mailbox saved' : 'Mailbox added', description: editing ? undefined : 'Test it to check the sign-in.' });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await intakeService.deleteMailbox(deleting.id);
      setMailboxes((current) => (current ?? []).filter((mailbox) => mailbox.id !== deleting.id));
      toast({ title: 'Mailbox removed' });
      setDeleting(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'The mailbox was not removed', description: describeError(error) });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5 shrink-0" />
          Mailboxes
        </CardTitle>
        <CardDescription>
          Mailboxes that DMARC reports arrive in, read over IMAP with TLS. DMARCo only touches messages with a report
          attached.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadError ? (
          <LoadError message={loadError} onRetry={load} />
        ) : mailboxes === null ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : mailboxes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No mailboxes yet. Add the one your DMARC records send reports to.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {mailboxes.map((mailbox) => (
              <MailboxRow
                key={mailbox.id}
                mailbox={mailbox}
                onEdit={() => openDialog(mailbox)}
                onDelete={() => setDeleting(mailbox)}
                onLog={() => setLogOf(mailbox)}
              />
            ))}
          </ul>
        )}

        {mailboxes !== null && (
          <Button type="button" onClick={() => openDialog(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add a mailbox
          </Button>
        )}
      </CardContent>

      <MailboxDialog mailbox={editing} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={handleSaved} />
      <MailboxLogDialog mailbox={logOf} onClose={() => setLogOf(null)} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              DMARCo stops reading it and forgets its password. The reports already stored stay, and nothing changes in
              the mailbox itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
