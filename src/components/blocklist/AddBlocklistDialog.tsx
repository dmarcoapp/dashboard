import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { blocklistService } from '@/services/blocklist-service';
import { normalizeBlocklistPattern, validateBlocklistPattern } from '@/lib/blocklist-pattern';
import { ApiError } from '@/lib/api-client';
import type { BlocklistEntryApi } from '@/types/blocklist';

interface AddBlocklistDialogProps {
  onCreated?: (entry: BlocklistEntryApi) => void;
}

export function AddBlocklistDialog({ onCreated }: AddBlocklistDialogProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [pattern, setPattern] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPattern('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPattern = pattern.trim();
    const validation = validateBlocklistPattern(trimmedPattern);
    if (!validation.valid) {
      setError(validation.error || 'Invalid pattern.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const normalizedPattern = normalizeBlocklistPattern(trimmedPattern);
      const entry = await blocklistService.createBlocklistEntry({ pattern: normalizedPattern });
      setPattern('');
      setOpen(false);
      onCreated?.(entry);
    } catch (submitError) {
      console.error('Failed to create blocklist entry:', submitError);
      if (submitError instanceof ApiError) {
        setError(submitError.message || 'Failed to create blocklist entry.');
      } else {
        setError('Failed to create blocklist entry.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="blocklist-pattern">Sender pattern</Label>
        <Input
          id="blocklist-pattern"
          placeholder="*@example.com or sender@example.com"
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use * as a wildcard. The pattern must include exactly one @ and is case-insensitive.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add to blocklist'}
        </Button>
      </div>
    </form>
  );

  const triggerButton = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add to blocklist
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Add a blocklist entry</DrawerTitle>
            <DrawerDescription>
              Block sender patterns that should be ignored by DMARCo.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a blocklist entry</DialogTitle>
          <DialogDescription>
            Block sender patterns that should be ignored by DMARCo.
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
