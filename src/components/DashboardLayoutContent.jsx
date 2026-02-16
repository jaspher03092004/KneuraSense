'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';

// 15 minutes in milliseconds
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; 

export default function DashboardLayoutContent({ children, user }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    router.push('/login?reason=timeout');
  }, [router]);

  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [handleLogout]);

  return (
    // ADDED dark:bg-slate-950 HERE!
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 relative transition-colors duration-300">
      
      {/* Mobile Backdrop Overlay */}
      {isSidebarExpanded && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsSidebarExpanded(false)}
        />
      )}

      <Sidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded}
        user={user} 
      />
      
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ml-0 w-full ${
          isSidebarExpanded ? 'md:ml-[280px]' : 'md:ml-20'
        }`}
      >
        <div className="p-4 md:p-8 pt-20 md:pt-8 w-full"> 
          {children}
        </div>
      </main>
    </div>
  );
}