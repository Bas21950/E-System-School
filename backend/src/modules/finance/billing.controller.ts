import { Request, Response } from 'express';
import * as billingService from './billing.service';
import { sendError, sendSuccess } from '../../utils/response';

function readMonthlyInput(body: Record<string, unknown>) {
  return {
    feePlanId: String(body.feePlanId || ''),
    academicYearId: body.academicYearId ? String(body.academicYearId) : null,
    semesterId: body.semesterId ? String(body.semesterId) : null,
    billingMonth: Number(body.billingMonth),
    billingYear: Number(body.billingYear),
  };
}

export async function prepareMonthlyRoster(req: Request, res: Response) {
  try {
    const input = readMonthlyInput(req.body);
    if (!input.feePlanId) return res.status(400).json(sendError('feePlanId is required'));
    return res.json(sendSuccess(await billingService.prepareMonthlyRoster(input)));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function updateMonthlyRosterMember(req: Request, res: Response) {
  try {
    const input = readMonthlyInput(req.body);
    if (!input.feePlanId || !req.params.studentId) {
      return res.status(400).json(sendError('feePlanId and studentId are required'));
    }
    return res.json(sendSuccess(await billingService.setMonthlyRosterMember({
      ...input,
      studentId: req.params.studentId,
      isActive: Boolean(req.body.isActive),
      courseCodes: Array.isArray(req.body.courseCodes) ? req.body.courseCodes.map(String) : undefined,
    })));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function previewMonthlyBilling(req: Request, res: Response) {
  try {
    const input = readMonthlyInput(req.body);
    if (!input.feePlanId) return res.status(400).json(sendError('feePlanId is required'));
    return res.json(sendSuccess(await billingService.previewMonthlyBilling(input)));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function postMonthlyBilling(req: Request, res: Response) {
  try {
    const input = readMonthlyInput(req.body);
    if (!input.feePlanId) return res.status(400).json(sendError('feePlanId is required'));
    const data = await billingService.postMonthlyBilling({
      ...input,
      dueDate: typeof req.body.dueDate === 'string' ? req.body.dueDate : null,
      operatorName: typeof req.body.operatorName === 'string' ? req.body.operatorName : null,
      idempotencyKey: String(req.body.idempotencyKey || ''),
      studentIds: Array.isArray(req.body.studentIds) ? req.body.studentIds.map(String) : undefined,
    });
    return res.status(data.idempotent_replay ? 200 : 201).json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}
