/**
 * Utility functions for handling Thai Buddhist Era (BE) dates.
 * In Thailand, BE = CE + 543.
 */

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Formats a date string or Date object to a Thai BE string.
 * @param date Date object, ISO string, or undefined
 * @param options Formatting options
 */
export function formatThaiDate(
  date: Date | string | null | undefined,
  options: { 
    short?: boolean; 
    includeTime?: boolean;
    includeYear?: boolean;
  } = { includeYear: true }
): string {
  if (!date) return '-';
  
  let dayVal, monthIdx, yearVal;
  
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [, yText, mText, dText] = date.match(/^(\d{4})-(\d{2})-(\d{2})/)!;
    const [y, m, d] = [yText, mText, dText].map(Number);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return '-';
    yearVal = y;
    monthIdx = m - 1;
    dayVal = d;
  } else {
    const dObj = typeof date === 'string' ? new Date(date) : date;
    if (!dObj || isNaN(dObj.getTime())) return '-';
    dayVal = dObj.getDate();
    monthIdx = dObj.getMonth();
    yearVal = dObj.getFullYear();
  }

  const monthLabel = options.short ? THAI_MONTHS_SHORT[monthIdx] : THAI_MONTHS[monthIdx];
  const yearBE = yearVal + 543;

  let result = `${dayVal} ${monthLabel}`;
  if (options.includeYear !== false) {
    result += ` ${yearBE}`;
  }

  if (options.includeTime) {
    // Note: Time components only work if the input was a full Date object or ISO string with time
    const dObj = typeof date === 'string' ? new Date(date) : date;
    if (dObj && !isNaN(dObj.getTime())) {
      const hours = String(dObj.getHours()).padStart(2, '0');
      const minutes = String(dObj.getMinutes()).padStart(2, '0');
      result += ` ${hours}:${minutes} น.`;
    }
  }

  return result;
}

/**
 * Converts CE year to BE year.
 */
export function toBE(ceYear: number): number {
  return ceYear + 543;
}

/**
 * Converts BE year to CE year.
 */
export function toCE(beYear: number): number {
  return beYear - 543;
}

/**
 * Gets a list of BE years for a range.
 */
export function getBEYears(range: number = 50, forward: number = 5): number[] {
  const currentBE = new Date().getFullYear() + 543;
  const years = [];
  for (let i = currentBE + forward; i >= currentBE - range; i--) {
    years.push(i);
  }
  return years;
}
