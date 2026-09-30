'use client';

import { useState, useEffect, useMemo } from 'react';
import { THAI_MONTHS, toBE, toCE, getBEYears } from '@/lib/dateUtils';

interface ThaiDatePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function ThaiDatePicker({
  value,
  onChange,
  label,
  required,
  disabled,
  className = '',
}: ThaiDatePickerProps) {
  // Parse initial value (expected ISO date string YYYY-MM-DD or full ISO)
  const parsedValue = useMemo(() => {
    if (!value) return null;
    
    // Safety check for YYYY-MM-DD format to avoid timezone shifts
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }

    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate()
    };
  }, [value]);

  const [day, setDay] = useState<number>(parsedValue ? parsedValue.day : 0);
  const [month, setMonth] = useState<number>(parsedValue ? parsedValue.month : 0);
  const [yearBE, setYearBE] = useState<number>(parsedValue ? toBE(parsedValue.year) : 0);

  // Update internal state when value prop changes
  useEffect(() => {
    if (parsedValue) {
      setDay(parsedValue.day);
      setMonth(parsedValue.month);
      setYearBE(toBE(parsedValue.year));
    } else if (!value) {
      setDay(0);
      setMonth(0);
      setYearBE(0);
    }
  }, [parsedValue, value]);

  const days = useMemo(() => {
    if (!yearBE || month === undefined) return Array.from({ length: 31 }, (_, i) => i + 1);
    const ceYear = toCE(yearBE);
    const date = new Date(ceYear, month + 1, 0);
    return Array.from({ length: date.getDate() }, (_, i) => i + 1);
  }, [month, yearBE]);

  const years = useMemo(() => getBEYears(100, 10), []);

  const handleDateChange = (newDay: number, newMonth: number, newYearBE: number) => {
    if (newDay && newMonth !== undefined && newYearBE) {
      const ceYear = toCE(newYearBE);
      // Manually format to YYYY-MM-DD to avoid timezone shifts
      const monthStr = String(newMonth + 1).padStart(2, '0');
      const dayStr = String(newDay).padStart(2, '0');
      const formatted = `${ceYear}-${monthStr}-${dayStr}`;
      onChange(formatted);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        {/* Day */}
        <select
          value={day || ''}
          onChange={(e) => {
            const val = Number(e.target.value);
            setDay(val);
            handleDateChange(val, month, yearBE);
          }}
          disabled={disabled}
          className="select-field flex-1"
          required={required}
        >
          <option value="">วัน</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Month */}
        <select
          value={month === undefined ? '' : month}
          onChange={(e) => {
            const val = Number(e.target.value);
            setMonth(val);
            handleDateChange(day, val, yearBE);
          }}
          disabled={disabled}
          className="select-field flex-[2]"
          required={required}
        >
          <option value="">เดือน</option>
          {THAI_MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>

        {/* Year */}
        <select
          value={yearBE || ''}
          onChange={(e) => {
            const val = Number(e.target.value);
            setYearBE(val);
            handleDateChange(day, month, val);
          }}
          disabled={disabled}
          className="select-field flex-[1.5]"
          required={required}
        >
          <option value="">ปี (พ.ศ.)</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
