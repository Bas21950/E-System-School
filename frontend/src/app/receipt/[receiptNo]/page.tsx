'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Payment } from '@/modules/finance/types/finance';
import { HiOutlineCheckBadge, HiOutlineXCircle } from 'react-icons/hi2';

export default function ReceiptVerificationPage() {
  const { receiptNo } = useParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        // We'll need a new endpoint for fetching by receipt number
        const res = await api.get<{ data: Payment }>(`/finance/payments/receipt/${receiptNo}`);
        setPayment(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'ไม่พบข้อมูลใบเสร็จ';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    if (receiptNo) fetchReceipt();
  }, [receiptNo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <HiOutlineXCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ตรวจสอบไม่พบข้อมูล</h1>
          <p className="text-gray-500 mb-6">{error || 'ใบเสร็จนี้อาจไม่มีอยู่ในระบบ หรือถูกยกเลิกแล้ว'}</p>
          <a href="/" className="btn-primary inline-block">กลับสู่หน้าหลัก</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-500 p-8 text-center text-white">
            <HiOutlineCheckBadge size={80} className="mx-auto mb-4" />
            <h1 className="text-2xl font-black">ใบเสร็จถูกต้อง</h1>
            <p className="opacity-90">ตรวจสอบโดยระบบบริหารโรงเรียน</p>
          </div>

          {/* Details */}
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-1">เลขที่ใบเสร็จ</div>
              <div className="text-3xl font-mono font-black text-gray-900">{payment.receipt_no}</div>
            </div>

            <hr className="border-dashed" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">ชื่อนักเรียน</span>
                <span className="font-bold text-gray-900">{payment.student_info?.first_name} {payment.student_info?.last_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">รหัสนักเรียน</span>
                <span className="font-mono text-gray-700">{payment.student_info?.student_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">วันที่ชำระ</span>
                <span className="text-gray-900">{new Date(payment.payment_date).toLocaleDateString('th-TH', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">ช่องทางการชำระ</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold uppercase">{payment.payment_method}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-sm text-gray-500 mb-2">รายการที่ชำระ:</div>
              <div className="space-y-2">
                {payment.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.student_fee_info?.fee_plan_info?.name || 'รายการทั่วไป'}</span>
                    <span className="font-bold">{item.amount.toLocaleString()} ฿</span>
                  </div>
                ))}
              </div>
              <hr className="my-3" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">ยอดรวมทั้งสิ้น</span>
                <span className="text-xl font-black text-emerald-600">{payment.total_amount.toLocaleString()} ฿</span>
              </div>
            </div>
            
            <div className="text-center text-[10px] text-gray-300">
               วันที่ตรวจสอบ: {new Date().toLocaleString('th-TH')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
