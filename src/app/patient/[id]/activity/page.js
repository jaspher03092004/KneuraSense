import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { 
  CheckCircle, XCircle, AlertTriangle, PlayCircle, RefreshCw, Plus, 
  Mountain, Thermometer, Shield, Footprints, Utensils, Bed, Activity, 
  CloudRain, Scale, Clock, Timer 
} from 'lucide-react';

export default async function ActivityPage({ params }) {
  const { id } = await params;
  
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, fullName: true }
  });

  if (!patient) redirect('/login');

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 bg-transparent transition-colors duration-300 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Activity Recommendations</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Personalized guidance based on your knee health data</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2D5F8B] dark:bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 dark:hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} /> Request Update
          </button>
        </div>
      </div>

      {/* Current Context Factors Banner */}
      <div className="bg-[#E9F0F5] dark:bg-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
            <AlertTriangle size={18} className="text-slate-600 dark:text-slate-400" /> Current Context Factors
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">These environmental factors are currently affecting your knee stress thresholds</p>
        </div>
        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg"><Mountain size={18} className="text-slate-600 dark:text-slate-400" /></div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Terrain</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Mostly Flat</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg"><Thermometer size={18} className="text-slate-600 dark:text-slate-400" /></div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Weather</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">32°C, 75% Humidity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg"><Shield size={18} className="text-slate-600 dark:text-slate-400" /></div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Risk Level</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Moderate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personalized Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-teal-600 dark:text-teal-400" /> Personalized Recommendations
          </h2>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-300">
             <div className="flex justify-between items-start">
                <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                  ● High Priority - Act Now
                </span>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-bold text-slate-500 dark:text-slate-400">Stairs</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-bold text-slate-500 dark:text-slate-400">High Impact</span>
                  <span className="text-[10px] bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active Today
                  </span>
                </div>
             </div>
             
             <div>
               <h4 className="font-bold text-slate-800 dark:text-slate-200">Stair Climbing Limit</h4>
               <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                 Limit stair climbing to <strong>5 minutes maximum per hour</strong>. Your knee stress increases by 40% on stairs compared to flat surfaces.
               </p>
             </div>

             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Average Stress on Stairs</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200"><span className="text-red-500 dark:text-red-400">72</span>/100</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Recovery Time Needed</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">15 minutes</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Peak Time Today</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">2:30 PM</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Total Stair Time Today</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">18 minutes</p>
                </div>
             </div>

             <div className="flex gap-3">
               <button className="bg-[#2D5F8B] dark:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-opacity-90 transition-colors">
                 <CheckCircle size={14} /> Mark as Followed
               </button>
               <button className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                 <Clock size={14} /> Set Reminder
               </button>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-300">
             <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CloudRain size={18} className="text-slate-400" /> Humidity Management
                </h4>
             </div>
             <p className="text-sm text-slate-600 dark:text-slate-400">
               <strong>Avoid outdoor activities when humidity exceeds 80%.</strong> High humidity increases inflammation risk by 25% based on your data.
             </p>

             <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 grid grid-cols-2 gap-4 border border-blue-50 dark:border-blue-900/30">
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Current Humidity</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">75%</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Peak Humidity Today</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">85% at 3 PM</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Safe Window</p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">9 AM - 2 PM</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Temperature</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">32°C</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: General Tips */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-teal-600 dark:text-teal-400" /> General OA Management Tips
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {[
              { title: 'Proper Footwear', icon: Footprints, desc: 'Wear shoes with good arch support...', tags: ['Avoid flat shoes', 'Replace every 6-12 mo'] },
              { title: 'Anti-inflammatory Diet', icon: Utensils, desc: 'Incorporate foods that reduce...', tags: ['Omega-3 rich foods', 'Colorful fruits'] },
              { title: 'Rest & Recovery', icon: Bed, desc: 'Proper rest is crucial for managing...', tags: ['Elevate legs', 'Ice knees'] },
              { title: 'Strengthening Exercises', icon: Activity, desc: 'Build supporting muscles around...', tags: ['Quadriceps strength', 'Low-impact'] },
            ].map((tip, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><tip.icon size={20} /></div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{tip.title}</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{tip.desc}</p>
                <div className="space-y-1">
                  {tip.tags.map((tag, j) => (
                    <div key={j} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      <CheckCircle size={12} className="text-blue-500 dark:text-blue-400" /> {tag}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Clinician Notes Footer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"></div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Dr. Maria Santos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Orthopedic Specialist</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">Last Updated: Today, 10:30 AM</span>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl relative">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
            {"\"Based on your data from the past week, I've adjusted your activity recommendations to focus on stair management and humidity sensitivity. Your knee shows good recovery patterns in the morning but decreased tolerance in high humidity conditions. Please follow the stair climbing limits strictly - this is where we see the highest risk of overuse.\""}
          </p>
          <p className="text-right text-xs font-bold text-slate-400 dark:text-slate-500 mt-4">— Dr. Maria Santos</p>
        </div>
      </div>

    </div>
  );
}