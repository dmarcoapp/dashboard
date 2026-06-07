import type { ParsedDmarcRecord } from '@/types/domain';

export function parseDmarcRecord(record: string | null): ParsedDmarcRecord | null {
  if (!record) return null;

  const parsed: ParsedDmarcRecord = { raw: record };
  
  // Split by semicolon and process each tag
  const parts = record.split(';').map(p => p.trim()).filter(Boolean);
  
  for (const part of parts) {
    const [key, ...valueParts] = part.split('=');
    const value = valueParts.join('=').trim();
    const keyLower = key.trim().toLowerCase();
    
    switch (keyLower) {
      case 'v':
        parsed.v = value;
        break;
      case 'p':
        parsed.p = value.toLowerCase() as 'none' | 'quarantine' | 'reject';
        break;
      case 'sp':
        parsed.sp = value.toLowerCase() as 'none' | 'quarantine' | 'reject';
        break;
      case 'rua':
        parsed.rua = value.split(',').map(u => u.trim());
        break;
      case 'ruf':
        parsed.ruf = value.split(',').map(u => u.trim());
        break;
      case 'adkim':
        parsed.adkim = value.toLowerCase() as 'r' | 's';
        break;
      case 'aspf':
        parsed.aspf = value.toLowerCase() as 'r' | 's';
        break;
      case 'pct':
        parsed.pct = parseInt(value, 10);
        break;
      case 'fo':
        parsed.fo = value;
        break;
      case 'rf':
        parsed.rf = value;
        break;
      case 'ri':
        parsed.ri = parseInt(value, 10);
        break;
    }
  }
  
  return parsed;
}

export function getPolicyDescription(policy: 'none' | 'quarantine' | 'reject' | undefined): string {
  switch (policy) {
    case 'none':
      return 'Monitor only - No action taken on failing emails';
    case 'quarantine':
      return 'Suspicious emails are sent to spam/junk folder';
    case 'reject':
      return 'Failing emails are rejected and not delivered';
    default:
      return 'Not specified';
  }
}

export function getAlignmentDescription(alignment: 'r' | 's' | undefined): string {
  switch (alignment) {
    case 'r':
      return 'Relaxed - Allows subdomains to pass alignment';
    case 's':
      return 'Strict - Exact domain match required';
    default:
      return 'Default (Relaxed)';
  }
}

export function getFailureOptionsDescription(fo: string | undefined): string {
  if (!fo) return 'Default (0 - Report if all mechanisms fail)';
  
  const options: string[] = [];
  if (fo.includes('0')) options.push('Report if all mechanisms fail');
  if (fo.includes('1')) options.push('Report if any mechanism fails');
  if (fo.includes('d')) options.push('Report DKIM failures');
  if (fo.includes('s')) options.push('Report SPF failures');
  
  return options.length > 0 ? options.join('; ') : fo;
}
