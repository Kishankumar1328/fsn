'use client';

import { useInsights } from '@/hooks/use-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Lightbulb, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-format';

export default function InsightsPage() {
  const { insights, summary, loading } = useInsights();

  const getInsightIcon = (type: string, severity: string) => {
    if (type === 'budget_warning') {
      return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
    if (type === 'saving_opportunity') {
      return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    }
    if (type === 'trend') {
      return severity === 'success' ? (
        <TrendingDown className="w-5 h-5 text-green-600" />
      ) : (
        <TrendingUp className="w-5 h-5 text-orange-600" />
      );
    }
    if (type === 'goal_progress') {
      return <Target className="w-5 h-5 text-blue-600" />;
    }
    return <Lightbulb className="w-5 h-5 text-primary" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900';
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Insights</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered analysis of your spending habits and personalized recommendations
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalSpending)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.categoriesTracked}</div>
              <p className="text-xs text-muted-foreground mt-1">Being tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.budgetsOnTrack}</div>
              <p className="text-xs text-muted-foreground mt-1">Budgets on track</p>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Generating insights...</p>
          </CardContent>
        </Card>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No insights available yet. Start tracking your expenses to get personalized recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <Card key={index} className={`border-2 ${getSeverityColor(insight.severity)}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getInsightIcon(insight.type, insight.severity)}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <CardDescription className="mt-2">{insight.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
