import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import studentRoutes from './modules/students/student.routes';
import academicYearRoutes from './modules/academic-years/academic-years.routes';
import semesterRoutes from './modules/semesters/semesters.routes';
import educationLevelRoutes from './modules/education-levels/education-levels.routes';
import gradeLevelRoutes from './modules/grade-levels/grade-levels.routes';
import roomRoutes from './modules/rooms/rooms.routes';
import financeRoutes from './modules/finance/finance.routes';
import enrollmentRoutes from './modules/students/enrollment.routes';
import { checkDatabaseConnection, ensureReceiptSettingsSchema, ensureStudentProfileSchema } from './config/database';
import { ensureStorageDirectories, getDataDir } from './config/storage';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || undefined });
ensureStorageDirectories();
void ensureReceiptSettingsSchema().catch((error) => {
  console.error('Failed to ensure receipt settings schema:', error);
});
let studentProfileSchemaReady: Promise<void> | null = null;

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/files', express.static(getDataDir()));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database keep-alive (prevent idle/sleep)
app.get('/api/keep-alive', async (_req, res) => {
  try {
    const db = await checkDatabaseConnection();
    console.log(`[Keep-Alive] DB Ping successful (${db.provider}) at ${new Date().toISOString()}`);
    res.json({ status: 'ok', db: 'success', provider: db.provider, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(`[Keep-Alive] DB Ping failed:`, err);
    res.status(500).json({ status: 'error', db: 'failed', message: err instanceof Error ? err.message : String(err) });
  }
});

// Module routes
app.use('/api/students', async (_req, _res, next) => {
  try {
    if (!studentProfileSchemaReady) {
      studentProfileSchemaReady = ensureStudentProfileSchema().catch((error) => {
        studentProfileSchemaReady = null;
        throw error;
      });
    }
    await studentProfileSchemaReady;
    next();
  } catch (error) {
    next(error);
  }
});
app.use('/api/students', studentRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/education-levels', educationLevelRoutes);
app.use('/api/grade-levels', gradeLevelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 E-System School API running on port ${PORT}`);
});

export default app;
