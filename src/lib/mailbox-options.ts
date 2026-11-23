import type { MailboxAfterImport } from '@/types/api';

// What happens to a report email once its report is stored.
export const AFTER_IMPORT_LABELS: Record<MailboxAfterImport, string> = {
  mark_seen: 'Mark as read',
  move: 'Move to folder',
  delete: 'Mark as deleted',
  leave: 'Leave unchanged',
};

export const AFTER_IMPORT_SUMMARIES: Record<MailboxAfterImport, string> = {
  mark_seen: 'Marked as read',
  move: 'Moved',
  delete: 'Marked as deleted',
  leave: 'Left unchanged',
};
