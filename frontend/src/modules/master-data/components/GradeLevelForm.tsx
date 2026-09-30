'use client';

import { useState, useEffect } from 'react';
import { GradeLevel, EducationLevel } from '@/types/master-data';

interface GradeLevelFormProps {
  initialData?: GradeLevel | null;
  educationLevels: EducationLevel[];
  onSubmit: (data: unknown) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function GradeLevelForm({ initialData, educationLevels, onSubmit, onCancel }: GradeLevelFormProps) {
  const [formData, setFormData] = useState({
    level_id: '',
    name: '',
    short_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        level_id: initialData.level_id || '',
        name: initialData.name || '',
        short_name: initialData.short_name || '',
      });
    } else if (educationLevels.length > 0) {
      setFormData(prev => ({ ...prev, level_id: educationLevels[0].id }));
    }
  }, [initialData, educationLevels]);

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
          <label className="block text-sm font-bold text-gray-700 mb-1">ระดับการศึกษา</label>
          <select
            className="input-field"
            value={formData.level_id}
            onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
            required
          >
            <option value="">เลือกการศึกษา</option>
            {educationLevels.map(el => (
              <option key={el.id} value={el.id}>{el.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อระดับชั้น</label>
          <input
            type="text"
            required
            className="input-field"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="เช่น ชั้นประถมศึกษาปีที่ 1"
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
            placeholder="เช่น ป.1"
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
