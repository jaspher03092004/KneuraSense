'use client';

import { useState, useEffect, useRef } from 'react';
import { useMQTT } from '@/hooks/useMQTT';
import { AlertCircle, X, Activity } from 'lucide-react';

export default function GlobalPatientAlerts({ highStressAlerts, patientId, riskThreshold = 75, deviceMac }) {
  const { data, deviceStatus } = useMQTT(deviceMac);
  
  const [showPopup, setShowPopup] = useState(false);
  const lastAlertTime = useRef(0);
  const ALERT_COOLDOWN = 60000; // 60 seconds

  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // --- REQUEST BROWSER PERMISSION ---
  useEffect(() => {
    if (highStressAlerts && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [highStressAlerts]);
  
  // --- TRIGGER NOTIFICATIONS ---
  useEffect(() => {
    const currentScore = Number(data.risk_score);
    const threshold = Number(riskThreshold);

    if (highStressAlerts && currentScore >= threshold) {
      const now = Date.now();
      
      if (now - lastAlertTime.current > ALERT_COOLDOWN) {
        setTimeout(() => setShowPopup(true), 0);
        
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("KneuraSense Alert", {
            body: `Critical knee stress detected (${currentScore}). Please rest immediately.`,
            icon: "/favicon.ico"
          });
        }
        
        lastAlertTime.current = now;
        setTimeout(() => setShowPopup(false), 15000);
      }
    }
  }, [data.risk_score, highStressAlerts, riskThreshold]);

  if (!showPopup) return null;

  return (
    <div className="fixed top-24 right-4 md:right-8 z-[9999] animate-in slide-in-from-right fade-in duration-500" role="alert" aria-live="assertive">
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-[0_8px_30px_rgb(225,29,72,0.12)] dark:shadow-[0_8px_30px_rgb(225,29,72,0.2)] rounded-2xl w-full max-w-sm">
        
        <div className="p-5 flex items-start gap-4">
          
          {/* Animated Icon */}
          <div className="relative shrink-0 mt-1">
            <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-25"></div>
            <div className="relative p-2.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-500/30">
              <AlertCircle size={24} strokeWidth={2.5} />
            </div>
          </div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              High Stress Alert
            </h4>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Knee stress exceeded safe limits. Please slow down or rest immediately to prevent overuse.
            </p>

            {/* Emphasized Score Badge */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Current Score
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-sm border border-rose-100 dark:border-rose-500/20">
                <Activity size={14} />
                {data.risk_score} / 100
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button 
            onClick={() => setShowPopup(false)}
            className="shrink-0 p-1.5 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label="Dismiss alert"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </div>
  );
}