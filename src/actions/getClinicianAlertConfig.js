'use server';
import { prisma } from '@/lib/prisma';

export async function getClinicianAlertConfig(clinicianId) {
  try {
    const clinician = await prisma.clinician.findUnique({
      where: { clinician_id: clinicianId },
      select: { criticalAlerts: true }
    });

    if (!clinician?.criticalAlerts) {
      return { alertsEnabled: false, patients: [] };
    }

    // Only get the basic details needed to listen to MQTT
    const patients = await prisma.patient.findMany({
      where: { clinicianId: clinicianId },
      select: {
        id: true,
        fullName: true,
        deviceMac: true,
        riskThreshold: true, 
      }
    });

    return { alertsEnabled: true, patients };
  } catch (error) {
    console.error("Error getting alert config:", error);
    return { alertsEnabled: false, patients: [] };
  }
}