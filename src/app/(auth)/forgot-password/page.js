'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { requestPasswordReset } from '@/actions/passwordReset';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const formData = new FormData();
      formData.append('email', email);
      
      const result = await requestPasswordReset(formData);
      
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
        setEmail('');
      } else {
        setStatus({ type: 'error', message: result.error });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative p-6 sm:p-10">
        
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none z-0"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            {/* App-like Logo */}
            <div className="flex flex-col items-center justify-center mb-6">
              <Link href="/" className="inline-block group mb-4">
                <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300">
                  <Image 
                    src="/images/Logo.svg" 
                    alt="KneuraSense Logo" 
                    width={36} 
                    height={36} 
                    className="drop-shadow-md"
                  />
                </div>
              </Link>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Forgot Password</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Enter your registered email address and we&apos;ll send you a link to reset your password.</p>
          </div>

          {status.message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-start animate-fade-in ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
               <span className="mr-2 mt-0.5 shrink-0">
                 {status.type === 'success' ? (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                 ) : (
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                 )}
               </span>
               <span className="leading-relaxed">{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="name@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-slate-900 placeholder-slate-400 font-medium text-base sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || status.type === 'success'}
              className="w-full relative overflow-hidden bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 group hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <svg className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center group">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </div>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}