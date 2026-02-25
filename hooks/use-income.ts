import useSWR from 'swr';
import { Income } from '@/lib/types';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch income');
  }

  return response.json();
};

export function useIncome() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: { incomes: Income[] } }>('/api/income', fetcher, {
    revalidateOnFocus: false,
  });

  const addIncome = async (incomeData: Omit<Income, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...incomeData,
          date: new Date(incomeData.date).getTime(),
        }),
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
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/income/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/income/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete income');

      await mutate();
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  };

  return {
    income: data?.data?.incomes || [],
    loading: isLoading,
    error,
    addIncome,
    updateIncome,
    deleteIncome,
  };
}
