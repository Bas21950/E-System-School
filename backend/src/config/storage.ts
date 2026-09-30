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
