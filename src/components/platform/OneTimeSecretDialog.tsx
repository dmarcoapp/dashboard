import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OneTimeSecretDialogProps {
  title: string;
  description: string;
  secret: string | null;
  onClose: () => void;
  children?: React.ReactNode;
}

// A key or a secret the backend hands out once and keeps only as a hash or
// encrypted, so this is the one chance to copy it.
export function OneTimeSecretDialog({ title, description, secret, onClose, children }: OneTimeSecretDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={secret !== null}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <code className="block break-all rounded border-2 border-muted-foreground/50 bg-muted p-3 pr-12 font-mono text-xs">
            {secret}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            aria-label="Copy"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        {children}
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
