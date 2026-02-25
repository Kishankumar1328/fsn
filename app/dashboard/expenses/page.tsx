'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useExpenses } from '@/hooks/use-expenses';
import { Plus, Trash2, Edit2, Heart } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils-format';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const EXPENSE_CATEGORIES = [
  'Grocery',
  'Food',
  'Dining',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Health',
  'Clothing',
  'Housing',
  'Education',
  'Shopping',
  'Travel',
  'Savings',
  'Other',
];

export default function ExpensesPage() {
  const { expenses, createExpense, deleteExpense } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredExpenses = expenses.filter((e: any) => {
    const matchesSearch = e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || e.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExpense({
        category,
        amount: parseFloat(amount),
        description: description || undefined,
        date: Date.now(),
        payment_method: 'manual',
        mood: mood.toLowerCase(),
      });
      toast.success('Expense recorded successfully');
      setCategory('');
      setAmount('');
      setDescription('');
      setMood('Neutral');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to add expense:', error);
      toast.error(error.message || 'Failed to record expense');
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track and manage your spending</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex-shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add </span>Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>Record a new expense transaction</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="What did you buy?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mood">How were you feeling?</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger>
                    <SelectValue placeholder="Neutral" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Happy', 'Stressed', 'Bored', 'Neutral', 'Sad', 'Excited'].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Add Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat.toLowerCase()}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Your transaction history with emotional intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No transactions found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense: any) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-all border border-transparent hover:border-primary/10"
                >
                  <div className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-full bg-background border flex items-center justify-center text-xs font-black uppercase">
                      {expense.category.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold capitalize text-sm sm:text-base">{expense.category}</p>
                        {expense.mood && (
                          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest">{expense.mood}</span>
                        )}
                        {expense.is_donation === 1 && (
                          <span className="hidden sm:flex px-2 py-0.5 rounded-full bg-pink-100 text-[10px] font-bold text-pink-600 uppercase tracking-widest items-center gap-1">
                            <Heart className="h-2 w-2" /> Impact
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                        <span className="hidden sm:inline truncate">{expense.description || 'No description'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{formatDate(expense.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <p className="font-semibold text-sm sm:text-base">{formatCurrency(expense.amount)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteExpense(expense.id)}
                      className="text-destructive hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
