export interface GradeLevel {
  id: string;
  created_at?: string;
  [key: string]: unknown;
}

export type CreateGradeLevelInput = Omit<GradeLevel, 'id' | 'created_at'>;
export type UpdateGradeLevelInput = Partial<CreateGradeLevelInput>;
