import ThaiBaht from 'thai-baht-text';

export function bahtText(amount: number): string {
  if (!amount) return 'ศูนย์บาทถ้วน';
  return '-' + ThaiBaht(amount) + '-';
}
