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
    <div className="space-y-6 max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activity Recommendations</h1>
          <p className="text-slate-500 text-sm">Personalized guidance based on your knee health data</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2D5F8B] text-white rounded-lg text-sm font-semibold hover:bg-opacity-90">
            <Plus size={16} /> Request Update
          </button>
        </div>
      </div>

      {/* Current Context Factors Banner */}
      <div className="bg-[#E9F0F5] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-200">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-slate-800">
            <AlertTriangle size={18} className="text-slate-600" /> Current Context Factors
          </h3>
          <p className="text-xs text-slate-500">These environmental factors are currently affecting your knee stress thresholds</p>
        </div>
        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg"><Mountain size={18} className="text-slate-600" /></div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Terrain</p>
              <p className="text-sm font-bold text-slate-700">Mostly Flat</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg"><Thermometer size={18} className="text-slate-600" /></div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Weather</p>
              <p className="text-sm font-bold text-slate-700">32°C, 75% Humidity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg"><Shield size={18} className="text-slate-600" /></div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Risk Level</p>
              <p className="text-sm font-bold text-slate-700">Moderate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personalized Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-teal-600" /> Personalized Recommendations
          </h2>

          {/* High Priority - Stair Climbing */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
             <div className="flex justify-between items-start">
                <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                  ● High Priority - Act Now
                </span>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">Stairs</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">High Impact</span>
                  <span className="text-[10px] bg-green-50 px-2 py-1 rounded font-bold text-green-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active Today
                  </span>
                </div>
             </div>
             
             <div>
               <h4 className="font-bold text-slate-800">Stair Climbing Limit</h4>
               <p className="text-sm text-slate-600 mt-1">
                 Limit stair climbing to <strong>5 minutes maximum per hour</strong>. Your knee stress increases by 40% on stairs compared to flat surfaces.
               </p>
             </div>

             <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Average Stress on Stairs</p>
                  <p className="text-sm font-bold text-slate-700"><span className="text-red-500">72</span>/100</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Recovery Time Needed</p>
                  <p className="text-sm font-bold text-slate-700">15 minutes</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Peak Time Today</p>
                  <p className="text-sm font-bold text-slate-700">2:30 PM</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Stair Time Today</p>
                  <p className="text-sm font-bold text-slate-700">18 minutes</p>
                </div>
             </div>

             <div className="flex gap-3">
               <button className="bg-[#2D5F8B] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                 <CheckCircle size={14} /> Mark as Followed
               </button>
               <button className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                 <Clock size={14} /> Set Reminder
               </button>
             </div>
          </div>

          {/* Humidity Management */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
             <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <CloudRain size={18} className="text-slate-400" /> Humidity Management
                </h4>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">Weather</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">Preventive</span>
                  <span className="text-[10px] bg-green-50 px-2 py-1 rounded font-bold text-green-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active Today
                  </span>
                </div>
             </div>
             
             <p className="text-sm text-slate-600">
               <strong>Avoid outdoor activities when humidity exceeds 80%.</strong> High humidity increases inflammation risk by 25% based on your data.
             </p>

             <div className="bg-blue-50/50 rounded-xl p-4 grid grid-cols-2 gap-4 border border-blue-50">
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Current Humidity</p>
                  <p className="text-sm font-bold text-slate-700">75%</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Peak Humidity Today</p>
                  <p className="text-sm font-bold text-slate-700">85% at 3 PM</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Safe Window</p>
                  <p className="text-sm font-bold text-green-600">9 AM - 2 PM</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Temperature</p>
                  <p className="text-sm font-bold text-slate-700">32°C</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: General Tips */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-teal-600" /> General OA Management Tips
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {[
              { title: 'Proper Footwear', icon: Footprints, desc: 'Wear shoes with good arch support...', tags: ['Avoid flat shoes', 'Replace every 6-12 mo'] },
              { title: 'Anti-inflammatory Diet', icon: Utensils, desc: 'Incorporate foods that reduce...', tags: ['Omega-3 rich foods', 'Colorful fruits'] },
              { title: 'Rest & Recovery', icon: Bed, desc: 'Proper rest is crucial for managing...', tags: ['Elevate legs', 'Ice knees'] },
              { title: 'Strengthening Exercises', icon: Activity, desc: 'Build supporting muscles around...', tags: ['Quadriceps strength', 'Low-impact'] },
            ].map((tip, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-600"><tip.icon size={20} /></div>
                  <h4 className="font-bold text-slate-800 text-sm">{tip.title}</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{tip.desc}</p>
                <div className="space-y-1">
                  {tip.tags.map((tag, j) => (
                    <div key={j} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                      <CheckCircle size={12} className="text-blue-500" /> {tag}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Clinician Notes Footer */}
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
              {/* Image placeholder */}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Dr. Maria Santos</h3>
              <p className="text-xs text-slate-500">Orthopedic Specialist</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">Last Updated: Today, 10:30 AM</span>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-xl relative">
          <p className="text-sm text-slate-600 leading-relaxed italic">
            {/* Wrapping in {} solves the escaping issue instantly */}
            {"\"Based on your data from the past week, I've adjusted your activity recommendations to focus on stair management and humidity sensitivity. Your knee shows good recovery patterns in the morning but decreased tolerance in high humidity conditions. Please follow the stair climbing limits strictly - this is where we see the highest risk of overuse.\""}
          </p>
          <p className="text-right text-xs font-bold text-slate-400 mt-4">— Dr. Maria Santos</p>
        </div>
      </div>

    </div>
  );
}