'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/actions/login';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, rememberMe);

      if (result.success) {
        // ADDED ADMIN ROUTING HERE:
        if (result.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (result.role === 'clinician') {
          router.push(`/clinician/${result.userId}/dashboard`);
        } else {
          router.push(`/patient/${result.userId}/dashboard`);
        }
      } else {
        setError(result.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-5xl flex bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        {/* Left Side - (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transition-transform duration-1000 hover:scale-105"
            style={{ backgroundImage: "url('/images/auth-bg.svg')" }} 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/80 z-0"></div>

          <div className="relative z-10">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-3">
                <Image 
                  src="/images/Logo.svg" 
                  alt="KneuraSense Logo" 
                  width={40} 
                  height={40} 
                  className="scale-125 group-hover:scale-150 group-hover:rotate-3 transition-all duration-300 drop-shadow-lg"
                />
                <div className="ml-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">KneuraSense</h1>
                  <p className="text-blue-300 text-xs font-medium tracking-wide uppercase">Knee Health Monitoring</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="relative z-10 my-16">
            <h2 className="text-4xl font-extrabold text-white mb-6 leading-[1.2] tracking-tight">
              Predictive knee health, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                powered by Edge AI.
              </span>
            </h2>
            <p className="text-slate-300 text-md leading-relaxed max-w-md font-medium">
              Monitor your joint stress in real-time with context-aware predictions tailored to your exact environment and lifestyle.
            </p>
          </div>

          {/* Testimonial / Social Proof element */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
            <p className="text-sm text-slate-200 font-medium italic leading-relaxed">
              &quot;Designed specifically for individuals at risk of knee osteoarthritis to maintain mobility and independence.&quot;
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white relative">
          
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

          <div className="w-full max-w-sm relative z-10">
            
            <div className="text-center mb-10 lg:mb-10">
              {/* Mobile-only (App-like) */}
              <div className="lg:hidden flex flex-col items-center justify-center mb-8">
                <Link href="/" className="inline-block group mb-4">
                  <div className="p-4 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300">
                    <Image 
                      src="/images/Logo.svg" 
                      alt="KneuraSense Logo" 
                      width={42} 
                      height={42} 
                      className="drop-shadow-md"
                    />
                  </div>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KneuraSense</h1>
                <p className="text-blue-600 text-[10px] font-bold tracking-widest uppercase mt-1">Predictive Care</p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 text-sm font-medium">Enter your credentials to access your dashboard.</p>
            </div>

            {/* Error Toast */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start animate-fade-in">
                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-slate-900 placeholder-slate-400 font-medium text-base sm:text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-slate-900 placeholder-slate-400 font-medium text-base sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Extras: Remember Me & Forgot Password */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 pb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 rounded focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-600 group-hover:border-blue-500 transition-colors bg-white">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <svg className="w-3.5 h-3.5 text-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-all">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 group hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <svg className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Register Prompt */}
            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm font-medium">
                New to KneuraSense?{' '}
                <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-all">
                  Create an account
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}