import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ClinicianHelpClient from './ClinicianHelpClient';

export default async function ClinicianHelpPage({ params }) {
  const { id } = await params;
  
  // Fetch clinician data
  const clinician = await prisma.clinician.findUnique({
    where: { clinician_id: id },
    select: { clinician_id: true, full_name: true, email: true, specialization: true }
  });

  if (!clinician) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800">
      <ClinicianHelpClient clinician={clinician} />
    </div>
  );
}