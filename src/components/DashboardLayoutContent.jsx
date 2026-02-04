'use client';

import { useState } from 'react';
import Sidebar from '@/components/Usidebar';

export default function DashboardLayoutContent({ children, user }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Pass the fetched user data to the Sidebar */}
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded}
        user={user} 
      />
      
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'ml-[280px]' : 'ml-20'
        }`}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}