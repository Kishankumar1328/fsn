import useSWR from 'swr';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch budgets');
  }

  return response.json();
};

export function useBudgets() {
  const { data, error, isLoading, mutate } = useSWR('/api/budgets', fetcher, {
    revalidateOnFocus: false,
  });

  const budgets = data?.data || [];

  const createBudget = async (budgetData: any) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(budgetData),
    });

    if (!response.ok) {
      throw new Error('Failed to create budget');
    }

    mutate();
  };

  const updateBudget = async (id: string, budgetData: any) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/budgets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(budgetData),
    });

    if (!response.ok) {
      throw new Error('Failed to update budget');
    }

    mutate();
  };

  const deleteBudget = async (id: string) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/budgets/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete budget');
    }

    mutate();
  };

  return {
    budgets,
    isLoading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    mutate,
  };
}
