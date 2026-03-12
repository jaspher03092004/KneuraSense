'use client';

import { useState, useEffect } from 'react';
import { 
  X, Sparkles, Pill, Activity, Stethoscope, 
  Calendar, Maximize2, ClipboardList 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CarePlanCard({ intervention, aiSummary }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Defers the state update to prevent the synchronous re-render warning
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!intervention) return (
    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-12">
      <ClipboardList size={32} className="mb-2 text-slate-400" />
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">All Clear</p>
    </div>
  );

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="flex flex-col h-full space-y-4 cursor-pointer group transition-all"
      >
        {/* Intervention Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-2 transition-colors">
              {intervention.type}
            </span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {intervention.title}
            </h3>
          </div>
          <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={14} />
          </div>
        </div>

        {/* AI Summary (Clamped) */}
        {aiSummary && (
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-md p-3.5 transition-colors">
            <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400">
              <Sparkles size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Summary</span>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed line-clamp-3 prose prose-sm dark:prose-invert max-w-none prose-p:m-0 prose-ul:m-0 prose-li:m-0">
              <ReactMarkdown>
                {aiSummary}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Clinical Notes (Clamped) */}
        <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-md p-3.5 border border-slate-100 dark:border-slate-800 transition-colors">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 block">Clinician Note</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-3 leading-relaxed">
            &quot;{intervention.notes}&quot;
          </p>
          <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold mt-1.5 uppercase tracking-tighter">Click to read more...</p>
        </div>

        {/* Metadata */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <Stethoscope size={12} />
            <span className="text-[10px] font-bold uppercase">Dr. {intervention.clinician?.full_name?.split(' ').pop()}</span>
          </div>
          <span className="text-[10px] font-bold uppercase">
            {isMounted ? new Date(intervention.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '...'}
          </span>
        </div>
      </div>

      {/* --- THE MODAL --- */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 w-full max-w-lg rounded-md shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Pinned to top) */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-md shadow-sm">
                  <ClipboardList size={18} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Full Instructions</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content (Scrollable area) */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <section>
                <div className="flex items-center gap-2 mb-3">
                   <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
                   <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Patient-Friendly Summary</h4>
                </div>
                
                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-4 prose-p:last:mb-0 prose-ul:list-disc prose-ul:ml-5 prose-ul:mb-4 prose-ul:last:mb-0 prose-ol:list-decimal prose-ol:ml-5 prose-ol:mb-4 prose-ol:last:mb-0">
                  <ReactMarkdown>
                    {aiSummary || "No summary available."}
                  </ReactMarkdown>
                </div>
              </section>

              <hr className="border-slate-100 dark:border-slate-800/80" />

              <section>
                <div className="flex items-center gap-2 mb-3">
                   <Stethoscope size={16} className="text-slate-400 dark:text-slate-500" />
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Official Clinical Records</h4>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-md border border-slate-100 dark:border-slate-700/50">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm sm:text-base">{intervention.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    &quot;{intervention.notes}&quot;
                  </p>
                </div>
              </section>

              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-2">
                 <span>Prescribed By: Dr. {intervention.clinician?.full_name}</span>
                 <span>Date: {isMounted ? new Date(intervention.createdAt).toLocaleDateString() : '...'}</span>
              </div>
            </div>

            {/* Modal Footer (Pinned to bottom) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
              >
                Close Instruction
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}