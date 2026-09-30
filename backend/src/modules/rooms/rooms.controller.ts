import { Request, Response, NextFunction } from 'express';
import * as service from './rooms.service';
import { successResponse, errorResponse } from '../../utils/response';

export const list = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getRooms();
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getRoomById(req.params.id);
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.createRoom(req.body);
    return successResponse(res, data, 'Created successfully', 201);
  } catch (error: unknown) {
    return errorResponse(res, error instanceof Error ? error.message : String(error), 400);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.updateRoom(req.params.id, req.body);
    return successResponse(res, data, 'Updated successfully');
  } catch (error: unknown) {
    return errorResponse(res, error instanceof Error ? error.message : String(error), 400);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteRoom(req.params.id);
    return successResponse(res, null, 'Deleted successfully');
  } catch (error: unknown) {
    return errorResponse(res, error instanceof Error ? error.message : String(error), 400);
  }
};
