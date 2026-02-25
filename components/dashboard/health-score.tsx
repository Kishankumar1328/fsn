'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface HealthScoreProps {
    score: number;
}

export function HealthScore({ score }: HealthScoreProps) {
    const getStatusColor = (s: number) => {
        if (s >= 80) return 'text-green-500';
        if (s >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getStatusBg = (s: number) => {
        if (s >= 80) return 'bg-green-500/10';
        if (s >= 50) return 'bg-yellow-500/10';
        return 'bg-red-500/10';
    };

    const getStatusIcon = (s: number) => {
        if (s >= 80) return <ShieldCheck className="h-8 w-8 text-green-500" />;
        if (s >= 50) return <Shield className="h-8 w-8 text-yellow-500" />;
        return <ShieldAlert className="h-8 w-8 text-red-500" />;
    };

    const getStatusText = (s: number) => {
        if (s >= 80) return 'Secure';
        if (s >= 50) return 'At Risk';
        return 'Critical';
    };

    const getStatusDesc = (s: number) => {
        if (s >= 80) return 'Your financial habits are excellent. Keep up the disciplined spending!';
        if (s >= 50) return "Some categories are exceeding expectations. Let's tighten the belt.";
        return 'Immediate adjustment needed to prevent long-term financial strain.';
    };

    return (
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    Financial Health Score
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getStatusBg(score)} ${getStatusColor(score)}`}>
                        {getStatusText(score)}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    <div className="relative flex items-center justify-center">
                        <svg className="h-24 w-24 transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-muted/20"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                                strokeLinecap="round"
                                className={`${getStatusColor(score)} transition-all duration-1000 ease-out`}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-2xl font-black">{score}</span>
                        </div>
                    </div>
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                            {getStatusIcon(score)}
                            <h3 className="font-bold text-lg leading-none">Guardianship Status</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {getStatusDesc(score)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
