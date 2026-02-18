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

  // 2. Fetch patients and their 10 most recent sensor logs
  const patientsData = await prisma.patient.findMany({
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
      
      // FIX: Add "Just now" for 0 minutes
      if (diffMins < 1) lastActive = 'Just now';
      else if (diffMins < 60) lastActive = `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
      else if (diffMins < 1440) lastActive = `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) === 1 ? '' : 's'} ago`;
      else lastActive = `${Math.floor(diffMins / 1440)} day${Math.floor(diffMins / 1440) === 1 ? '' : 's'} ago`;
    }

    return {
      id: patient.id,
      name: patient.fullName,
      initials,
      age: patient.age || 'N/A',
      score: riskScore,
      status,
      lastActive,
      lastSensorSync: latestLog ? latestLog.timestamp.toISOString() : null,
      avgStrainScore,
      compliance: latestLog ? 100 : 0 // Compliance logic can be adjusted later based on log frequency
    };
  });

  // 4. Calculate overview statistics dynamically
  const activeTodayCount = formattedPatients.filter(p => p.status !== 'offline' && p.lastActive !== 'Never').length;
  const highRiskCount = formattedPatients.filter(p => p.status === 'high-risk').length;
  const offlineCount = formattedPatients.filter(p => p.status === 'offline').length;

  const stats = [
    { label: 'Total Patients', value: formattedPatients.length.toString(), icon: 'Users', bg: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-100' },
    { label: 'Active Today', value: activeTodayCount.toString(), icon: 'Activity', bg: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-100' },
    { label: 'High Risk', value: highRiskCount.toString(), icon: 'AlertCircle', bg: 'bg-rose-50', textColor: 'text-rose-600', borderColor: 'border-rose-100' },
    { label: 'Offline', value: offlineCount.toString(), icon: 'WifiOff', bg: 'bg-slate-50', textColor: 'text-slate-600', borderColor: 'border-slate-100' }
  ];

  return (
    <DashboardClient 
      clinician={clinician} 
      initialPatients={formattedPatients} 
      stats={stats} 
    />
  );
}