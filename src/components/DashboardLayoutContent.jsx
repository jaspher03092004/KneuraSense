'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar';

export default function DashboardLayoutContent({ children, user }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar handles its own mobile drawer logic internally */}
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded}
        user={user} 
      />
      
      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ml-0 ${
          isSidebarExpanded ? 'md:ml-[280px]' : 'md:ml-20'
        }`}
      >
        <div className="p-4 md:p-8 pt-20 md:pt-8"> 
           {/* Added pt-20 on mobile to clear the fixed Hamburger button */}
          {children}
        </div>
      </main>
    </div>
  );
}