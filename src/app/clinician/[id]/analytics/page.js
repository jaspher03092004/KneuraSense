import { prisma } from '@/lib/prisma';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { id: clinicianId } = resolvedParams;
  const targetPatientId = resolvedSearchParams.patientId;
  const period = resolvedSearchParams.period; 
  const start = resolvedSearchParams.start;
  const end = resolvedSearchParams.end;

  const allPatients = await prisma.patient.findMany({
    select: { id: true, fullName: true, age: true, oaDiagnosis: true },
    orderBy: { fullName: 'asc' }
  });

  let patient = null;
  let sensorLogs = [];

  if (targetPatientId) {
    patient = await prisma.patient.findUnique({
      where: { id: targetPatientId }
    });

    if (patient) {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date(); // Added to track the end of the range

      // Check if custom start and end dates were provided
      if (start && end) {
        startDate = new Date(start);
        endDate = new Date(end);
        endDate.setHours(23, 59, 59); // Set to end of the day
      } else if (period === '7d') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === '30d') {
        startDate.setDate(now.getDate() - 30);
      } else {
        // Default to 24 hours
        startDate.setHours(now.getHours() - 24);
      }

      const rawSensorLogs = await prisma.sensorLog.findMany({
        where: { 
          patientId: patient.id,
          timestamp: {
            gte: startDate,
            lte: endDate // Now limits to endDate instead of strictly "now"
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000 
      });
      sensorLogs = rawSensorLogs.reverse();
    }
  }

  // ... (rest of the data formatting code remains exactly the same) ...
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