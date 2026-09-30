'use client';

import React from 'react';
import { HiOutlineXMark, HiOutlinePrinter, HiOutlineCheckCircle } from 'react-icons/hi2';



interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: {
    receipt_no: string;
    payment_date: string;
    student_name: string;
    student_id: string | undefined;
    class: string;
    room: string;
    semester: string;
    academic_year: string;
    total: number;
    items: { name: string; amount: number }[];
  };
}

export default function ReceiptPreview({ isOpen, onClose, onConfirm, data }: ReceiptPreviewProps) {
  if (!isOpen) return null;

  const ReceiptCard = ({ type }: { type: 'ORIGINAL' | 'COPY' }) => (
    <div className="bg-white p-[10mm] shadow-sm border border-gray-200 text-[#000] font-serif w-[148mm] mx-auto min-h-[210mm] flex flex-col box-border">
      {/* School Header Table */}
      <table className="w-full mb-2">
        <tr>
          <td className="w-[60px] h-[60px] border border-gray-300 text-[8px] text-center flex items-center justify-center">LOGO</td>
          <td className="pl-4 text-left">
            <div className="text-xl font-bold leading-tight">โรงเรียนสหวิทยานุสรณ์</div>
            <div className="text-[10px] leading-tight">
              123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110<br />
              โทรศัพท์: 02-123-4567
            </div>
          </td>
        </tr>
      </table>

      {/* Document Title */}
      <div className="text-center my-4">
        <h2 className="text-2xl font-bold underline decoration-1 underline-offset-4 m-0 p-0 tracking-tight">ใบเสร็จรับเงิน</h2>
        <div className="text-[11px] font-normal mt-1 italic">
          ({type === 'COPY' ? 'ฉบับสำเนา สำหรับฝ่ายการเงิน' : 'ฉบับจริง สำหรับนักเรียน'})
        </div>
      </div>

      {/* Metadata Table */}
      <table className="w-full text-xs mb-4 border-none">
        <tr>
          <td className="py-1"><strong>เลขที่ใบเสร็จ:</strong> {data.receipt_no}</td>
          <td className="py-1 text-right"><strong>วันที่:</strong> {data.payment_date}</td>
        </tr>
        <tr>
          <td className="py-1"><strong>ชื่อ-นามสกุล นักเรียน:</strong> {data.student_name}</td>
          <td className="py-1 text-right"><strong>รหัสประจำตัว:</strong> {data.student_id}</td>
        </tr>
        <tr>
          <td className="py-1"><strong>ชั้น / ห้อง:</strong> {data.class} / {data.room}</td>
          <td className="py-1 text-right"><strong>ภาคเรียน/ปีการศึกษา:</strong> {data.semester} / {data.academic_year}</td>
        </tr>
      </table>

      {/* Items Table */}
      <table className="w-full text-xs border-collapse border border-black mb-auto">
        <thead>
          <tr className="bg-gray-50 font-bold">
            <th className="border border-black p-2 text-center w-12">ลำดับที่</th>
            <th className="border border-black p-2 text-left">รายละเอียด</th>
            <th className="border border-black p-2 text-right w-32">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-black p-2 text-center">{idx + 1}</td>
              <td className="border border-black p-2">{item.name}</td>
              <td className="border border-black p-2 text-right px-4">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
          {/* Fill empty rows to maintain size - 8 rows total */}
          {Array.from({ length: Math.max(0, 8 - data.items.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-black p-2 text-center">&nbsp;</td>
              <td className="border border-black p-2 h-7">&nbsp;</td>
              <td className="border border-black p-2 text-right">&nbsp;</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-slate-50">
            <td colSpan={2} className="border border-black p-2 text-right uppercase tracking-wider">ยอดรวมทั้งสิ้น (TOTAL)</td>
            <td className="border border-black p-2 text-right px-4">{data.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>

      {/* Footer Table (Signature + QR) */}
      <table className="w-full mt-6">
        <tr>
          <td className="text-center w-[60%] pt-8">
            ลงชื่อ......................................................ผู้รับเงิน<br />
            (......................................................)<br />
            <span className="text-[10px] text-gray-600">เจ้าหน้าที่การเงิน</span>
          </td>
          <td className="w-[40%] text-right align-bottom">
             <div className="inline-block text-center">
               <div className="w-16 h-16 bg-gray-50 border border-gray-200 flex items-center justify-center mb-1 mx-auto">
                 <div className="text-[6px] text-gray-300">QR CODE</div>
               </div>
               <div className="text-[8px] text-gray-400">ตรวจสอบใบเสร็จ</div>
             </div>
          </td>
        </tr>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-100 w-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/20">
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shadow-inner">
               <HiOutlinePrinter size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">ตัวอย่างใบเสร็จก่อนพิมพ์</h2>
              <p className="text-xs text-slate-500 font-medium italic">ตรวจสอบ Layout แบบ 2-up A4 (สำเนา + ตัวจริง)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <HiOutlineXMark size={24} />
          </button>
        </div>

        {/* Content - Scrollable area for 2-up preview */}
        <div className="flex-1 overflow-auto p-12 bg-slate-200/50 flex justify-center items-start gap-8 min-w-fit">
           <div className="flex gap-4 p-8 bg-white shadow-xl border border-white/50 relative group">
              {/* Vertical Dashed Line Representing A4 perforation */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-dashed border-slate-300 z-10"></div>
              
              <div className="relative z-0 scale-[0.85] origin-top">
                <ReceiptCard type="COPY" />
              </div>
              <div className="relative z-0 scale-[0.85] origin-top">
                <ReceiptCard type="ORIGINAL" />
              </div>

              {/* A4 Label */}
              <div className="absolute -top-6 left-4 px-3 py-1 bg-slate-800 text-white text-[10px] font-black rounded-t-lg tracking-widest uppercase">
                 Paper: ISO A4 (Landscape)
              </div>
           </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-white border-t border-gray-200 flex justify-end gap-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200"
          >
            ยกเลิก
          </button>
          <button 
            onClick={onConfirm}
            className="px-8 py-2.5 rounded-xl font-black bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[0] transition-all flex items-center gap-2 group shadow-primary-500/20 shadow-lg"
          >
            <HiOutlineCheckCircle size={20} className="group-hover:scale-110 transition-transform" />
            ยืนยันและส่งพิมพ์ PDF
          </button>
        </div>
      </div>
    </div>
  );
}
