import type { MailboxAfterImport } from '@/types/api';

// What happens to a report email once its report is stored.
export const AFTER_IMPORT_LABELS: Record<MailboxAfterImport, string> = {
  mark_seen: 'Mark it as read',
  move: 'Move it to another folder',
  delete: 'Mark it as deleted',
  leave: 'Leave it as it is',
};

export const AFTER_IMPORT_SUMMARIES: Record<MailboxAfterImport, string> = {
  mark_seen: 'Marked as read',
  move: 'Moved',
  delete: 'Marked as deleted',
  leave: 'Left as it is',
};
