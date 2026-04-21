'use server';

import { prisma } from '@/lib/prisma';
import { cookies, headers } from 'next/headers';
import { jwtVerify } from 'jose';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email'; // <-- NEW IMPORT

// --- SECURITY PROTOCOL ---
async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) throw new Error("Unauthorized");

  const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secretKey);

  if (payload.role !== 'admin') {
    throw new Error("Forbidden: Admin access required");
  }

  return payload.userId;
}

async function getClientIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip'); 

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return realIp || 'Unknown IP';
}

// --- CLINICIAN APPROVAL WORKFLOW ---
export async function getPendingClinicians() {
  try {
    await verifyAdmin();
    const pending = await prisma.clinician.findMany({
      where: { isApproved: false },
      select: {
        clinician_id: true,
        full_name: true,
        email: true,
        specialization: true,
        licenseNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: pending };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function approveClinician(clinicianId) {
  try {
    await verifyAdmin();
    await prisma.clinician.update({
      where: { clinician_id: clinicianId },
      data: { isApproved: true }
    });
    return { success: true, message: "Clinician approved successfully." };
  } catch (error) {
    return { success: false, error: "Failed to approve clinician." };
  }
}

export async function rejectClinician(clinicianId) {
  try {
    await verifyAdmin();
    await prisma.clinician.delete({
      where: { clinician_id: clinicianId }
    });
    return { success: true, message: "Clinician registration rejected and removed." };
  } catch (error) {
    return { success: false, error: "Failed to reject clinician." };
  }
}

// --- DASHBOARD TELEMETRY & ANALYTICS ---
export async function getDashboardAnalytics(startDateStr, endDateStr) {
  try {
    await verifyAdmin();

    const [totalPatients, totalApprovedClinicians, pendingApprovalsCount, activeDevices] = await Promise.all([
      prisma.patient.count(),
      prisma.clinician.count({ where: { isApproved: true } }),
      prisma.clinician.count({ where: { isApproved: false } }),
      prisma.patient.count({ where: { deviceMac: { not: null } } })
    ]);

    const diagnosisStats = await prisma.patient.groupBy({
      by: ['oaDiagnosis'],
      _count: { id: true }
    });
    
    const confirmedOaCount = diagnosisStats.find(d => d.oaDiagnosis === true || d.oaDiagnosis === "Yes")?._count.id || 0;
    const atRiskCount = diagnosisStats.find(d => d.oaDiagnosis === false || d.oaDiagnosis === "No")?._count.id || 0;

    const demographicsData = [
      { name: 'Confirmed OA', value: confirmedOaCount },
      { name: 'At-Risk', value: atRiskCount }
    ];

    const patientsWithLogs = await prisma.patient.findMany({
      where: { deviceMac: { not: null } },
      select: {
        sensorLogs: { orderBy: { timestamp: 'desc' }, take: 1, select: { battery: true } }
      }
    });

    let batteryHealth = { healthy: 0, warning: 0, critical: 0 };
    patientsWithLogs.forEach(p => {
      if (p.sensorLogs.length > 0) {
        const level = p.sensorLogs[0].battery;
        if (level > 50) batteryHealth.healthy++;
        else if (level > 20) batteryHealth.warning++;
        else batteryHealth.critical++;
      }
    });

    const recentAlerts = await prisma.sensorLog.findMany({
      where: { riskScore: { gt: 75 } },
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: { patient: { select: { fullName: true } } }
    });

    const end = endDateStr ? new Date(endDateStr) : new Date();
    end.setHours(23, 59, 59, 999); 
    const start = startDateStr ? new Date(startDateStr) : new Date(end);
    if (!startDateStr) start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    if (start > end) throw new Error("Start date cannot be after end date.");

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dateMap = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const label = diffDays <= 14 
        ? d.toLocaleDateString('en-US', { weekday: 'short' }) 
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap.push({ dateString, label, patients: 0, clinicians: 0, alerts: 0 });
    }

    const [newPatients, newClinicians, recentAlertLogs] = await Promise.all([
      prisma.patient.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { createdAt: true } }),
      prisma.clinician.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { createdAt: true } }),
      prisma.sensorLog.findMany({ where: { riskScore: { gt: 75 }, timestamp: { gte: start, lte: end } }, select: { timestamp: true } })
    ]);

    newPatients.forEach(p => {
      const dStr = p.createdAt.toISOString().split('T')[0];
      const day = dateMap.find(d => d.dateString === dStr);
      if (day) day.patients++;
    });

    newClinicians.forEach(c => {
      const dStr = c.createdAt.toISOString().split('T')[0];
      const day = dateMap.find(d => d.dateString === dStr);
      if (day) day.clinicians++;
    });

    recentAlertLogs.forEach(a => {
      const dStr = a.timestamp.toISOString().split('T')[0];
      const day = dateMap.find(d => d.dateString === dStr);
      if (day) day.alerts++;
    });

    const growthData = dateMap.map(d => ({ date: d.label, patients: d.patients, clinicians: d.clinicians }));
    const alertTrends = dateMap.map(d => ({ date: d.label, alerts: d.alerts }));

    const syncEfficiency = [
      { name: '< 1s', value: 92, fill: '#10b981' },
      { name: '1-3s', value: 6, fill: '#3b82f6' },
      { name: '> 3s', value: 2, fill: '#f59e0b' }
    ];

    return { 
      success: true, 
      data: {
        kpis: { totalPatients, totalApprovedClinicians, pendingApprovalsCount, activeDevices },
        demographicsData,
        batteryHealth: [
          { name: '> 50% (Good)', value: batteryHealth.healthy, fill: '#10b981' },
          { name: '20-50% (Warn)', value: batteryHealth.warning, fill: '#f59e0b' },
          { name: '< 20% (Crit)', value: batteryHealth.critical, fill: '#e11d48' }
        ],
        recentAlerts, growthData, alertTrends, syncEfficiency
      } 
    };
  } catch (error) {
    return { success: false, error: "Failed to load dashboard analytics." };
  }
}

