'use client';

import { useState, useEffect } from 'react';
import { Semester, AcademicYear } from '@/types/master-data';
import { api } from '@/lib/api';
import { ApiResponse } from '@/modules/students/types/student';
import ThaiDatePicker from '@/components/ui/ThaiDatePicker';

interface SemesterFormProps {
  initialData?: Semester | null;
  onSubmit: (data: unknown) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function SemesterForm({ initialData, onSubmit, onCancel }: SemesterFormProps) {
  const [formData, setFormData] = useState({
    academic_year_id: '',
    semester: '',
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await api.get<ApiResponse<AcademicYear[]>>('/academic-years');
        setAcademicYears(res.data || []);
      } catch (err) {
        console.error('Failed to fetch years', err);
      }
    }
    fetchYears();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        academic_year_id: initialData.academic_year_id || '',
        semester: initialData.semester || '',
        start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
        end_date: initialData.end_date ? initialData.end_date.split('T')[0] : '',
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ปีการศึกษา</label>
            <select
              required
              className="input-field"
              value={formData.academic_year_id}
              onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
            >
              <option value="">เลือกปีการศึกษา</option>
              {academicYears.map((y: AcademicYear) => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ภาคเรียน</label>
            <select
              className="input-field"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              required
            >
              <option value="">เลือกภาคเรียน</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="ฤดูร้อน">ฤดูร้อน</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ThaiDatePicker
            label="วันที่เริ่ม"
            value={formData.start_date}
            onChange={(val: string) => setFormData(prev => ({ ...prev, start_date: val }))}
            disabled={loading}
          />
          <ThaiDatePicker
            label="วันที่สิ้นสุด"
            value={formData.end_date}
            onChange={(val: string) => setFormData(prev => ({ ...prev, end_date: val }))}
            disabled={loading}
          />
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
