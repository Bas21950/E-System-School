export interface FeePlan {
  id: string;
  name: string;
  amount: number;
  receipt_type_id?: string | null;
  target_grade_id?: string | null;
  target_room_id?: string | null;
  billing_cycle: 'once' | 'monthly' | 'semester' | 'yearly';
  billing_day: number | null;
  description: string | null;
  created_at: string;
  receipt_type_info?: { name: string };
}

export interface StudentFeeAssignment {
  id: string;
  student_id: string;
  fee_plan_id: string;
  active: boolean;
  created_at: string;
  student_info?: {
    id: string;
    first_name: string;
    last_name: string;
    student_id: string;
  };
}

export interface StudentFee {
  id: string;
  student_id: string;
  fee_plan_id: string;
  total_amount: number;
  paid_amount: number;
  discount_amount?: number;
  effective_balance?: number;
  status: 'unpaid' | 'partial' | 'paid';
  source: 'system' | 'legacy';
  semester_id?: string | null;
  academic_year_id?: string | null;
  billing_month?: number | null;
  billing_year?: number | null;
  due_date?: string | null;
  created_at: string;
  fee_plan_info?: FeePlan;
  academic_year_info?: { year: string };
  semester_info?: { semester: string };
}

export interface Payment {
  id: string;
  student_id: string;
  receipt_no: string;
  payment_date: string;
  payment_method: 'cash' | 'transfer' | 'qr';
  total_amount: number;
  transfer_slip_url?: string | null;
  evidence_url?: string | null;
  payee_name?: string;
  created_at: string;
  student_info?: {
    first_name: string;
    last_name: string;
    student_id: string;
    room_info?: {
      room_number: string;
      grade_info?: {
        name: string;
      };
    };
  };
  items?: PaymentItem[];
}

export interface PaymentItem {
  id: string;
  payment_id: string;
  student_fee_id: string | null;
  amount: number;
  created_at: string;
  student_fee_info?: {
    id: string;
    billing_month?: number | null;
    billing_year?: number | null;
    semester_id?: string | null;
    academic_year_id?: string | null;
    fee_plan_info?: {
      name: string;
    };
    academic_year_info?: { year: string };
    semester_info?: { semester: string };
  };
}

export interface CreateFeePlanInput {
  name: string;
  amount: number;
  receipt_type_id?: string | null;
  target_grade_id?: string | null;
  target_room_id?: string | null;
  billing_cycle: 'once' | 'monthly' | 'semester' | 'yearly';
  billing_day?: number | null;
  description?: string;
}

export interface ProcessPaymentInput {
  student_id: string;
  payment_method: 'cash' | 'transfer' | 'qr';
  payment_date: string;
  payee_name?: string | null;
  idempotency_key?: string | null;
  items: {
    student_fee_id: string;
    amount: number;
  }[];
}

export interface BillingRosterMember {
  student_id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  grade_name: string | null;
  room_number: string | null;
  is_active: boolean;
  course_codes: ('basic' | 'steam')[];
  student_fee_id: string | null;
  student_fee_status: 'unpaid' | 'partial' | 'paid' | null;
  student_fee_amount: number | null;
  student_fee_discount: number | null;
}

export interface MonthlyBillingPreview {
  roster: {
    id: string;
    fee_plan_id: string;
    fee_plan_name: string;
    amount: number;
    academic_year_id: string | null;
    semester_id: string | null;
    billing_month: number;
    billing_year: number;
    period_key: string;
  };
  members: BillingRosterMember[];
  summary: {
    students: number;
    pending_count: number;
    existing_count: number;
    gross_amount: number;
  };
}

export interface BillingRunResult {
  id: string;
  created_count: number;
  existing_count: number;
  requested_count: number;
  total_amount: number;
  status: 'draft' | 'posted' | 'failed';
  idempotent_replay: boolean;
}

export interface FinanceStats {
  todayTotal: number;
  monthTotal: number;
  pendingStudentsCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  pendingStudents: number;
}

export interface StudentDiscount {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
  student_id?: string | null;
  fee_plan_id?: string | null;
  active?: boolean;
  note?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStudentDiscountInput {
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
  fee_plan_id?: string | null;
  active?: boolean;
  note?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ReceiptType {
  id: string;
  name: string;
  code: string;
  prefix: string;
  current_number: number;
  is_active: boolean;
}

export interface AcademicYear {
  id: string;
  year: string;
  created_at?: string;
}

export interface Semester {
  id: string;
  academic_year_id: string;
  semester: string;
  start_date?: string;
  end_date?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}
