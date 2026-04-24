import { prisma } from '@/lib/prisma';
import ExportButton from '@/components/ExportButton';
import { Users, Activity, FileDown } from 'lucide-react';

export default async function ReportsPage({ params }) {
  // Await the params Promise here
  const { id } = await params;

  // Fetch interventions made by this clinician to get their active patients
  const interventions = await prisma.intervention.findMany({
    where: { clinicianId: id },
    include: {
      patient: {
        include: {
          sensorLogs: {
            orderBy: { timestamp: 'desc' },
            take: 500 
          }
        }
      }
    }
  });

  // Extract a unique list of patients from the interventions
  const uniquePatients = Array.from(new Set(interventions.map(i => i.patient.id)))
    .map(patientId => interventions.find(i => i.patient.id === patientId).patient);

  // Calculate quick stats
  const totalLogs = uniquePatients.reduce((acc, curr) => acc + curr.sensorLogs.length, 0);

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <header className="mb-4 -mt-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Clinical Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Export and analyze patient sensor metrics and histories.
          </p>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patients</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{uniquePatients.length}</p>
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
        
        {/* Main Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileDown className="w-4 h-4 text-slate-500" />
              Patient Data Export
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Download CSV reports containing knee angle, force, and risk scores.
            </p>
          </div>

          <div className="p-3">
            {uniquePatients.length === 0 ? (
              <div className="p-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center flex flex-col items-center justify-center">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Patients Found</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Issue interventions to link patients to your dashboard.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {uniquePatients.map(patient => (
                  <div 
                    key={patient.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800/50">
                        {patient.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-none">{patient.fullName}</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          {patient.sensorLogs.length} logs available
                        </p>
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      <ExportButton 
                        logs={patient.sensorLogs} 
                        patientName={patient.fullName} 
                        className="text-xs py-1.5 px-3"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}