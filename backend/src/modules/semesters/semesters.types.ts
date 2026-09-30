export interface Semester {
  id: string;
  created_at?: string;
  academic_year_id: string;
  semester: string;
  start_date?: string;
  end_date?: string;
}

export type CreateSemesterInput = Omit<Semester, 'id' | 'created_at'>;
export type UpdateSemesterInput = Partial<CreateSemesterInput>;
