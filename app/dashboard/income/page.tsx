'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useIncome } from '@/hooks/use-income';
import { formatCurrency, formatDate } from '@/lib/utils-format';

export default function IncomePage() {
  const { income, loading, addIncome, deleteIncome } = useIncome();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ source: '', amount: '', date: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.source && formData.amount && formData.date) {
      await addIncome({
        source: formData.source,
        amount: parseFloat(formData.amount),
        date: formData.date,
      });
      setFormData({ source: '', amount: '', date: '' });
      setShowForm(false);
    }
  };

  const totalIncome = income?.reduce((sum, inc) => sum + inc.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Income</h1>
          <p className="text-muted-foreground mt-1">Track your income sources</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Income
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">{formatCurrency(totalIncome)}</p>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Income Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Income Source</label>
                <Input
                  placeholder="e.g., Salary, Freelance"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Amount ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Income</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading income...</div>
      ) : income && income.length > 0 ? (
        <div className="space-y-3">
          {income.map((inc) => (
            <Card key={inc.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{inc.source}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(inc.date)}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <p className="text-lg font-semibold text-primary">{formatCurrency(inc.amount)}</p>
                    <button
                      onClick={() => deleteIncome(inc.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No income entries yet. Add one to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
