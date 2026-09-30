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
}

export interface StudentFeeAssignment {
  id: string;
  student_id: string;
  fee_plan_id: string;
  active: boolean;
  created_at: string;
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

  // Joined fields
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
  receipt_file_url?: string | null;
  transfer_slip_url?: string | null;
  evidence_url?: string | null;
  payee_name?: string | null;
  status?: 'success' | 'voided';
  idempotency_key?: string | null;
  void_reason?: string | null;
  voided_at?: string | null;
  created_at: string;

  // Joined fields
  student_info?: {
    first_name: string;
    last_name: string;
    student_id: string;
  };
  items?: PaymentItem[];
}

export interface PaymentItem {
  id: string;
  payment_id: string;
  student_fee_id: string | null;
  amount: number;
  created_at: string;

  // Joined fields
  student_fee_info?: {
    fee_plan_info?: {
      name: string;
    };
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

export interface FinanceStats {
  todayTotal: number;
  monthTotal: number;
  pendingStudentsCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface Discount {
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
  updated_at?: string;
  created_at?: string;
}

export interface CreateDiscountInput {
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
  fee_plan_id?: string | null;
  active?: boolean;
  note?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface UpdateDiscountInput extends Partial<CreateDiscountInput> {}

export interface ReceiptSettings {
  id?: number;
  payee_name?: string | null;
  school_name?: string | null;
  school_logo_url?: string | null;
  school_address?: string | null;
  school_phone?: string | null;
  school_subtitle?: string | null;
  receipt_note?: string | null;
  receipt_output_dir?: string | null;
  receipt_email_enabled?: boolean | null;
  receipt_email_to?: string | null;
  receipt_gas_secret?: string | null;
  updated_at?: string;
}
