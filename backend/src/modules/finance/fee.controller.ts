import { Request, Response } from 'express';
import * as feeService from './fee.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function getFeePlans(req: Request, res: Response) {
  try {
    const data = await feeService.getFeePlans();
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function getReceiptTypes(req: Request, res: Response) {
  try {
    const data = await feeService.getReceiptTypes();
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function createReceiptType(req: Request, res: Response) {
  try {
    const data = await feeService.createReceiptType(req.body);
    return res.status(201).json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function updateReceiptType(req: Request, res: Response) {
  try {
    const data = await feeService.updateReceiptType(req.params.id, req.body);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function deleteReceiptType(req: Request, res: Response) {
  try {
    await feeService.deleteReceiptType(req.params.id);
    return res.json(sendSuccess(null));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function createFeePlan(req: Request, res: Response) {
  try {
    const data = await feeService.createFeePlan(req.body);
    return res.status(201).json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function deleteFeePlan(req: Request, res: Response) {
  try {
    await feeService.deleteFeePlan(req.params.id);
    return res.json(sendSuccess(null));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function generateFees(req: Request, res: Response) {
  try {
    const { feePlanId, semesterId, academicYearId, billingMonth, billingYear } = req.body;
    if (!feePlanId) return res.status(400).json(sendError('feePlanId is required'));
    
    const result = await feeService.generateFeesForGrade(feePlanId, semesterId, academicYearId, billingMonth, billingYear);
    return res.json(sendSuccess(result));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function getStudentFees(req: Request, res: Response) {
  try {
    const data = await feeService.getStudentFees(req.params.studentId);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function generateFeesByRoom(req: Request, res: Response) {
  try {
    const { feePlanId, roomId, semesterId, academicYearId, billingMonth, billingYear } = req.body;
    if (!feePlanId || !roomId) {
      return res.status(400).json(sendError('feePlanId and roomId are required'));
    }

    const result = await feeService.generateFeesForRoom(feePlanId, roomId, semesterId, academicYearId, billingMonth, billingYear);
    return res.json(sendSuccess(result));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function createIndividualFee(req: Request, res: Response) {
  try {
    const { studentId, feePlanId, amount, source, semesterId, academicYearId, billingMonth, billingYear, dueDate } = req.body;
    if (!studentId || !feePlanId || !amount) {
      return res.status(400).json(sendError('studentId, feePlanId, and amount are required'));
    }

    const data = await feeService.createIndividualFee(
      studentId, 
      feePlanId, 
      Number(amount),
      source,
      semesterId,
      academicYearId,
      billingMonth ? Number(billingMonth) : undefined,
      billingYear ? Number(billingYear) : undefined,
      dueDate
    );
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function updateStudentFee(req: Request, res: Response) {
  try {
    const { amount } = req.body;
    const data = await feeService.updateStudentFee(req.params.id, Number(amount));
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function deleteStudentFee(req: Request, res: Response) {
  try {
    await feeService.deleteStudentFee(req.params.id);
    return res.json(sendSuccess(null));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function getRoomBalances(req: Request, res: Response) {
  try {
    const data = await feeService.getRoomBalances(req.params.roomId);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function getFeeAssignments(req: Request, res: Response) {
  try {
    const data = await feeService.getFeeAssignments(req.params.id);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function getArrearsReport(req: Request, res: Response) {
  try {
    const data = await feeService.getArrearsReport({
      academicYearId: typeof req.query.academicYearId === 'string' ? req.query.academicYearId : undefined,
      roomId: typeof req.query.roomId === 'string' ? req.query.roomId : undefined,
      gradeId: typeof req.query.gradeId === 'string' ? req.query.gradeId : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(500).json(sendError(error.message));
  }
}

export async function assignFeeToStudent(req: Request, res: Response) {
  try {
    const { studentId } = req.body;
    const data = await feeService.assignFeeToStudent(studentId, req.params.id);
    return res.json(sendSuccess(data));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}

export async function unassignFeeFromStudent(req: Request, res: Response) {
  try {
    const { feePlanId, studentId } = req.params;
    await feeService.unassignFeeFromStudent(studentId, feePlanId);
    return res.json(sendSuccess(null));
  } catch (error: any) {
    return res.status(400).json(sendError(error.message));
  }
}
