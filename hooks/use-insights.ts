'use client';

import useSWR from 'swr';

interface Insight {
  type: 'spending_pattern' | 'budget_warning' | 'saving_opportunity' | 'goal_progress' | 'trend';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success';
  data?: any;
}

interface InsightsSummary {
  insights: Insight[];
  summary: {
    totalSpending: number;
    categoriesTracked: number;
    budgetsOnTrack: number;
  };
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch insights');
  }

  return response.json();
};

export function useInsights() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: InsightsSummary }>('/api/insights', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });

  const insightsData = data?.data;

  return {
    insights: insightsData?.insights || [],
    summary: insightsData?.summary,
    loading: isLoading,
    error,
  };
}
