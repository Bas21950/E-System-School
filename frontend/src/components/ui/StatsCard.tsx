'use client';

import { IconType } from 'react-icons';

interface StatsCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon: IconType | React.ReactNode;
  color?: 'indigo' | 'blue' | 'pink' | 'emerald' | 'amber' | 'red' | 'primary';
  delay?: number;
  trend?: { value: number; label: string };
}

const colorMap: Record<string, { bg: string; shadow: string; iconBg: string }> = {
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    shadow: 'shadow-indigo-500/30',
    iconBg: 'bg-white/20',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/30',
    iconBg: 'bg-white/20',
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-500 to-pink-600',
    shadow: 'shadow-pink-500/30',
    iconBg: 'bg-white/20',
  },
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/30',
    iconBg: 'bg-white/20',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/30',
    iconBg: 'bg-white/20',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500 to-red-600',
    shadow: 'shadow-red-500/30',
    iconBg: 'bg-white/20',
  },
  primary: {
    bg: 'bg-gradient-to-br from-primary-500 to-primary-600',
    shadow: 'shadow-primary-500/30',
    iconBg: 'bg-white/20',
  },
};

export default function StatsCard({ title, value, suffix, icon, color = 'indigo', delay = 0, trend }: StatsCardProps) {
  const colors = colorMap[color] || colorMap.indigo;

  // Support both IconType (component) and ReactNode
  const IconElement = typeof icon === 'function' ? icon : null;

  return (
    <div
      className={`
        ${colors.bg} ${colors.shadow}
        rounded-2xl p-6 text-white shadow-xl
        transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]
        animate-slide-up
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-3xl font-bold mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-sm font-medium opacity-80 ml-1">{suffix}</span>}
          </p>
          {trend && (
            <p className="text-xs text-white/60 mt-1">{trend.label}</p>
          )}
        </div>
        <div className={`${colors.iconBg} p-3 rounded-xl`}>
          {IconElement ? <IconElement size={28} /> : (icon as React.ReactNode)}
        </div>
      </div>
    </div>
  );
}
