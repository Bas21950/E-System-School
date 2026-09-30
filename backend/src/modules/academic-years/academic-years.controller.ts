import { Request, Response, NextFunction } from 'express';
import * as service from './academic-years.service';
import { successResponse, errorResponse } from '../../utils/response';

export const list = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAcademicYears();
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAcademicYearById(req.params.id);
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.createAcademicYear(req.body);
    return successResponse(res, data, 'Created successfully', 201);
  } catch (error: unknown) {
    return errorResponse(res, error instanceof Error ? error.message : String(error), 400);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.updateAcademicYear(req.params.id, req.body);
    return successResponse(res, data, 'Updated successfully');
  } catch (error: unknown) {
    return errorResponse(res, error instanceof Error ? error.message : String(error), 400);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteAcademicYear(req.params.id);
    return successResponse(res, null, 'Deleted successfully');
  } catch (error: unknown) {
    return errorResponse(res, error instanceof Error ? error.message : String(error), 400);
  }
};
