import { deleteRowById, insertRow, selectAllRows, selectRowById, updateRowById } from '../../repositories/postgresCrud';
import { GradeLevel, CreateGradeLevelInput, UpdateGradeLevelInput } from './grade-levels.types';

export async function getGradeLevels() {
  return selectAllRows<GradeLevel>('grade_levels');
}

export async function getGradeLevelById(id: string) {
  return selectRowById<GradeLevel>('grade_levels', id);
}

export async function createGradeLevel(input: CreateGradeLevelInput) {
  return insertRow<GradeLevel>('grade_levels', input as Record<string, unknown>);
}

export async function updateGradeLevel(id: string, input: UpdateGradeLevelInput) {
  return updateRowById<GradeLevel>('grade_levels', id, input as Record<string, unknown>);
}

export async function deleteGradeLevel(id: string) {
  await deleteRowById('grade_levels', id);
}
