import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Student, CreateStudentInput, ApiResponse, ImportResult } from '../types/student';

// Type for the filters used in the hook
interface StudentFilters extends Record<string, unknown> {
  page?: number;
  limit?: number;
  search?: string;
  academicYearId?: string;
  grade?: string;
  room?: string;
  status?: string;
}

const fetcher = <T,>(url: string) => api.get<ApiResponse<T>>(url).then(res => res);

export function useStudents(filters: StudentFilters = {}) {
  // 1. Fetch Students with SWR
  const query = useMemo(() => {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') q.append(key, String(value));
    });
    return q.toString();
  }, [filters]);

  const studentsKey = `/students?${query}`;
  const { 
    data: studentsResponse, 
    error: studentsError, 
    isLoading: studentsLoading,
    mutate: mutateStudents
  } = useSWR<ApiResponse<Student[]>>(studentsKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  // 2. Fetch Filter Options (Cached for 1 hour)
  const optionsKey = '/students/options';
  const { 
    data: optionsResponse, 
    mutate: mutateOptions 
  } = useSWR<ApiResponse<{ 
    grades: { id: string; name: string }[]; 
    rooms: { id: string; room_number: string; grade_id: string }[]; 
    academicYears: { id: string; year: string; is_current: boolean }[];
    semesters: { id: string; academic_year_id: string; semester: string }[];
  }>>(optionsKey, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 3600000, // 1 hour
  });

  const students: Student[] = studentsResponse?.data || [];
  const total = studentsResponse?.meta?.total || 0;
  const loading = studentsLoading;
  const error = studentsError instanceof Error ? studentsError.message : (studentsError ? String(studentsError) : null);
  
  const filterOptions = optionsResponse?.data || { 
    grades: [], 
    rooms: [], 
    academicYears: [],
    semesters: []
  };

  // Manual fetch function (triggers revalidation)
  const fetchStudents = useCallback(async () => {
    await mutateStudents();
  }, [mutateStudents]);

  const fetchFilterOptions = useCallback(async () => {
    await mutateOptions();
  }, [mutateOptions]);

  const createStudent = async (data: CreateStudentInput) => {
    try {
      await api.post('/students', data);
      mutateStudents(); // Refresh student list
      mutateOptions();  // Refresh options
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const updateStudent = async (id: string, data: Partial<CreateStudentInput>) => {
    try {
      await api.put(`/students/${id}`, data);
      mutateStudents();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await api.delete(`/students/${id}`);
      mutateStudents();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const importExcel = async (file: File, preview = false): Promise<ImportResult> => {
    try {
      const res = await api.upload<ApiResponse<ImportResult>>(`/students/import?preview=${preview}`, file);
      if (res.success && res.data) {
        if (!preview) {
          mutateStudents();
          mutateOptions();
        }
        return res.data;
      }
      throw new Error(res.error || 'Import failed');
    } catch (err: unknown) {
      throw err;
    }
  };

  return {
    students,
    total,
    loading,
    error,
    filterOptions,
    fetchStudents,
    fetchFilterOptions,
    createStudent,
    updateStudent,
    deleteStudent,
    importExcel,
  };
}
