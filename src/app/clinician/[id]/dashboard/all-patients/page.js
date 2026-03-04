import { prisma } from '@/lib/prisma';
import AllPatientsClient from './AllPatientsClient';
import { notFound } from 'next/navigation';

export default async function AllPatientsPage({ params }) {
  const { id } = await params;

  const clinician = await prisma.clinician.findUnique({
    where: { clinician_id: id },
    select: { compactView: true }
  });

  if (!clinician) return notFound();

  // Fetch all patients with their latest sensor logs
  const patientsData = await prisma.patient.findMany({
    where: { 
      clinicianId: id
    },
    include: {
      sensorLogs: {
        orderBy: { timestamp: 'desc' },
        take: 1
      }
    },
    orderBy: { fullName: 'asc' }
  });

  const now = new Date();

  // Format patient data
  const formattedPatients = patientsData.map(patient => {
    const latestLog = patient.sensorLogs[0];
    const riskScore = latestLog?.riskScore || 0;

    let status = 'offline';
    if (latestLog) {
      const hoursSinceLastSync = (now - new Date(latestLog.timestamp)) / (1000 * 60 * 60);
      if (hoursSinceLastSync > 24) {
        status = 'offline';
      } else if (riskScore >= 70) {
        status = 'high-risk';
      } else if (riskScore >= 40) {
        status = 'caution';
      } else {
        status = 'stable';
      }
    }

    const initials = patient.fullName
      ? patient.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : '??';

    let lastActive = 'Never';
    if (latestLog) {
      const diffMins = Math.floor((now - new Date(latestLog.timestamp)) / 60000);
      if (diffMins < 1) lastActive = 'Just now';
      else if (diffMins < 60) lastActive = `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
      else if (diffMins < 1440) lastActive = `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) === 1 ? '' : 's'} ago`;
      else lastActive = `${Math.floor(diffMins / 1440)} day${Math.floor(diffMins / 1440) === 1 ? '' : 's'} ago`;
    }

    return {
      id: patient.id,
      name: patient.fullName,
      email: patient.email,
      initials,
      age: patient.age || 'N/A',
      score: riskScore,
      status,
      lastActive,
      lastSensorSync: latestLog ? latestLog.timestamp.toISOString() : null
    };
  });

  return <AllPatientsClient patients={formattedPatients} clinicianId={id} isCompact={clinician.compactView} />;
}
