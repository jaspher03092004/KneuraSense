'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { activatePatientAccount } from '@/actions/activateAccount';

function ActivationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setStatus('loading');
    const result = await activatePatientAccount(token, password);

    if (result.success) {
      setStatus('success');
      setTimeout(() => router.push('/login'), 3000);
    } else {
      setStatus('error');
      setMessage(result.error || "Failed to activate account.");
    }
  };

  if (!token) {
    return (
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-900">Invalid Link</h2>
        <p className="text-slate-500 mt-2">This activation link is missing or corrupted.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={56} />
        <h2 className="text-2xl font-bold text-slate-900">Account Activated!</h2>
        <p className="text-slate-500 mt-2">Your password has been set. Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
      <div className="bg-[#2D5F8B] p-8 text-center text-white">
        <div className="flex justify-center mb-4">
          <Image src="/images/Logo.svg" alt="Logo" width={50} height={50} className="brightness-0 invert" />
        </div>
        <h2 className="text-2xl font-bold">Activate Account</h2>
        <p className="text-blue-100 text-sm mt-1">Set a secure password to begin monitoring.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {status === 'error' && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {message}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="password" required minLength={8}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Min. 8 characters"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="password" required
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Repeat password"
            />
          </div>
        </div>

        <button 
          type="submit" disabled={status === 'loading'}
          className="w-full bg-[#2D5F8B] hover:bg-[#234b6e] text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-900/10"
        >
          {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : 'Complete Activation'}
        </button>
      </form>
    </div>
  );
}

export default function ActivationPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Suspense fallback={<Loader2 className="animate-spin text-blue-600" size={40} />}>
        <ActivationForm />
      </Suspense>
    </div>
  );
}