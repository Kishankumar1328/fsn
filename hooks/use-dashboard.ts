import useSWR from 'swr';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  return response.json();
};

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 10000,
  });

  const dashboardData = data?.data || null;

  return {
    data: dashboardData,
    isLoading,
    error,
    mutate,
  };
}
