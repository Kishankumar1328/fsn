'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Globe, Users, Leaf, Plus, Sparkles, Award } from 'lucide-react';
import { useDonations } from '@/hooks/use-donations';
import { formatCurrency, formatDate } from '@/lib/utils-format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

const CAUSES = [
    { value: 'environment', label: 'Environment', icon: Leaf },
    { value: 'education', label: 'Education', icon: Globe },
    { value: 'poverty', label: 'Poverty & Hunger', icon: Users },
    { value: 'health', label: 'Healthcare', icon: Heart },
    { value: 'other', label: 'Other', icon: Sparkles },
];

export default function SocialImpactPage() {
    const { donations, createDonation, isLoading } = useDonations();
    const [isOpen, setIsOpen] = useState(false);
    const [org, setOrg] = useState('');
    const [amount, setAmount] = useState('');
    const [cause, setCause] = useState('');
    const [description, setDescription] = useState('');

    const totalDonated = donations.reduce((sum: number, d: any) => sum + d.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createDonation({
                organization: org,
                amount: parseFloat(amount),
                cause,
                date: Date.now(),
                impact_description: description,
            });
            toast.success('Donation logged. Your social impact score has increased!');
            setIsOpen(false);
            setOrg('');
            setAmount('');
            setCause('');
            setDescription('');
        } catch (err) {
            toast.error('Failed to log donation');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Social Impact</h1>
                    <p className="text-muted-foreground italic">"Wealth is not just what you have, but what you give."</p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-500/20">
                            <Plus className="mr-2 h-4 w-4" />
                            Log Donation
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Record Social Impact</DialogTitle>
                            <DialogDescription>Log a contribution to a cause you care about.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Organization</Label>
                                <Input placeholder="NGO Name" value={org} onChange={e => setOrg(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cause</Label>
                                    <Select value={cause} onValueChange={setCause}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Cause" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CAUSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Impact Note (Optional)</Label>
                                <Input placeholder="e.g. Planted 10 trees" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700">Confirm Contribution</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-none bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-pink-100 uppercase tracking-widest text-xs font-black">Social Net Worth</CardTitle>
                        <div className="text-4xl font-black">{formatCurrency(totalDonated)}</div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-pink-100 text-sm">
                            <Award className="h-4 w-4" />
                            <span>Sentinel of Goodness Level 4</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-none shadow-xl bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Cause Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            {CAUSES.map(c => {
                                const count = donations.filter((d: any) => d.cause === c.value).length;
                                return (
                                    <div key={c.value} className="flex-1 p-4 rounded-2xl bg-background border flex flex-col items-center justify-center gap-2 group hover:border-pink-500/50 transition-all cursor-default">
                                        <c.icon className={`h-6 w-6 ${count > 0 ? 'text-pink-500' : 'text-muted-foreground'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">{c.label}</span>
                                        <span className="text-lg font-black">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader>
                    <CardTitle>Impact History</CardTitle>
                </CardHeader>
                <CardContent>
                    {donations.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground italic">
                            "Even the smallest act of caring for another is like a drop of water - it will make ripples throughout the entire pond."
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {donations.map((d: any) => (
                                <div key={d.id} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-muted/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                            <Heart className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold">{d.organization}</div>
                                            <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{d.cause} • {formatDate(d.date)}</div>
                                            {d.impact_description && <div className="text-sm italic mt-1 text-muted-foreground">"{d.impact_description}"</div>}
                                        </div>
                                    </div>
                                    <div className="text-xl font-black text-pink-600">{formatCurrency(d.amount)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
