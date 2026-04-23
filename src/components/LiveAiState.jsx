'use client';

import React, { memo, useState, useEffect } from 'react';
import { useMQTT } from '@/hooks/useMQTT';
import { 
  Activity, 
  Footprints, 
  PersonStanding, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  ArrowUpCircle,
  Armchair,
  Signal,
  Cpu,
  Wifi, Brain
} from 'lucide-react';

const LiveAiState = memo(({ deviceMac }) => {
  const { data, deviceStatus } = useMQTT(deviceMac);
  const [hexCode, setHexCode] = useState('0x0000');
  const [latency, setLatency] = useState(0);
  const isOnline = deviceStatus === 'Online';
  
  const rawState = data.ai_state || 'analyzing';
  const normalizedState = rawState.toLowerCase();

  // Simulated hardware readouts for the HUD
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      setHexCode('0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0'));
      setLatency(Math.floor(Math.random() * 33) + 12); 
    }, 2000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // --- Theme-Aware Configuration Map ---
  const stateConfig = {
    'safe_walking': {
      icon: Footprints,
      label: 'SAFE WALKING',
      animation: 'animate-bounce',
      color: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-500/30',
      glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.15)] dark:shadow-[0_0_20px_rgba(52,211,153,0.15)]',
      scanline: 'from-transparent via-emerald-400 dark:via-emerald-500 to-transparent',
      indicator: 'bg-emerald-500'
    },
    'risky_gait': {
      icon: AlertTriangle,
      label: 'RISKY GAIT',
      animation: 'animate-ping',
      color: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-500/30',
      glow: 'shadow-[0_4px_20px_rgba(225,29,72,0.15)] dark:shadow-[0_0_25px_rgba(244,63,94,0.3)]',
      scanline: 'from-transparent via-rose-400 dark:via-rose-500 to-transparent',
      indicator: 'bg-rose-500'
    },
    'incline_context_up': {
      icon: TrendingUp,
      label: 'INCLINE CONTEXT UP',
      animation: 'animate-pulse',
      color: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-500/30',
      glow: 'shadow-[0_4px_20px_rgba(217,119,6,0.15)] dark:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      scanline: 'from-transparent via-amber-400 dark:via-amber-500 to-transparent',
      indicator: 'bg-amber-500'
    },
    'incline_context_down': {
      icon: TrendingDown,
      label: 'INCLINE CONTEXT DOWN',
      animation: 'animate-pulse',
      color: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-500/30',
      glow: 'shadow-[0_4px_20px_rgba(217,119,6,0.15)] dark:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      scanline: 'from-transparent via-amber-400 dark:via-amber-500 to-transparent',
      indicator: 'bg-amber-500'
    },
    'prolonged_static_standing': {
      icon: PersonStanding,
      label: 'STATIC STANDING',
      animation: '',
      color: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-500/30',
      glow: 'shadow-[0_4px_20px_rgba(79,70,229,0.1)] dark:shadow-[0_0_15px_rgba(129,140,248,0.1)]',
      scanline: 'from-transparent via-indigo-400 dark:via-indigo-500 to-transparent',
      indicator: 'bg-indigo-500'
    },
    'seated_rest': {
      icon: Armchair,
      label: 'SEATED REST',
      animation: '',
      color: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-500/30',
      glow: 'shadow-[0_4px_20px_rgba(37,99,235,0.1)] dark:shadow-[0_0_15px_rgba(96,165,250,0.1)]',
      scanline: 'from-transparent via-blue-400 dark:via-blue-500 to-transparent',
      indicator: 'bg-blue-500'
    },
    'analyzing': {
      icon: Activity,
      label: 'ANALYZING',
      animation: 'animate-spin',
      color: 'text-slate-600 dark:text-emerald-400',
      iconBg: 'bg-slate-50 dark:bg-emerald-950/20',
      border: 'border-slate-200 dark:border-emerald-500/30',
      glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(52,211,153,0.05)]',
      scanline: 'from-transparent via-slate-300 dark:via-emerald-500 to-transparent',
      indicator: 'bg-slate-400 dark:bg-emerald-400'
    }
  };

  let currentConfig = stateConfig[normalizedState] || stateConfig['analyzing'];

  if (!isOnline) {
    currentConfig = {
      icon: Signal,
      label: 'DATA STREAM OFFLINE',
      animation: '',
      color: 'text-slate-400 dark:text-slate-500',
      iconBg: 'bg-slate-50 dark:bg-slate-900/50',
      border: 'border-slate-200 dark:border-slate-800',
      glow: 'shadow-sm',
      scanline: 'from-transparent via-slate-300 dark:via-slate-600 to-transparent',
      indicator: 'bg-slate-300 dark:bg-slate-600'
    };
  }

  const Icon = currentConfig.icon;

  return (
    <article className={`relative h-[110px] w-full flex flex-col justify-center overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl ${currentConfig.glow} transition-all duration-700 ease-out group`}>
      
      {/* Subtle Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
      
      {/* Top Accent Scanline */}
      <div className={`absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r ${currentConfig.scanline} opacity-80`} />

      <div className="relative px-3 z-10 flex items-center gap-3 w-full">
        
        {/* HUD Icon Module */}
        <div className={`relative shrink-0 flex items-center justify-center p-2 rounded-lg border backdrop-blur-md transition-all duration-500 ${currentConfig.iconBg} ${currentConfig.border}`}>
          <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${currentConfig.border} rounded-tl-sm`} />
          <div className={`absolute top-0 right-0 w-1.5 h-1.5 border-t border-r ${currentConfig.border} rounded-tr-sm`} />
          <div className={`absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l ${currentConfig.border} rounded-bl-sm`} />
          <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${currentConfig.border} rounded-br-sm`} />
          
          <Icon size={20} className={`${currentConfig.color} ${isOnline && currentConfig !== stateConfig.prolonged_static_standing && currentConfig !== stateConfig.seated_rest ? currentConfig.animation : ''}`} strokeWidth={2} />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <header className="flex items-center justify-between mb-0.5 pb-0.5 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-1.5 shrink-0">
              <Brain size={10} className="text-slate-400 dark:text-slate-500" />
              <h2 className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                AI STATE
              </h2>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {isOnline && (
                <div className="flex items-center gap-1 opacity-80">
                  <Wifi size={9} className="text-emerald-500 dark:text-emerald-400" />
                  <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">{latency}ms</span>
                </div>
              )}
              <span className={`text-[8px] font-mono font-bold tracking-wider ${isOnline ? 'text-slate-400 dark:text-slate-500' : 'text-rose-500/70 animate-pulse'}`}>
                 {isOnline ? `OP.${hexCode}` : 'SYS.FAIL'}
              </span>
            </div>
          </header>
          
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className={`text-xs md:text-sm font-mono font-black tracking-tight uppercase ${currentConfig.color} drop-shadow-sm truncate whitespace-nowrap`}>
              {currentConfig.label}
            </p>
            
            {/* Shrunk Ping Box */}
            {isOnline && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-black/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 shadow-inner shrink-0">
                <span className="relative flex h-1 w-1">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentConfig.indicator}`}></span>
                  <span className={`relative inline-flex rounded-full h-1 w-1 ${currentConfig.indicator}`}></span>
                </span>
                <span className="text-[8px] font-mono text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">SYNC</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

LiveAiState.displayName = 'LiveAiState';

export default LiveAiState;