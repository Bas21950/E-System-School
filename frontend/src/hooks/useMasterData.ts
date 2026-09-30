import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { ApiResponse } from '@/modules/students/types/student';

export function useMasterData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<T[]>>(endpoint);
      if (res.data) {
        setData(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const create = async (input: unknown) => {
    try {
      await api.post(endpoint, input);
      fetchData();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const update = async (id: string, input: unknown) => {
    try {
      await api.put(`${endpoint}/${id}`, input);
      fetchData();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      fetchData();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  return {
    data,
    loading,
    error,
    fetchData,
    create,
    update,
    remove,
  };
}
