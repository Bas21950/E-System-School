export interface EducationLevel {
  id: string;
  created_at?: string;
  [key: string]: unknown;
}

export type CreateEducationLevelInput = Omit<EducationLevel, 'id' | 'created_at'>;
export type UpdateEducationLevelInput = Partial<CreateEducationLevelInput>;
