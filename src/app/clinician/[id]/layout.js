import { prisma } from '@/lib/prisma';
import DashboardLayoutContent from '@/components/DashboardLayoutContent';
import { redirect } from 'next/navigation';

export default async function ClinicianLayout({ children, params }) {
  // 1. Get the ID from the URL
  const { id } = await params;

  // 2. Fetch the specific clinician details needed for the sidebar
  const clinician = await prisma.clinician.findUnique({
    where: { clinician_id: id },
    select: {
      clinician_id: true,
      full_name: true,
      email: true,
      specialization: true,
    },
  });
  
  // Security check: If no clinician found, kick them out
  if (!clinician) {
    redirect('/login');
  }

  // 3. Map the clinician data to match the expected format for Usidebar
  const clinicianData = {
    id: clinician.clinician_id,
    fullName: clinician.full_name,
    email: clinician.email,
    role: 'CLINICIAN',
  };

  // 4. Render the Client Wrapper and pass the clinician data
  return (
    <DashboardLayoutContent user={clinicianData}>
      {children}
    </DashboardLayoutContent>
  );
}
