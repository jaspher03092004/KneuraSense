'use client';

import { useState, useEffect, useRef } from 'react';
import { useMQTT } from '@/hooks/useMQTT';
import { 
  Activity, Thermometer, MoveDiagonal, 
  Battery, Wifi, RefreshCw, Database, 
  Bluetooth, Cloud, HeartPulse, Wind, AlertCircle,
} from 'lucide-react';

// --- Helper Components ---
const SensorCard = ({ icon: Icon, title, subTitle, value, unit, status, colorTheme = "blue" }) => {
  const themes = {
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600"
  };
  const isAlert = status === 'High Risk' || status === 'High Flexion' || status === 'High Load';

  return (
    <div className="bg-white rounded-xl p-5 flex flex-col justify-between h-full min-h-[150px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-lg ${themes[colorTheme]}`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{subTitle}</p>
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
          {value}<span className="text-lg font-medium text-slate-400 ml-1">{unit}</span>
        </h3>
        <div className="flex items-center mt-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isAlert ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {status || 'Live'}
          </span>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ icon: Icon, label, value, isOnline }) => (
  <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm">
    <Icon size={18} className={isOnline ? "text-emerald-500" : "text-slate-400"} />
    <div className="flex flex-col">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-slate-700">{value}</span>
    </div>
  </div>
);

// --- Main Component (Saves to DB) ---
export default function SmartDashboard({ patientName, patientId, deviceMac }) {
  const { data, deviceStatus, lastPacketTime } = useMQTT(deviceMac);
  
  const [weather, setWeather] = useState(null);
  const dataRef = useRef(data); 
  const weatherRef = useRef(weather); 

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);

  // --- WEATHER FETCHING ---
  useEffect(() => {
    if (data.lat && data.lng && data.lat !== "0" && data.lng !== "0") {
      const fetchWeather = async () => {
        const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY; 
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${data.lat}&lon=${data.lng}&units=metric&appid=${API_KEY}`;
        try {
          const response = await fetch(url);
          const result = await response.json();
          if (result.cod === 200) setWeather(result);
        } catch (error) { console.error("Error fetching weather:", error); }
      };
      fetchWeather();
    }
  }, [data.lat, data.lng]); 

  // --- AUTO-SAVE TO SUPABASE ---
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      const currentData = dataRef.current;
      const currentWeather = weatherRef.current; 
      
      if (deviceStatus === 'Online' && patientId && currentData.bat > 0) {
        try {
           await fetch('/api/save-log', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
               patientId: patientId,
               risk_score: currentData.risk_score,
               bat: currentData.bat,
               angle: currentData.angle,
               skin_temp: currentData.skin_temp,
               fsr: currentData.fsr,
               lat: currentData.lat, 
               lng: currentData.lng,
               weatherTemp: currentWeather ? currentWeather.main.temp : null,
               bpm: currentData.bpm,
               ambient_temp: currentData.ambient_temp,
               pressure: currentData.pressure
             }),
           });
        } catch (err) { console.error("Auto-save failed:", err); }
      }
    }, 10000); 
    return () => clearInterval(saveInterval);
  }, [deviceStatus, patientId]);

  const timeString = lastPacketTime ? new Date(lastPacketTime).toLocaleTimeString() : "--:--";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Monitoring</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Live telemetry for {patientName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <StatusBadge icon={Wifi} label="KneuraSense-001" value={deviceStatus} isOnline={deviceStatus === 'Online'} />
           <StatusBadge icon={RefreshCw} label="Last Sync" value={timeString} isOnline={deviceStatus === 'Online'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gauge Card */}
        <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-full h-2 transition-colors duration-500 ${
               data.risk_score > 70 ? 'bg-rose-500' : data.risk_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'
           }`}></div>
           
           <div className="w-full text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Overuse Risk Score</h2>
              <p className="text-sm text-slate-500 font-medium">Knee Osteoarthritis stress indicator</p>
           </div>
           
           {/* UPDATED GAUGE CONTAINER FOR RESPONSIVENESS */}
           <div className="relative w-full max-w-[240px] md:max-w-xs h-32 mt-4 mb-2 mx-auto flex justify-center items-end min-w-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110" preserveAspectRatio="xMidYMax meet">
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="stroke-slate-100" strokeWidth="18" strokeLinecap="round" />
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" 
                  className={`transition-all duration-1000 ease-out ${
                    data.risk_score > 70 ? 'text-rose-500' : data.risk_score > 40 ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                  stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (data.risk_score / 100) * 251.2}
                />
              </svg>
           </div>
           
           <div className="mt-6 text-center">
              <h1 className="text-6xl font-black text-slate-800 tracking-tighter">{data.risk_score}</h1>
              <span className={`inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 text-sm font-bold rounded-full border ${
                  data.risk_score > 70 ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                  data.risk_score > 40 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {data.risk_score > 70 && <AlertCircle size={14} />}
                {data.risk_score > 70 ? 'CRITICAL STRESS' : data.risk_score > 40 ? 'MODERATE LOAD' : 'SAFE ZONE'}
              </span>
           </div>
        </div>

        {/* Sensor Grid */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-6">
           <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Joint Kinematics</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SensorCard icon={MoveDiagonal} title="Knee Flexion" subTitle="Angle" value={data.angle} unit="°" status={data.angle > 110 ? "High Flexion" : "Normal"} colorTheme="blue" />
                <SensorCard icon={Database} title="Applied Force" subTitle="Load" value={data.fsr} unit="N" status={data.fsr > 1000 ? "High Load" : "Normal"} colorTheme="amber" />
             </div>
           </div>

           <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Vitals & Environment</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <SensorCard icon={HeartPulse} title="Heart Rate" subTitle="Pulse" value={data.bpm} unit="bpm" status={data.bpm > 0 ? "Reading" : "Calculating"} colorTheme="rose" />
                <SensorCard icon={Thermometer} title="Skin Temp" subTitle="Surface" value={data.skin_temp} unit="°C" colorTheme="emerald" />
                <SensorCard icon={Thermometer} title="Air Temp" subTitle="Ambient" value={data.ambient_temp} unit="°C" colorTheme="slate" />
                <SensorCard icon={Wind} title="Pressure" subTitle="Atmos" value={data.pressure} unit="hPa" colorTheme="slate" />
             </div>
           </div>
        </div>
      </div>

      {/* Footer Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-3 w-full md:w-1/2">
            <div className={`p-2 rounded-lg ${data.bat < 20 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
               <Battery size={20}/>
            </div>
            <div className="flex-1">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-sm font-bold text-slate-700">Device Battery</span>
                 <span className="text-sm font-bold text-slate-700">{data.bat}%</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                 <div className={`h-full rounded-full transition-all duration-500 ${data.bat < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${data.bat}%` }}></div>
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-full md:w-auto">
            <Cloud size={20} className="text-slate-400" />
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
               <p className="text-sm font-semibold text-slate-700">
                 {weather ? `${weather.name} (${Math.round(weather.main.temp)}°C)` : (data.lat !== "0" ? "Fetching GPS..." : "Indoor Mode")}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}