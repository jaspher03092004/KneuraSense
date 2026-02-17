import { prisma } from '@/lib/prisma';
import InterventionsClient from './InterventionsClient';

export default async function InterventionsPage({ params }) {
  const resolvedParams = await params;
  const { id: clinicianId } = resolvedParams;

  // Fetch all patients for the select dropdown
  const allPatients = await prisma.patient.findMany({
    select: { id: true, fullName: true, oaDiagnosis: true },
    orderBy: { fullName: 'asc' }
  });

  // Fetch all interventions logged by this clinician, including the patient's name
  const interventions = await prisma.intervention.findMany({
    where: { clinicianId },
    include: {
      patient: {
        select: { fullName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <InterventionsClient 
      clinicianId={clinicianId} 
      allPatients={allPatients} 
      interventions={interventions} 
    />
  );
} 