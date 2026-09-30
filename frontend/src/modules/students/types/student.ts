export interface Student {
  id: string;
  created_at: string;
  sequence_no: number;
  student_id: string;
  national_id: string | null;
  prefix: string | null;
  first_name: string;
  last_name: string;
  gender: 'ชาย' | 'หญิง' | null;
  birthday: string | null;
  room_id: string | null;
  academic_year_id: string | null;

  // Joined Info
  room_info?: {
    id: string;
    room_number: string;
    grade_info?: {
      id: string;
      name: string;
      short_name: string;
      education_info?: {
        name: string;
      }
    }
  };
  academic_year_info?: {
    id: string;
    year: string;
  };

  parent_name: string | null;
  parent_phone: string | null;
  address: string | null;
  profile_data: StudentProfileData;
  status: string;

  // History (Step 7)
  enrollment_history?: {
    id: string;
    academic_year_id: string;
    room_id: string;
    status: string;
    academic_year_info: { year: string };
    room_info: { room_number: string; grade_info: { name: string } };
  }[];
}

export interface StudentProfileData {
  [field: string]: string | undefined;
  nationality?: string;
  ethnicity?: string;
  religion?: string;
  blood_type?: string;
  student_age?: string;
  height_cm?: string;
  weight_kg?: string;
  disability_type?: string;
  house_registration_no?: string;
  house_no?: string;
  moo?: string;
  alley?: string;
  road?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  telephone?: string;
  fax?: string;
  email?: string;
  enrollment_status_label?: string;
  special_abilities?: string;
  opportunity_status?: string;
  chronic_disease?: string;
  drug_allergy?: string;
  food_allergy?: string;
  favorite_foods?: string;
  admission_date?: string;
  previous_grade?: string;
  previous_student_id?: string;
  previous_school_affiliation?: string;
  previous_school_province?: string;
  previous_school_name?: string;
  previous_total_credits?: string;
  previous_gpa?: string;
  qualification_status?: string;
  qualification_response_date?: string;
  previous_graduation_date?: string;
  parents_marital_status?: string;
  siblings_count?: string;
  siblings_studying_count?: string;
  father_national_id?: string;
  father_name?: string;
  father_nationality?: string;
  father_status?: string;
  father_disability_type?: string;
  father_occupation?: string;
  father_monthly_income?: string;
  mother_national_id?: string;
  mother_name?: string;
  mother_nationality?: string;
  mother_status?: string;
  mother_disability_type?: string;
  mother_occupation?: string;
  mother_monthly_income?: string;
  guardian_national_id?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_age?: string;
  guardian_status?: string;
  guardian_occupation?: string;
  guardian_monthly_income?: string;
  student_name_en?: string;
  parent_name_en?: string;
  home_address_en?: string;
}

export interface CreateStudentInput {
  student_id: string;
  national_id?: string;
  prefix?: string;
  first_name: string;
  last_name: string;
  gender?: 'ชาย' | 'หญิง';
  birthday?: string;
  room_id?: string;
  academic_year_id?: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  profile_data?: StudentProfileData;
  status?: string;
}

export interface StudentStats {
  total: number;
  male: number;
  female: number;
  byStatus: { status: string; count: number }[];
  byGrade: { grade_name: string; count: number }[];
  byRoom: { grade_name: string; room_number: string; count: number }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ImportResult {
  preview?: unknown[];
  validCount?: number;
  errorCount?: number;
  inserted?: number;
  updated?: number;
  enrollmentsCreated?: number;
  imported?: number; // Legacy, keep for safety
  errors?: { row: number; message: string; data: unknown }[];
  errorDetails?: { row: number; message: string; data: unknown }[];
}
