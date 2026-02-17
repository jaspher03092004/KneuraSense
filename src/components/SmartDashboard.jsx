'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useMQTT } from '@/hooks/useMQTT';
import { 
  Activity, Thermometer, MoveDiagonal, 
  Battery, Wifi, RefreshCw, Database, 
  Bluetooth, Cloud, HeartPulse, Wind, AlertCircle,
} from 'lucide-react';

// Moved outside component to prevent recreation on every render
const THEMES = {
  blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
  emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
};

const SensorCard = ({ icon: Icon, title, subTitle, value, unit, status, colorTheme = "blue" }) => {
  const isAlert = status === 'High Risk' || status === 'High Flexion' || status === 'High Load';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 flex flex-col justify-between h-full min-h-[150px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-lg transition-colors duration-300 ${THEMES[colorTheme]}`}>
          <Icon size={22} strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-300">{title}</p>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors duration-300">{subTitle}</p>
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight transition-colors duration-300">
          {value}<span className="text-lg font-medium text-slate-400 dark:text-slate-500 ml-1 transition-colors duration-300">{unit}</span>
        </h3>
        <div className="flex items-center mt-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors duration-300 ${
              isAlert ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            {status || 'Live'}
          </span>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ icon: Icon, label, value, isOnline }) => (
  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
    <Icon size={18} aria-hidden="true" className={`transition-colors duration-300 ${isOnline ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`} />
    <div className="flex flex-col">
      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider transition-colors duration-300">{label}</span>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-300">{value}</span>
    </div>
  </div>
);

export default function SmartDashboard({ patientName, patientId }) {
  const { data, deviceStatus, lastPacketTime } = useMQTT();
  const [weather, setWeather] = useState(null);
  
  const dataRef = useRef(data); 
  const weatherRef = useRef(weather); 

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);

  // Derived risk config (returns full class strings so Tailwind compiles them properly)
  const riskConfig = useMemo(() => {
    if (data.risk_score > 70) return { 
      isCritical: true,
      label: 'CRITICAL STRESS',
      bgBar: 'bg-rose-500',
      textMain: 'text-rose-500 dark:text-rose-400',
      badgeStyles: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
    };
    if (data.risk_score > 40) return { 
      isCritical: false,
      label: 'MODERATE LOAD',
      bgBar: 'bg-amber-500',
      textMain: 'text-amber-500 dark:text-amber-400',
      badgeStyles: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
    };
    return { 
      isCritical: false,
      label: 'SAFE ZONE',
      bgBar: 'bg-emerald-500',
      textMain: 'text-emerald-500 dark:text-emerald-400',
      badgeStyles: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
    };
  }, [data.risk_score]);

  // Rounded GPS to prevent Weather API spamming on minor GPS jitter
  const roundedLat = Number(data.lat).toFixed(2);
  const roundedLng = Number(data.lng).toFixed(2);

  useEffect(() => {
    // 1. Use the rounded coordinates for the check instead of data.lat/data.lng
    // Note: Number("0").toFixed(2) becomes "0.00"
    if (roundedLat && roundedLng && roundedLat !== "0.00" && roundedLng !== "0.00" && roundedLat !== "NaN" && roundedLng !== "NaN") {
      const fetchWeather = async () => {
        const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY; 
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${roundedLat}&lon=${roundedLng}&units=metric&appid=${API_KEY}`;
        try {
          const response = await fetch(url);
          const result = await response.json();
          if (result.cod === 200) setWeather(result);
        } catch (error) { 
          console.error("Error fetching weather:", error); 
        }
      };
      fetchWeather();
    }
  }, [roundedLat, roundedLng]); // Depend on rounded coordinates

  useEffect(() => {
    const saveInterval = setInterval(async () => {
      const currentData = dataRef.current;
      const currentWeather = weatherRef.current; 
      
      if (deviceStatus === 'Online' && patientId && currentData.bat !== undefined) {
        try {
           await fetch('/api/save-log', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
               patientId, risk_score: currentData.risk_score, bat: currentData.bat,
               angle: currentData.angle, skin_temp: currentData.skin_temp, fsr: currentData.fsr,
               lat: currentData.lat, lng: currentData.lng,
               weatherTemp: currentWeather ? currentWeather.main.temp : null,
               bpm: currentData.bpm, ambient_temp: currentData.ambient_temp, pressure: currentData.pressure
             }),
           });
        } catch (err) { 
          console.error("Auto-save failed:", err); 
        }
      }
    }, 10000); 
    return () => clearInterval(saveInterval);
  }, [deviceStatus, patientId]);

  const timeString = lastPacketTime ? new Date(lastPacketTime).toLocaleTimeString() : "--:--";

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Patient Monitoring</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">Live telemetry for {patientName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <StatusBadge icon={Wifi} label="KneuraSense-001" value={deviceStatus} isOnline={deviceStatus === 'Online'} />
           <StatusBadge icon={RefreshCw} label="Last Sync" value={timeString} isOnline={deviceStatus === 'Online'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
           <div className={`absolute top-0 left-0 w-full h-2 transition-colors duration-500 ${riskConfig.bgBar}`}></div>
           
           <div className="w-full text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors duration-300">Overuse Risk Score</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors duration-300">Knee Osteoarthritis stress indicator</p>
           </div>
           
           <div className="relative w-full max-w-[240px] md:max-w-xs h-32 mt-4 mb-2 mx-auto flex justify-center items-end min-w-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110" preserveAspectRatio="xMidYMax meet" aria-label={`Risk Score: ${data.risk_score}`}>
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="stroke-slate-100 dark:stroke-slate-800 transition-colors duration-300" strokeWidth="18" strokeLinecap="round" />
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" 
                  className={`transition-all duration-1000 ease-out ${riskConfig.textMain}`}
                  stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (data.risk_score / 100) * 251.2}
                />
              </svg>
           </div>
           
           <div className="mt-6 text-center">
              <h1 className="text-6xl font-black text-slate-800 dark:text-white tracking-tighter transition-colors duration-300">{data.risk_score}</h1>
              <span className={`inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 text-sm font-bold rounded-full border transition-colors duration-300 ${riskConfig.badgeStyles}`}>
                {riskConfig.isCritical && <AlertCircle size={14} />}
                {riskConfig.label}
              </span>
           </div>
        </div>

        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-6">
           <div>
             <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1 transition-colors duration-300">Joint Kinematics</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SensorCard icon={MoveDiagonal} title="Knee Flexion" subTitle="Angle" value={data.angle} unit="°" status={data.angle > 110 ? "High Flexion" : "Normal"} colorTheme="blue" />
                <SensorCard icon={Database} title="Applied Force" subTitle="Load" value={data.fsr} unit="N" status={data.fsr > 1000 ? "High Load" : "Normal"} colorTheme="amber" />
             </div>
           </div>

           <div>
             <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1 transition-colors duration-300">Vitals & Environment</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <SensorCard icon={HeartPulse} title="Heart Rate" subTitle="Pulse" value={data.bpm} unit="bpm" status={data.bpm > 0 ? "Reading" : "Calculating"} colorTheme="rose" />
                <SensorCard icon={Thermometer} title="Skin Temp" subTitle="Surface" value={data.skin_temp} unit="°C" colorTheme="emerald" />
                <SensorCard icon={Thermometer} title="Air Temp" subTitle="Ambient" value={data.ambient_temp} unit="°C" colorTheme="slate" />
                <SensorCard icon={Wind} title="Pressure" subTitle="Atmos" value={data.pressure} unit="hPa" colorTheme="slate" />
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300">
         <div className="flex items-center gap-3 w-full md:w-1/2">
            <div className={`p-2 rounded-lg transition-colors duration-300 ${data.bat < 20 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
               <Battery size={20}/>
            </div>
            <div className="flex-1">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors duration-300">Device Battery</span>
                 <span className="text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors duration-300">{data.bat}%</span>
               </div>
               <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden transition-colors duration-300">
                 <div className={`h-full rounded-full transition-all duration-500 ${data.bat < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${data.bat}%` }}></div>
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 w-full md:w-auto transition-colors duration-300">
            <Cloud size={20} className="text-slate-400 dark:text-slate-500 transition-colors duration-300" aria-hidden="true" />
            <div>
               <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors duration-300">Location</p>
               <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-300">
                 {weather ? `${weather.name} (${Math.round(weather.main.temp)}°C)` : (data.lat !== "0" ? "Fetching GPS..." : "Indoor Mode")}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}