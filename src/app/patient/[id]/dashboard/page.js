import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SmartDashboard from '@/components/SmartDashboard';
import CarePlanCard from '@/components/CarePlanCard'; 
import { ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PatientDashboard({ params }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { 
      id: true, 
      fullName: true,
      deviceMac: true,
      interventions: {
        orderBy: { createdAt: 'desc' },
        take: 1, 
        include: { clinician: { select: { full_name: true } } }
      }
    },
  });

  if (!patient) redirect('/login');

  const latestIntervention = patient.interventions[0];
  const aiSummary = latestIntervention?.patientFriendlyNote || null; 

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-8 2xl:col-span-9">
          <SmartDashboard 
            patientName={patient.fullName} 
            patientId={patient.id}  
            deviceMac={patient.deviceMac}
            enableAutoSave={true} // <--- THIS IS THE NEW PROP
          />
        </div>

        <aside className="xl:col-span-4 2xl:col-span-3">
          <div className="h-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <header className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-5 shrink-0 flex items-center gap-3">
               <div className="bg-blue-600 text-white p-2 rounded-lg">
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