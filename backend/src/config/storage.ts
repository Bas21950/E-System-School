import fs from 'fs';
import path from 'path';

const defaultDataDir = path.resolve(process.cwd(), process.env.DATA_DIR || 'data');
const transferSlipDir = path.join(defaultDataDir, 'transfer-slips');
const brandingDir = path.join(defaultDataDir, 'branding');
const receiptDir = path.join(defaultDataDir, 'receipts');

export function getDataDir() {
  return defaultDataDir;
}

export function getTransferSlipDir() {
  return transferSlipDir;
}

export function getBrandingDir() {
  return brandingDir;
}

export function getBundledSchoolLogoPath() {
  return path.resolve(__dirname, '../../assets/branding/school-logo.png');
}

export function resolveSchoolLogoUrl(input?: string | null): string {
  const value = input?.trim();
  const fallback = buildLocalFileUrl('branding/school-logo.png');
  if (!value) return fallback;

  try {
    const url = new URL(value);
    if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
        url.pathname.startsWith('/api/files/branding/')) {
      const fileName = decodeURIComponent(url.pathname.slice('/api/files/branding/'.length));
      if (fileName !== path.basename(fileName) || !fs.existsSync(path.join(brandingDir, fileName))) {
        return fallback;
      }
    }
  } catch (_) {
    // Keep custom data URLs and paths supplied by the administrator.
  }
  return value;
}

export function getReceiptDir() {
  return receiptDir;
}

export function ensureStorageDirectories() {
  fs.mkdirSync(transferSlipDir, { recursive: true });
  fs.mkdirSync(brandingDir, { recursive: true });
  fs.mkdirSync(receiptDir, { recursive: true });
}

export function buildLocalFileUrl(relativePath: string) {
  const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const baseUrl =
    process.env.PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 4000}`;

  return `${baseUrl.replace(/\/+$/, '')}/api/files/${normalizedPath}`;
}
