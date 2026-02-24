'use client';

import { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGoals } from '@/hooks/use-goals';
import { formatCurrency } from '@/lib/utils-format';

export default function GoalsPage() {
  const { goals, loading, addGoal, deleteGoal } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', targetAmount: '', deadline: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.targetAmount && formData.deadline) {
      await addGoal({
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        deadline: formData.deadline,
      });
      setFormData({ name: '', targetAmount: '', deadline: '' });
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Goals</h1>
          <p className="text-muted-foreground mt-1">Track and manage your financial goals</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Goal Name</label>
                <Input
                  placeholder="e.g., Emergency Fund, Vacation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Target Amount ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Target Date</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Goal</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading goals...</div>
      ) : goals && goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysRemaining = Math.ceil(
              (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {goal.name}
                        {progress >= 100 && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </CardTitle>
                      <CardDescription>
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </CardDescription>
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Math.round(progress)}% complete</span>
                      <span>{daysRemaining > 0 ? `${daysRemaining} days left` : 'Goal date passed'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No goals yet. Set one to start tracking your progress!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
