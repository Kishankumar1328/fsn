import useSWR from 'swr';
import { Income } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useIncome() {
  const { data, error, isLoading, mutate } = useSWR<{ income: Income[] }>('/api/income', fetcher, {
    revalidateOnFocus: false,
  });

  const addIncome = async (incomeData: Omit<Income, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomeData),
      });

      if (!response.ok) throw new Error('Failed to add income');

      await mutate();
      return await response.json();
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  };

  const updateIncome = async (id: string, incomeData: Partial<Income>) => {
    try {
      const response = await fetch(`/api/income/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomeData),
      });

      if (!response.ok) throw new Error('Failed to update income');

      await mutate();
      return await response.json();
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      const response = await fetch(`/api/income/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete income');

      await mutate();
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  };

  return {
    income: data?.income || [],
    loading: isLoading,
    error,
    addIncome,
    updateIncome,
    deleteIncome,
  };
}
