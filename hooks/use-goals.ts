import useSWR from 'swr';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch goals');
  }

  return response.json();
};

export function useGoals() {
  const { data, error, isLoading, mutate } = useSWR('/api/goals', fetcher, {
    revalidateOnFocus: false,
  });

  const goals = data?.data || [];

  const createGoal = async (goalData: any) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(goalData),
    });

    if (!response.ok) {
      throw new Error('Failed to create goal');
    }

    mutate();
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
      throw new Error('Failed to update goal');
    }

    mutate();
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
      throw new Error('Failed to delete goal');
    }

    mutate();
  };

  return {
    goals,
    isLoading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    mutate,
  };
}
