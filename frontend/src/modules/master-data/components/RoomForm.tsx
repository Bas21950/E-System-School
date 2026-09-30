'use client';

import { useState, useEffect } from 'react';
import { Room, GradeLevel } from '@/types/master-data';

interface RoomFormProps {
  initialData?: Room | null;
  gradeLevels: GradeLevel[];
  onSubmit: (data: unknown) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function RoomForm({ initialData, gradeLevels, onSubmit, onCancel }: RoomFormProps) {
  const [formData, setFormData] = useState({
    grade_id: '',
    room_number: '',
    room_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        grade_id: initialData.grade_id || '',
        room_number: initialData.room_number || '',
        room_code: initialData.room_code || '',
      });
    } else if (gradeLevels.length > 0) {
      setFormData(prev => ({ ...prev, grade_id: gradeLevels[0].id }));
    }
  }, [initialData, gradeLevels]);

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
          <label className="block text-sm font-bold text-gray-700 mb-1">ระดับชั้น</label>
          <select
            className="input-field"
            value={formData.grade_id}
            onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
            required
          >
            <option value="">เลือกระดับชั้น</option>
            {gradeLevels.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">เลขห้อง (เช่น 1, 2)</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="1"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">รหัสห้อง (ถ้ามี)</label>
            <input
              type="text"
              className="input-field"
              value={formData.room_code}
              onChange={(e) => setFormData({ ...formData, room_code: e.target.value })}
              placeholder="R01"
            />
          </div>
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
