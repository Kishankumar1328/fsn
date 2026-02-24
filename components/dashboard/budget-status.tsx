import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-format';

interface BudgetStatusProps {
  data: Array<{
    category: string;
    spent: number;
    limit: number;
    threshold: number;
  }>;
}

export function BudgetStatus({ data }: BudgetStatusProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Status</CardTitle>
          <CardDescription>Current month spending vs budget</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No budget data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Status</CardTitle>
        <CardDescription>Current month spending vs budget</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          const isOverBudget = percentage > 100;
          const isNearLimit = percentage >= budget.threshold && percentage <= 100;

          return (
            <div key={budget.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{budget.category}</span>
                <span className={`text-sm font-semibold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                </span>
              </div>
              <Progress
                value={Math.min(percentage, 100)}
                className="h-2"
                indicatorClassName={isOverBudget ? 'bg-destructive' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'}
              />
              {isOverBudget && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Over budget by {formatCurrency(budget.spent - budget.limit)}
                  </AlertDescription>
                </Alert>
              )}
              {isNearLimit && !isOverBudget && (
                <p className="text-xs text-yellow-700 dark:text-yellow-500">
                  {Math.round(100 - percentage)}% remaining
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
