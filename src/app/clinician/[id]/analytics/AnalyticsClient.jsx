'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RiskDonutChart, OveruseComposedChart, BiomechanicalScatterChart, MiniLineChart } from '@/components/HistoryCharts';
import ExportButton from '@/components/ExportButton';
import { 
  Activity, Mountain, ChevronLeft, ChevronRight, User, AlertTriangle, Zap, Users, Thermometer, Target, Clock, ActivitySquare, Calendar
} from 'lucide-react';

export default function AnalyticsClient({ clinicianId, patientData, chartData, rawLogs, allPatients }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Read parameters from the URL
  const activePeriod = searchParams.get('period') || '24h';
  const patientId = searchParams.get('patientId');
  const start = searchParams.get('start') || '';
  const end = searchParams.get('end') || '';

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handlePeriodChange = (newPeriod) => {
    // Navigates and drops the start/end custom dates when a quick button is clicked
    router.push(`/clinician/${clinicianId}/analytics?patientId=${patientId}&period=${newPeriod}`);
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sDate = formData.get('start');
    const eDate = formData.get('end');
    if (sDate && eDate) {
      // Navigates with the custom date range instead of a quick period
      router.push(`/clinician/${clinicianId}/analytics?patientId=${patientId}&start=${sDate}&end=${eDate}`);
      setCurrentPage(1);
    }
  };

  // PATIENT SELECTION SCREEN
  if (!patientData) {
    return (
      <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-slate-800 antialiased p-4 md:p-8">
        <div className="mx-auto w-full max-w-[1400px]">
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h1 className="-mt-6 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Select a Patient</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Choose a patient to view their biomechanical analytics.</p>
            </div>
            <button 
              onClick={() => router.push(`/clinician/${clinicianId}/dashboard`)}
              className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] md:text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm w-full md:w-auto"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </button>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPatients?.map(p => (
              <div 
                key={p.id} 
                onClick={() => router.push(`/clinician/${clinicianId}/analytics?patientId=${p.id}&period=24h`)} 
                className="cursor-pointer group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold text-lg">
                    {p.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${p.oaDiagnosis ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {p.oaDiagnosis ? 'Knee OA' : 'Healthy'}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.fullName}</h3>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                  <span className="font-semibold">Age: {p.age || 'N/A'}</span>
                  <span className="truncate max-w-[120px] font-mono text-[10px]">ID: {p.id.split('-')[0]}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- CDSS DATA PROCESSING ---
  const formattedChartData = chartData?.map(d => ({
    time: `${d.hour}:00`,
    risk: d.risk,
    angle: d.angle,
    force: d.force,
    skinTemp: d.skinTemp,
    bpm: d.bpm
  })) || [];

  const hasData = formattedChartData.length > 0;
  const maxFlexion = hasData ? Math.max(...formattedChartData.map(d => d.angle)).toFixed(1) : 0;
  const highRiskLogsCount = formattedChartData.filter(d => d.risk >= 70).length;
  const complianceHours = formattedChartData.length; 

  const safeCount = formattedChartData.filter(d => d.risk < 40).length;
  const warningCount = formattedChartData.filter(d => d.risk >= 40 && d.risk < 70).length;
  const criticalCount = formattedChartData.filter(d => d.risk >= 70).length;
  const distributionData = [
    { name: 'Safe (<40)', value: safeCount, fill: '#10b981' }, 
    { name: 'Warning (40-69)', value: warningCount, fill: '#f59e0b' }, 
    { name: 'Critical (>70)', value: criticalCount, fill: '#f43f5e' } 
  ];

  const skinTempData = formattedChartData.map(d => ({ time: d.time, val: d.skinTemp }));
  
  const totalLogsCount = rawLogs?.length || 0;
  const totalPages = Math.ceil(totalLogsCount / itemsPerPage);
  const paginatedLogs = rawLogs?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  const tableRows = paginatedLogs.map(log => ({
    time: new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    score: log.riskScore,
    angle: `${log.angle?.toFixed(1) || 0}°`,
    force: `${log.force} N`,
    bpm: log.bpm && log.bpm > 0 ? `${log.bpm} bpm` : '--',
    temp: `${log.skinTemp?.toFixed(1) || 0}°C`,
    status: log.riskScore > 70 ? 'High' : log.riskScore > 40 ? 'Medium' : 'Low'
  }));
  
  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-slate-800 antialiased overflow-x-hidden p-4 md:p-8">
      <div className="mx-auto w-full max-w-[1400px]">
        
        {/* HEADER */}
        <header className="mb-6 -mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl border border-blue-100 dark:border-blue-500/20">
              {patientData.initials}
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {patientData.name} 
                <span className="text-[10px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">
                  ID: {patientData.id.split('-')[0]}
                </span>
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{patientData.diagnosis} • {patientData.history}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => router.push(`/clinician/${clinicianId}/analytics`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm whitespace-nowrap transition-colors"
            >
               Switch Patient
            </button>
            <div className="flex-1 sm:flex-none">
              <ExportButton logs={rawLogs} patientName={patientData.name} />
            </div>
          </div>
        </header>

        {/* DATE FILTERS */}
        <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <nav className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 snap-x touch-pan-x min-w-0">
            <FilterLink label="24 Hours" active={activePeriod === '24h' && !start} onClick={() => handlePeriodChange('24h')} />
            <FilterLink label="7 Days" active={activePeriod === '7d' && !start} onClick={() => handlePeriodChange('7d')} />
            <FilterLink label="30 Days" active={activePeriod === '30d' && !start} onClick={() => handlePeriodChange('30d')} />
          </nav>

          <form onSubmit={handleCustomDateSubmit} className="flex flex-col sm:flex-row w-full xl:w-fit items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl md:rounded-full border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between sm:justify-start gap-2 px-1 w-full sm:w-auto">
              <Calendar size={14} className="text-slate-400 dark:text-slate-500 shrink-0 hidden sm:block" />
              <input type="date" name="start" required defaultValue={start} className="text-[13px] text-slate-600 dark:text-slate-300 bg-transparent outline-none cursor-pointer w-full sm:w-auto dark:[color-scheme:dark]" />
              <span className="text-slate-300 dark:text-slate-600 text-xs font-bold shrink-0">to</span>
              <input type="date" name="end" required defaultValue={end} className="text-[13px] text-slate-600 dark:text-slate-300 bg-transparent outline-none cursor-pointer w-full sm:w-auto dark:[color-scheme:dark]" />
            </div>
            <button type="submit" className="bg-slate-900 dark:bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl md:rounded-full hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shrink-0 w-full sm:w-auto text-center">
              Apply Filter
            </button>
          </form>
        </div>

        {/* ROW 1: PRIMARY KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard icon={<Target size={18} />} value={patientData.avgRisk} label="Avg Risk Score" trend={patientData.avgRisk > 50 ? "Elevated" : "Normal"} color={patientData.avgRisk > 50 ? "amber" : "emerald"} />
          <StatCard icon={<AlertTriangle size={18} />} value={highRiskLogsCount} label="High Risk Events" trend="Action Required" color={highRiskLogsCount > 0 ? "rose" : "slate"} />
          <StatCard icon={<Mountain size={18} />} value={`${maxFlexion}°`} label="Max Flexion (ROM)" trend="Stiffness Check" color="blue" />
          <StatCard icon={<Clock size={18} />} value={`${complianceHours} hrs`} label="Device Wear Time" trend="Compliance" color="sky" />
        </section>

        {/* ROW 2: THE BIG PICTURE */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Left: Risk Distribution */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm lg:col-span-1 flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <ActivitySquare size={16} className="text-slate-400 dark:text-slate-500" /> Zone Distribution
            </h3>
            <div className="flex-1 relative min-h-[200px]">
              <RiskDonutChart data={distributionData} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{complianceHours}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Readings</span>
              </div>
            </div>
            <div className="flex justify-between mt-4 border-t border-slate-50 dark:border-slate-800/50 pt-4">
               <LegendItem color="bg-emerald-500" label="Safe" value={`${Math.round((safeCount/complianceHours)*100 || 0)}%`} />
               <LegendItem color="bg-amber-500" label="Warn" value={`${Math.round((warningCount/complianceHours)*100 || 0)}%`} />
               <LegendItem color="bg-rose-500" label="Crit" value={`${Math.round((criticalCount/complianceHours)*100 || 0)}%`} />
            </div>
          </div>

          {/* Right: Overuse Overlay (Risk + Force) */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Activity size={16} className="text-slate-400 dark:text-slate-500" /> Overuse Overlay (Load vs Risk)
              </h3>
              <div className="flex gap-4">
                <LegendItem color="bg-sky-500" label="Force (N)" />
                <LegendItem color="bg-amber-500" label="Risk Score" />
              </div>
            </div>
            <div className="flex-1 min-h-[250px]">
               <OveruseComposedChart data={formattedChartData} /> 
            </div>
          </div>
        </section>

        {/* ROW 3: BIOMECHANICAL & PHYSIOLOGICAL DEEP DIVE */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Scatter Plot */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Target size={16} className="text-slate-400 dark:text-slate-500" /> Biomechanics (Flexion vs Load)
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">Are high risk events occurring during deep knee bending?</p>
            <div className="h-48 w-full">
               <BiomechanicalScatterChart data={formattedChartData} />
            </div>
          </div>

          {/* Temp Chart */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Thermometer size={16} className="text-slate-400 dark:text-slate-500" /> Joint Inflammation Indicator
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">Localized skin temperature trends indicating potential flare-ups.</p>
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-2 min-h-[150px]">
               <MiniLineChart data={skinTempData} stroke="#f43f5e" unit="°C" />
            </div>
          </div>
        </section>

        {/* ROW 4: DETAILED LOGS */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="border-b border-slate-50 dark:border-slate-800 p-5 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Raw Telemetry Auditing</h3>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Showing {tableRows.length} of {totalLogsCount}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  {['Time', 'Risk Score', 'Flexion', 'Load', 'Heart Rate', 'Skin Temp', 'Status'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {tableRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.time}</td>
                    <td className="px-6 py-3 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{row.score}</td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{row.angle}</td>
                    <td className="px-6 py-3 text-xs text-sky-600 dark:text-sky-400 font-semibold">{row.force}</td>
                    <td className="px-6 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400">{row.bpm}</td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{row.temp}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${row.status === 'High' ? 'text-rose-500 dark:text-rose-400' : row.status === 'Medium' ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-xs font-bold px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-xs font-bold px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// --- UI Helper Components ---

function FilterLink({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 md:px-6 py-2 rounded-full text-[11px] md:text-xs font-bold transition-all border whitespace-nowrap shrink-0 ${
        active 
          ? 'bg-[#2D5F8B] dark:bg-blue-600 text-white border-[#2D5F8B] dark:border-blue-600 shadow-md' 
          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ icon, value, label, trend, color }) {
  const themes = { 
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', 
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400', 
    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    sky: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
  };
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${themes[color]}`}>{icon}</div>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${themes[color]}`}>{trend}</span>
      </div>
      <div>
        <h4 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h4>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} />
        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      {value && <span className="text-xs font-black text-slate-800 dark:text-slate-200">{value}</span>}
    </div>
  );
}