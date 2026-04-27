import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, AlertTriangle, RefreshCw, Thermometer, Shield, 
  Footprints, Utensils, Bed, Activity, Calendar, ClipboardList,
  Stethoscope
} from 'lucide-react';
import AcknowledgeButton from '@/components/AcknowledgeButton';

export default async function ActivityPage({ params }) {
  const { id } = await params;
  
  // 1. DATA FETCHING: Pull up to 5 recent interventions to catch all pending ones
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { 
      id: true, 
      fullName: true,
      interventions: {
        orderBy: { createdAt: 'desc' },
        take: 5, 
        select: {
          id: true,             
          type: true, 
          title: true, 
          notes: true, 
          createdAt: true,
          isAcknowledged: true, 
          acknowledgedAt: true, 
          clinician: { select: { full_name: true, specialization: true } }
        }
      },
      sensorLogs: {
        orderBy: { timestamp: 'desc' },
        take: 1, 
      }
    }
  });

  if (!patient) redirect('/login');

  const latestLog = patient.sensorLogs[0] || null;

  // --- SEPARATE PENDING VS CAUGHT UP INTERVENTIONS ---
  const pendingInterventions = patient.interventions.filter(i => !i.isAcknowledged);
  const lastAcknowledged = patient.interventions.find(i => i.isAcknowledged);

  // Safe Initials Extractor for the Doctor
  const getInitials = (name) => {
    if (!name) return 'DR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // 2. LOGIC ENGINE: Calculate Context and Risk dynamically
  let riskLevelText = "Unknown";
  let riskColor = "text-slate-500";
  let riskAnimation = "";
  
  if (latestLog) {
    if (latestLog.riskScore > 70) {
      riskLevelText = "Critical Risk";
      riskColor = "text-red-500 dark:text-red-400";
      riskAnimation = "animate-pulse"; 
    } else if (latestLog.riskScore > 40) {
      riskLevelText = "Moderate Risk";
      riskColor = "text-amber-500 dark:text-amber-400";
    } else {
      riskLevelText = "Safe & Optimal";
      riskColor = "text-emerald-500 dark:text-emerald-400";
    }
  }

  // 3. DYNAMIC RECOMMENDATIONS ENGINE
  const activeRecommendations = [];

  if (latestLog) {
    if (latestLog.riskScore > 60 || latestLog.angle > 110) {
      activeRecommendations.push({
        id: 'high-load',
        title: 'High Joint Stress Detected',
        priority: 'High Priority - Act Now',
        priorityColor: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20',
        tags: ['Load Reduction', 'Rest'],
        description: `Your knee stress score is currently at ${latestLog.riskScore}/100. We strongly recommend halting high-impact activities immediately to prevent a flare-up.`,
        stats: [
          { label: 'Current Stress', value: `${latestLog.riskScore}/100`, valueColor: 'text-red-500 font-black' },
          { label: 'Max Flexion', value: `${Math.round(latestLog.angle)}°` },
          { label: 'Suggested Rest', value: '30 mins' },
        ]
      });
    }

    if (latestLog.skinTemp && latestLog.skinTemp > 34.5) {
      activeRecommendations.push({
        id: 'high-skin-temp',
        title: 'Elevated Joint Temperature',
        priority: 'Monitor Closely',
        priorityColor: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20',
        tags: ['Inflammation', 'Ice'],
        description: `Your knee skin temperature is elevated at ${latestLog.skinTemp}°C, which may indicate early localized inflammation or synovitis.`,
        stats: [
          { label: 'Skin Temp', value: `${latestLog.skinTemp}°C`, valueColor: 'text-orange-500 font-black' },
          { label: 'Ambient Temp', value: latestLog.weatherTemp ? `${Math.round(latestLog.weatherTemp)}°C` : '--' },
          { label: 'Suggested Action', value: 'Ice for 15 mins' },
        ]
      });
    }

    if (latestLog.weatherTemp !== null && latestLog.weatherTemp < 18) {
      activeRecommendations.push({
        id: 'cold-weather',
        title: 'Cold Weather Joint Care',
        priority: 'Preventative Measure',
        priorityColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
        tags: ['Stiffness', 'Warm-up'],
        description: `The current temperature is ${Math.round(latestLog.weatherTemp)}°C. Cold weather reduces synovial fluid elasticity. Ensure a proper 10-minute warm-up before walking.`,
        stats: [
          { label: 'Local Temp', value: `${Math.round(latestLog.weatherTemp)}°C`, valueColor: 'text-blue-500 font-black' },
          { label: 'Skin Temp', value: `${latestLog.skinTemp}°C` },
          { label: 'Suggested Warmup', value: '10 mins' },
        ]
      });
    }
  }

  if (activeRecommendations.length === 0) {
    activeRecommendations.push({
      id: 'all-clear',
      title: 'Maintain Current Activity',
      priority: 'Routine',
      priorityColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
      tags: ['Maintenance', 'Pacing'],
      description: latestLog 
        ? "Your joint telemetry looks completely stable today. Continue with your normal paced activities and prescribed exercises."
        : "No recent device data found. Please ensure your KneuraSense wearable is connected to get real-time recommendations.",
      stats: [
        { label: 'Status', value: latestLog ? 'Optimal' : 'Offline', valueColor: 'text-emerald-500 font-black' },
        { label: 'Last Sync', value: latestLog ? new Date(latestLog.timestamp).toLocaleTimeString() : '--' },
      ]
    });
  }

  // Unified original style class for the bento tiles
  const originalTileClass = "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300";

  return (
    <div className="max-w-[1400px] mx-auto p-3 md:p-4 bg-transparent min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Activity Recommendations</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Personalized guidance based on your live sensor data</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href={`/patient/${id}/activity`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
          >
            <RefreshCw size={16} /> Sync Data
          </Link>
        </div>
      </div>

      {/* --- STRICT BENTO GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
        
        {/* 1. Environment Bento Tile (1x1) */}
        <div className={`col-span-1 row-span-1 ${originalTileClass} p-5 flex flex-col justify-center gap-3`}>
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-md w-fit">
                <Thermometer size={20} className="text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Environment</p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 dark:text-white leading-tight">
                {latestLog?.weatherTemp ? `${Math.round(latestLog.weatherTemp)}°C` : '--'}
              </p>
            </div>
        </div>

        {/* 2. Joint Load Bento Tile (1x1) */}
        <div className={`col-span-1 row-span-1 ${originalTileClass} p-5 flex flex-col justify-center gap-3`}>
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-md w-fit">
                <Activity size={20} className="text-indigo-500 dark:text-indigo-400" />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Joint Load</p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 dark:text-white leading-tight">
                {latestLog?.force ? `${Math.round(latestLog.force)} N` : '--'}
              </p>
            </div>
        </div>

        {/* 3. Risk Level Bento Banner (2x1) */}
        <div className={`col-span-1 md:col-span-2 row-span-1 bg-gradient-to-r from-[#E9F0F5] to-[#F1F5F9] dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center`}>
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                <Shield size={28} className={`${riskColor} ${riskAnimation}`} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">System Risk Level</p>
                  {latestLog && <span className="bg-white/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Score: {latestLog.riskScore}</span>}
                </div>
                <p className={`text-2xl font-black leading-tight ${riskColor}`}>{riskLevelText}</p>
              </div>
            </div>
        </div>

        {/* 4. Active Insights Bento Block (2x2 - Tall and Wide) */}
        <div className={`col-span-1 md:col-span-2 row-span-2 ${originalTileClass} p-5 md:p-6 flex flex-col h-full`}>
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity size={20} className="text-blue-600 dark:text-blue-400" /> Active Insights
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">{activeRecommendations.length}</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {activeRecommendations.map((rec) => (
              <div key={rec.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700/50 space-y-3">
                 <div className="flex justify-between items-start">
                    <span className={`${rec.priorityColor} text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider`}>
                      {rec.priority}
                    </span>
                    <div className="flex gap-2">
                      {rec.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded font-bold text-slate-600 dark:text-slate-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                 </div>
                 
                 <div>
                   <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{rec.title}</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                     {rec.description}
                   </p>
                 </div>

                 <div className="bg-white dark:bg-slate-900 rounded-md p-3 grid grid-cols-3 gap-3 border border-slate-100 dark:border-slate-800">
                    {rec.stats.map((stat, i) => (
                      <div key={i}>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className={`text-sm font-semibold ${stat.valueColor || 'text-slate-700 dark:text-slate-200'}`}>{stat.value}</p>
                      </div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. General Tips Bento Block (2x2 - Tall and Wide) */}
        <div className={`col-span-1 md:col-span-2 row-span-2 ${originalTileClass} p-5 md:p-6 flex flex-col h-full bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-900/50`}>
          <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Footprints size={20} className="text-blue-600 dark:text-blue-400" /> Clinical Guidelines
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 pl-7">Standard Osteoarthritis Protocol</p>
          </div>
          
          <div className="flex-1 flex flex-col gap-5 justify-center mt-1">
            {[
              { 
                title: 'Joint Biomechanics', 
                icon: Footprints, 
                desc: 'Utilize footwear with rigid arch support to minimize patellofemoral impact forces during ambulation.', 
                tag: 'Mobility' 
              },
              { 
                title: 'Systemic Inflammation', 
                icon: Utensils, 
                desc: 'Incorporate an Omega-3 rich diet to proactively reduce systemic joint inflammation and stiffness.', 
                tag: 'Nutrition' 
              },
              { 
                title: 'Protocol: Recovery', 
                icon: Bed, 
                desc: 'Elevate extremities post-activity to manage synovial fluid pressure and localized swelling.', 
                tag: 'Rest' 
              },
            ].map((tip, i) => (
              <div key={i} className="flex gap-4 items-start group">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-400 transition-colors shrink-0 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  <tip.icon size={18} />
                </div>
                <div className="flex-1 border-b border-slate-100 dark:border-slate-800/60 pb-5 group-last:border-0 group-last:pb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{tip.title}</h4>
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 dark:border-blue-800/30 dark:text-blue-400 dark:bg-blue-900/20 px-2.5 py-0.5 rounded shadow-sm">
                      {tip.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-2">
                    {tip.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Care Plan Footer (Spans all 4 columns) */}
        <div className={`col-span-1 md:col-span-4 ${originalTileClass} p-6 md:p-8 mt-2`}>
          
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2.5 rounded-lg text-white shadow-sm ${pendingInterventions.length > 0 ? 'bg-amber-500' : 'bg-blue-600'}`}>
              <ClipboardList size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {pendingInterventions.length > 0 ? 'Action Required: Pending Instructions' : 'Active Care Plan'}
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {pendingInterventions.length > 0 
                  ? `You have ${pendingInterventions.length} unacknowledged instruction(s) from your doctor.` 
                  : 'You are up to date with your clinical instructions.'}
              </p>
            </div>
          </div>

          {pendingInterventions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingInterventions.map((intervention) => (
                
                <div key={intervention.id} className="flex flex-col bg-slate-50 dark:bg-slate-800/40 border border-amber-200 dark:border-amber-500/30 rounded-lg transition-colors duration-300 overflow-hidden">
                  <div className="h-1 w-full bg-amber-500 shrink-0"></div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center font-black text-sm border border-amber-100 dark:border-amber-900 shadow-sm">
                           {getInitials(intervention.clinician.full_name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Dr. {intervention.clinician.full_name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar size={10}/> {new Date(intervention.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">
                        {intervention.type}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mb-2">
                       {intervention.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-6 italic border-l-2 border-amber-200 dark:border-amber-500/30 pl-3">
                      &quot;{intervention.notes}&quot;
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-amber-200/50 dark:border-amber-500/20 flex justify-end">
                       <AcknowledgeButton 
                         interventionId={intervention.id} 
                         patientId={patient.id}
                         isAcknowledged={intervention.isAcknowledged}
                         acknowledgedAt={intervention.acknowledgedAt}
                       />
                    </div>
                  </div>
                </div>

              ))}
            </div>

          ) : lastAcknowledged ? (
            
            <div className="flex flex-col md:flex-row bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm group hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors duration-300">
              {/* Left Clinical Accent Bar */}
              <div className="w-1.5 bg-blue-500 dark:bg-blue-600 shrink-0"></div>
              
              <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center w-full">
                <div className="flex-1 w-full">
                  
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-100/50 dark:border-blue-800/30">
                         <CheckCircle size={16} />
                      </div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg tracking-tight">
                        {lastAcknowledged.title}
                      </h4>
                    </div>
                    <span className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                      {lastAcknowledged.type}
                    </span>
                  </div>
                  
                  {/* Doctor's Notes (Clinical Quote Block) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-lg p-4 mb-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-700"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium pl-2 italic">
                      &quot;{lastAcknowledged.notes}&quot;
                    </p>
                  </div>
                  
                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded shadow-sm">
                       <Calendar size={12} className="text-blue-500" /> 
                       {new Date(lastAcknowledged.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded shadow-sm">
                       <Stethoscope size={12} className="text-blue-500" /> 
                       Dr. {lastAcknowledged.clinician.full_name}
                    </span>
                  </div>
                </div>
                
                {/* Acknowledgment Status Zone */}
                <div className="shrink-0 w-full md:w-auto flex md:flex-col justify-end border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-4 md:pt-0 md:pl-6 h-full items-center">
                   <AcknowledgeButton 
                      interventionId={lastAcknowledged.id} 
                      patientId={patient.id}
                      isAcknowledged={lastAcknowledged.isAcknowledged}
                      acknowledgedAt={lastAcknowledged.acknowledgedAt}
                   />
                </div>
              </div>
            </div>

          ) : (
            <div className="flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
               <div className="w-12 h-12 bg-white dark:bg-slate-900 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <ClipboardList size={24} />
               </div>
               <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Active Instructions</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Your care team has not assigned any specific interventions at this time.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}