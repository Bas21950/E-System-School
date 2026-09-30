'use client';

import { useState, useEffect } from 'react';
import { AcademicYear } from '@/types/master-data';
import ThaiDatePicker from '@/components/ui/ThaiDatePicker';

interface AcademicYearFormProps {
  initialData?: AcademicYear | null;
  onSubmit: (data: unknown) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function AcademicYearForm({ initialData, onSubmit, onCancel }: AcademicYearFormProps) {
  const [formData, setFormData] = useState({
    year: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        year: initialData.year || '',
        start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
        end_date: initialData.end_date ? initialData.end_date.split('T')[0] : '',
        is_current: initialData.is_current || false,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await onSubmit(formData);
      if (!res.success) setError(res.error || 'เกิดข้อผิดพลาด');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">ปีการศึกษา (พ.ศ.)</label>
          <input
            type="text"
            required
            className="input-field"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="เช่น 2567"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ThaiDatePicker
            label="วันที่เริ่ม"
            value={formData.start_date}
            onChange={(val) => setFormData(prev => ({ ...prev, start_date: val }))}
            disabled={loading}
          />
          <ThaiDatePicker
            label="วันที่สิ้นสุด"
            value={formData.end_date}
            onChange={(val) => setFormData(prev => ({ ...prev, end_date: val }))}
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <input
            type="checkbox"
            id="is_current"
            className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            checked={formData.is_current}
            onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
          />
          <label htmlFor="is_current" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
            ตั้งเป็นปีการศึกษาปัจจุบัน
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-6 border-t font-medium">
        <button type="button" onClick={onCancel} className="btn-secondary">ยกเลิก</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : initialData ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
        </button>
      </div>
    </form>
  );
}
