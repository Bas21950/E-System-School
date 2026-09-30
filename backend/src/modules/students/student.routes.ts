import { Router } from 'express';
import multer from 'multer';
import * as controller from './student.controller';
import { validateStudentBody } from '../../middleware/validate';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Stats & Template & Options (must come before /:id)
router.get('/stats', controller.getStats);
router.get('/options', controller.getFilterOptions);
router.get('/template', controller.downloadTemplate);

// Import
router.post('/import', upload.single('file'), controller.importStudents);

// CRUD
router.get('/', controller.listStudents);
router.get('/:id/document', controller.studentDocument);
router.get('/:id/document.pdf', controller.studentDocument);
router.get('/:id', controller.getStudent);
router.post('/', validateStudentBody, controller.createStudent);
router.put('/:id', controller.updateStudent);
router.delete('/:id', controller.deleteStudent);

export default router;
