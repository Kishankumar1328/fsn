'use client';

import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Edit2, Target as TargetIcon, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGoals } from '@/hooks/use-goals';
import { formatCurrency, formatDate } from '@/lib/utils-format';
import { toast } from 'sonner';

export default function GoalsPage() {
  const { goals, loading, addGoal, updateGoal, deleteGoal, mutate } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    const targetVal = parseFloat(formData.targetAmount);
    const currentVal = parseFloat(formData.currentAmount || '0');

    if (isNaN(targetVal)) {
      toast.error('Target amount must be a number');
      return;
    }

    setIsSubmitting(true);
    try {
      const goalPayload = {
        name: formData.name,
        targetAmount: targetVal,
        currentAmount: isNaN(currentVal) ? 0 : currentVal,
        deadline: formData.deadline,
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          title: goalPayload.name,
          target_amount: goalPayload.targetAmount,
          current_amount: goalPayload.currentAmount,
          deadline: new Date(goalPayload.deadline).getTime(),
        });
        toast.success('Goal updated successfully');
      } else {
        await addGoal(goalPayload);
        toast.success('Goal created successfully');
      }

      setFormData({ name: '', targetAmount: '', currentAmount: '0', deadline: '' });
      setShowForm(false);
      setEditingGoal(null);

      // Force a re-fetch of the goals list
      await mutate();
    } catch (error: any) {
      console.error('Goal error:', error);
      toast.error(error.message || (editingGoal ? 'Failed to update goal' : 'Failed to create goal'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    // Ensure deadline is in YYYY-MM-DD format for input[type="date"]
    // goal.deadline is expected to be a timestamp (number)
    const deadlineDate = new Date(goal.deadline);
    const formattedDate = !isNaN(deadlineDate.getTime())
      ? deadlineDate.toISOString().split('T')[0]
      : '';

    setFormData({
      name: goal.name || goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: formattedDate,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(id);
        toast.success('Goal deleted successfully');
        await mutate();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete goal');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <h1 className="text-3xl font-bold text-foreground">Financial Goals</h1>
          <p className="text-muted-foreground mt-1">Track and manage your savings milestones</p>
        </div>
        <Button
          onClick={() => {
            if (showForm && editingGoal) {
              setEditingGoal(null);
              setFormData({ name: '', targetAmount: '', currentAmount: '0', deadline: '' });
            } else {
              setShowForm(!showForm);
            }
          }}
          variant={showForm ? 'outline' : 'default'}
          className="gap-2 shadow-sm transition-all duration-300"
        >
          {showForm ? 'Cancel' : (
            <>
              <Plus className="h-4 w-4" />
              New Goal
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</CardTitle>
            <CardDescription>
              {editingGoal ? 'Update your goal progress and details.' : 'Set a new financial target to track your savings.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Goal Name</label>
                  <Input
                    placeholder="e.g., Emergency Fund, New Car"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-muted/30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Target Amount ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    className="bg-muted/30"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Current Savings ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    className="bg-muted/30"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Target Date</label>
                  <Input
                    type="date"
                    className="bg-muted/30"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 font-bold h-11 shadow-md" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shadow-sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                    setFormData({ name: '', targetAmount: '', currentAmount: '0', deadline: '' });
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Synchronizing milestones...</p>
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
          {goals.map((goal: any) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const daysRemaining = Math.ceil(
              (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isCompleted = progress >= 100;

            return (
              <Card key={goal.id} className="hover:border-primary/50 transition-all duration-300 group overflow-hidden border-sidebar-border bg-card shadow-sm hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{goal.name || goal.title}</CardTitle>
                        {isCompleted && (
                          <div className="bg-primary/10 p-1 rounded-full animate-bounce">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1.5 font-medium">
                        <TargetIcon className="h-3.5 w-3.5" />
                        Target: {formatCurrency(goal.targetAmount)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200"
                        title="Edit Goal"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all duration-200"
                        title="Delete Goal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold tracking-tight">
                      <span className="text-muted-foreground uppercase text-[10px] tracking-widest">Progress</span>
                      <span className={isCompleted ? 'text-primary' : 'text-foreground'}>
                        {formatCurrency(goal.currentAmount)} ({Math.round(progress)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-4 overflow-hidden shadow-inner border border-muted-foreground/10 p-[2px]">
                      <div
                        className={`h-full transition-all duration-1000 ease-in-out rounded-full ${isCompleted ? 'bg-primary' : 'bg-primary/80'
                          }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      >
                        {progress > 5 && (
                          <div className="w-full h-full bg-white/20 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1 border-t border-muted-foreground/5 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {formatDate(goal.deadline)}
                    </div>
                    <div className={`px-2 py-0.5 rounded-sm ${daysRemaining <= 7 && daysRemaining > 0 ? 'bg-orange-500/10 text-orange-500 font-black' : ''}`}>
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : isCompleted ? 'Goal achieved!' : 'Target date passed'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed py-24 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center transition-transform hover:scale-110 duration-300 shadow-inner">
              <TargetIcon className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">No goals established</h3>
              <p className="text-muted-foreground max-w-[320px] mx-auto">
                Set clear financial targets and track your journey to achieving them.
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} size="lg" className="px-12 font-bold shadow-lg h-12">
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
