import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target } from 'lucide-react';
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

export function UpcomingGoals({ data }: UpcomingGoalsProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Goals</CardTitle>
          <CardDescription>Track your savings goals</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Target className="h-8 w-8" />
          <p>No active goals. Create one to get started!</p>
          <Link href="/dashboard/goals">
            <Button variant="outline" size="sm">
              Create Goal
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Financial Goals</CardTitle>
          <CardDescription>Track your savings goals</CardDescription>
        </div>
        <Link href="/dashboard/goals">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.slice(0, 3).map((goal) => (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">{goal.title}</p>
                <p className="text-xs text-muted-foreground">Due: {formatDate(goal.deadline)}</p>
              </div>
              <span className="text-sm font-semibold">{goal.progress}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>{formatCurrency(goal.current_amount)}</span>
              <span className="text-muted-foreground">/ {formatCurrency(goal.target_amount)}</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
