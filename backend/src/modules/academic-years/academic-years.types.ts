export interface AcademicYear {
  id: string;
  created_at?: string;
  [key: string]: unknown;
}

export type CreateAcademicYearInput = Omit<AcademicYear, 'id' | 'created_at'>;
export type UpdateAcademicYearInput = Partial<CreateAcademicYearInput>;
