import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
  FeePlan, StudentFee, Payment, 
  CreateFeePlanInput, ProcessPaymentInput, FinanceStats, ReceiptType,
  StudentDiscount, CreateStudentDiscountInput,
  StudentFeeAssignment, PaymentMethod
} from '../types/finance';
import type { BillingRunResult, MonthlyBillingPreview } from '../types/finance';

export function useFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeePlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: FeePlan[] }>('/finance/fee-plans');
      return res.data || [];
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createReceiptType = async (data: Partial<ReceiptType>) => {
    try {
      const res = await api.post<{ success: boolean; data: ReceiptType }>('/finance/receipt-types', data);
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const updateReceiptType = async (id: string, data: Partial<ReceiptType>) => {
    try {
      const res = await api.put<{ success: boolean; data: ReceiptType }>(`/finance/receipt-types/${id}`, data);
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const deleteReceiptType = async (id: string) => {
    try {
      await api.delete(`/finance/receipt-types/${id}`);
      return true;
    } catch (err: unknown) {
      throw err;
    }
  };

  const fetchReceiptTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: ReceiptType[] }>('/finance/receipt-types');
      return res.data || [];
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createFeePlan = async (data: CreateFeePlanInput) => {
    try {
      const res = await api.post<{ success: boolean; data: FeePlan }>('/finance/fee-plans', data);
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const deleteFeePlan = async (id: string) => {
    try {
      await api.delete(`/finance/fee-plans/${id}`);
      return true;
    } catch (err: unknown) {
      throw err;
    }
  };

  const generateFees = async (
    feePlanId: string,
    semesterId?: string | null,
    academicYearId?: string | null,
    billingMonth?: number | null,
    billingYear?: number | null
  ) => {
    try {
      const res = await api.post<{ success: boolean; data: { count: number } }>(
        '/finance/fees/generate', 
        { feePlanId, semesterId, academicYearId, billingMonth, billingYear }
      );
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const fetchStudentFees = useCallback(async (studentId: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ data: StudentFee[] }>(`/finance/students/${studentId}/fees`);
      return res.data || [];
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentDiscounts = useCallback(async (studentId: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ data: StudentDiscount[] }>(`/finance/students/${studentId}/discounts`);
      return res.data || [];
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const processPayment = async (data: ProcessPaymentInput) => {
    try {
      const res = await api.post<{ success: boolean; data: Payment }>('/finance/payments', data);
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<{ data: FinanceStats }>('/finance/dashboard/stats');
      return res.data;
    } catch (err: unknown) {
      console.error('Failed to fetch stats:', err);
      return null;
    }
  }, []);

  const fetchStudentPayments = useCallback(async (studentId: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Payment[] }>(`/finance/students/${studentId}/payments`);
      return res.data || [];
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStudentFee = async (id: string, amount: number) => {
    try {
      const res = await api.put<{ success: boolean; data: StudentFee }>(`/finance/fees/${id}`, { amount });
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const deleteStudentFee = async (id: string) => {
    try {
      await api.delete(`/finance/fees/${id}`);
      return true;
    } catch (err: unknown) {
      throw err;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await api.delete(`/finance/payments/${id}`);
      return true;
    } catch (err: unknown) {
      throw err;
    }
  };

  const createStudentDiscount = async (studentId: string, data: CreateStudentDiscountInput) => {
    try {
      const res = await api.post<{ success: boolean; data: StudentDiscount }>(`/finance/students/${studentId}/discounts`, data);
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const updateStudentDiscount = async (id: string, data: Partial<CreateStudentDiscountInput>) => {
    try {
      const res = await api.put<{ success: boolean; data: StudentDiscount }>(`/finance/discounts/${id}`, data);
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const deleteStudentDiscount = async (id: string) => {
    try {
      await api.delete(`/finance/discounts/${id}`);
      return true;
    } catch (err: unknown) {
      throw err;
    }
  };

  const generateFeesByRoom = async (
    feePlanId: string, 
    roomId: string,
    semesterId?: string | null,
    academicYearId?: string | null,
    billingMonth?: number | null,
    billingYear?: number | null
  ) => {
    try {
      const res = await api.post<{ success: boolean; data: { count: number; skipped?: number } }>(
        '/finance/fees/generate-room',
        { feePlanId, roomId, semesterId, academicYearId, billingMonth, billingYear }
      );
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const createIndividualFee = async (
    studentId: string, 
    feePlanId: string, 
    amount: number,
    source: 'system' | 'legacy' = 'system',
    semesterId?: string | null,
    academicYearId?: string | null,
    billingMonth?: number | null,
    billingYear?: number | null,
    dueDate?: string | null
  ) => {
    try {
      const res = await api.post<{ success: boolean; data: StudentFee }>(
        '/finance/fees/individual',
        { studentId, feePlanId, amount, source, semesterId, academicYearId, billingMonth, billingYear, dueDate }
      );
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const fetchFeeAssignments = useCallback(async (feePlanId: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ data: StudentFeeAssignment[] }>(`/finance/fee-plans/${feePlanId}/assignments`);
      return res.data || [];
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const assignFeeToStudent = async (feePlanId: string, studentId: string) => {
    try {
      const res = await api.post<{ success: boolean; data: StudentFeeAssignment }>(`/finance/fee-plans/${feePlanId}/assignments`, { studentId });
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const unassignFeeFromStudent = async (feePlanId: string, studentId: string) => {
    try {
      await api.delete(`/finance/fee-plans/${feePlanId}/assignments/${studentId}`);
      return true;
    } catch (err: unknown) {
      throw err;
    }
  };

  // Payment Methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await api.get<{ data: PaymentMethod[] }>('/finance/payment-methods');
      return res.data || [];
    } catch (err: unknown) {
      console.error('Failed to fetch payment methods:', err);
      return [];
    }
  }, []);

  const createPaymentMethod = async (data: { name: string; code?: string; description?: string; is_active?: boolean; sort_order?: number }) => {
    try {
      const res = await api.post<{ success: boolean; data: PaymentMethod }>('/finance/payment-methods', data);
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const updatePaymentMethod = async (id: string, data: Partial<{ name: string; code?: string; description?: string; is_active?: boolean; sort_order?: number }>) => {
    try {
      const res = await api.put<{ success: boolean; data: PaymentMethod }>(`/finance/payment-methods/${id}`, data);
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  // Transfer Slip Upload
  const uploadTransferSlip = async (paymentId: string, slipBase64: string, mimeType: string = 'image/jpeg') => {
    try {
      const res = await api.post<{ success: boolean; data: { transfer_slip_url: string } }>(`/finance/payments/${paymentId}/slip`, {
        slipBase64,
        mimeType
      });
      return res.data;
    } catch (err: unknown) {
      throw err;
    }
  };

  const prepareMonthlyBillingRoster = async (input: {
    feePlanId: string;
    academicYearId?: string | null;
    semesterId?: string | null;
    billingMonth: number;
    billingYear: number;
  }) => {
    const res = await api.post<{ success: boolean; data: Omit<MonthlyBillingPreview, 'summary'> }>(
      '/finance/billing/monthly/roster/prepare',
      input
    );
    return res.data;
  };

  const updateMonthlyBillingRosterMember = async (
    studentId: string,
    input: {
      feePlanId: string;
      academicYearId?: string | null;
      semesterId?: string | null;
      billingMonth: number;
      billingYear: number;
      isActive: boolean;
      courseCodes?: ('basic' | 'steam')[];
    }
  ) => {
    const res = await api.put<{ success: boolean; data: Omit<MonthlyBillingPreview, 'summary'> }>(
      `/finance/billing/monthly/roster/members/${studentId}`,
      input
    );
    return res.data;
  };

  const previewMonthlyBilling = async (input: {
    feePlanId: string;
    academicYearId?: string | null;
    semesterId?: string | null;
    billingMonth: number;
    billingYear: number;
  }) => {
    const res = await api.post<{ success: boolean; data: MonthlyBillingPreview }>('/finance/billing/monthly/preview', input);
    return res.data;
  };

  const postMonthlyBilling = async (input: {
    feePlanId: string;
    academicYearId?: string | null;
    semesterId?: string | null;
    billingMonth: number;
    billingYear: number;
    dueDate?: string | null;
    operatorName?: string | null;
    idempotencyKey: string;
    studentIds?: string[];
  }) => {
    const res = await api.post<{ success: boolean; data: BillingRunResult }>('/finance/billing/monthly/post', input);
    return res.data;
  };

  return {
    loading,
    error,
    fetchFeePlans,
    fetchReceiptTypes,
    createReceiptType,
    updateReceiptType,
    deleteReceiptType,
    createFeePlan,
    deleteFeePlan,
    generateFees,
    generateFeesByRoom,
    createIndividualFee,
    fetchStudentFees,
    updateStudentFee,
    deleteStudentFee,
    processPayment,
    deletePayment,
    fetchStudentPayments,
    fetchStudentDiscounts,
    fetchStats,
    fetchFeeAssignments,
    assignFeeToStudent,
    unassignFeeFromStudent,
    fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    uploadTransferSlip,
    prepareMonthlyBillingRoster,
    updateMonthlyBillingRosterMember,
    previewMonthlyBilling,
    postMonthlyBilling,
    createStudentDiscount,
    updateStudentDiscount,
    deleteStudentDiscount,
  };
}
