'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/ui/StatsCard';
import { HiOutlineUsers, HiOutlineChartPie, HiOutlineAcademicCap, HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { api } from '@/lib/api';
import { StudentStats, ApiResponse } from '@/modules/students/types/student';

export default function StudentStatisticsPage() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get<ApiResponse<StudentStats>>('/students/stats');
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Header 
        title="สถิตินักเรียน (Student Statistics)" 
        subtitle="ภาพรวมและสถิติจำนวนนักเรียนแยกตามกลุ่มต่างๆ"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="นักเรียนทั้งหมด" 
          value={stats?.total || 0} 
          icon={HiOutlineUsers}
          trend={{ value: 0, label: 'จากปีการศึกษาที่แล้ว' }}
        />
        <StatsCard 
          title="กำลังศึกษา" 
          value={stats?.byStatus?.find(s => s.status === 'กำลังศึกษาอยู่')?.count || 0} 
          icon={HiOutlineAcademicCap}
          color="indigo"
        />
        <StatsCard 
          title="จำนวนระดับชั้น" 
          value={stats?.byGrade?.length || 0} 
          icon={HiOutlineChartPie}
          color="amber"
        />
        <StatsCard 
          title="จำนวนห้องเรียน" 
          value={stats?.byRoom?.length || 0} 
          icon={HiOutlineBuildingOffice2}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Grade */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HiOutlineChartPie className="text-primary-600" />
            จำนวนนักเรียนแยกตามระดับชั้น
          </h3>
          <div className="space-y-4">
            {stats?.byGrade?.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between items-end text-sm">
                  <span className="font-medium text-gray-700">{item.grade_name}</span>
                  <span className="font-bold text-gray-900">{item.count} คน</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(item.count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Room */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HiOutlineBuildingOffice2 className="text-secondary-600" />
            จำนวนนักเรียนแยกตามห้องเรียน
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {stats?.byRoom?.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">{item.grade_name}/{item.room_number}</span>
                <span className="font-bold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
