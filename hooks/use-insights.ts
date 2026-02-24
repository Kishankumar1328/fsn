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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useInsights() {
  const { data, error, isLoading } = useSWR<InsightsSummary>('/api/insights', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });

  return {
    insights: data?.insights || [],
    summary: data?.summary,
    loading: isLoading,
    error,
  };
}
