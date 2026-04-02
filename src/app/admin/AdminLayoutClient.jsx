'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar';

export default function AdminLayoutClient({ children, user }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden">
      
      {/* We pass the user object into the Sidebar so it knows this is the Admin 
        and can display the correct menu links and name bubble.
      */}
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} user={user} />
      
      {/* ADDED: pt-16 pb-24 md:pt-0 md:pb-0 w-full
          This adds padding on mobile to push the content down below a top-navbar 
          and up above a bottom-navbar. It resets to 0 on desktop (md:).
      */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 w-full pt-16 pb-24 md:pt-0 md:pb-0 ${
        isExpanded ? 'md:ml-[280px]' : 'md:ml-20'
      }`}>
        {children}
      </main>
    </div>
  );
}