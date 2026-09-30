import { deleteRowById, insertRow, selectAllRows, selectRowById, updateRowById } from '../../repositories/postgresCrud';
import { AcademicYear, CreateAcademicYearInput, UpdateAcademicYearInput } from './academic-years.types';

export async function getAcademicYears() {
  return selectAllRows<AcademicYear>('academic_years');
}

export async function getAcademicYearById(id: string) {
  return selectRowById<AcademicYear>('academic_years', id);
}

export async function createAcademicYear(input: CreateAcademicYearInput) {
  return insertRow<AcademicYear>('academic_years', input as Record<string, unknown>);
}

export async function updateAcademicYear(id: string, input: UpdateAcademicYearInput) {
  return updateRowById<AcademicYear>('academic_years', id, input as Record<string, unknown>);
}

export async function deleteAcademicYear(id: string) {
  await deleteRowById('academic_years', id);
}
