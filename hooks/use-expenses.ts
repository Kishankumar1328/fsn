import useSWR from 'swr';
import { Expense } from '@/lib/types';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch expenses');
  }

  return response.json();
};

export function useExpenses(page = 1, limit = 20, category?: string) {
  let url = `/api/expenses?page=${page}&limit=${limit}`;
  if (category) {
    url += `&category=${category}`;
  }

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
  });

  const expenses = data?.data?.expenses || [];
  const pagination = data?.data?.pagination;

  const createExpense = async (expenseData: any) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create expense');
    }

    const newExpense = await response.json();
    mutate();
    return newExpense;
  };

  const updateExpense = async (id: string, expenseData: any) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      throw new Error('Failed to update expense');
    }

    mutate();
  };

  const deleteExpense = async (id: string) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }

    mutate();
  };

  return {
    expenses,
    pagination,
    loading: isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    mutate,
  };
}
