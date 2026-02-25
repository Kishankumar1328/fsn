'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid credentials');
      }

      localStorage.setItem('authToken', result.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: result.data.userId,
        email: result.data.email,
        name: result.data.name,
      }));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden">

      {/* Left — decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900 p-14 relative overflow-hidden">
        {/* Background glow circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-lg shadow-primary/30">
            FS
          </div>
          <span className="font-extrabold text-xl text-white">FinSentinel</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <h2 className="text-5xl font-black text-white leading-tight">
              Smart money,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
                smarter insights.
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Track expenses, hit savings goals, and get AI-powered financial guidance — all in one place.
            </p>
          </div>

          {/* Social proof */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { stat: '3.2k+', label: 'Users' },
              { stat: '$12M+', label: 'Tracked' },
              { stat: '98%', label: 'Satisfaction' },
              { stat: 'AI', label: 'Powered' },
            ].map(({ stat, label }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                <p className="text-2xl font-black text-white">{stat}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-xs text-slate-600">© 2026 FinSentinel · All rights reserved</p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black shadow-md shadow-primary/30">
              FS
            </div>
            <span className="font-extrabold text-lg">FinSentinel</span>
          </div>

          {/* Form header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Demo banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary">Demo Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enter any email address to explore FinSentinel — no real account needed.</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm font-medium">
              <span className="text-base">⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full h-12 px-4 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full h-12 px-4 pr-12 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                : <><span>Sign In</span> <ArrowRight className="h-4 w-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New to FinSentinel?{' '}
            <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
