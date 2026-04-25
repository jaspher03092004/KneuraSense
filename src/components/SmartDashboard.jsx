// src/components/SmartDashboard.jsx
'use client';

import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { 
  Activity, Thermometer, MoveDiagonal, 
  Battery, Wifi, RefreshCw, Database, 
  Cloud, HeartPulse, Wind, AlertTriangle, CheckCircle2,
  Target, X, Volume2, 
  WifiOff, HardDrive 
} from 'lucide-react';
import { useMQTT } from '@/hooks/useMQTT';
import LocationSync from '@/components/LocationSync';

const THEMES = {
  blue: "bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30",
  rose: "bg-rose-50/80 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/30",
  emerald: "bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30",
  amber: "bg-amber-50/80 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30",
  slate: "bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50"
};

const SensorCard = memo(({ icon: Icon, title, subTitle, value, unit, status, colorTheme = "blue", isLive = true }) => {
  const isAlert = status?.includes('High') || status?.includes('Risk');

  return (
    <article className="bg-white dark:bg-slate-900 rounded-lg p-5 flex flex-col justify-between h-full min-h-[160px] border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-md transition-all duration-300 group">
      <header className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-lg border transition-colors duration-300 ${THEMES[colorTheme]}`}>
          <Icon size={20} strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div className="text-right">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{subTitle}</p>
        </div>
      </header>
      
      <div className="mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{unit}</span>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAlert ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isAlert ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
            </span>
          )}
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors duration-300 ${
              isAlert 
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {status || 'Live Data'}
          </span>
        </div>
      </div>
    </article>
  );
});

SensorCard.displayName = 'SensorCard';

const StatusBadge = memo(({ icon: Icon, label, value, isOnline, pulsing = false }) => (
  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
    <div className="relative">
      <Icon size={14} aria-hidden="true" className={isOnline ? "text-emerald-500" : "text-slate-400"} />
      {pulsing && isOnline && (
        <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider leading-none mb-0.5">{label}</span>
      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">{value}</span>
    </div>
  </div>
));

StatusBadge.displayName = 'StatusBadge';

// --- NEW SMART DASHBOARD NETWORK INDICATOR ---
function NetworkIndicator({ deviceStatus, data }) {
  if (deviceStatus === "Offline") {
    return (
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900/50 shadow-sm transition-colors duration-300">
        <WifiOff size={14} className="text-red-500" />
        <div className="flex flex-col text-left">
          <span className="text-[8px] uppercase font-black text-red-500 tracking-wider leading-none mb-0.5">Network Status</span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">Disconnected</span>
        </div>
      </div>
    );
  }

  if (data.offline_mode) {
    return (
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-amber-200 dark:border-amber-900/50 shadow-sm transition-colors duration-300">
        <HardDrive size={14} className="text-amber-500" />
        <div className="flex flex-col text-left">
          <span className="text-[8px] uppercase font-black text-amber-500 tracking-wider leading-none mb-0.5">Syncing Status</span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">Offline Data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-900/50 shadow-sm transition-colors duration-300">
      <div className="relative">
        <Wifi size={14} className="text-emerald-500" />
        <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[8px] uppercase font-black text-emerald-500 tracking-wider leading-none mb-0.5">Connected To</span>
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">{data.wifi_ssid || "Unknown Network"}</span>
      </div>
    </div>
  );
}

export default function SmartDashboard({ patientName, patientId, deviceMac, enableAutoSave = false, riskThreshold = 75, voiceAlert }) {
  const { data, deviceStatus, lastPacketTime, sendCommand } = useMQTT(deviceMac);
  const [weather, setWeather] = useState(null);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationPhase, setCalibrationPhase] = useState('idle'); 
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const dataRef = useRef(data); 
  const weatherRef = useRef(weather); 
  
  const lastLatRef = useRef(null);
  const lastLngRef = useRef(null);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);

  useEffect(() => {
    if (voiceAlert && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceAlert);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      utterance.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setAudioBlocked(true);
        }
      };
      window.speechSynthesis.speak(utterance);
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) {
          setAudioBlocked(true);
        }
      }, 500);
      const url = new URL(window.location);
      url.searchParams.delete('voiceAlert');
      window.history.replaceState({}, '', url);
    }
  }, [voiceAlert]);

  const handleManualPlay = () => {
    if (voiceAlert) {
      const utterance = new SpeechSynthesisUtterance(voiceAlert);
      window.speechSynthesis.speak(utterance);
      setAudioBlocked(false);
    }
  };

  const riskConfig = useMemo(() => {
    const currentScore = Number(data.risk_score);
    const threshold = Number(data.dynamic_threshold || riskThreshold);
    if (currentScore >= threshold) return { 
      isCritical: true, label: 'CRITICAL STRESS', textMain: 'text-rose-500 dark:text-rose-400',
      stroke: 'stroke-rose-500 dark:stroke-rose-400',
      badgeStyles: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
    };
    if (currentScore >= (threshold - 15)) return { 
      isCritical: false, label: 'MODERATE LOAD', textMain: 'text-amber-500 dark:text-amber-400',
      stroke: 'stroke-amber-500 dark:stroke-amber-400',
      badgeStyles: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
    };
    return { 
      isCritical: false, label: 'SAFE ZONE', textMain: 'text-emerald-500 dark:text-emerald-400',
      stroke: 'stroke-emerald-500 dark:stroke-emerald-400',
      badgeStyles: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
    };
  }, [data.risk_score, data.dynamic_threshold, riskThreshold]);

  useEffect(() => {
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    if (lat && lng && lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
      const roundedLat = lat.toFixed(2);
      const roundedLng = lng.toFixed(2);
      if (lastLatRef.current !== roundedLat || lastLngRef.current !== roundedLng) {
        lastLatRef.current = roundedLat;
        lastLngRef.current = roundedLng;
        const fetchWeather = async () => {
          try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${roundedLat}&lon=${roundedLng}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`);
            if (res.ok) setWeather(await res.json());
          } catch (error) {}
        };
        fetchWeather();
      }
    }
  }, [data.lat, data.lng]);

  const isOnline = deviceStatus === 'Online';

  const executeCalibration = () => {
    if (!isOnline) return;
    if (sendCommand("CALIBRATE")) {
      setCalibrationPhase('calibrating');
      setCalibrationProgress(0);
      const duration = 4000;
      const intervalTime = 50; 
      const step = (intervalTime / duration) * 100;
      const progressInterval = setInterval(() => {
        setCalibrationProgress(prev => {
          if (prev + step >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + step;
        });
      }, intervalTime);
      setTimeout(() => {
        clearInterval(progressInterval);
        setCalibrationPhase('success');
        setTimeout(() => closeCalibrationModal(), 2500);
      }, duration);
    }
  };

  const closeCalibrationModal = () => {
    setShowCalibrationModal(false);
    setTimeout(() => {
      setCalibrationPhase('idle');
      setCalibrationProgress(0);
    }, 300);
  };
  

  return (
    <>
      <LocationSync patientId={patientId} /> 
      
      <section className="space-y-6 w-full" aria-label="Patient Telemetry Dashboard">
        {audioBlocked && (
          <div className="fixed inset-x-4 top-20 z-[100] animate-in slide-in-from-top-4 duration-500">
            <button 
              onClick={handleManualPlay}
              className="w-full bg-rose-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 font-bold border-2 border-white/20"
            >
              <Volume2 size={24} className="animate-pulse" />
              TAP TO HEAR URGENT INSTRUCTIONS
            </button>
          </div>
        )}
        <header className="-mt-4 flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="shrink-0">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Live Telemetry</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Real-time monitoring for {patientName}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
             <div className="relative group flex items-center">
               <button 
                 onClick={() => setShowCalibrationModal(true)}
                 disabled={!isOnline}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-bold text-[10px] uppercase tracking-wider transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Target size={14} className={isOnline ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"} />
                 Set Baseline
               </button>
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center z-10 pointer-events-none shadow-lg">
                 Click this while standing perfectly straight to zero your joint angle to 0°.
                 <svg className="absolute text-slate-800 dark:text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
               </div>
             </div>

             <NetworkIndicator deviceStatus={deviceStatus} data={data} />
             
             <StatusBadge icon={RefreshCw} label="Sync" value={lastPacketTime ? new Date(lastPacketTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : "--:--"} isOnline={isOnline} />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <article className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="w-full text-center mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Overuse Risk Index</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">Real-time Joint Stress</p>
             </div>
             
             <div className="relative w-full max-w-[260px] aspect-[2/1] mx-auto flex justify-center items-end">
                <svg className="w-full h-full overflow-visible drop-shadow-sm" viewBox="0 0 200 110" preserveAspectRatio="xMidYMax meet">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="20" strokeLinecap="round" />
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" 
                    className={`transition-all duration-500 ease-out ${riskConfig.stroke}`}
                    strokeWidth="20" strokeLinecap="round" strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (data.risk_score / 100) * 251.2}
                  />
                </svg>
                <div className="absolute bottom-0 left-0 right-0 text-center translate-y-2">
                  <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{data.risk_score}</span>
                </div>
             </div>
             
             <div className="mt-8">
                <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full border ${riskConfig.badgeStyles}`}>
                  {riskConfig.isCritical ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                  {riskConfig.label}
                </span>
             </div>
          </article>

          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
             <section>
               <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">Joint Kinematics</h3>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <SensorCard icon={MoveDiagonal} title="Knee Flexion" subTitle="Current Angle" value={data.angle} unit="°" status={data.angle > 110 ? "High Flexion" : "Normal"} colorTheme="blue" isLive={isOnline} />
                  <SensorCard icon={Database} title="Applied Force" subTitle="Patellar Load" value={data.fsr} unit=" N" status={data.fsr > 2500 ? "High Load" : "Normal Range"} colorTheme="amber" isLive={isOnline} />
               </div>
             </section>

             <section>
               <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">Vitals & Environment</h3>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <SensorCard icon={HeartPulse} title="Heart Rate"  subTitle="BPM"  value={data.bpm || "--"} unit=""  status={data.bpm > 120 ? "High Exertion" : (data.bpm > 0 ? "Normal Range" : "Calculating")} colorTheme="rose" isLive={isOnline && data.bpm > 0} />
                  <SensorCard icon={Thermometer} title="Skin Temp" subTitle="Surface" value={data.skin_temp || "--"}  unit="°C" status={data.skin_temp ? (data.skin_temp > 34.5 ? "Inflammation Risk" : "Normal") : "--"} colorTheme="emerald"  isLive={isOnline} />
                  <SensorCard icon={Thermometer} title="Air Temp" subTitle="Ambient" value={data.ambient_temp || "--"} unit="°C" status={data.ambient_temp ? (data.ambient_temp < 15 ? "Stiffness Risk" : "Optimal") : "--"} colorTheme="slate" isLive={isOnline} />
                 <SensorCard icon={Wind}  title="Pressure" subTitle="Atmos" value={data.pressure ? Math.round(data.pressure) : "--"} unit=" hPa"  status={data.pressure ? (data.pressure < 1005 ? "Expansion Risk" : "Normal Range") : "--"}  colorTheme="slate" isLive={isOnline} />
               </div>
             </section>
          </div>
        </div>

        <footer className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4 w-full sm:w-1/2">
              <div className={`p-2.5 rounded-xl ${data.bat < 20 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                 <Battery size={20} strokeWidth={2.5}/>
              </div>
              <div className="flex-1 max-w-xs">
                 <div className="flex justify-between items-end mb-1.5">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Battery Level</span>
                   <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{data.bat}%</span>
                 </div>
                 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                   <div className={`h-full rounded-full transition-all duration-700 ease-out ${data.bat < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.max(0, Math.min(100, data.bat))}%` }}></div>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 w-full sm:w-auto">
              <Cloud size={18} className="text-slate-400 dark:text-slate-500" />
              <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Environment Context</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {data.ext_temp ? `Weather • ${data.ext_temp}°C` : "Syncing..."}
                  </p>
              </div>
            </div>
        </footer>
      </section>

      {/* Calibration Modal */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Set Standing Baseline</h3>
              </div>
              {calibrationPhase === 'idle' && (
                <button onClick={closeCalibrationModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="p-6">
              {calibrationPhase === 'idle' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">To ensure accurate joint kinematics, both the thigh and shank sensors must be zeroed to establish a baseline.</p>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex gap-3">
                    <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Patient Preparation</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400/90 mt-1">Instruct the patient to stand perfectly straight with their weight evenly distributed. They must remain completely still for 5 seconds after initiating.</p>
                    </div>
                  </div>
                </div>
              )}
              {calibrationPhase === 'calibrating' && (
                <div className="py-6 text-center space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <svg className="animate-spin w-full h-full text-indigo-100 dark:text-indigo-900/30" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                      <path className="opacity-75 text-indigo-600 dark:text-indigo-400" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.round(calibrationProgress)}%</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Calibrating...</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please ensure the patient remains still.</p>
                  </div>
                </div>
              )}
              {calibrationPhase === 'success' && (
                <div className="py-6 text-center space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Baseline Established</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sensors have been successfully zeroed to 0°.</p>
                  </div>
                </div>
              )}
            </div>
            {calibrationPhase === 'idle' && (
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button onClick={closeCalibrationModal} className="px-4 py-2 rounded-lg font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={executeCalibration} className="px-6 py-2 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center gap-2">Start Calibration</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}