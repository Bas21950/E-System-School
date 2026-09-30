import { Request, Response } from 'express';
import * as paymentService from './payment.service';
import { sendSuccess, sendError } from '../../utils/response';

function sanitizeFileName(value: string) {
  return String(value || 'receipt')
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/_+/g, '_')
    .trim();
}

export async function processPayment(req: Request, res: Response) {
  try {
    const data = await paymentService.processPayment(req.body);
    return res.status(201).json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function generateReceiptPdf(req: Request, res: Response) {
  try {
    const { generateReceiptPdf } = await import('./pdf.service');
    const paymentId =
      req.params.id ||
      req.query.paymentId as string ||
      req.query.payment_id as string;
    if (!paymentId) throw new Error("Missing payment ID");
    
    const pdfBuffer = await generateReceiptPdf(paymentId);
    let fileName = `receipt_${paymentId}.pdf`;
    try {
      const detail: any = await paymentService.getPaymentDetail(paymentId);
      const student = detail?.student_info || {};
      const studentName = `${student.prefix || ''}${student.first_name || ''} ${student.last_name || ''}`.trim();
      const receiptNo = detail?.receipt_no || paymentId;
      fileName = sanitizeFileName(`${receiptNo}_${studentName || 'receipt'}.pdf`);
    } catch {
      fileName = sanitizeFileName(fileName);
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    return res.status(500).send(`Error generating PDF: ${error.message}`);
  }
}

export async function getPaymentDetail(req: Request, res: Response) {
  try {
    const data = await paymentService.getPaymentDetail(req.params.id);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(404).json(sendError(error.message));
  }
}

export async function getReceiptSettings(req: Request, res: Response) {
  try {
    const data = await paymentService.getReceiptSettings();
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function updateReceiptSettings(req: Request, res: Response) {
  try {
    const data = await paymentService.updateReceiptSettings(req.body);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function uploadReceiptLogo(req: Request, res: Response) {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json(sendError('Missing logo file'));
    }

    const result = await paymentService.uploadReceiptLogo(file);
    return res.json(sendSuccess(result));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const data = await paymentService.getDashboardStats();
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function getStudentPayments(req: Request, res: Response) {
  try {
    const data = await paymentService.getStudentPayments(req.params.studentId);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function deletePayment(req: Request, res: Response) {
  try {
    const data = await paymentService.deletePayment(req.params.id, req.body?.reason);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function getLatestPayments(req: Request, res: Response) {
  try {
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit as string) : 50; // Increased default to 50
    const data = await paymentService.getLatestPayments(limit);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function getPaymentByReceiptNo(req: Request, res: Response) {
  try {
    const data = await paymentService.getPaymentByReceiptNo(req.params.receiptNo);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(404).json(sendError(error.message));
  }
}

export async function uploadTransferSlip(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { slipBase64, mimeType } = req.body;
    
    if (!slipBase64) {
      return res.status(400).json(sendError('Missing slipBase64'));
    }
    
    const result = await paymentService.uploadTransferSlip(id, slipBase64, mimeType);
    return res.json(sendSuccess(result));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function getPaymentSlipUrl(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const url = await paymentService.getPaymentSlipUrl(id);
    return res.json(sendSuccess({ url }));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}
