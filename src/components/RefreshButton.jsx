'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    // startTransition allows us to track the pending state of the server refresh
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button 
      onClick={handleRefresh}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-70"
    >
      <RefreshCw 
        size={16} 
        className={`${isPending ? 'animate-spin' : ''}`} 
      />
      {isPending ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}