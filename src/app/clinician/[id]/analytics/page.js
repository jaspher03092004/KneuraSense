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

  // 1. Updated Select: Changed 'age' to 'dateOfBirth'
  const allPatients = await prisma.patient.findMany({
    where: {
      clinicianId: clinicianId
    },
    select: { 
      id: true, 
      mrn: true, 
      fullName: true, 
      dateOfBirth: true, // Required for dynamic age calculation in UI
      oaDiagnosis: true 
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
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      if (start && end) {
        startDate = new Date(start);
        endDate = new Date(end);
        endDate.setHours(23, 59, 59);
      } else if (period === '7d') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === '30d') {
        startDate.setDate(now.getDate() - 30);
      } else {
        startDate.setHours(now.getHours() - 24);
      }

      const rawSensorLogs = await prisma.sensorLog.findMany({
        where: { 
          patientId: patient.id,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000 
      });
      sensorLogs = rawSensorLogs.reverse();
    }
  }

  let patientData = null;
  let chartData = [];

  if (patient) {
    patientData = {
      name: patient.fullName,
      mrn: patient.mrn,
      initials: patient.fullName.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase(),
      id: patient.id,
      // 2. Fixed mapping: Pass the actual dateOfBirth value
      dateOfBirth: patient.dateOfBirth,
      diagnosis: patient.oaDiagnosis ? `Knee OA (${patient.affectedKnee || 'Unknown'} Knee)` : "No OA",
      // 3. Removed painSeverity reference as it no longer exists in schema
      history: `Activity: ${patient.activityLevel || 'N/A'}. Occupation: ${patient.occupation || 'N/A'}`,
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