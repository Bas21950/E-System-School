import { deleteRowById, insertRow, selectAllRows, selectRowById, updateRowById } from '../../repositories/postgresCrud';
import { EducationLevel, CreateEducationLevelInput, UpdateEducationLevelInput } from './education-levels.types';

export async function getEducationLevels() {
  return selectAllRows<EducationLevel>('education_levels');
}

export async function getEducationLevelById(id: string) {
  return selectRowById<EducationLevel>('education_levels', id);
}

export async function createEducationLevel(input: CreateEducationLevelInput) {
  return insertRow<EducationLevel>('education_levels', input as Record<string, unknown>);
}

export async function updateEducationLevel(id: string, input: UpdateEducationLevelInput) {
  return updateRowById<EducationLevel>('education_levels', id, input as Record<string, unknown>);
}

export async function deleteEducationLevel(id: string) {
  await deleteRowById('education_levels', id);
}
