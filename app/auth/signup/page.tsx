'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  'AI-powered spending insights',
  'Smart budget alerts',
  'Goal tracking & projections',
  'Beautiful financial reports',
];

export default function SignUpPage() {
  const [name, setName] = useState('');
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
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

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const pwColors = ['', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
  const pwLabels = ['', 'Weak', 'Good', 'Strong'];

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden">

      {/* Left — decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-slate-900 via-violet-950/40 to-slate-900 p-14 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-lg shadow-primary/30">
            FS
          </div>
          <span className="font-extrabold text-xl text-white">FinSentinel</span>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white leading-tight">
              Your financial journey
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-primary">
                starts here.
              </span>
            </h2>
            <p className="text-slate-400 leading-relaxed max-w-xs">
              Join thousands of users building wealth with AI-powered financial intelligence.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-600">© 2026 FinSentinel · All rights reserved</p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-7">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black shadow-md shadow-primary/30">
              FS
            </div>
            <span className="font-extrabold text-lg">FinSentinel</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground">Free forever · No credit card required</p>
          </div>

          {/* Demo banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary">Demo Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create any account to explore FinSentinel — your data stays local.</p>
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
              <label htmlFor="name" className="text-sm font-semibold">Full name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
                disabled={loading}
                className="w-full h-12 px-4 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 transition"
              />
            </div>

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
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
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
              {/* Password strength */}
              {password.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(level => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${pwStrength >= level ? pwColors[pwStrength] : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${pwStrength === 1 ? 'text-rose-500' : pwStrength === 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {pwLabels[pwStrength]} password
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                : <><span>Create Account</span> <ArrowRight className="h-4 w-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
