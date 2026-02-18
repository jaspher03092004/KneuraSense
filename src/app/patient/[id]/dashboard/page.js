import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SmartDashboard from '@/components/SmartDashboard';
import { ClipboardList, FileText, Pill, Activity, Stethoscope, Calendar } from 'lucide-react';

export default async function PatientDashboard({ params }) {
  const { id } = await params;

  // Fetch patient along with their latest intervention AND highStressAlerts setting
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { 
      id: true, 
      fullName: true,
      highStressAlerts: true, // <-- ADDED THIS
      interventions: {
        orderBy: { createdAt: 'desc' },
        take: 1, 
        include: {
          clinician: { select: { full_name: true } }
        }
      }
    },
  });

  if (!patient) redirect('/login');

  const latestIntervention = patient.interventions[0];

  // Helper to match the icons and their specific colors
  const getIcon = (type) => {
    switch (type) {
      case 'Advice': return <FileText size={18} className="text-blue-500" />;
      case 'Medication': return <Pill size={18} className="text-rose-500" />;
      case 'Exercise': return <Activity size={18} className="text-emerald-500" />;
      default: return <Stethoscope size={18} className="text-purple-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 p-4 md:p-6 max-w-[1600px] mx-auto">
      
      {/* Grid Layout: Changed to items-stretch so both columns match heights automatically */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT/MAIN AREA: Smart Dashboard */}
        <div className="xl:col-span-8 2xl:col-span-9 w-full">
          {/* <-- PASSED highStressAlerts PROP HERE --> */}
          <SmartDashboard 
            patientName={patient.fullName} 
            patientId={patient.id} 
            highStressAlerts={patient.highStressAlerts} 
          />
        </div>

        {/* RIGHT AREA: Care Plan Sidebar */}
        <div className="xl:col-span-4 2xl:col-span-3 w-full h-full">
          
          {latestIntervention ? (
            // Added h-full and flex-col to force the card to stretch to the bottom
            <div className="h-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-300 overflow-hidden">
                                     
              {/* flex-1 allows this inner padding container to grow */}
              <div className="p-6 flex flex-col flex-1">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-2.5 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                    <ClipboardList size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Active Care Plan</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Clinical Instructions</p>
                  </div>
                </div>
                
                {/* Main Content Box - flex-1 forces it to stretch down */}
                <div className="flex flex-col flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
                  
                  {/* Title & Type Badge */}
                  <div className="flex items-start gap-3 mb-4 shrink-0">
                    <div className="mt-0.5 p-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
                      {getIcon(latestIntervention.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base leading-snug">
                        {latestIntervention.title}
                      </h3>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {latestIntervention.type}
                      </span>
                    </div>
                  </div>
                  
                  {/* Doctor's Notes */}
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {`"${latestIntervention.notes}"`}
                  </p>
                  
                  {/* Footer Metadata - mt-auto pushes this to the very bottom! */}
                  <div className="mt-auto space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Stethoscope size={14} /> Prescribed By
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Dr. {latestIntervention.clinician.full_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Calendar size={14} /> Date Issued
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {new Date(latestIntervention.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          ) : (
            /* Empty State - Centered exactly in the middle of the stretched height */
            <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-300 p-8 text-center">
               <div className="mx-auto w-14 h-14 bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/50">
                  <ClipboardList size={28} strokeWidth={1.5} />
               </div>
               <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Active Instructions</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">Your care team has not assigned any specific interventions at this time.</p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}