export interface OperatorIdentity {
  name: string;
  role: string;
  source: 'storage' | 'fallback';
}

export const CURRENT_OPERATOR_STORAGE_KEY = 'esystem.currentOperator';

export const DEFAULT_OPERATOR: OperatorIdentity = {
  name: 'Admin User',
  role: 'ผู้ดูแลระบบ',
  source: 'fallback',
};

const GENERIC_OPERATOR_NAMES = new Set([
  'admin',
  'admin user',
  'administrator',
  'finance',
  'finance staff',
  'ฝ่ายการเงิน',
  'ผู้รับเงิน',
  'ผู้ดูแลระบบ',
]);

const normalize = (value?: string | null) => value?.trim().replace(/\s+/g, ' ') || '';

export function readCurrentOperator(storage?: Storage): OperatorIdentity {
  if (!storage) return DEFAULT_OPERATOR;

  try {
    const raw = storage.getItem(CURRENT_OPERATOR_STORAGE_KEY);
    if (!raw) return DEFAULT_OPERATOR;

    const parsed = JSON.parse(raw) as Partial<OperatorIdentity>;
    const name = normalize(parsed.name);
    const role = normalize(parsed.role) || DEFAULT_OPERATOR.role;

    if (!name) return DEFAULT_OPERATOR;

    return {
      name,
      role,
      source: 'storage',
    };
  } catch {
    return DEFAULT_OPERATOR;
  }
}

export function writeCurrentOperator(storage: Storage | undefined, operator: Partial<OperatorIdentity>) {
  if (!storage) return DEFAULT_OPERATOR;

  const next: OperatorIdentity = {
    name: normalize(operator.name) || DEFAULT_OPERATOR.name,
    role: normalize(operator.role) || DEFAULT_OPERATOR.role,
    source: 'storage',
  };

  storage.setItem(CURRENT_OPERATOR_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearCurrentOperator(storage: Storage | undefined) {
  if (!storage) return;
  storage.removeItem(CURRENT_OPERATOR_STORAGE_KEY);
}

export function isGenericPayeeName(value?: string | null) {
  const normalized = normalize(value).toLowerCase();
  if (!normalized) return true;
  return GENERIC_OPERATOR_NAMES.has(normalized);
}

export function resolvePayeeName(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (normalized && !isGenericPayeeName(normalized)) {
      return normalized;
    }
  }

  return 'ฝ่ายการเงิน';
}
