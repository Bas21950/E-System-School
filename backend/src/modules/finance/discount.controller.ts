import { Request, Response } from 'express';
import * as discountService from './discount.service';
import { sendError, sendSuccess } from '../../utils/response';

export async function getStudentDiscounts(req: Request, res: Response) {
  try {
    const data = await discountService.getStudentDiscounts(req.params.studentId);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function createStudentDiscount(req: Request, res: Response) {
  try {
    const { name, amount, type, fee_plan_id, active, note, start_date, end_date } = req.body;
    if (!name || amount === undefined || !type) {
      return res.status(400).json(sendError('name, amount, and type are required'));
    }

    const data = await discountService.createStudentDiscount(req.params.studentId, {
      name,
      amount: Number(amount),
      type,
      fee_plan_id: fee_plan_id || null,
      active,
      note,
      start_date,
      end_date,
    });
    return res.status(201).json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function updateStudentDiscount(req: Request, res: Response) {
  try {
    const data = await discountService.updateStudentDiscount(req.params.id, req.body);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function deleteStudentDiscount(req: Request, res: Response) {
  try {
    await discountService.deleteStudentDiscount(req.params.id);
    return res.json(sendSuccess(null));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}
