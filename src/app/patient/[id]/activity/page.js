import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, AlertTriangle, RefreshCw, Thermometer, Shield, 
  Footprints, Utensils, Bed, Activity, Clock, Flame, Snowflake, 
  ClipboardList, Stethoscope, Calendar
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
      riskLevelText = "Critical";
      riskColor = "text-red-500 dark:text-red-400";
      riskAnimation = "animate-pulse"; 
    } else if (latestLog.riskScore > 40) {
      riskLevelText = "Moderate";
      riskColor = "text-amber-500 dark:text-amber-400";
    } else {
      riskLevelText = "Safe";
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

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 bg-transparent transition-colors duration-300 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 -mt-2">
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

      {/* Dynamic Context Factors Banner */}
      <div className="bg-gradient-to-r from-[#E9F0F5] to-[#F1F5F9] dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-slate-200 dark:border-slate-700 transition-colors duration-300 shadow-sm">
        <div>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-800 dark:text-white text-lg">
            <AlertTriangle size={20} className="text-slate-600 dark:text-slate-400" /> Current Context Factors
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Real-time variables affecting your knee health right now</p>
        </div>
        
        <div className="flex flex-wrap gap-4 md:gap-8">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
              <Thermometer size={18} className="text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Environment</p>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                {latestLog?.weatherTemp ? `${Math.round(latestLog.weatherTemp)}°C` : 'Indoor'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
              <Activity size={18} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Joint Load</p>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                {latestLog?.force ? `${Math.round(latestLog.force)} N` : '-- N'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Shield size={18} className={`${riskColor} ${riskAnimation}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Risk Level</p>
              <p className={`text-sm font-black ${riskColor}`}>{riskLevelText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Data-Driven Recommendations */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-blue-600 dark:text-blue-400" /> Active Insights
          </h2>

          {activeRecommendations.map((rec) => (
            <div key={rec.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-300">
               <div className="flex justify-between items-start">
                  <span className={`${rec.priorityColor} text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider`}>
                    {rec.priority}
                  </span>
                  <div className="flex gap-2">
                    {rec.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded font-bold text-slate-600 dark:text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
               </div>
               
               <div>
                 <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{rec.title}</h4>
                 <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                   {rec.description}
                 </p>
               </div>

               <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 grid grid-cols-3 gap-4 border border-slate-100 dark:border-slate-700/50">
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

        {/* Right Column: General Tips */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Footprints size={20} className="text-blue-600 dark:text-blue-400" /> OA Management Rules
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {[
              { title: 'Proper Footwear', icon: Footprints, desc: 'Wear shoes with good arch support to reduce impact forces.', tags: ['Avoid flat shoes'] },
              { title: 'Anti-inflammatory Diet', icon: Utensils, desc: 'Incorporate foods that reduce systemic joint inflammation.', tags: ['Omega-3 rich foods'] },
              { title: 'Rest & Recovery', icon: Bed, desc: 'Proper rest is crucial for managing cartilage stress.', tags: ['Elevate legs post-walk'] },
            ].map((tip, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300 hover:shadow-md group">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 rounded-lg text-slate-500 group-hover:text-blue-500 transition-colors">
                    <tip.icon size={18} />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{tip.title}</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{tip.desc}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 w-fit px-2.5 py-1 rounded-md">
                  <CheckCircle size={12} className="text-blue-500" /> {tip.tags[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- CLINICIAN CARE PLAN FOOTER --- */}
      <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
        
        {/* Dynamic Header based on Pending Status */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2.5 rounded-xl text-white ${pendingInterventions.length > 0 ? 'bg-amber-500 shadow-amber-500/20 shadow-lg' : 'bg-blue-600 shadow-blue-600/20 shadow-lg'}`}>
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {pendingInterventions.length > 0 ? 'Action Required: Pending Instructions' : 'Active Care Plan'}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {pendingInterventions.length > 0 
                ? `You have ${pendingInterventions.length} unacknowledged instruction(s) from your doctor.` 
                : 'You are up to date with your clinical instructions.'}
            </p>
          </div>
        </div>

        {/* SCENARIO A: Multiple Pending Interventions */}
        {pendingInterventions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingInterventions.map((intervention) => (
              
              <div key={intervention.id} className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-300 overflow-hidden">
                {/* UNIFORM ACCENT LINE (Amber for pending) */}
                <div className="h-1.5 w-full bg-amber-500 dark:bg-amber-400 shrink-0"></div>
                
                <div className="p-5 md:p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-black text-sm border border-blue-100 dark:border-blue-800/30">
                         {getInitials(intervention.clinician.full_name)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">Dr. {intervention.clinician.full_name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={10}/> {new Date(intervention.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* UNIFORM INNER BOUNDING BOX */}
                  <div className="flex flex-col flex-1 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl p-5 border border-amber-100/50 dark:border-amber-500/20">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">
                        {intervention.type}
                      </span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
                         {intervention.title}
                      </h4>
                    </div>
                    
                    {/* FIXED ESLINT QUOTES */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-5">
                      &quot;{intervention.notes}&quot;
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-amber-200/50 dark:border-amber-500/30 flex justify-end">
                       <AcknowledgeButton 
                          interventionId={intervention.id} 
                          patientId={patient.id}
                          isAcknowledged={intervention.isAcknowledged}
                          acknowledgedAt={intervention.acknowledgedAt}
                       />
                    </div>
                  </div>
                </div>
              </div>

            ))}
          </div>

        ) : lastAcknowledged ? (
          
          /* SCENARIO B: Caught Up (Show latest acknowledged plan) */
          <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-300 overflow-hidden">
            {/* UNIFORM ACCENT LINE (Blue for standard active plan) */}
            <div className="h-1.5 w-full bg-blue-600 dark:bg-blue-500 shrink-0"></div>
            
            <div className="p-6 md:p-8 flex flex-col flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-black text-lg border border-blue-100 dark:border-blue-800/30">
                     {getInitials(lastAcknowledged.clinician.full_name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Dr. {lastAcknowledged.clinician.full_name}</h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {lastAcknowledged.clinician.specialization}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                  <Calendar size={14} /> Issued: {new Date(lastAcknowledged.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              {/* UNIFORM INNER BOUNDING BOX */}
              <div className="flex flex-col flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-start gap-2 mb-3">
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600">
                    {lastAcknowledged.type}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
                    {lastAcknowledged.title}
                  </h4>
                </div>
                
                {/* FIXED ESLINT QUOTES */}
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-6">
                  &quot;{lastAcknowledged.notes}&quot;
                </p>
                
                <div className="mt-auto pt-5 border-t border-slate-200 dark:border-slate-700/60 flex justify-end">
                   <AcknowledgeButton 
                      interventionId={lastAcknowledged.id} 
                      patientId={patient.id}
                      isAcknowledged={lastAcknowledged.isAcknowledged}
                      acknowledgedAt={lastAcknowledged.acknowledgedAt}
                   />
                </div>
              </div>
            </div>
          </div>

        ) : (
          /* SCENARIO C: No history at all */
          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-300 p-8 text-center">
             <div className="mx-auto w-14 h-14 bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/50">
                <ClipboardList size={28} strokeWidth={1.5} />
             </div>
             <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Active Instructions</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">Your care team has not assigned any specific interventions at this time.</p>
          </div>
        )}
      </div>

    </div>
  );
}