export interface BlocklistPatternValidation {
  valid: boolean;
  error?: string;
}

const AT_SYMBOL = '@';

const escapeRegex = (value: string) => value.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

export const normalizeBlocklistPattern = (pattern: string) => pattern.trim().toLowerCase();

export const validateBlocklistPattern = (pattern: string): BlocklistPatternValidation => {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a sender pattern.' };
  }

  if (/\s/.test(trimmed)) {
    return { valid: false, error: 'Pattern cannot contain spaces.' };
  }

  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, error: 'Pattern must contain exactly one @.' };
  }

  const [localPart, domainPart] = trimmed.split(AT_SYMBOL);
  if (!localPart || !domainPart) {
    return { valid: false, error: 'Pattern must include both local part and domain.' };
  }

  return { valid: true };
};

export const blocklistPatternToRegex = (pattern: string) => {
  const normalized = normalizeBlocklistPattern(pattern);
  const escaped = escapeRegex(normalized);
  const regexSource = `^${escaped.replace(/\*/g, '.*')}$`;
  return new RegExp(regexSource, 'i');
};

export const matchesBlocklistPattern = (pattern: string, email: string) => {
  const validation = validateBlocklistPattern(pattern);
  if (!validation.valid) return false;
  if (!email.includes(AT_SYMBOL)) return false;

  const regex = blocklistPatternToRegex(pattern);
  return regex.test(email.toLowerCase());
};
