import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SmartDashboard from '@/components/SmartDashboard';
import { Activity, Database } from 'lucide-react';

export default async function PatientDashboard({ params }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, fullName: true },
  });

  if (!patient) redirect('/login');

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 p-0 md:p-6 space-y-6">
      <SmartDashboard patientName={patient.fullName} patientId={patient.id} />
    </div>
  );
}