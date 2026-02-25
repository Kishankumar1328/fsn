'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Star, Target, ShieldCheck } from 'lucide-react';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: any;
    achieved: boolean;
    progress: number;
}

export function AchievementTracker() {
    const achievements: Achievement[] = [
        {
            id: '1',
            title: 'Wealth Builder',
            description: 'Saved more than 20% of income',
            icon: <Trophy className="h-5 w-5 text-yellow-500" />,
            achieved: true,
            progress: 100,
        },
        {
            id: '2',
            title: 'Budget Master',
            description: '7 days with no budget breaches',
            icon: <Target className="h-5 w-5 text-primary" />,
            achieved: false,
            progress: 65,
        },
        {
            id: '3',
            title: 'Jarvis user',
            description: 'Used voice entry 5 times',
            icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
            achieved: false,
            progress: 40,
        }
    ];

    return (
        <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500/5 to-primary/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Financial Milestones
                </CardTitle>
                <CardDescription>Earn badges for healthy habits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                {achievements.map((a) => (
                    <div key={a.id} className="flex items-center gap-4 group cursor-help">
                        <div className={`p-2 rounded-xl border flex-shrink-0 transition-all ${a.achieved ? 'bg-yellow-500/10 border-yellow-500/20 shadow-inner' : 'bg-muted opacity-70'}`}>
                            {a.icon}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <h4 className={`text-sm font-bold truncate ${a.achieved ? 'text-foreground' : 'text-muted-foreground'}`}>{a.title}</h4>
                                <span className="text-[10px] font-black">{a.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ease-out ${a.achieved ? 'bg-yellow-500' : 'bg-primary'}`}
                                    style={{ width: `${a.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