// --- HARDWARE MANAGEMENT ACTIONS ---
export async function getHardwareFleet() {
  try {
    await verifyAdmin();

    // 1. Fetch active patients with linked devices
    const patientsWithDevices = await prisma.patient.findMany({
      where: { deviceMac: { not: null } },
      select: {
        id: true, 
        fullName: true, 
        deviceMac: true,
        clinician: { select: { full_name: true } },
        sensorLogs: { orderBy: { timestamp: 'desc' }, take: 1, select: { timestamp: true, battery: true } }
      },
      orderBy: { fullName: 'asc' }
    });

    // 2. Fetch full device inventory
    const inventory = await prisma.hardwareDevice.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // 3. Fetch patients without devices for the manual pairing dropdown
    const unassignedPatients = await prisma.patient.findMany({
      where: { deviceMac: null },
      select: { id: true, fullName: true }
    });

    return { 
      success: true, 
      data: { active: patientsWithDevices, inventory, unassignedPatients } 
    };
  } catch (error) {
    return { success: false, error: "Failed to fetch hardware fleet." };
  }
}

export async function registerNewDevice(macAddress) {
  try {
    const adminId = await verifyAdmin();
    
    const cleanMac = macAddress.toUpperCase().trim();

    const existing = await prisma.hardwareDevice.findUnique({ where: { macAddress: cleanMac } });
    if (existing) return { success: false, error: "Device MAC already exists in inventory." };

    await prisma.hardwareDevice.create({
      data: { macAddress: cleanMac, status: 'IN_STOCK', firmwareVer: '1.0.0' }
    });

    // FIX: Safely create the Audit Log without the strict clinicianId
    await prisma.auditLog.create({
      data: { 
        action: 'REGISTER_DEVICE', 
        targetType: 'Hardware', 
        targetId: cleanMac, 
        details: `Added to inventory by Admin ${adminId}.` 
      }
    });

    return { success: true, message: "Device successfully added to inventory." };
  } catch (error) {
    // Log the actual error to your terminal so you can see it
    console.error("Registration Error:", error); 
    // Return the specific error message to the frontend instead of a generic one
    return { success: false, error: `Failed to register: ${error.message}` };
  }
}

export async function updateDeviceStatus(macAddress, newStatus) {
  try {
    const adminId = await verifyAdmin();
    
    await prisma.hardwareDevice.update({
      where: { macAddress },
      data: { status: newStatus }
    });

    await prisma.auditLog.create({
      data: { clinicianId: adminId, action: 'UPDATE_DEVICE_STATUS', targetType: 'Hardware', targetId: macAddress, details: `Status changed to ${newStatus}.` }
    });

    return { success: true, message: "Device status updated." };
  } catch (error) {
    return { success: false, error: "Failed to update device status." };
  }
}

