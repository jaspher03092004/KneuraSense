'use client';

import { useState, useEffect, useRef } from 'react';
import { checkCriticalAlerts } from '@/actions/checkCriticalAlerts';
import { AlertTriangle, X, Users, ArrowRight } from 'lucide-react';

export default function GlobalClinicianAlerts({ clinicianId }) {
  const [alertToast, setAlertToast] = useState(null);
  const alertedPatientIds = useRef(new Set());
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { alertsEnabled, patients } = await checkCriticalAlerts(clinicianId);

      if (!alertsEnabled) return;

      // Ask for browser permission once if enabled
      if (!hasRequestedPermission && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
        setHasRequestedPermission(true);
      }

      // Filter out patients we've already alerted about in this session
      const newHighRisk = patients.filter(p => !alertedPatientIds.current.has(p.id));

      if (newHighRisk.length > 0) {
        // Add to tracked list to prevent duplicate alerts
        newHighRisk.forEach(p => alertedPatientIds.current.add(p.id));

        // 1. Show UI Toast with count and names
        setAlertToast({
          title: 'Critical Risk Alert',
          count: newHighRisk.length,
          names: newHighRisk.map(p => p.name).join(', ')
        });

        // 2. Show Native Browser Push Notification
        if ("Notification" in window && Notification.permission === "granted") {
          const names = newHighRisk.map(p => p.name).join(', ');
          const title = newHighRisk.length === 1 ? 'Patient Alert: High Risk' : 'Multiple Patients: High Risk';
          const body = newHighRisk.length === 1 
            ? `${newHighRisk[0].name} reached a critical risk score!`
            : `${newHighRisk.length} patients (${names}) reached a critical risk score!`;

          new Notification(title, { body, icon: "/favicon.ico" });
        }

        // Auto-hide toast after 15 seconds
        setTimeout(() => setAlertToast(null), 15000);
      }
    };

    // Check immediately on load, then every 5 seconds
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [clinicianId, hasRequestedPermission]);

  if (!alertToast) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-4 fade-in duration-500" role="alert">
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-[0_8px_30px_rgb(225,29,72,0.15)] dark:shadow-[0_8px_30px_rgb(225,29,72,0.3)] rounded-2xl w-full max-w-sm">
        
        <div className="p-5 flex items-start gap-4">
          
          {/* Status Icon with Pulse */}
          <div className="relative shrink-0 mt-1">
            <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-25"></div>
            <div className="relative p-2.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-500/30">
              <AlertTriangle size={22} strokeWidth={2.5} />
            </div>
          </div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {alertToast.title}
              </h4>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                URGENT
              </span>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {alertToast.count === 1 
                ? `${alertToast.names} has exceeded the safe knee stress threshold.`
                : `${alertToast.count} patients require immediate review due to high risk scores.`
              }
            </p>

            {/* Patient Badge */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
                <Users size={12} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                  {alertToast.names}
                </span>
              </div>
              <div className="flex-1"></div>
              <button className="text-[11px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-0.5 hover:gap-1.5 transition-all">
                VIEW <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Close Action */}
          <button 
            onClick={() => setAlertToast(null)}
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </div>
  );
}