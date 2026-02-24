import useSWR from 'swr';
import { UserProfile } from '@/lib/types';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch');
  }

  return response.json();
};

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: UserProfile }>(
    '/api/user/profile',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  const user = data?.data || null;
  const isAuthenticated = !!user && !error;

  const logout = async () => {
    try {
      localStorage.removeItem('authToken');
      await fetch('/api/auth/logout', { method: 'POST' });
      mutate(undefined, false);
      // Redirect to sign in page
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout,
    mutate,
  };
}
