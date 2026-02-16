'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button 
      onClick={handleRefresh}
      disabled={isPending}
      className="flex w-full md:w-auto h-11 items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70"
    >
      <RefreshCw 
        size={16} 
        className={`${isPending ? 'animate-spin' : ''}`} 
      />
      {isPending ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}