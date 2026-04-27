import React from 'react';
import { AlertCircle, ThermometerSnowflake, Activity, CheckCircle2 } from 'lucide-react';

export default function InsightCard({ rec }) {
  const getIcon = () => {
    if (rec.id === 'high-load') return <Activity size={14} className="text-red-500" />;
    if (rec.id === 'high-skin-temp') return <AlertCircle size={14} className="text-orange-500" />;
    if (rec.id === 'cold-weather') return <ThermometerSnowflake size={14} className="text-blue-500" />;
    return <CheckCircle2 size={14} className="text-emerald-500" />;
  };

  const getAccentColor = () => {
    if (rec.priority.includes('High Priority')) return 'bg-red-500 dark:bg-red-400';
    if (rec.priority.includes('Monitor Closely')) return 'bg-orange-500 dark:bg-orange-400';
    if (rec.priority.includes('Preventative')) return 'bg-blue-500 dark:bg-blue-400';
    return 'bg-emerald-500 dark:bg-emerald-400';
  };

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
      {/* Slimmer Accent Line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getAccentColor()} opacity-80 group-hover:opacity-100 transition-opacity`} />

      {/* Tighter padding */}
      <div className="p-3.5 pl-4 flex flex-col h-full">
        {/* Compact Header */}
        <div className="flex flex-wrap justify-between items-start gap-2 mb-2.5">
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${rec.priorityColor}`}>
            {getIcon()}
            {rec.priority}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {rec.tags.map(tag => (
              <span key={tag} className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* Compact Text */}
        <div className="mb-3 flex-1">
          <h4 className="font-extrabold text-slate-800 dark:text-white text-sm leading-tight mb-1">
            {rec.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug font-medium line-clamp-2">
            {rec.description}
          </p>
        </div>

        {/* Compact Telemetry Stats */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-md p-2 grid grid-cols-3 gap-2 border border-slate-100 dark:border-slate-800/60 mt-auto">
          {rec.stats.map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                {stat.label}
              </span>
              <span className={`text-xs font-black ${stat.valueColor || 'text-slate-700 dark:text-slate-200'}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}