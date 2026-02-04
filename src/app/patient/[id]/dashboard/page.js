import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { 
  Activity, 
  Thermometer, 
  MoveDiagonal, 
  ArrowDown, 
  ArrowUp,
  Battery,
  Wifi,
  RefreshCw,
  Database,
  Bluetooth
} from 'lucide-react';

// --- Small Helper Components ---

const SensorCard = ({ icon: Icon, title, subTitle, value, unit, status, trend }) => (
  <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between h-full min-h-[140px]">
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 bg-teal-700 rounded-lg text-white">
        <Icon size={20} />
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-xs text-gray-400">{subTitle}</p>
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-bold text-gray-800">
        {value}<span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>
      </h3>
      <div className="flex items-center mt-2">
        {trend && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center ${
            trend === 'up' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
          }`}>
             {trend === 'up' ? <ArrowUp size={12} className="mr-1"/> : <ArrowDown size={12} className="mr-1"/>}
             {trend === 'up' ? '+12%' : '-5%'}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-2">{status}</span>
      </div>
    </div>
  </div>
);

const StatusCard = ({ icon: Icon, title, value, subText, statusColor = "bg-teal-600" }) => (
  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
    <div className={`p-3 rounded-lg text-white ${statusColor} shrink-0`}>
      <Icon size={24} />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-bold text-gray-700">{title}</p>
      <div className="flex items-center gap-2">
         {title === "Connection" && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>}
         <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
      <p className="text-xs text-gray-400 truncate">{subText}</p>
    </div>
  </div>
);

// --- Main Page Component ---

export default async function PatientDashboard({ params }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, fullName: true },
  });

  if (!patient) redirect('/login');

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-0 md:p-6 space-y-6">
      
      {/* 1. Page Header - Made Responsive */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Knee Stress Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time monitoring for {patient.fullName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
           <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Connected</div>
           <div className="flex items-center gap-1"><RefreshCw size={12}/> Last Sync: 2m ago</div>
           <div className="flex items-center gap-1"><Battery size={16} className="text-green-600"/> 78%</div>
        </div>
      </div>

      {/* 2. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Gauge - Spans full on mobile, 5 cols on desktop */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
           <div className="w-full text-left mb-8">
              <h2 className="text-lg font-bold text-gray-800">Overuse Risk Score</h2>
              <p className="text-xs text-gray-500">Current knee stress level</p>
           </div>

           <div className="relative w-64 h-32 mt-4 mb-4 shrink-0">
              <div className="w-full h-full bg-gray-100 rounded-t-full overflow-hidden relative">
                 <div className="absolute bottom-0 left-[10%] w-[80%] h-[160%] border-[20px] border-orange-100 rounded-full border-t-orange-400 border-r-gray-200 border-l-gray-200 border-b-transparent rotate-45 transform origin-center"></div>
              </div>
              <div className="absolute bottom-0 left-1/2 w-1 h-24 bg-gray-800 origin-bottom transform -rotate-12 rounded-full -translate-x-1/2 z-10"></div>
              <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2 z-20"></div>
           </div>
           
           <div className="mt-4">
              <h1 className="text-6xl font-bold text-orange-400">42</h1>
              <span className="inline-block mt-2 px-4 py-1 bg-orange-50 text-orange-500 text-sm font-bold rounded-full border border-orange-100">
                MODERATE RISK
              </span>
           </div>
           
           <p className="text-xs text-gray-400 mt-6 max-w-xs">
             Consider reducing high-impact activities.
           </p>
        </div>

        {/* RIGHT: Sensor Grid - Spans full on mobile, 7 cols on desktop */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
           <div className="mb-6 flex items-center gap-2">
             <Database size={20} className="text-gray-700"/>
             <div>
                <h2 className="text-lg font-bold text-gray-800">Real-time Data</h2>
                <p className="text-xs text-gray-500">Live readings</p>
             </div>
           </div>

           {/* Flexible height on mobile, fixed height on desktop for alignment */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto lg:h-[calc(100%-4rem)]">
              <SensorCard icon={MoveDiagonal} title="Knee Flexion" subTitle="Angle" value="32°" unit="Deg" status="Stable" />
              <SensorCard icon={Database} title="Force" subTitle="Load" value="85" unit="N" trend="up" status="" />
              <SensorCard icon={Thermometer} title="Temp" subTitle="Skin" value="33.5" unit="°C" status="Normal" />
              <SensorCard icon={Activity} title="Heart Rate" subTitle="Stress" value="72" unit="BPM" trend="down" status="" />
           </div>
        </div>
      </div>

      {/* 3. Device Status Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-800">Connection</h2>
          <button className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg">
            <RefreshCw size={12}/> Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <StatusCard icon={Bluetooth} title="Connection" value="Connected" subText="KneuraSense-001" />
           
           <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-teal-600 rounded-lg text-white"><Battery size={20}/></div>
                 <span className="text-sm font-bold text-gray-700">Battery</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-green-500 h-4 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <p className="text-xs text-gray-400">Est. 32h remaining</p>
           </div>

           <StatusCard icon={Wifi} title="Data Sync" value="2:43 PM" subText="Last cloud sync" />
        </div>
      </div>

      {/* 4. Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-teal-600 rounded-xl text-white mb-3"><Activity size={24}/></div>
            <h3 className="font-bold text-gray-800">View History</h3>
         </div>
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-teal-600 rounded-xl text-white mb-3"><Database size={24}/></div>
            <h3 className="font-bold text-gray-800">Recommendations</h3>
         </div>
      </div>

    </div>
  );
}