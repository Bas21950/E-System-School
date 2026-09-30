import crypto from 'crypto';
import { getReceiptSettingsRecord, saveReceiptSettingsRecord } from '../../repositories/receiptSettings.repository';
import { getPaymentForReceipt } from './payment.service';
import { generateReceiptPdf } from './pdf.service';

const GAS_WEB_APP_URL =
  process.env.RECEIPT_GAS_WEB_APP_URL ||
  'https://script.google.com/macros/s/AKfycbw-43-zADdTnjLhuuYwiG6OXLPgBG58LPC2gPer_BmwYZsA4KrsJvaWd1rVq20Ci-v-/exec';
const GAS_SECRET = process.env.RECEIPT_GAS_SECRET || '';

function generateSecret() {
  return crypto.randomBytes(24).toString('hex');
}

export async function sendReceiptToGas(paymentId: string) {
  let settings = await getReceiptSettingsRecord();
  if (!settings.receipt_email_enabled) return { sent: false, reason: 'disabled' };

  const recipient = settings.receipt_email_to?.trim();
  const gasUrl = GAS_WEB_APP_URL.trim();
  let secret = GAS_SECRET.trim() || settings.receipt_gas_secret?.trim();

  if (!secret) {
    secret = generateSecret();
    settings = await saveReceiptSettingsRecord({
      ...settings,
      receipt_gas_secret: secret,
    });
  }

  if (!gasUrl || !recipient) {
    return { sent: false, reason: 'missing-gas-config' };
  }

  const payment = await getPaymentForReceipt(paymentId);
  const pdfBuffer = await generateReceiptPdf(paymentId);
  const studentName = `${payment.student?.prefix || ''}${payment.student?.first_name || ''} ${payment.student?.last_name || ''}`.trim();

  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secret: secret || '',
      recipient_email: recipient,
      receipt_no: payment.receipt_no,
      student_name: studentName || '',
      student_id: payment.student?.student_id || '',
      payment_date: payment.payment_date,
      file_name: `${payment.receipt_no}.pdf`,
      file_base64: pdfBuffer.toString('base64'),
      mime_type: 'application/pdf',
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`GAS request failed: ${response.status} ${text}`);
  }

  return { sent: true };
}
