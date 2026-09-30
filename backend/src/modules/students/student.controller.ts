import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { sendSuccess, sendError } from '../../utils/response';
import * as studentService from './student.service';
import { StudentFilters } from './student.types';

// ─── GET /api/students ───
export async function listStudents(req: Request, res: Response) {
  try {
    const filters: StudentFilters = {
      search: req.query.search as string,
      academicYearId: req.query.academicYearId as string,
      grade: req.query.grade as string,
      room: req.query.room as string,
      status: req.query.status as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    };

    const { data, total } = await studentService.getStudents(filters);
    res.json(sendSuccess(data, { total, page: filters.page, limit: filters.limit }));
  } catch (err: any) {
    res.status(500).json(sendError(err.message));
  }
}

// ─── GET /api/students/stats ───
export async function getStats(req: Request, res: Response) {
  try {
    const stats = await studentService.getStudentStats();
    res.json(sendSuccess(stats));
  } catch (err: any) {
    res.status(500).json(sendError(err.message));
  }
}

// ─── GET /api/students/options ───
export async function getFilterOptions(req: Request, res: Response) {
  try {
    const options = await studentService.getFilterOptions();
    res.json(sendSuccess(options));
  } catch (err: any) {
    res.status(500).json(sendError(err.message));
  }
}

// ─── GET /api/students/template ───
export async function downloadTemplate(req: Request, res: Response) {
  try {
    const headers = [
      'student_id',
      'prefix',
      'first_name',
      'last_name',
      'gender',
      'birthday',
      'parent_name',
      'parent_phone',
      'address',
      'academic_year',
      'room_code',
    ];

    const sampleRow = {
      student_id: '65001',
      prefix: 'ด.ช.',
      first_name: 'สมชาย',
      last_name: 'ใจดี',
      gender: 'ชาย',
      birthday: '2016-05-12',
      parent_name: 'นายสมปอง',
      parent_phone: '0812345678',
      address: 'กำแพงเพชร',
      academic_year: '2568',
      room_code: 'K1-1',
    };

    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });

    // Set column widths
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 5, 15) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.xlsx');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json(sendError(err.message));
  }
}

// ─── GET /api/students/:id ───
export async function getStudent(req: Request, res: Response) {
  try {
    const student = await studentService.getStudentById(req.params.id);
    res.json(sendSuccess(student));
  } catch (err: any) {
    res.status(404).json(sendError('Student not found'));
  }
}

// ─── POST /api/students ───
export async function createStudent(req: Request, res: Response) {
  try {
    const student = await studentService.createStudent(req.body);
    res.status(201).json(sendSuccess(student));
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      return res.status(409).json(sendError('student_id already exists'));
    }
    res.status(500).json(sendError(err.message));
  }
}

// ─── PUT /api/students/:id ───
export async function updateStudent(req: Request, res: Response) {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    res.json(sendSuccess(student));
  } catch (err: any) {
    res.status(500).json(sendError(err.message));
  }
}

// ─── DELETE /api/students/:id ───
export async function deleteStudent(req: Request, res: Response) {
  try {
    await studentService.deleteStudent(req.params.id);
    res.json(sendSuccess({ message: 'Student deleted' }));
  } catch (err: any) {
    res.status(500).json(sendError(err.message));
  }
}

// ─── POST /api/students/import ───
export async function importStudents(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json(sendError('No file uploaded'));
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet);

    // Map Thai headers to English keys
    const HEADER_MAP: Record<string, string> = {
      'student_id': 'student_id',
      'prefix': 'prefix',
      'first_name': 'first_name',
      'last_name': 'last_name',
      'gender': 'gender',
      'birthday': 'birthday',
      'parent_name': 'parent_name',
      'parent_phone': 'parent_phone',
      'address': 'address',
      'academic_year': 'academic_year',
      'room_code': 'room_code',
      // Legacy / Thai support
      'รหัสนักเรียน': 'student_id',
      'คำนำหน้า': 'prefix',
      'ชื่อ': 'first_name',
      'นามสกุล': 'last_name',
      'เพศ': 'gender',
      'วันเกิด': 'birthday',
      'ชื่อผู้ปกครอง': 'parent_name',
      'เบอร์โทร': 'parent_phone',
      'ที่อยู่': 'address',
      'ปีการศึกษา': 'academic_year',
      'รหัสห้องเรียน': 'room_code'
    };

    // Format rows and normalize keys
    const rows = rawRows.map((row: any) => {
      const normalizedRow: any = {};
      
      // Normalize keys
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = HEADER_MAP[key.trim()] || key.trim().toLowerCase();
        normalizedRow[normalizedKey] = value;
      });

      return normalizedRow;
    });

    if (rows.length === 0) {
      return res.status(400).json(sendError('File is empty'));
    }

    // Validate
    const { valid, errors } = await studentService.validateImportData(rows);

    // If only validation requested
    if (req.query.preview === 'true') {
      return res.json(
        sendSuccess({
          preview: rows,
          validCount: valid.length,
          errorCount: errors.length,
          errors,
        })
      );
    }

    // Import valid records
    const result = await studentService.importStudents(valid);

    res.json(
      sendSuccess({
        inserted: result.inserted,
        updated: result.updated,
        errorCount: errors.length,
        errors: errors,
      })
    );
  } catch (err: any) {
    res.status(500).json(sendError(err.message));
  }
}
