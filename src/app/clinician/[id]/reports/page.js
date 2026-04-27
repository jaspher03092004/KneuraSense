import { prisma } from '@/lib/prisma';
import { Users, Activity } from 'lucide-react';
import PatientReportList from './PatientReportList'; // <-- Import the new component

export default async function ReportsPage({ params }) {
  const { id } = await params;

  // 1. OPTIMIZED: Fetch only patient metadata and the COUNT of logs
  const patients = await prisma.patient.findMany({
    where: { clinicianId: id },
    select: {
      id: true,
      fullName: true,
      mrn: true,
      email: true,
      affectedKnee: true,
      createdAt: true,
      // Only get the count, NOT the actual logs
      _count: {
        select: { sensorLogs: true }
      }
    }
  });

  const totalLogs = patients.reduce((acc, curr) => acc + (curr._count?.sensorLogs || 0), 0);

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto">
        
        <header className="mb-4 -mt-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Clinical Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Export and analyze patient sensor metrics and histories.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patients</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{patients.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-md text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Logs</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{totalLogs.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* 2. Pass the data down to the Client Component */}
        <PatientReportList patients={patients} />

      </div>
    </div>
  );
}