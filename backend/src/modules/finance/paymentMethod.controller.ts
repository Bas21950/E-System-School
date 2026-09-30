import { Request, Response } from 'express';
import * as paymentMethodService from './paymentMethod.service';

export async function getPaymentMethods(req: Request, res: Response) {
  try {
    const data = await paymentMethodService.getPaymentMethods();
    res.json({ success: true, data });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function createPaymentMethod(req: Request, res: Response) {
  try {
    const data = await paymentMethodService.createPaymentMethod(req.body);
    res.json({ success: true, data });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function updatePaymentMethod(req: Request, res: Response) {
  try {
    const data = await paymentMethodService.updatePaymentMethod(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
