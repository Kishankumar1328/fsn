'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBudgets } from '@/hooks/use-budgets';
import { formatCurrency } from '@/lib/utils-format';
import { toast } from 'sonner';
import { EXPENSE_CATEGORIES } from '@/app/dashboard/expenses/page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function BudgetsPage() {
  const { budgets, loading, addBudget, updateBudget, deleteBudget, mutate } = useBudgets();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [formData, setFormData] = useState({ category: '', limit: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.limit) {
      toast.error('Please fill in all required fields');
      return;
    }

    const limitVal = parseFloat(formData.limit);

    if (isNaN(limitVal)) {
      toast.error('Limit must be a valid number');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          category: formData.category,
          limit_amount: limitVal,
        });
        toast.success('Budget updated successfully');
      } else {
        await addBudget({
          category: formData.category,
          limit: limitVal,
          spent: '0',
        });
        toast.success('Budget created successfully');
      }

      // Reset form and close
      setFormData({ category: '', limit: '' });
      setShowForm(false);
      setEditingBudget(null);

      // Explicitly trigger a re-fetch of the budgets list
      await mutate();
    } catch (error: any) {
      console.error('Budget error:', error);
      toast.error(error.message || (editingBudget ? 'Failed to update budget' : 'Failed to create budget'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      limit: budget.limit.toString(),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
        toast.success('Budget deleted successfully');
        await mutate();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete budget');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Set and manage spending limits for each category</p>
        </div>
        <Button
          onClick={() => {
            if (showForm && editingBudget) {
              setEditingBudget(null);
              setFormData({ category: '', limit: '' });
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
              New Budget
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>{editingBudget ? 'Edit Budget' : 'Create New Budget'}</CardTitle>
            <CardDescription>
              {editingBudget ? 'Update your category limit and current spending.' : 'Define a monthly limit for a specific spending category.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(v: string) => setFormData({ ...formData, category: v })}
                    required
                  >
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Spending is automatically calculated from your recorded expenses.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Monthly Limit</label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      className="pl-9 bg-muted/30"
                      value={formData.limit}
                      onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 font-bold h-11" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBudget(null);
                    setFormData({ category: '', limit: '' });
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
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-medium animate-pulse">Synchronizing your budgets...</p>
        </div>
      ) : budgets && budgets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-700">
          {budgets.map((budget: any) => {
            const usageRatio = budget.limit > 0 ? budget.spent / budget.limit : 0;
            const isOverBudget = usageRatio > 1;
            const isNearLimit = usageRatio > 0.8 && !isOverBudget;

            return (
              <Card key={budget.id} className="relative group overflow-hidden border-sidebar-border bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="pr-8">
                      <CardTitle className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">{budget.category}</CardTitle>
                      <CardDescription className="font-bold text-foreground/80">
                        {formatCurrency(budget.spent)} of {formatCurrency(budget.limit)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200"
                        title="Edit Budget"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all duration-200"
                        title="Delete Budget"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-3.5 overflow-hidden shadow-inner border border-muted-foreground/10">
                        <div
                          className={`h-full transition-all duration-700 ease-out rounded-full ${isOverBudget ? 'bg-destructive' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'
                            }`}
                          style={{ width: `${Math.min(usageRatio * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
                        <span className={isOverBudget ? 'text-destructive animate-pulse' : 'text-muted-foreground'}>
                          {Math.round(usageRatio * 100)}% utilized
                        </span>
                        <span className="text-muted-foreground/80">
                          {budget.limit > budget.spent
                            ? `${formatCurrency(budget.limit - budget.spent)} left`
                            : `${formatCurrency(budget.spent - budget.limit)} over`}
                        </span>
                      </div>
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
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Wallet className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">No budgets established</h3>
              <p className="text-muted-foreground max-w-[320px] mx-auto">
                Take control of your finances by setting monthly limits for your spending categories.
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} size="lg" className="px-12 font-bold shadow-lg h-12">
              Setup Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
