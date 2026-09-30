'use client';

import { useState, useEffect } from 'react';
import { EducationLevel } from '@/types/master-data';

interface EducationLevelFormProps {
  initialData?: EducationLevel | null;
  onSubmit: (data: unknown) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function EducationLevelForm({ initialData, onSubmit, onCancel }: EducationLevelFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        short_name: initialData.short_name || '',
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
          <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อระดับการศึกษา</label>
          <input
            type="text"
            required
            className="input-field"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="เช่น ประถมศึกษา, มัธยมศึกษาตอนต้น"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">อักษรย่อ</label>
          <input
            type="text"
            required
            className="input-field"
            value={formData.short_name}
            onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
            placeholder="เช่น ป., ม.ต้น"
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
