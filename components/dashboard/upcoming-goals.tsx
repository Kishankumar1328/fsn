import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Target, Flame } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils-format';

interface GoalItem {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: number;
  progress: number;
}

interface UpcomingGoalsProps {
  data: GoalItem[];
}

const GOAL_COLORS = [
  { bar: 'bg-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-600' },
  { bar: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  { bar: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
];

export function UpcomingGoals({ data }: UpcomingGoalsProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="rounded-2xl border h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Financial Goals</CardTitle>
          <p className="text-xs text-muted-foreground">Track your savings targets</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-48 gap-4 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            <Target className="h-6 w-6" />
          </div>
          <p className="text-sm">No active goals yet</p>
          <Link href="/dashboard/goals">
            <button className="flex items-center gap-2 h-8 px-4 rounded-xl border border-primary/30 text-primary font-semibold text-xs hover:bg-primary/10 transition">
              Create a Goal
            </button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Financial Goals</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Track your savings targets</p>
          </div>
          <Link href="/dashboard/goals">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.slice(0, 3).map((goal, idx) => {
          const colors = GOAL_COLORS[idx % GOAL_COLORS.length];
          const daysLeft = Math.max(0, Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24)));
          const isUrgent = daysLeft <= 30 && goal.progress < 80;

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold truncate">{goal.title}</h4>
                    {isUrgent && (
                      <Flame className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Due {formatDate(goal.deadline)} · {daysLeft}d left</p>
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} flex-shrink-0`}>
                  {goal.progress}%
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{formatCurrency(goal.current_amount)}</span>
                <span className="text-muted-foreground">of {formatCurrency(goal.target_amount)}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
