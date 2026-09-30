import { Request, Response, NextFunction } from 'express';
import * as service from './semesters.service';
import { successResponse, errorResponse } from '../../utils/response';

export const list = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getSemesters();
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getSemesterById(req.params.id);
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.createSemester(req.body);
    return successResponse(res, data, 'Created successfully', 201);
  } catch (error: unknown) {
    return errorResponse(res, error instanceof Error ? error.message : String(error), 400);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.updateSemester(req.params.id, req.body);
    return successResponse(res, data, 'Updated successfully');
  } catch (error: unknown) {
    return errorResponse(res, error instanceof Error ? error.message : String(error), 400);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteSemester(req.params.id);
    return successResponse(res, null, 'Deleted successfully');
  } catch (error: unknown) {
    return errorResponse(res, error instanceof Error ? error.message : String(error), 400);
  }
};
