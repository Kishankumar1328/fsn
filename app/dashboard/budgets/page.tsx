'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBudgets } from '@/hooks/use-budgets';
import { formatCurrency } from '@/lib/utils-format';

export default function BudgetsPage() {
  const { budgets, loading, addBudget, deleteBudget } = useBudgets();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: '', limit: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.category && formData.limit) {
      await addBudget({
        category: formData.category,
        limit: parseFloat(formData.limit),
      });
      setFormData({ category: '', limit: '' });
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Set and manage spending limits for each category</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Budget
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Input
                  placeholder="e.g., Groceries, Dining"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Monthly Limit ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Budget</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading budgets...</div>
      ) : budgets && budgets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{budget.category}</CardTitle>
                    <CardDescription>{formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}</CardDescription>
                  </div>
                  <button
                    onClick={() => deleteBudget(budget.id)}
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
                      style={{ width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((budget.spent / budget.limit) * 100)}% of budget used
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No budgets yet. Create one to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
