'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { resetPassword } from '@/actions/passwordReset';

// 1. Content component that uses the searchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('token', token);
    formData.append('password', password);

    const result = await resetPassword(formData);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setTimeout(() => router.push('/login'), 3000);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-8 sm:p-10 text-center relative">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-60 pointer-events-none z-0"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Invalid Link</h2>
          <p className="text-slate-500 font-medium mb-8">This password reset link is missing a token or has expired.</p>
          <Link href="/forgot-password" className="inline-flex items-center justify-center w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98]">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative p-6 sm:p-10">
      
      {/* Decorative background blob */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none z-0"></div>

      <div className="relative z-10">
        <div className="mb-8 text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20">
              <Image 
                src="/images/Logo.svg" 
                alt="KneuraSense Logo" 
                width={36} 
                height={36} 
                className="drop-shadow-md"
              />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">New Password</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Set a secure password for your account.</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-start animate-fade-in ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <span className="mr-2 mt-0.5 shrink-0">
               {message.type === 'success' ? (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
               ) : (
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
               )}
            </span>
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
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
                placeholder="At least 8 characters"
                required
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-slate-900 placeholder-slate-400 font-medium text-base sm:text-sm"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-2 top-1.5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-slate-900 placeholder-slate-400 font-medium text-base sm:text-sm"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute right-2 top-1.5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 group hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] mt-4"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Updating...
              </>
            ) : (
              <>
                Reset Password
                <svg className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. Main Page component with Suspense Boundary
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center gap-5 p-12 bg-white rounded-3xl shadow-xl border border-slate-100">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold tracking-wide">Loading security module...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}