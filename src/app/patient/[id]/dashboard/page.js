import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SmartDashboard from '@/components/SmartDashboard'; // Import the new component
import { Activity, Database } from 'lucide-react';

export default async function PatientDashboard({ params }) {
  const { id } = await params;

  // 1. Fetch Patient Data (Server Side)
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, fullName: true },
  });

  if (!patient) redirect('/login');

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-0 md:p-6 space-y-6">
      
      {/* 2. Load the SMART Dashboard (Client Side, Real-time) */}
      <SmartDashboard patientName={patient.fullName} />
    </div>
  );
}