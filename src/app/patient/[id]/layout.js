import { prisma } from '@/lib/prisma';
import DashboardLayoutContent from '@/components/DashboardLayoutContent';
import GlobalPatientAlerts from '@/components/GlobalPatientAlerts';
import { redirect } from 'next/navigation';
import KneuraBot from '@/components/KneuraBot';

export default async function PatientLayout({ children, params }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      highStressAlerts: true, 
      riskThreshold: true,
      deviceMac: true,
    },
  });
  
  if (!patient) {
    redirect('/login');
  }

  return (
    <DashboardLayoutContent user={patient}>
      {/* Background Global Component */}
      <GlobalPatientAlerts 
         highStressAlerts={patient.highStressAlerts} 
         patientId={patient.id} 
         riskThreshold={patient.riskThreshold}
      />
      {children}
      <KneuraBot />
    </DashboardLayoutContent>
    
  );
}