export async function manualPairDevice(patientId, macAddress) {
  try {
    const adminId = await verifyAdmin();
    const cleanMac = macAddress.toUpperCase().trim();
    
    // 1. Check if device is already assigned to someone else
    const existingPatient = await prisma.patient.findUnique({ where: { deviceMac: cleanMac } });
    if (existingPatient) return { success: false, error: "MAC Address is already assigned to another patient." };

    // 2. Upsert the hardware record (in case it wasn't formally registered in inventory first)
    await prisma.hardwareDevice.upsert({
      where: { macAddress: cleanMac },
      update: { status: 'ASSIGNED' },
      create: { macAddress: cleanMac, status: 'ASSIGNED', firmwareVer: '1.0.0' }
    });

    // 3. Assign to patient
    await prisma.patient.update({
      where: { id: patientId },
      data: { deviceMac: cleanMac }
    });

    await prisma.auditLog.create({
      data: { clinicianId: adminId, action: 'PAIR_DEVICE', targetType: 'Patient', targetId: patientId, details: `Manually paired with MAC: ${cleanMac}` }
    });

    return { success: true, message: "Device successfully paired." };
  } catch (error) {
    return { success: false, error: "Failed to pair device." };
  }
}

export async function unpairDevice(patientId, macAddress) {
  try {
    const adminId = await verifyAdmin();
    
    await prisma.patient.update({
      where: { id: patientId },
      data: { deviceMac: null }
    });

    if (macAddress) {
      await prisma.hardwareDevice.update({
        where: { macAddress },
        data: { status: 'IN_STOCK' }
      }).catch(() => {}); // Catch if hardware device wasn't in inventory table
    }

    await prisma.auditLog.create({
      data: { clinicianId: adminId, action: 'UNPAIR_DEVICE', targetType: 'Patient', targetId: patientId, details: `Unpaired device MAC: ${macAddress}` }
    });

    return { success: true, message: "Device successfully unlinked and returned to stock." };
  } catch (error) {
    return { success: false, error: "Failed to unlink device." };
  }
}

export async function triggerOTAUpdate(macAddress) {
  try {
    const adminId = await verifyAdmin();
    
    // In a real scenario, this would trigger an AWS IoT Core / MQTT message.
    // Here, we simulate a successful OTA update in the database.
    const newVersion = `1.1.${Math.floor(Math.random() * 10)}`;
    
    await prisma.hardwareDevice.update({
      where: { macAddress },
      data: { firmwareVer: newVersion, lastOtaUpdate: new Date() }
    });

    await prisma.auditLog.create({
      data: { clinicianId: adminId, action: 'OTA_UPDATE', targetType: 'Hardware', targetId: macAddress, details: `Pushed firmware ${newVersion}` }
    });

    return { success: true, message: `OTA Update initiated. Target firmware: ${newVersion}` };
  } catch (error) {
    return { success: false, error: "Failed to trigger OTA update." };
  }
}

export async function getSystemUsers() {
  try {
    await verifyAdmin();
    const [clinicians, patients] = await Promise.all([
      prisma.clinician.findMany({
        select: {
          clinician_id: true, full_name: true, email: true, specialization: true, isApproved: true, createdAt: true,
          _count: { select: { patients: true } }
        },
        orderBy: { full_name: 'asc' }
      }),
      prisma.patient.findMany({
        select: {
          id: true, fullName: true, email: true, oaDiagnosis: true, createdAt: true, deviceMac: true, clinicianId: true,
          clinician: { select: { full_name: true } },
          sensorLogs: { orderBy: { timestamp: 'desc' }, take: 1, select: { riskScore: true } }
        },
        orderBy: { fullName: 'asc' }
      })
    ]);
    return { success: true, data: { clinicians, patients } };
  } catch (error) {
    return { success: false, error: "Failed to fetch system users." };
  }
}

export async function getSystemAuditLogs() {
  try {
    await verifyAdmin();
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        // Only include clinician, since that is the only relation defined in the schema
        clinician: { select: { full_name: true, email: true } }
      }
    });

    const totalLogs = logs.length;
    let criticalActions = 0;
    let loginEvents = 0;
    
    logs.forEach(log => {
      const action = log.action.toUpperCase();
      if (action.includes('DELETE') || action.includes('EXPORT') || action.includes('REVOKE')) criticalActions++;
      if (action.includes('LOGIN')) loginEvents++;
    });

    return { success: true, data: { logs, stats: { totalLogs, criticalActions, loginEvents } } };
  } catch (error) {
    console.error("Audit Log Error:", error);
    return { success: false, error: "Failed to fetch system audit logs." };
  }
}

