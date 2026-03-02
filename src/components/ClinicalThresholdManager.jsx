'use client';

import { useState } from 'react';
import { updateClinicalThreshold } from '@/actions/updateClinicalThreshold';
import { useMQTT } from '@/hooks/useMQTT';
import { Target, Save, Loader2, CheckCircle } from 'lucide-react';

export default function ClinicalThresholdManager({ clinicianId, patient }) {
  const [threshold, setThreshold] = useState(patient.riskThreshold ?? 75);
  const [status, setStatus] = useState({ loading: false, success: false });

  // Connect to the patient's specific device to push the update instantly
  const { sendCommand, deviceStatus } = useMQTT(patient.deviceMac);

  const handleSave = async () => {
    setStatus({ loading: true, success: false });
    
    const res = await updateClinicalThreshold(clinicianId, patient.id, threshold);
    
    if (res.success) {
      // If the patient's device is online, sync the new clinical setting instantly
      if (sendCommand && patient.deviceMac) {
        // Pull their existing notification settings from the DB response, append the new threshold
        const p = res.patientData;
        const configCommand = `CONFIG:${p.highStressAlerts ? 1 : 0}:${p.vibrationEnabled ? 1 : 0}:${p.vibrationIntensity}:${p.ledEnabled ? 1 : 0}:${threshold}`;
        sendCommand(configCommand);
      }

      setStatus({ loading: false, success: true });
      setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 3000);
    } else {
      setStatus({ loading: false, success: false });
      alert(res.error);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Target size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Clinical Baseline Threshold</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Prescribe the Overuse Risk Score limit for this patient.</p>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-8">
        <input 
          type="range" 
          min="50" 
          max="95" 
          step="5"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
        />
        <div className="flex flex-col items-center justify-center min-w-[80px] px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
          <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 leading-none">{threshold}</span>
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-1">Target</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="text-sm">
          {deviceStatus === 'Online' 
            ? <span className="text-emerald-600 font-medium">Device Online: Will sync instantly.</span>
            : <span className="text-slate-500">Device Offline: Will sync on next connection.</span>
          }
        </div>
        
        <button 
          onClick={handleSave}
          disabled={status.loading || threshold === patient.riskThreshold}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {status.loading ? <Loader2 size={16} className="animate-spin" /> : (status.success ? <CheckCircle size={16} /> : <Save size={16} />)}
          {status.success ? 'Prescribed!' : 'Update Prescription'}
        </button>
      </div>
    </div>
  );
}