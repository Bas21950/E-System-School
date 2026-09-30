import { Request, Response } from 'express';
import * as enrollmentService from './enrollment.service';

export async function getEnrollments(req: Request, res: Response) {
  try {
    const filters = {
      academicYearId: req.query.academicYearId as string,
      gradeId: req.query.gradeId as string,
      roomId: req.query.roomId as string,
      search: req.query.search as string,
      status: req.query.status as string,
    };

    if (!filters.academicYearId) {
      return res.status(400).json({ message: 'academicYearId is required' });
    }

    const data = await enrollmentService.getEnrollments(filters);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function upsertEnrollment(req: Request, res: Response) {
  try {
    const data = await enrollmentService.upsertEnrollment(req.body);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getEligibleStudents(req: Request, res: Response) {
  try {
    const academicYearId = req.params.academicYearId;
    const data = await enrollmentService.getEligibleStudents(academicYearId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function promoteStudents(req: Request, res: Response) {
  try {
    const { sourceYearId, targetYearId } = req.body;
    if (!sourceYearId || !targetYearId) {
      return res.status(400).json({ message: 'Both sourceYearId and targetYearId are required' });
    }
    const promotedCount = await enrollmentService.promoteStudents(sourceYearId, targetYearId);
    res.json({ promoted_count: promotedCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
