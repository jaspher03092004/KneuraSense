import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ClinicianSettingsForm from '@/components/ClinicianSettingsForm';

export default async function SettingsPage({ params }) {
  const { id } = await params;
  
  const clinician = await prisma.clinician.findUnique({
    where: { clinician_id: id },
    select: { 
      clinician_id: true, 
      full_name: true, 
      email: true, 
      updatedAt: true 
    }
  });

  if (!clinician) redirect('/login');

  return <ClinicianSettingsForm clinician={clinician} />;
}