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

// --- Small Helper Components for the Dashboard ---

const SensorCard = ({ icon: Icon, title, subTitle, value, unit, status, trend }) => (
  <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between h-full">
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
    <div className={`p-3 rounded-lg text-white ${statusColor}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-bold text-gray-700">{title}</p>
      <div className="flex items-center gap-2">
         {/* Simple Green Dot indicator if needed */}
         {title === "Connection" && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
         <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
      <p className="text-xs text-gray-400">{subText}</p>
    </div>
  </div>
);

// --- Main Page Component ---

export default async function PatientDashboard({ params }) {
  const { id } = await params;

  // 1. Fetch Patient Data (Keep this security check)
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, fullName: true }, // Minimized selection for speed
  });

  if (!patient) redirect('/login');

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      
      {/* 1. Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Knee Stress Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time monitoring for {patient.fullName}</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
           <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Device Connected</div>
           <div className="flex items-center gap-1"><RefreshCw size={12}/> Last Sync: 2 min ago</div>
           <div className="flex items-center gap-1"><Battery size={16} className="text-green-600"/> Battery: 78%</div>
        </div>
      </div>

      {/* 2. Main Dashboard Grid (Gauge + Sensors) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Overuse Risk Score (Gauge) - Spans 5 columns */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center relative">
           <div className="w-full text-left mb-8">
              <h2 className="text-lg font-bold text-gray-800">Overuse Risk Score</h2>
              <p className="text-xs text-gray-500">Current knee stress level based on biomechanical data</p>
           </div>

           {/* CSS-only Gauge representation for simplicity */}
           <div className="relative w-64 h-32 mt-4 mb-4">
              {/* Semi Circle Background */}
              <div className="w-full h-full bg-gray-100 rounded-t-full overflow-hidden relative">
                 <div className="absolute bottom-0 left-[10%] w-[80%] h-[160%] border-[20px] border-orange-100 rounded-full border-t-orange-400 border-r-gray-200 border-l-gray-200 border-b-transparent rotate-45 transform origin-center"></div>
              </div>
              {/* Needle (Static for now) */}
              <div className="absolute bottom-0 left-1/2 w-1 h-24 bg-gray-800 origin-bottom transform -rotate-12 rounded-full -translate-x-1/2 z-10"></div>
              <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2 z-20"></div>
           </div>
           
           <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">0 (Safe) 50 (Caution) 100 (High Risk)</p>
              <h1 className="text-6xl font-bold text-orange-400">42</h1>
              <span className="inline-block mt-2 px-4 py-1 bg-orange-50 text-orange-500 text-sm font-bold rounded-full border border-orange-100">
                MODERATE RISK
              </span>
           </div>
           
           <p className="text-xs text-gray-400 mt-6 max-w-xs">
             Consider reducing high-impact activities. Monitor your knee response to current activities.
           </p>
        </div>

        {/* RIGHT: Real-time Sensor Data Grid - Spans 7 columns */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
           <div className="mb-6 flex items-center gap-2">
             <Database size={20} className="text-gray-700"/>
             <div>
                <h2 className="text-lg font-bold text-gray-800">Real-time Sensor Data</h2>
                <p className="text-xs text-gray-500">Live readings from your KneuraSense wearable</p>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100%-4rem)]">
              <SensorCard 
                icon={MoveDiagonal}
                title="Knee Flexion"
                subTitle="Current Angle"
                value="32°"
                unit="Degrees"
                status="Stable"
              />
              <SensorCard 
                icon={Database} // Using Database as placeholder for "Compressive Force" icon
                title="Compressive Force"
                subTitle="Knee Joint Load"
                value="85"
                unit="Newtons"
                trend="up"
                status=""
              />
              <SensorCard 
                icon={Thermometer}
                title="Skin Temperature"
                subTitle="Around Knee"
                value="33.5"
                unit="°C"
                status="Normal"
              />
              <SensorCard 
                icon={Activity}
                title="Heart Rate"
                subTitle="Physiological Stress"
                value="72"
                unit="BPM"
                trend="down"
                status=""
              />
           </div>
        </div>
      </div>

      {/* 3. Device Status Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-800">Device Status & Connection</h2>
          <button className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition">
            <RefreshCw size={12}/> Refresh Status
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <StatusCard 
             icon={Bluetooth}
             title="Connection"
             value="Connected"
             subText="KneuraSense-001 via BLE"
           />
           
           {/* Custom Battery Card for Progress Bar */}
           <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-teal-600 rounded-lg text-white"><Battery size={20}/></div>
                 <span className="text-sm font-bold text-gray-700">Battery Level</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-green-500 h-4 rounded-full" style={{ width: '78%' }}></div>
                <div className="text-center text-[10px] text-white font-bold relative -top-3.5 drop-shadow-md">78%</div>
              </div>
              <p className="text-xs text-gray-400">Estimated: 32 hours remaining</p>
           </div>

           <StatusCard 
             icon={Wifi}
             title="Data Sync"
             value="2:43 PM"
             subText="Last cloud synchronization"
           />
        </div>
      </div>

      {/* 4. Bottom Navigation Cards (Shortcuts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md transition">
            <div className="p-4 bg-teal-600 rounded-xl text-white mb-3">
              <Activity size={24}/> 
            </div>
            <h3 className="font-bold text-gray-800">View History & Trends</h3>
            <p className="text-xs text-gray-400 mt-1">Analyze your knee stress patterns over time</p>
         </div>

         <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md transition">
            <div className="p-4 bg-teal-600 rounded-xl text-white mb-3">
              <Database size={24}/>
            </div>
            <h3 className="font-bold text-gray-800">Activity Recommendations</h3>
            <p className="text-xs text-gray-400 mt-1">Get personalized advice based on your current risk level</p>
         </div>
      </div>

    </div>
  );
}