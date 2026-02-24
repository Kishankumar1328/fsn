'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, StopCircle, Send, AlertCircle, Loader2 } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';

export default function VoiceEntryPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const recognitionRef = useRef<any>(null);
  const { createExpense } = useExpenses();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
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

        recognitionRef.current.onerror = (event: any) => {
          setError(`Speech recognition error: ${event.error}`);
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
    } else {
      setError('');
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const parseExpense = async () => {
    if (!transcript.trim()) {
      setError('Please record a voice entry first');
      return;
    }

    setIsLoading(true);
    setError('');

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

      if (!response.ok) {
        setError(data.error || 'Failed to parse voice entry');
        return;
      }

      const { category, amount, description, type } = data.data;

      if (type === 'expense') {
        await createExpense({
          category,
          amount: parseFloat(amount),
          description,
          date: Date.now(),
          payment_method: 'cash',
        });
      }

      setMessage(`Successfully recorded ${type}: ${formatCurrency(amount)} for ${description}`);
      setTranscript('');

      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to process voice entry');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Voice Entry</h1>
        <p className="text-muted-foreground">Record your expenses using voice commands</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Expense</CardTitle>
          <CardDescription>
            Say something like: "I spent 25 dollars on groceries" or "Logged 15 dollars for coffee"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={toggleListening}
                size="lg"
                className={isListening ? 'bg-red-600 hover:bg-red-700' : ''}
                disabled={isLoading}
              >
                {isListening ? (
                  <>
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>

            {transcript && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Transcript:</p>
                <p className="text-foreground">{transcript}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={parseExpense}
                disabled={!transcript.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Add Expense
                  </>
                )}
              </Button>
              {transcript && (
                <Button
                  onClick={() => setTranscript('')}
                  variant="outline"
                  disabled={isLoading}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Click "Start Recording" and speak your expense entry</p>
          <p>2. Say the amount, category, and description (e.g., "spent 25 on groceries")</p>
          <p>3. Click "Add Expense" to process the recording</p>
          <p>4. The AI will extract the details and save the expense</p>
        </CardContent>
      </Card>
    </div>
  );
}
