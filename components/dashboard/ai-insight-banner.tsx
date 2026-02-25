'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight, Zap, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Insight {
    type: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'success';
}

interface AIInsightBannerProps {
    insights: Insight[];
}

export function AIInsightBanner({ insights }: AIInsightBannerProps) {
    if (!insights || insights.length === 0) return null;

    // Prioritize warnings, then success, then info
    const sortedInsights = [...insights].sort((a, b) => {
        const priority = { warning: 0, success: 1, info: 2 };
        return priority[a.severity] - priority[b.severity];
    });

    const mainInsight = sortedInsights[0];

    const getIcon = (type: string) => {
        switch (type) {
            case 'budget_warning': return <Zap className="h-5 w-5 text-yellow-500" />;
            case 'goal_progress': return <Target className="h-5 w-5 text-primary" />;
            case 'trend': return <TrendingUp className="h-5 w-5 text-blue-500" />;
            case 'saving_opportunity': return <Sparkles className="h-5 w-5 text-green-500" />;
            default: return <Sparkles className="h-5 w-5 text-primary" />;
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
            case 'success': return 'bg-green-500/10 border-green-500/20';
            default: return 'bg-primary/5 border-primary/10';
        }
    };

    return (
        <Card className={`overflow-hidden border relative group shadow-lg ${getSeverityStyles(mainInsight.severity)} animate-in fade-in slide-in-from-top-4 duration-500`}>
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex gap-4 items-start">
                        <div className={`p-3 rounded-2xl ${mainInsight.severity === 'warning' ? 'bg-yellow-500/20' : 'bg-primary/10'} flex-shrink-0`}>
                            {mainInsight.severity === 'warning' ? <AlertTriangle className="h-6 w-6 text-yellow-600" /> : <Sparkles className="h-6 w-6 text-primary" />}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">FinSentinel Intelligence</span>
                                <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                            </div>
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                {mainInsight.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                                {mainInsight.description}
                            </p>
                        </div>
                    </div>
                    <Link href="/dashboard/insights">
                        <Button className="font-bold h-11 px-6 group/btn w-full sm:w-auto mt-2 sm:mt-0" variant={mainInsight.severity === 'warning' ? 'secondary' : 'default'}>
                            View All Insights
                            <ArrowRight className="ml-2 h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
