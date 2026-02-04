'use client';

import { use } from 'react';
import { PatientProvider } from '@/lib/PatientContext';
import SidebarNavigation from '@/components/SidebarNavigation';

export default function PatientLayout({ children, params }) {
  const { id } = use(params);

  return (
    <PatientProvider patientId={id}>
      <div className="flex h-screen">
        <SidebarNavigation />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </PatientProvider>
  );
}
