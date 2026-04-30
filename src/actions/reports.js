import { prisma } from "@/lib/prisma"; // Reference from src.zip

export async function getPatientLogsForExport(patientId, clinicianId, startDate, endDate) {
  try {
    // 1. Fetch logs within the specified date range
    const logs = await prisma.sensorLog.findMany({
      where: {
        patientId: patientId,
        timestamp: {
          gte: new Date(startDate), // Start of range[cite: 1]
          lte: new Date(endDate),   // End of range[cite: 1]
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // 2. Create an Audit Log entry for compliance
    await prisma.auditLog.create({
      data: {
        clinicianId: clinicianId,
        action: "EXPORT_DATA",
        targetType: "Patient",
        targetId: patientId,
        details: JSON.stringify({ 
          startDate, 
          endDate, 
          recordCount: logs.length 
        }),
      },
    });

    return { success: true, data: logs };
  } catch (error) {
    console.error("Export failed:", error);
    return { success: false, error: error.message };
  }
}