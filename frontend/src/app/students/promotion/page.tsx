'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { 
  HiOutlineSparkles, 
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function PromotionPage() {
  const [academicYears, setAcademicYears] = useState<unknown[]>([]);
  const [sourceYear, setSourceYear] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const res: { data: unknown[] } = await api.get('/academic-years');
      setAcademicYears(res.data);
      
      const yData = res.data as { id: string, is_current: boolean }[];
      const current = yData.find(y => y.is_current);
      if (current) setSourceYear(current.id);
    } catch (err: unknown) {
      console.error('Fetch years error:', err);
      toast.error('ไม่สามารถโหลดปีการศึกษาได้');
    }
  };

  const handlePromotion = async () => {
    if (!sourceYear || !targetYear) {
      toast.error('กรุณาเลือกปีการศึกษาต้นทางและปลายทาง');
      return;
    }

    if (sourceYear === targetYear) {
      toast.error('ปีการศึกษาต้นทางและปลายทางต้องต่างกัน');
      return;
    }

    setLoading(true);
    try {
      // เรียก RPC promote_students ผ่าน API (ถ้ามี endpoint รองรับ)
      // หรือเรียกผ่าน generic execute endpoint
      const res: { data: { promoted_count: number } } = await api.post('/enrollments/promote', {
        sourceYearId: sourceYear,
        targetYearId: targetYear
      });
      setResult(res.data.promoted_count);
      setStep(3);
      toast.success('เลื่อนชั้นนักเรียนสำเร็จ');
    } catch (err: unknown) {
      console.error('Promotion process error:', err);
      type ErrRes = { response?: { data?: { message?: string } } };
      toast.error(((err as ErrRes).response?.data?.message) || 'เกิดข้อผิดพลาดในการเลื่อนชั้น');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Header 
        title="เลื่อนชั้นนักเรียน" 
        subtitle="ระบบประมวลผลการปรับระดับชั้นนักเรียนแบบกลุ่ม (Batch Promotion Engine)"
      />

      {/* Process Stepper */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 -z-10"></div>
        {[1, 2, 3].map((s) => (
          <div 
            key={s}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
              step >= s ? 'bg-primary-600 text-white ring-4 ring-primary-50' : 'bg-white text-gray-400 border border-gray-200'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      <div className="glass-card p-8 border-none shadow-sm min-h-[400px] flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <HiOutlineSparkles size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">ระบุปีการศึกษาที่จะดำเนินการ</h2>
              <p className="text-gray-500">ระบบจะทำการก๊อปปี้รายชื่อนักเรียนจากปีการศึกษาเดิมไปยังปีการศึกษาใหม่พร้อมเลื่อนชั้นให้อัตโนมัติ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto items-center">
              <div className="space-y-2 text-left">
                <label className="text-sm font-bold text-gray-700">ปีการศึกษาต้นทาง (เดิม)</label>
                <select 
                  value={sourceYear}
                  onChange={(e) => setSourceYear(e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl py-3 font-sans"
                >
                  <option value="">-- เลือกปีการศึกษา --</option>
                  {(academicYears as { id: string, year: string, is_current: boolean }[]).map(y => (
                    <option key={y.id} value={y.id}>{y.year} {y.is_current ? '(ปัจจุบัน)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="hidden md:block">
                <HiOutlineArrowRight className="text-primary-500 mx-auto" size={32} />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-sm font-bold text-gray-700">ปีการศึกษาปลายทาง (ใหม่)</label>
                <select 
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl py-3 font-sans"
                >
                  <option value="">-- เลือกปีการศึกษา --</option>
                  {(academicYears as { id: string, year: string }[]).map(y => (
                    <option key={y.id} value={y.id}>{y.year}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!sourceYear || !targetYear || sourceYear === targetYear}
              className="btn-primary px-12 py-4 rounded-2xl text-lg font-bold disabled:opacity-50 mt-4"
            >
              ตรวจสอบความพร้อม
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-amber-100/50">
              <HiOutlineExclamationTriangle size={40} />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">ยืนยันการเลื่อนชั้นแบบกลุ่ม</h2>
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 max-w-md mx-auto space-y-2">
                <p className="text-amber-800 font-medium">คำสำคัญของการประมวลผล:</p>
                <ul className="text-amber-700 text-sm list-disc list-inside text-left">
                  <li>นักเรียน ป.1 จะถูกเลื่อนเป็น ป.2 อัตโนมัติ</li>
                  <li>นักเรียน ป.6 และ ม.6 จะไม่ถูกเลื่อน (ต้องดำเนินการจบการศึกษา)</li>
                  <li>ห้องเรียนจะถูกจับคู่ตามเลขเดิม (เช่น 1/1 -{'>'} 2/1)</li>
                  <li>ระบบจะไม่กระทบนักเรียนที่ลงทะเบียนในปีใหม่ไว้แล้ว</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4 max-w-md mx-auto">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold hover:bg-gray-50 transition-all font-sans"
              >
                ย้อนกลับ
              </button>
              <button 
                onClick={handlePromotion}
                disabled={loading}
                className="flex-2 bg-primary-600 text-white rounded-2xl font-bold py-4 px-8 hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2 font-sans"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังประมวลผล...</span>
                  </>
                ) : (
                  <span>เริ่มประมวลผลทันที</span>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 text-center animate-in bounce-in duration-500">
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
              <HiOutlineCheckCircle size={60} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900">ประมวลผลสำเร็จ!</h2>
              <p className="text-gray-500 text-lg">เลื่อนชั้นนักเรียนเรียบร้อยแล้วจำนวน</p>
              <div className="text-6xl font-black text-primary-600 py-4 animate-pulse">
                {result}
              </div>
              <p className="text-gray-500">รายการ</p>
            </div>

            <button 
              onClick={() => window.location.href = '/students/enrollment'}
              className="btn-primary px-12 py-4 rounded-2xl text-lg font-bold mt-4"
            >
              ไปหน้าตรวจสอบข้อมูล
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
