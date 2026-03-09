import { prisma } from '@/lib/prisma';
import InterventionsClient from './InterventionsClient';

export default async function InterventionsPage({ params }) {
  const resolvedParams = await params;
  const { id: clinicianId } = resolvedParams;

  // SECURED: Fetch ONLY the patients assigned to this clinician
  const allPatients = await prisma.patient.findMany({
    where: { 
      clinicianId: clinicianId // Security lock applied here
    },
    select: { 
      id: true, 
      fullName: true, 
      oaDiagnosis: true 
    },
    orderBy: { 
      fullName: 'asc' 
    }
  });

  // Fetch all interventions logged by this clinician, including the patient's name
  const interventions = await prisma.intervention.findMany({
    where: { 
      clinicianId: clinicianId // This was already secure
    },
    include: {
      patient: {
        select: { fullName: true }
      }
    },
    orderBy: { 
      createdAt: 'desc' 
    }
  });

  return (
    <InterventionsClient 
      clinicianId={clinicianId} 
      allPatients={allPatients} 
      interventions={interventions} 
    />
  );
}