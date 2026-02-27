'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, AlertCircle, Loader2, Check, ShieldCheck } from 'lucide-react';
import { acknowledgeIntervention } from '@/actions/acknowledgeIntervention';

export default function InterventionAcknowledgmentModal({ pendingInterventions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasRead, setHasRead] = useState(false);

  // Only open the modal if we have pending interventions on mount
  useEffect(() => {
    if (pendingInterventions && pendingInterventions.length > 0) {
      setIsOpen(true);
    }
  }, [pendingInterventions]);

  if (!isOpen || !pendingInterventions || pendingInterventions.length === 0) return null;

  const currentIntervention = pendingInterventions[currentIndex];

  const handleAcknowledge = async () => {
    if (!hasRead) return; // Guard clause
    
    setIsSubmitting(true);
    try {
      await acknowledgeIntervention(currentIntervention.id);
      
      if (currentIndex < pendingInterventions.length - 1) {
        // Move to the next intervention and reset the checkbox
        setCurrentIndex(prev => prev + 1);
        setHasRead(false);
      } else {
        // All done, close modal
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Failed to acknowledge intervention", error);
      alert("Something went wrong communicating with the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans transition-opacity">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Care Plan Update</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Please review the latest notes from your clinician.</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Medical Note Callout */}
          <div className="bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6 relative overflow-hidden">
            {/* Decorative left accent bar */}
            
            
            <div className="flex gap-3 mb-3">
              <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Clinician Instructions</h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
              {currentIntervention.notes || currentIntervention.patientFriendlyNote || "Please follow the updated physical therapy guidelines provided during your last visit."}
            </p>
          </div>

          {/* Explicit Acknowledgment Checkbox */}
          <label className="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
            <div className="relative flex items-center mt-0.5">
              <input 
                type="checkbox" 
                checked={hasRead}
                onChange={(e) => setHasRead(e.target.checked)}
                disabled={isSubmitting}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center group-hover:border-blue-500">
                <Check size={14} className={`text-white transition-opacity ${hasRead ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
              </div>
            </div>
            <span className="text-sm text-slate-700 dark:text-slate-300 select-none">
              I have read and understand these updated instructions from my healthcare provider.
            </span>
          </label>
        </div>

        {/* Footer Section */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="text-xs font-medium text-slate-500">
            {pendingInterventions.length > 1 ? `Update ${currentIndex + 1} of ${pendingInterventions.length}` : 'Required Review'}
          </div>
          
          <button
            onClick={handleAcknowledge}
            disabled={!hasRead || isSubmitting}
            className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-blue-600 shadow-sm disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Confirm & Continue</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}