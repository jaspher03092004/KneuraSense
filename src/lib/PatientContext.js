'use client';

import { createContext, useContext } from 'react';

const PatientContext = createContext();

export function PatientProvider({ children, patientId }) {
  return (
    <PatientContext.Provider value={{ patientId }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within PatientProvider');
  }
  return context;
}
