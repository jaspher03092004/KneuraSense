import { prisma } from '@/lib/prisma';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { id: clinicianId } = resolvedParams;
  const targetPatientId = resolvedSearchParams.patientId;

  const allPatients = await prisma.patient.findMany({
    select: {
      id: true,
      fullName: true,
      age: true,
      oaDiagnosis: true,
    },
    orderBy: { fullName: 'asc' }
  });

  let patient = null;
  let sensorLogs = [];

  if (targetPatientId) {
    patient = await prisma.patient.findUnique({
      where: { id: targetPatientId }
    });

    if (patient) {
      const rawSensorLogs = await prisma.sensorLog.findMany({
        where: { patientId: patient.id },
        orderBy: { timestamp: 'desc' },
        take: 24
      });
      sensorLogs = rawSensorLogs.reverse();
    }
  }

  let patientData = null;
  let chartData = [];

  if (patient) {
    patientData = {
      name: patient.fullName,
      initials: patient.fullName.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase(),
      id: patient.id,
      age: patient.age || "N/A",
      diagnosis: patient.oaDiagnosis ? `Knee OA (${patient.affectedKnee || 'Unknown'} Knee)` : "No OA",
      history: `Pain Severity: ${patient.painSeverity || 'N/A'}/10. Activity: ${patient.activityLevel || 'N/A'}`,
      avgRisk: sensorLogs.length > 0 
        ? Math.round(sensorLogs.reduce((acc, log) => acc + log.riskScore, 0) / sensorLogs.length) 
        : 0
    };

    chartData = sensorLogs.map(log => ({
      hour: new Date(log.timestamp).getHours(),
      timestamp: log.timestamp,
      risk: log.riskScore,
      angle: log.angle,
      force: log.force,
      skinTemp: log.skinTemp,
      bpm: log.bpm
    }));
  }

  return (
    <AnalyticsClient 
      clinicianId={clinicianId}
      patientData={patientData} 
      chartData={chartData} 
      rawLogs={sensorLogs} 
      allPatients={allPatients} 
    />
  );
}