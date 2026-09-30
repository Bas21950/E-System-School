import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function validateStudentBody(req: Request, res: Response, next: NextFunction) {
  const { student_id, first_name, last_name, room_id } = req.body;

  const errors: string[] = [];

  if (!student_id) errors.push('student_id is required');
  if (!first_name) errors.push('first_name is required');
  if (!last_name) errors.push('last_name is required');
  if (!room_id) errors.push('room_id is required');

  if (errors.length > 0) {
    return res.status(400).json(sendError(errors.join(', ')));
  }

  next();
}
