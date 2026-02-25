import useSWR from 'swr';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch budgets');
  }

  return response.json();
};

export function useBudgets() {
  const { data, error, isLoading, mutate } = useSWR('/api/budgets', fetcher, {
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });

  const budgets = (data?.data || []).map((budget: any) => ({
    ...budget,
    spent: budget.spent_amount,
    limit: budget.limit_amount,
  }));

  const addBudget = async (budgetData: any) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        category: budgetData.category,
        limit_amount: parseFloat(budgetData.limit),
        spent_amount: parseFloat(budgetData.spent || '0'),
        period: 'monthly',
        start_date: Date.now(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create budget');
    }

    await mutate();
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update budget');
    }

    // Force a re-validation to ensure UI is in sync with the database
    await mutate();
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete budget');
    }

    await mutate();
  };

  return {
    budgets,
    loading: isLoading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    mutate,
  };
}
