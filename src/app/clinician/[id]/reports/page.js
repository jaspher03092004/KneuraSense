import { prisma } from '@/lib/prisma';
import ExportButton from '@/components/ExportButton';
import { Users, Activity, FileDown } from 'lucide-react'; // Removed FileText

export default async function ReportsPage({ params }) {
  const { id } = params;

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

  // Calculate some quick stats for the UI
  const totalLogs = uniquePatients.reduce((acc, curr) => acc + curr.sensorLogs.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Clinical Reports
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            Export and analyze patient sensor data and intervention histories.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Patients</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{uniquePatients.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Sensor Logs Available</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalLogs.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* Main Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              Patient Data Export
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Download CSV reports containing timestamped sensor metrics (Knee Angle, Applied Force, Risk Score, etc.) for your patients. 
            </p>
          </div>

          <div className="p-6 md:p-8">
            {uniquePatients.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Patients Found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                  You don&apos;t have any patient data available for export yet. Issue interventions to automatically link patients to your dashboard.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {uniquePatients.map(patient => (
                  <div 
                    key={patient.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg shrink-0 border border-blue-200 dark:border-blue-800/50">
                        {patient.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{patient.fullName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {patient.sensorLogs.length} recent logs available
                        </p>
                      </div>
                    </div>
                    
                    <div className="shrink-0 w-full md:w-auto">
                      <ExportButton 
                        logs={patient.sensorLogs} 
                        patientName={patient.fullName} 
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