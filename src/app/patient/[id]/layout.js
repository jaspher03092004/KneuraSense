import { prisma } from '@/lib/prisma';
import DashboardLayoutContent from '@/components/DashboardLayoutContent';
import { redirect } from 'next/navigation';

export default async function PatientLayout({ children, params }) {
  // 1. Get the ID from the URL
  const { id } = await params;

  // 2. Fetch the specific patient details needed for the sidebar
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });
  
  // Security check: If no patient found, kick them out
  if (!patient) {
    redirect('/login');
  }

  // 3. Render the Client Wrapper and pass the patient data
  return (
    <DashboardLayoutContent user={patient}>
      {children}
    </DashboardLayoutContent>
  );
}