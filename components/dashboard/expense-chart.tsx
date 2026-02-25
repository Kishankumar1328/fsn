'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ExpenseChartProps {
  data: Array<{
    category: string;
    amount: number;
  }>;
}

// Vivid, distinct HSL palette that works on both dark and light modes
const PALETTE = [
  { fill: '#6366f1', glow: 'rgba(99,102,241,0.35)' },   // Indigo
  { fill: '#f43f5e', glow: 'rgba(244,63,94,0.35)' },    // Rose
  { fill: '#10b981', glow: 'rgba(16,185,129,0.35)' },   // Emerald
  { fill: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },   // Amber
  { fill: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },   // Blue
  { fill: '#a855f7', glow: 'rgba(168,85,247,0.35)' },   // Purple
  { fill: '#14b8a6', glow: 'rgba(20,184,166,0.35)' },   // Teal
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const colorIdx = item.payload?.colorIdx ?? 0;
    const color = PALETTE[colorIdx % PALETTE.length].fill;
    return (
      <div className="rounded-2xl border bg-popover/95 backdrop-blur-sm px-4 py-3 shadow-xl text-sm min-w-[130px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="font-semibold capitalize">{item.name}</span>
        </div>
        <p className="text-muted-foreground font-mono font-bold">${item.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  if (percentage < 8) return null; // skip tiny slices
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="800">
      {`${percentage.toFixed(0)}%`}
    </text>
  );
};

export function ExpenseChart({ data }: ExpenseChartProps) {
  const totalAmount = data?.reduce((sum, item) => sum + item.amount, 0) || 0;

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-2xl border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Expense Distribution</CardTitle>
          <p className="text-xs text-muted-foreground">By category · last 30 days</p>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl">📊</div>
          <p className="text-sm">No expense data yet</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, idx) => ({
    ...item,
    percentage: (item.amount / totalAmount) * 100,
    colorIdx: idx,
    name: item.category,
  }));

  return (
    <Card className="rounded-2xl border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Expense Distribution</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">By category · last 30 days</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="font-extrabold text-lg">
              ${totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="flex-shrink-0 relative">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <defs>
                  {PALETTE.map((p, i) => (
                    <filter key={i} id={`glow-${i}`}>
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={p.glow} />
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  dataKey="amount"
                  nameKey="category"
                  labelLine={false}
                  label={renderCustomLabel}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={PALETTE[idx % PALETTE.length].fill}
                      style={{ filter: `url(#glow-${idx % PALETTE.length})` }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-semibold text-muted-foreground">Top</span>
              <span className="text-sm font-black">{chartData.length} cats</span>
            </div>
          </div>

          {/* Legend bars */}
          <div className="flex-1 w-full space-y-3 min-w-0">
            {chartData.map((item, idx) => {
              const color = PALETTE[idx % PALETTE.length].fill;
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-md"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-semibold truncate capitalize">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono font-bold">
                        ${item.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] font-black w-9 text-right" style={{ color }}>
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${color}22` }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
