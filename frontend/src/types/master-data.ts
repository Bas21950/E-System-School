export interface AcademicYear {
  id: string;
  year: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  created_at?: string;
}

export interface Semester {
  id: string;
  academic_year_id: string;
  semester: string;
  start_date: string | null;
  end_date: string | null;
  created_at?: string;
  
  // Joined Info
  academic_year?: string; // legacy text field
  academic_year_info?: {
    id: string;
    year: string;
  };
}

export interface EducationLevel {
  id: string;
  name: string;
  short_name: string;
  created_at?: string;
}

export interface GradeLevel {
  id: string;
  level_id: string;
  name: string;
  short_name: string;
  created_at?: string;
}

export interface Room {
  id: string;
  grade_id: string;
  room_number: string;
  room_code: string | null;
  created_at?: string;
}
