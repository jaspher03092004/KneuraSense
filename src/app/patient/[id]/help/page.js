import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import HelpClient from './HelpClient';

export default async function HelpPage({ params }) {
  const { id } = await params;
  
  // Fetch patient data/help/page.js]
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, fullName: true, email: true }
  });

  if (!patient) redirect('/login');

  // Fetch the patient's absolute latest sensor log to determine device status
  const latestLog = await prisma.sensorLog.findFirst({
    where: { patientId: id },
    orderBy: { timestamp: 'desc' },
    select: { timestamp: true, battery: true }
  });

  const supportEmail = process.env.SMTP_USER;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800">
      {/* Offload the interactive UI to the Client Component */}
      <HelpClient patient={patient} latestLog={latestLog} />
    </div>
  );
}