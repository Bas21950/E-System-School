import { Router } from 'express';
import * as enrollmentController from './enrollment.controller';

const router = Router();

router.get('/', enrollmentController.getEnrollments);
router.post('/', enrollmentController.upsertEnrollment);
router.post('/promote', enrollmentController.promoteStudents);
router.get('/eligible/:academicYearId', enrollmentController.getEligibleStudents);

export default router;
