import { Mail, Upload, Webhook } from 'lucide-react';
import type { ReportSource } from '@/types/api';

// The names the operator sees for the ways a report reaches DMARCo.
export const REPORT_SOURCE_META: Record<ReportSource, { label: string; description: string; Icon: typeof Mail }> = {
  mailbox: { label: 'IMAP', description: 'Fetched from a mailbox over IMAP', Icon: Mail },
  upload: { label: 'API', description: 'Uploaded to the upload endpoint with an API key', Icon: Upload },
  webhook: { label: 'Webhook', description: 'Posted to the webhook', Icon: Webhook },
};
