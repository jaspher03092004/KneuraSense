'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useMQTT } from '@/hooks/useMQTT';
import { 
  Activity, Thermometer, MoveDiagonal, 
  Battery, Wifi, RefreshCw, Database, 
  Bluetooth, Cloud, HeartPulse, Wind, AlertCircle,
} from 'lucide-react';

// --- Helper Components ---
// [OPTIMIZATION] Wrapped in React.memo to prevent unnecessary re-renders
const SensorCard = memo(({ icon: Icon, title, subTitle, value, unit, status, colorTheme = "blue" }) => {
  const themes = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  };
  const isAlert = status === 'High Risk' || status === 'High Flexion' || status === 'High Load';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 flex flex-col justify-between h-full min-h-[130px] border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md dark:shadow-none transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg ${themes[colorTheme]}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{subTitle}</p>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          {value}<span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">{unit}</span>
        </h3>
        <div className="flex items-center mt-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isAlert ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            {status || 'Live'}
          </span>
        </div>
      </div>
    </div>
  );
});
SensorCard.displayName = 'SensorCard';

// [OPTIMIZATION] Wrapped in React.memo
const StatusBadge = memo(({ icon: Icon, label, value, isOnline }) => (
  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
    <Icon size={16} className={isOnline ? "text-emerald-500" : "text-slate-400 dark:text-slate-600"} />
    <div className="flex flex-col">
      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{label}</span>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  </div>
));
StatusBadge.displayName = 'StatusBadge';

// --- Main Component (Saves to DB) ---
export default function LiveDashboard({ patientName, patientId, deviceMac }) {
  const { data, deviceStatus, lastPacketTime } = useMQTT(deviceMac);
  
  const [weather, setWeather] = useState(null);
  const dataRef = useRef(data); 
  const weatherRef = useRef(weather); 
  
  // [OPTIMIZATION] Refs to track previous coordinates to prevent API spam
  const lastLatRef = useRef(null);
  const lastLngRef = useRef(null);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);

  // --- WEATHER FETCHING ---
  useEffect(() => {
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    
    if (lat && lng && lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
      // [OPTIMIZATION] Round coordinates to 2 decimals (~1.1km) to stop GPS jitter spam
      const roundedLat = lat.toFixed(2);
      const roundedLng = lng.toFixed(2);
      
      if (lastLatRef.current !== roundedLat || lastLngRef.current !== roundedLng) {
        lastLatRef.current = roundedLat;
        lastLngRef.current = roundedLng;
        
        const fetchWeather = async () => {
          const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY; 
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${roundedLat}&lon=${roundedLng}&units=metric&appid=${API_KEY}`;
          try {
            const response = await fetch(url);
            const result = await response.json();
            if (result.cod === 200) setWeather(result);
          } catch (error) { console.error("Error fetching weather:", error); }
        };
        fetchWeather();
      }
    }
  }, [data.lat, data.lng]); 
  
  const timeString = lastPacketTime ? new Date(lastPacketTime).toLocaleTimeString() : "--:--";

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Patient Monitoring</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Live telemetry for {patientName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <StatusBadge icon={Wifi} label="KneuraSense-001" value={deviceStatus} isOnline={deviceStatus === 'Online'} />
           <StatusBadge icon={RefreshCw} label="Last Sync" value={timeString} isOnline={deviceStatus === 'Online'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Gauge Card */}
        <div className="lg:col-span-4 xl:col-span-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center justify-center relative overflow-hidden">
          
           <div className="w-full text-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Overuse Risk Score</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Knee Osteoarthritis stress indicator</p>
           </div>
           
           <div className="relative w-full max-w-[200px] h-24 mt-2 mb-1 mx-auto flex justify-center items-end min-w-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110" preserveAspectRatio="xMidYMax meet">
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="16" strokeLinecap="round" />
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" 
                  className={`transition-all duration-500 ease-out ${
                    data.risk_score > 70 ? 'text-rose-500' : data.risk_score > 40 ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                  stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (data.risk_score / 100) * 251.2}
                />
              </svg>
           </div>
           
           <div className="mt-4 text-center">
              <h1 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{data.risk_score}</h1>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 text-xs font-bold rounded-full border ${
                  data.risk_score > 70 ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' : 
                  data.risk_score > 40 ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              }`}>
                {data.risk_score > 70 && <AlertCircle size={12} />}
                {data.risk_score > 70 ? 'CRITICAL STRESS' : data.risk_score > 40 ? 'MODERATE LOAD' : 'SAFE ZONE'}
              </span>
           </div>
        </div>

        {/* Sensor Grid */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4">
           <div>
             <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Joint Kinematics</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SensorCard icon={MoveDiagonal} title="Knee Flexion" subTitle="Angle" value={data.angle} unit="°" status={data.angle > 110 ? "High Flexion" : "Normal"} colorTheme="blue" />
                <SensorCard icon={Database} title="Applied Force" subTitle="Load" value={data.fsr} unit="N" status={data.fsr > 1000 ? "High Load" : "Normal"} colorTheme="amber" />
             </div>
           </div>

           <div>
             <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Vitals & Environment</h3>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SensorCard icon={HeartPulse} title="Heart Rate" subTitle="Pulse" value={data.bpm} unit="bpm" status={data.bpm > 0 ? "Reading" : "Calculating"} colorTheme="rose" />
                <SensorCard icon={Thermometer} title="Skin Temp" subTitle="Surface" value={data.skin_temp} unit="°C" colorTheme="emerald" />
                <SensorCard icon={Thermometer} title="Air Temp" subTitle="Ambient" value={data.ambient_temp} unit="°C" colorTheme="slate" />
                <SensorCard icon={Wind} title="Pressure" subTitle="Atmos" value={data.pressure} unit="hPa" colorTheme="slate" />
             </div>
           </div>
        </div>
      </div>

      {/* Footer Row */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-3 w-full md:w-1/2">
            <div className={`p-2 rounded-lg ${data.bat < 20 ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'}`}>
               <Battery size={18}/>
            </div>
            <div className="flex-1 max-w-xs">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Device Battery</span>
                 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{data.bat}%</span>
               </div>
               <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                 <div className={`h-full rounded-full transition-all duration-500 ${data.bat < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.max(0, Math.min(100, data.bat))}%` }}></div>
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 w-full md:w-auto">
            <Cloud size={16} className="text-slate-400 dark:text-slate-500" />
            <div>
               <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location</p>
               <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                 {weather ? `${weather.name} (${Math.round(weather.main.temp)}°C)` : (data.lat !== "0" ? "Fetching GPS..." : "Indoor Mode")}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}