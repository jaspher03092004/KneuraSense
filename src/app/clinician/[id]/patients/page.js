import { prisma } from '@/lib/prisma';
import PatientsClient from './PatientsClient';
import { notFound } from 'next/navigation';

export default async function PatientsPage({ params }) {
  const { id } = await params;

  const clinician = await prisma.clinician.findUnique({
    where: { clinician_id: id }
  });

  if (!clinician) return notFound();

  // Fetch all assigned patients
  const patients = await prisma.patient.findMany({
    where: { clinicianId: id },
    include: {
      sensorLogs: {
        orderBy: { timestamp: 'desc' },
        take: 1, // Just grab the very last log to see when they were last online
      }
    },
    orderBy: { fullName: 'asc' } // Alphabetical order
  });

  return <PatientsClient clinicianId={id} patients={patients} />;
}