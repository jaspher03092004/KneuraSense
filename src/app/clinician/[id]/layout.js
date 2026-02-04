'use client';

import { use } from 'react';
import { ClinicianProvider } from '@/lib/ClinicianContext';
import ClinicianSidebarNavigation from '@/components/ClinicianSidebarNavigation';

export default function ClinicianIdLayout({ children, params }) {
  const { id } = use(params);

  return (
    <ClinicianProvider clinicianId={id}>
      <div className="flex h-screen">
        <ClinicianSidebarNavigation />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ClinicianProvider>
  );
}