// ==========================================
// ADVANCED USER MANAGEMENT ACTIONS
// ==========================================

export async function toggleClinicianAccess(clinicianId, currentStatus) {
  try {
    await verifyAdmin();
    await prisma.clinician.update({
      where: { clinician_id: clinicianId },
      data: { isApproved: !currentStatus }
    });
    
    const adminId = await verifyAdmin();
    await prisma.auditLog.create({
      data: {
        clinicianId: adminId, 
        action: !currentStatus ? 'RESTORE_ACCESS' : 'REVOKE_ACCESS',
        targetType: 'Clinician',
        targetId: clinicianId,
        details: `Admin changed approval status to ${!currentStatus}`
      }
    });

    return { success: true, message: `Clinician access ${!currentStatus ? 'restored' : 'revoked'}.` };
  } catch (error) {
    return { success: false, error: "Failed to update clinician status." };
  }
}

export async function updateUserProfile(id, role, data) {
  try {
    const adminId = await verifyAdmin();
    
    if (role === 'clinician') {
      await prisma.clinician.update({ where: { clinician_id: id }, data });
    } else {
      await prisma.patient.update({ where: { id }, data });
    }

    await prisma.auditLog.create({
      data: {
        clinicianId: adminId, 
        action: 'UPDATE_PROFILE',
        targetType: role === 'clinician' ? 'Clinician' : 'Patient',
        targetId: id,
        details: `Admin manually edited profile data.`
      }
    });

    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
    return { success: false, error: "Failed to update profile details. Email might already be in use." };
  }
}

export async function deleteSystemUser(id, role) {
  try {
    const adminId = await verifyAdmin();
    
    if (role === 'clinician') {
      await prisma.clinician.delete({ where: { clinician_id: id } });
    } else {
      await prisma.patient.delete({ where: { id } });
    }

    await prisma.auditLog.create({
      data: {
        clinicianId: adminId, 
        action: 'DELETE_USER',
        targetType: role === 'clinician' ? 'Clinician' : 'Patient',
        targetId: id,
        details: `Admin permanently deleted account.`
      }
    });

    return { success: true, message: "User permanently deleted." };
  } catch (error) {
    return { success: false, error: "Failed to delete user. Ensure they have no active dependencies." };
  }
}

// THE UPDATED PASSWORD RESET FUNCTION
export async function adminTriggerPasswordReset(email) {
  try {
    await verifyAdmin();
    
    // Check if the user exists first before making a token
    const [clinicianCheck, patientCheck] = await Promise.all([
      prisma.clinician.findUnique({ where: { email } }),
      prisma.patient.findUnique({ where: { email } })
    ]);

    if (!clinicianCheck && !patientCheck) {
      return { success: false, error: "No user found with that email address." };
    }
    
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // Valid for 24h
    
    await prisma.passwordResetToken.create({
      data: { email, token, expires }
    });

    // Fire the email
    const emailResult = await sendPasswordResetEmail(email, token);
    
    if (!emailResult.success) {
      return { success: false, error: "Token generated, but failed to send the email." };
    }

    return { success: true, message: "Password reset instructions generated and sent." };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error: "Failed to initiate password reset." };
  }
}

export async function deleteHardwareDevice(macAddress) {
  try {
    const adminId = await verifyAdmin();
    const userIp = await getClientIp(); // <-- 1. Get the IP

    const existingHardware = await prisma.hardwareDevice.findUnique({ where: { macAddress } });
    if (existingHardware?.status === 'ASSIGNED') {
      return { success: false, error: "Cannot delete an assigned device. Unpair it first." };
    }

    await prisma.hardwareDevice.delete({
      where: { macAddress }
    });

    await prisma.auditLog.create({
      data: { 
        action: 'DELETE_DEVICE', 
        targetType: 'Hardware', 
        targetId: macAddress, 
        details: `Permanently deleted from inventory by Admin ${adminId}.`,
        ipAddress: userIp // <-- 2. Save the IP to the database
      }
    });

    return { success: true, message: "Device permanently deleted." };
  } catch (error) {
    console.error("Delete Error:", error); 
    return { success: false, error: `Failed to delete: ${error.message}` };
  }
}