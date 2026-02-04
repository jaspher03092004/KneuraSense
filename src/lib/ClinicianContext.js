'use client';

import { createContext, useContext } from 'react';

const ClinicianContext = createContext();

export function ClinicianProvider({ children, clinicianId }) {
  return (
    <ClinicianContext.Provider value={{ clinicianId }}>
      {children}
    </ClinicianContext.Provider>
  );
}

export function useClinician() {
  const ctx = useContext(ClinicianContext);
  if (!ctx) throw new Error('useClinician must be used within ClinicianProvider');
  return ctx;
}
