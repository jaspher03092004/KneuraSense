import { useState, useEffect, useCallback, useRef } from 'react';
import { useMQTT } from '@/hooks/useMQTT';
import { updateClinicalThreshold } from '@/actions/updateClinicalThreshold';
import { Clock, Play, Square, Activity as ActivityIcon } from 'lucide-react';

export default function STSClinicalTest({ deviceMac, patientId, clinicianId }) {
  const { data, deviceStatus } = useMQTT(deviceMac);
  
  // -- Test Configuration State --
  const [isTesting, setIsTesting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('Deep Squat');
  const [testDuration, setTestDuration] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // -- Results State --
  const [peakScore, setPeakScore] = useState(0);
  const peakScoreRef = useRef(0); // Safely holds the latest score for callbacks
  const [safeThreshold, setSafeThreshold] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // --- 60% Angle / 40% FSR Calculation ---
  const liveStrainScore = Math.min(100, Math.round(
    (Math.abs(data.angle) / 120) * 60 + (data.fsr / 3000) * 40
  )) || 0;

  // 1. Derive peak score directly during render (Best Practice)
  if (isTesting && liveStrainScore > peakScore) {
    setPeakScore(liveStrainScore);
  }

  // 2. Keep the ref perfectly synced, safely inside an effect (Fixes the very first error)
  useEffect(() => {
    peakScoreRef.current = peakScore;
  }, [peakScore]);

  // 3. Stable stopTest function
  // Empty dependency array [] means this function never changes, keeping the timer stable!
  const stopTest = useCallback(() => {
    setIsTesting(false);
    // Uses the ref to get the absolute latest score without needing it in the dependency array
    setSafeThreshold(Math.max(10, peakScoreRef.current - 10));
  }, []);

  const startTest = () => {
    setPeakScore(0);
    peakScoreRef.current = 0;
    setSavedSuccess(false);
    setTimeLeft(testDuration * 60);
    setIsTesting(true);
  };

  // 4. Integrated Timer Logic
  // Handles the countdown AND the stop condition purely inside the async interval
  // This completely eliminates the "cascading effect" warning!
  useEffect(() => {
    if (!isTesting) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTest(); // Timer hit zero, stop cleanly!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isTesting, stopTest]);

  const handleApplyThreshold = async () => {
    setIsSaving(true);
    const res = await updateClinicalThreshold(clinicianId, patientId, safeThreshold); 
    if (res.success) setSavedSuccess(true);
    setIsSaving(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      
      {deviceStatus === "Offline" && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded text-sm font-bold">
          ⚠️ Device is Offline. Ensure the patellar sensor is powered on.
        </div>
      )}

      {/* --- PRE-TEST CONFIGURATION --- */}
      {!isTesting && peakScore === 0 && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Select Activity</label>
              <select 
                value={selectedActivity} 
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none"
              >
                <option value="Deep Squat">Deep Squat</option>
                <option value="Climbing Stairs">Climbing Stairs</option>
                <option value="Walking">Gait Assessment</option>
                <option value="Sit-to-Stand">Sit-to-Stand</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Duration (Minutes)</label>
              <select 
                value={testDuration} 
                onChange={(e) => setTestDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none"
              >
                <option value={0.5}>30 Seconds</option>
                <option value={1}>1 Minute</option>
                <option value={2}>2 Minutes</option>
                <option value={5}>5 Minutes</option>
              </select>
            </div>
          </div>
          <button 
            onClick={startTest}
            disabled={deviceStatus === "Offline"}
            className="w-full flex items-center justify-center gap-2 bg-[#2D5F8B] text-white py-3 rounded-lg font-bold hover:bg-[#22486b] transition-colors disabled:opacity-50"
          >
            <Play size={16} /> Start {selectedActivity} Test
          </button>
        </div>
      )}

      {/* --- ACTIVE TESTING DISPLAY --- */}
      {isTesting && (
        <div className="mb-6 space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <ActivityIcon size={18} className="animate-pulse" />
              <span className="text-xs uppercase tracking-wider">{selectedActivity} IN PROGRESS</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono font-bold">
              <Clock size={16} />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-2 border-blue-500 text-center shadow-lg">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Strain</span>
              <span className={`text-5xl font-black ${liveStrainScore > 75 ? 'text-rose-500' : 'text-blue-600'}`}>
                {liveStrainScore}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session Peak</span>
              <span className="text-5xl font-black text-slate-700 dark:text-slate-200">
                {peakScore}
              </span>
            </div>
          </div>

          <button 
            onClick={stopTest}
            className="w-full flex items-center justify-center gap-2 bg-rose-500 text-white py-3 rounded-lg font-bold hover:bg-rose-600 transition-colors shadow-lg"
          >
            <Square size={16} fill="currentColor" /> Stop Test (Patient Felt Pain)
          </button>
        </div>
      )}

      {/* --- RESULTS & THRESHOLD SAVE --- */}
      {!isTesting && peakScore > 0 && (
        <div className="mt-4 p-5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg animate-in slide-in-from-bottom-2 text-left">
          <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-2">Test Summary: {selectedActivity}</h4>
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
            Maximum discomfort reached at a strain score of <strong>{peakScore}</strong>. Adjust the slider to set a safe daily monitoring baseline.
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            <input 
              type="range" min="10" max="100" 
              value={safeThreshold} 
              onChange={(e) => setSafeThreshold(Number(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-2xl font-black text-blue-700 dark:text-blue-400 w-12 text-center">{safeThreshold}</span>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={handleApplyThreshold}
              disabled={isSaving || savedSuccess}
              className={`w-full py-2.5 rounded-md font-bold text-sm transition-all shadow-sm
                ${savedSuccess ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isSaving ? "Saving..." : savedSuccess ? "✓ Baseline Threshold Updated" : `Set Alert Threshold to ${safeThreshold}`}
            </button>
            <button 
              onClick={() => { setPeakScore(0); setSavedSuccess(false); }}
              className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase hover:underline mt-1"
            >
              Discard and Retest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}