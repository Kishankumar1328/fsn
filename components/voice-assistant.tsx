'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';
import { toast } from 'sonner';

export function VoiceAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { createExpense, mutate } = useExpenses();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    let interim = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcriptSegment = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            setTranscript((prev) => prev + transcriptSegment + ' ');
                        } else {
                            interim += transcriptSegment;
                        }
                    }
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            // Automatically process after stopping
            if (transcript.length > 5) {
                processVoice();
            }
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
            setIsOpen(true);
        }
    };

    const processVoice = async () => {
        if (!transcript.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/voice/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({ text: transcript }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            const { category, amount, description, type } = data.data;

            if (type === 'expense') {
                await createExpense({
                    category,
                    amount: parseFloat(amount),
                    description,
                    date: Date.now(),
                    payment_method: 'cash',
                });
                await mutate();
                toast.success(`Logged: $${amount} for ${description}`, {
                    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
                });
            }

            setTranscript('');
            setIsOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Could not interpret voice command');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
            {isOpen && (
                <div className="bg-background border shadow-2xl rounded-2xl p-4 w-72 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">FinSentinel AI</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="min-h-[60px] flex items-center justify-center text-center p-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-xs font-medium">Analyzing your request...</span>
                            </div>
                        ) : isListening ? (
                            <div className="space-y-2 w-full">
                                <div className="flex justify-center">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-1 bg-primary rounded-full animate-bounce" style={{ height: `${Math.random() * 20 + 5}px`, animationDelay: `${i * 0.1}s` }} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm font-medium italic">"{transcript || 'Listening...'}"</p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">Tap the mic to log an expense instantly.</p>
                        )}
                    </div>

                    {!isListening && transcript && !isLoading && (
                        <Button className="w-full mt-2 font-bold" onClick={processVoice}>
                            Confirm & Save
                        </Button>
                    )}
                </div>
            )}

            <Button
                size="icon"
                className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary/90'}`}
                onClick={toggleListening}
            >
                {isListening ? <StopCircle className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
        </div>
    );
}
