'use server';

import { prisma } from '@/lib/prisma';

export async function checkCriticalAlerts(clinicianId) {
  try {
    // 1. Check if clinician has alerts enabled
    const clinician = await prisma.clinician.findUnique({
      where: { clinician_id: clinicianId },
      select: { criticalAlerts: true }
    });

    if (!clinician?.criticalAlerts) {
      return { alertsEnabled: false, patients: [] };
    }

    // 2. Fetch the latest sensor log for all patients
    const patients = await prisma.patient.findMany({
      where: { clinicianId: clinicianId },
      select: {
        id: true,
        fullName: true,
        riskThreshold: true, 
        sensorLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    const now = new Date();
    const highRiskPatients = [];

    patients.forEach(patient => {
      const latestLog = patient.sensorLogs[0];
      if (latestLog) {
        const hoursSinceLastSync = (now - new Date(latestLog.timestamp)) / (1000 * 60 * 60);
        
        // 2. Compare against patient.riskThreshold INSTEAD OF 70
        const threshold = patient.riskThreshold ?? 75;
        
        if (hoursSinceLastSync <= 24 && latestLog.riskScore >= threshold) {
          highRiskPatients.push({
            id: patient.id,
            name: patient.fullName,
            score: latestLog.riskScore
          });
        }
      }
    });

  return { alertsEnabled: true, patients: highRiskPatients };
  } catch (error) {
    console.error("Error checking critical alerts:", error);
    return { alertsEnabled: false, patients: [] };
  }
}