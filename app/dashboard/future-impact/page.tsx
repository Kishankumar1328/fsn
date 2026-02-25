'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { TrendingUp, Wallet, ShieldCheck, Info, ArrowUpRight } from 'lucide-react';
import { useDashboard } from '@/hooks/use-dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function FutureImpactPage() {
    const { data: dashboardData, isLoading } = useDashboard();

    // Simulation inputs
    const [incomeChange, setIncomeChange] = useState(0); // -20% to +100%
    const [expenseReduction, setExpenseReduction] = useState(10); // 0% to 50%
    const [savingsRate, setSavingsRate] = useState(20); // 0% to 80%
    const [investmentReturn, setInvestmentReturn] = useState(7); // 0% to 15%

    const summary = dashboardData?.summary || { totalIncome: 5000, totalExpenses: 4000 };

    const simulationData = useMemo(() => {
        const years = 10;
        const monthlyIncome = summary.totalIncome * (1 + incomeChange / 100);
        const monthlyExpenses = summary.totalExpenses * (1 - expenseReduction / 100);
        const monthlySavings = monthlyIncome - monthlyExpenses;

        // We'll calculate data for both "current" and "optimized" paths
        const data = [];
        let currentWealth = 0;
        let optimizedWealth = 0;

        const currPathSavings = summary.totalIncome - summary.totalExpenses;
        const optPathSavings = monthlySavings;

        for (let year = 0; year <= years; year++) {
            // Current path (yearly compounding)
            const currentVal = year === 0 ? 0 : currentWealth * (1 + 0.04) + (currPathSavings * 12);
            currentWealth = currentVal;

            // Optimized path
            const optVal = year === 0 ? 0 : optimizedWealth * (1 + investmentReturn / 100) + (optPathSavings * 12);
            optimizedWealth = optVal;

            data.push({
                year: `Year ${year}`,
                current: Math.round(currentVal),
                optimized: Math.round(optVal),
                diff: Math.round(optVal - currentVal)
            });
        }
        return data;
    }, [summary, incomeChange, expenseReduction, investmentReturn]);

    const finalDiff = simulationData[simulationData.length - 1].diff;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Future Impact Simulator</h1>
                <p className="text-muted-foreground italic">"What if I change my habits today?" — Visualize your potential wealth in 10 years.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls */}
                <Card className="lg:col-span-1 border-none shadow-xl bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Adjust Parameters
                        </CardTitle>
                        <CardDescription>Simulate lifestyle and income changes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Income Change (%)</label>
                                <span className="text-primary font-bold">{incomeChange}%</span>
                            </div>
                            <Slider
                                value={[incomeChange]}
                                min={-20} max={100} step={5}
                                onValueChange={(v: number[]) => setIncomeChange(v[0])}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Expense Reduction (%)</label>
                                <span className="text-green-600 font-bold">{expenseReduction}%</span>
                            </div>
                            <Slider
                                value={[expenseReduction]}
                                min={0} max={50} step={5}
                                onValueChange={(v: number[]) => setExpenseReduction(v[0])}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Expected Return (%)</label>
                                <span className="text-blue-600 font-bold">{investmentReturn}%</span>
                            </div>
                            <Slider
                                value={[investmentReturn]}
                                min={1} max={15} step={1}
                                onValueChange={(v: number[]) => setInvestmentReturn(v[0])}
                            />
                        </div>

                        <div className="pt-6 border-t">
                            <div className="p-4 rounded-xl bg-primary/10 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-primary">
                                    <ShieldCheck className="h-4 w-4" />
                                    AI Prediction
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                                    Based on your current trajectory, optimizing these 3 variables could increase your 10-year net worth by <span className="text-foreground font-bold">${finalDiff.toLocaleString()}</span>.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Visualization */}
                <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl">
                    <CardHeader className="bg-primary/5 pb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl font-black">Wealth Projection</CardTitle>
                                <CardDescription>Estimated Net Worth (10 Year Horizon)</CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-primary">${simulationData[10].optimized.toLocaleString()}</div>
                                <div className="text-xs font-bold text-green-600 flex items-center justify-end">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    OPTIMIZED PATH
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={simulationData}>
                                    <defs>
                                        <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.1} />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(v: number) => `$${v / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
                                    />
                                    <Area type="monotone" dataKey="current" stroke="#888888" strokeWidth={2} fill="transparent" name="Current Path" />
                                    <Area type="monotone" dataKey="optimized" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorOpt)" name="Optimized Path" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 rounded-xl border bg-muted/50 space-y-1">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Financial Stress Score</div>
                                <div className="text-2xl font-black text-yellow-600">Moderate</div>
                            </div>
                            <div className="p-4 rounded-xl border bg-muted/50 space-y-1">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Retirement Readiness</div>
                                <div className="text-2xl font-black text-green-600">68.4%</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
