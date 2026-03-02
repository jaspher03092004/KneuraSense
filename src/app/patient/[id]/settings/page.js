import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SettingsForm from '@/components/SettingsForm';

export default async function SettingsPage({ params }) {
  const { id } = await params;
  
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { 
      id: true, 
      fullName: true, 
      email: true, 
      updatedAt: true,
      highStressAlerts: true,
      vibrationEnabled: true,
      vibrationIntensity: true,
      ledEnabled: true,
      deviceMac: true,
      riskThreshold: true
    }
  });

  if (!patient) redirect('/login');

  return <SettingsForm patient={patient} />;
}