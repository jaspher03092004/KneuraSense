import { prisma } from '@/lib/prisma';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage({ params, searchParams }) {
  // 1. AWAIT the params and searchParams promises first
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { id: clinicianId } = resolvedParams;
  const targetPatientId = resolvedSearchParams.patientId;

  // 2. Fetch ALL patients so the clinician has a list to choose from
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

  // 3. Only fetch specific patient data if they clicked on one
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

  // 4. If a patient is selected, map their data for the dashboard
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
      risk: log.riskScore,
      angle: log.angle,
      force: log.force
    }));
  }

  return (
    <AnalyticsClient 
      clinicianId={clinicianId}
      patientData={patientData} 
      chartData={chartData} 
      rawLogs={sensorLogs} 
      allPatients={allPatients} // Pass the list of all patients to the client
    />
  );
}