import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
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
      <Card className="rounded-2xl border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Budget Status</CardTitle>
          <p className="text-xs text-muted-foreground">Current month vs limits</p>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-sm">No budgets configured</p>
        </CardContent>
      </Card>
    );
  }

  const overCount = data.filter(b => (b.spent / b.limit) * 100 > 100).length;
  const healthPercent = Math.round(((data.length - overCount) / data.length) * 100);

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Budget Status</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Current month vs limits</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">On track</p>
            <p className={`font-extrabold text-lg ${healthPercent === 100 ? 'text-green-500' : healthPercent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {healthPercent}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.slice(0, 5).map((budget) => {
          const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
          const rawPercentage = (budget.spent / budget.limit) * 100;
          const isOverBudget = rawPercentage > 100;
          const isNearLimit = rawPercentage >= budget.threshold && rawPercentage <= 100;

          const barColor = isOverBudget
            ? 'bg-red-500'
            : isNearLimit
              ? 'bg-amber-500'
              : 'bg-emerald-500';

          const statusIcon = isOverBudget
            ? <AlertTriangle className="h-3 w-3 text-red-500" />
            : isNearLimit
              ? <Zap className="h-3 w-3 text-amber-500" />
              : <CheckCircle2 className="h-3 w-3 text-emerald-500" />;

          return (
            <div key={budget.category} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {statusIcon}
                  <span className="text-sm font-medium capitalize">{budget.category}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${isOverBudget ? 'text-red-500' : 'text-foreground'}`}>
                    {formatCurrency(budget.spent)}
                  </span>
                  <span className="text-xs text-muted-foreground"> / {formatCurrency(budget.limit)}</span>
                </div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {isOverBudget && (
                <p className="text-xs text-red-500 font-medium">
                  Over by {formatCurrency(budget.spent - budget.limit)}
                </p>
              )}
              {isNearLimit && !isOverBudget && (
                <p className="text-xs text-amber-600 font-medium">
                  {Math.round(100 - rawPercentage)}% remaining — stay disciplined!
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
