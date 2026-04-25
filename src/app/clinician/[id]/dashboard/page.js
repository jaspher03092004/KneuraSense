import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export default async function ClinicianDashboardPage({ params }) {
  const { id } = await params;

  // 1. Fetch Clinician Preferences
  const clinician = await prisma.clinician.findUnique({
    where: { clinician_id: id },
    select: {
      clinician_id: true, 
      criticalAlerts: true,
      compactView: true,
    }
  });

  // 2. SECURED: Fetch ONLY the patients assigned to this clinician
  const patientsData = await prisma.patient.findMany({
    where: {
      clinicianId: id // <-- Security lock applied here
    },
    include: {
      sensorLogs: {
        orderBy: { timestamp: 'desc' },
        take: 10, 
      }
    }
  });

  const now = new Date();

  // 3. Format the data to match the UI requirements
  const formattedPatients = patientsData.map(patient => {
    const latestLog = patient.sensorLogs[0];
    const riskScore = latestLog?.riskScore || 0;

    // Calculate Average Strain (Force) from recent logs
    const avgStrainScore = patient.sensorLogs.length > 0
      ? Math.round(patient.sensorLogs.reduce((acc, log) => acc + log.force, 0) / patient.sensorLogs.length)
      : 0;

    // Determine Status based on risk score and recency
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

    // Generate initials (e.g., "John Doe" -> "JD")
    const initials = patient.fullName
      ? patient.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : '??';

    // Format relative time (e.g., "2 hours ago")
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
      mrn: patient.mrn,
      name: patient.fullName,
      email: patient.email,
      deviceMac: patient.deviceMac || null,
      initials,
      age: patient.age || 'N/A',
      score: riskScore,
      status,
      lastActive,
      lastSensorSync: latestLog ? latestLog.timestamp.toISOString() : null,
      avgStrainScore,
      compliance: latestLog ? 100 : 0 
    };
  });

  // 4. Calculate overview statistics dynamically based ONLY on the clinician's patients
  const activeTodayCount = formattedPatients.filter(p => p.status !== 'offline' && p.lastActive !== 'Never').length;
  const highRiskCount = formattedPatients.filter(p => p.status === 'high-risk').length;
  const offlineCount = formattedPatients.filter(p => p.status === 'offline').length;

  const stats = [
    { 
      label: 'Total Patients', 
      value: formattedPatients.length.toString(), 
      icon: 'Users', 
      bg: 'bg-blue-50 dark:bg-blue-500/10', 
      textColor: 'text-blue-600 dark:text-blue-400', 
      borderColor: 'border-blue-100 dark:border-blue-500/20' 
    },
    { 
      label: 'Active Today', 
      value: activeTodayCount.toString(), 
      icon: 'Activity', 
      bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
      textColor: 'text-emerald-600 dark:text-emerald-400', 
      borderColor: 'border-emerald-100 dark:border-emerald-500/20' 
    },
    { 
      label: 'High Risk', 
      value: highRiskCount.toString(), 
      icon: 'AlertCircle', 
      bg: 'bg-rose-50 dark:bg-rose-500/10', 
      textColor: 'text-rose-600 dark:text-rose-400', 
      borderColor: 'border-rose-100 dark:border-rose-500/20' 
    },
    { 
      label: 'Offline', 
      value: offlineCount.toString(), 
      icon: 'WifiOff', 
      bg: 'bg-slate-50 dark:bg-slate-800', 
      textColor: 'text-slate-600 dark:text-slate-400', 
      borderColor: 'border-slate-100 dark:border-slate-700' 
    }
  ];

  return (
    <DashboardClient 
      clinician={clinician} 
      initialPatients={formattedPatients} 
      stats={stats} 
    />
  );
}