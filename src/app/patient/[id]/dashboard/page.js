import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SmartDashboard from '@/components/SmartDashboard';
import CarePlanCard from '@/components/CarePlanCard'; 
import LiveAiState from '@/components/LiveAiState';
import { ClipboardList } from 'lucide-react';
import InterventionAcknowledgmentModal from '@/components/InterventionAcknowledgmentModal'; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PatientDashboard({ params, searchParams }) {
  const { id } = await params;

  // Extract the voiceAlert from the URL (e.g., ?voiceAlert=Warning...)
  const resolvedSearchParams = await searchParams;
  const voiceAlert = resolvedSearchParams?.voiceAlert || null;

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { 
      id: true, 
      fullName: true,
      deviceMac: true,
      riskThreshold: true,
      interventions: {
        orderBy: { createdAt: 'desc' },
        take: 1, 
        include: { clinician: { select: { full_name: true } } }
      }
    },
  });

  if (!patient) redirect('/login');

  // Fetch unacknowledged interventions directly using your schema's boolean field
  const pendingInterventions = await prisma.intervention.findMany({
    where: { 
      patientId: id,
      isAcknowledged: false 
    },
    orderBy: { createdAt: 'asc' } // Show the oldest pending one first
  });

  const latestIntervention = patient.interventions[0];
  const aiSummary = latestIntervention?.patientFriendlyNote || null; 

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 relative">
      
      {/* Drop the modal at the top level of the dashboard */}
      <InterventionAcknowledgmentModal pendingInterventions={pendingInterventions} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        <div className="xl:col-span-8 2xl:col-span-9">
          <SmartDashboard 
            patientName={patient.fullName} 
            patientId={patient.id}  
            deviceMac={patient.deviceMac}
            enableAutoSave={true} 
            riskThreshold={patient.riskThreshold}
            voiceAlert={voiceAlert} // Pass the extracted message down to the client
          />
        </div>

        <aside className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-4">
          
          {/* Animated AI State placed above the Care Plan */}
          <LiveAiState deviceMac={patient.deviceMac} />

          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <header className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-5 shrink-0 flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2 rounded-lg transition-colors">
                <ClipboardList size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Care Plan</h2>
            </header>

            <div className="p-5 flex-1">
              <CarePlanCard 
                intervention={latestIntervention} 
                aiSummary={aiSummary} 
              />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}