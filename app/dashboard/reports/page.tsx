'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-format';

interface ReportData {
  generatedAt: string;
  period: { from: string; to: string };
  user: { name: string; email: string };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
  };
  expensesByCategory: Record<string, number>;
  budgetComparison: Array<{
    category: string;
    name: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
  topExpenses: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json', startDate, endDate }),
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, startDate, endDate }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
        <p className="text-muted-foreground mt-2">Generate and export comprehensive financial reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select a date range to analyze your finances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateReport} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </Button>

              {reportData && (
                <>
                  <Button onClick={() => downloadReport('json')} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    JSON
                  </Button>
                  <Button onClick={() => downloadReport('csv')} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
              <CardDescription>
                {reportData.period.from} to {reportData.period.to}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.summary.totalIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(reportData.summary.totalExpenses)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Income</p>
                  <p
                    className={`text-2xl font-bold ${
                      reportData.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(reportData.summary.netIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{reportData.summary.transactionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(reportData.expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize font-medium">{category}</span>
                    <span className="text-right">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {reportData.budgetComparison.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Budget Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.budgetComparison.map((budget) => (
                    <div key={budget.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{budget.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {budget.percentage.toFixed(0)}% used
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            budget.percentage >= 100
                              ? 'bg-destructive'
                              : budget.percentage >= 80
                                ? 'bg-yellow-500'
                                : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(budget.spent)}</span>
                        <span>{formatCurrency(budget.limit)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.topExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.topExpenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.category} • {expense.date}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
