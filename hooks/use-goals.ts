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
    throw new Error('Failed to fetch goals');
  }

  return response.json();
};

export function useGoals() {
  const { data, error, isLoading, mutate } = useSWR('/api/goals', fetcher, {
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });

  const goals = (data?.data || []).map((goal: any) => ({
    ...goal,
    name: goal.title,
    currentAmount: goal.current_amount,
    targetAmount: goal.target_amount,
  }));

  const addGoal = async (goalData: any) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: goalData.name,
        target_amount: parseFloat(goalData.targetAmount),
        current_amount: parseFloat(goalData.currentAmount || '0'),
        deadline: new Date(goalData.deadline).getTime(),
        category: goalData.category || 'other',
        priority: goalData.priority || 'medium',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create goal');
    }

    await mutate();
  };

  const updateGoal = async (id: string, goalData: any) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(goalData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update goal');
    }

    await mutate();
  };

  const deleteGoal = async (id: string) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/goals/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete goal');
    }

    await mutate();
  };

  return {
    goals,
    loading: isLoading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    mutate,
  };
}
