'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  RiskDonutChart, 
  OveruseComposedChart, 
  BiomechanicalScatterChart, 
  MiniLineChart,
  ActivityDistributionChart,
  ActivityTimelineChart
} from '@/components/HistoryCharts';
import ExportButton from '@/components/ExportButton';
import { 
  Activity, Mountain, ChevronLeft, ChevronRight, User, AlertTriangle, Zap, Users, Thermometer, Target, Clock, ActivitySquare, Calendar
} from 'lucide-react';
import { calculateAge } from '@/lib/utils';

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
    router.push(`/clinician/${clinicianId}/analytics?patientId=${patientId}&period=${newPeriod}`);
    setCurrentPage(1); 
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sDate = formData.get('start');
    const eDate = formData.get('end');
    if (sDate && eDate) {
      router.push(`/clinician/${clinicianId}/analytics?patientId=${patientId}&start=${sDate}&end=${eDate}`);
      setCurrentPage(1);
    }
  };

  // PATIENT SELECTION SCREEN
  if (!patientData) {
    return (
      <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-slate-800 antialiased p-3 md:p-5">
        <div className="mx-auto w-full max-w-[1400px]">
          <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h1 className="-mt-4 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">Select a Patient</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Choose a patient to view their biomechanical analytics.</p>
            </div>
            <button 
              onClick={() => router.push(`/clinician/${clinicianId}/dashboard`)}
              className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm w-full md:w-auto"
            >
              <ChevronLeft size={14} /> Back to Dashboard
            </button>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {allPatients?.map(p => (
              <div 
                key={p.id} 
                onClick={() => router.push(`/clinician/${clinicianId}/analytics?patientId=${p.id}&period=24h`)} 
                className="cursor-pointer group bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-sm">
                    {p.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${p.oaDiagnosis ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {p.oaDiagnosis ? 'Knee OA' : 'Healthy'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{p.fullName}</h3>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                  <span className="font-semibold">Age: {calculateAge(p.dateOfBirth)}</span>
                  <span className="truncate max-w-[100px] font-mono text-[9px]">{p.mrn || 'No MRN'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- DATA PROCESSING ---
  const timeOpts = { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' };
  const dateOpts = { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

  // 1. Existing Physiological & Biomechanical Data
  const formattedChartData = chartData?.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString('en-US', timeOpts),
    risk: d.risk,
    angle: d.angle,
    force: d.force,
    skinTemp: d.skinTemp,
    bpm: d.bpm,
    aiState: d.aiState 
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
  
  // ==========================================
  // AI STATE DATA TRANSFORMATION
  // ==========================================
  
  // Transform data for the Donut Chart (Totals)
  const aiStateCounts = {};
  rawLogs?.forEach(log => {
    const state = log.aiState || 'UNKNOWN';
    aiStateCounts[state] = (aiStateCounts[state] || 0) + 1;
  });
  
  const formattedActivityDistributionData = Object.keys(aiStateCounts).map(state => ({
    state: state,
    count: aiStateCounts[state]
  }));

  // Transform data for the Timeline Bar Chart (Over time)
  const timelineBuckets = {};
  rawLogs?.forEach(log => {
    const timeKey = new Date(log.timestamp).toLocaleTimeString('en-US', timeOpts);
    const state = log.aiState || 'UNKNOWN';

    if (!timelineBuckets[timeKey]) {
      timelineBuckets[timeKey] = { time: timeKey };
    }
    
    // Increment the count for this specific state at this specific time
    timelineBuckets[timeKey][state] = (timelineBuckets[timeKey][state] || 0) + 1;
  });
  
  const formattedActivityTimelineData = Object.values(timelineBuckets);

  // ==========================================

  const totalLogsCount = rawLogs?.length || 0;
  const totalPages = Math.ceil(totalLogsCount / itemsPerPage);
  const paginatedLogs = rawLogs?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  const tableRows = paginatedLogs.map(log => ({
    time: new Date(log.timestamp).toLocaleString('en-US', dateOpts),
    score: log.riskScore,
    angle: `${log.angle?.toFixed(1) || 0}°`,
    force: `${log.force} N`,
    bpm: log.bpm && log.bpm > 0 ? `${log.bpm} bpm` : '--',
    temp: `${log.skinTemp?.toFixed(1) || 0}°C`,
    status: log.riskScore > 70 ? 'High' : log.riskScore > 40 ? 'Medium' : 'Low',
    activity: log.aiState?.replace('_', ' ') || 'Unknown'
  }));
  
  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-slate-800 antialiased overflow-x-hidden p-3 md:p-5">
      <div className="mx-auto w-full max-w-[1400px]">
        
        {/* HEADER */}
        <header className="mb-4 -mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-lg border border-blue-100 dark:border-blue-500/20 shrink-0">
              {patientData.initials}
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {patientData.name} 
                <span className="text-[9px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                  {patientData.mrn || 'No MRN'}
                </span>
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{patientData.diagnosis} • {patientData.history}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => router.push(`/clinician/${clinicianId}/analytics`)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm whitespace-nowrap transition-colors"
            >
               Switch Patient
            </button>
            <div className="flex-1 md:flex-none">
              <ExportButton logs={rawLogs} 
                patientName={patientData.name} 
                mrn={patientData.mrn} 
                riskThreshold={patientData.riskThreshold}
              />
            </div>
          </div>
        </header>

        {/* DATE FILTERS */}
        <div className="mb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 mt-2">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 snap-x touch-pan-x min-w-0 no-scrollbar">
            <FilterLink label="24 Hours" active={activePeriod === '24h' && !start} onClick={() => handlePeriodChange('24h')} />
            <FilterLink label="7 Days" active={activePeriod === '7d' && !start} onClick={() => handlePeriodChange('7d')} />
            <FilterLink label="30 Days" active={activePeriod === '30d' && !start} onClick={() => handlePeriodChange('30d')} />
          </nav>

          <form onSubmit={handleCustomDateSubmit} className="flex flex-col sm:flex-row w-full xl:w-fit items-stretch sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg md:rounded-full border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between sm:justify-start gap-1.5 px-1 w-full sm:w-auto">
              <Calendar size={12} className="text-slate-400 dark:text-slate-500 shrink-0 hidden sm:block" />
              <input type="date" name="start" required defaultValue={start} className="text-[11px] text-slate-600 dark:text-slate-300 bg-transparent outline-none cursor-pointer w-full sm:w-auto dark:[color-scheme:dark]" />
              <span className="text-slate-300 dark:text-slate-600 text-[10px] font-bold shrink-0">to</span>
              <input type="date" name="end" required defaultValue={end} className="text-[11px] text-slate-600 dark:text-slate-300 bg-transparent outline-none cursor-pointer w-full sm:w-auto dark:[color-scheme:dark]" />
            </div>
            <button type="submit" className="bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md md:rounded-full hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shrink-0 w-full sm:w-auto text-center">
              Apply Filter
            </button>
          </form>
        </div>

        {/* ROW 1: PRIMARY KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <StatCard icon={<Target size={16} />} value={patientData.avgRisk} label="Avg Risk Score" trend={patientData.avgRisk > 50 ? "Elevated" : "Normal"} color={patientData.avgRisk > 50 ? "amber" : "emerald"} />
          <StatCard icon={<AlertTriangle size={16} />} value={highRiskLogsCount} label="High Risk Events" trend="Action Required" color={highRiskLogsCount > 0 ? "rose" : "slate"} />
          <StatCard icon={<Mountain size={16} />} value={`${maxFlexion}°`} label="Max Flexion (ROM)" trend="Stiffness Check" color="blue" />
          <StatCard icon={<Clock size={16} />} value={`${complianceHours} hrs`} label="Device Wear Time" trend="Compliance" color="sky" />
        </section>

        {/* ROW 2: THE BIG PICTURE */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          {/* Left: Risk Distribution */}
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm lg:col-span-1 flex flex-col">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
              <ActivitySquare size={14} className="text-slate-400 dark:text-slate-500" /> Zone Distribution
            </h3>
            <div className="flex-1 relative min-h-[160px]">
              <RiskDonutChart data={distributionData} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{complianceHours}</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Readings</span>
              </div>
            </div>
            <div className="flex justify-between mt-3 border-t border-slate-50 dark:border-slate-800/50 pt-3">
               <LegendItem color="bg-emerald-500" label="Safe" value={`${Math.round((safeCount/complianceHours)*100 || 0)}%`} />
               <LegendItem color="bg-amber-500" label="Warn" value={`${Math.round((warningCount/complianceHours)*100 || 0)}%`} />
               <LegendItem color="bg-rose-500" label="Crit" value={`${Math.round((criticalCount/complianceHours)*100 || 0)}%`} />
            </div>
          </div>

          {/* Right: Overuse Overlay (Risk + Force) */}
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Activity size={14} className="text-slate-400 dark:text-slate-500" /> Overuse Overlay (Load vs Risk)
              </h3>
              <div className="flex gap-3">
                <LegendItem color="bg-sky-500" label="Force (N)" />
                <LegendItem color="bg-amber-500" label="Risk Score" />
              </div>
            </div>
            <div className="flex-1 min-h-[180px]">
               <OveruseComposedChart data={formattedChartData} /> 
            </div>
          </div>
        </section>

        {/* ROW 3: AI STATE ACTIVITY ANALYSIS (WITH FIXED HEIGHTS) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          {/* Left: Activity Distribution */}
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm lg:col-span-1 flex flex-col">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Zap size={14} className="text-slate-400 dark:text-slate-500" /> Detected Activity
            </h3>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mb-3">Breakdown of patient movement states.</p>
            {/* FIXED HEIGHT CONTAINER */}
            <div className="h-[250px] w-full relative">
              <ActivityDistributionChart data={formattedActivityDistributionData} />
            </div>
          </div>

          {/* Right: Activity Timeline */}
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm lg:col-span-2 flex flex-col">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400 dark:text-slate-500" /> Activity Timeline
            </h3>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mb-3">Frequency of specific activities mapped over the selected period.</p>
            {/* FIXED HEIGHT CONTAINER */}
            <div className="h-[250px] w-full relative">
               <ActivityTimelineChart data={formattedActivityTimelineData} />
            </div>
          </div>
        </section>

        {/* ROW 4: BIOMECHANICAL & PHYSIOLOGICAL DEEP DIVE */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          {/* Scatter Plot */}
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Target size={14} className="text-slate-400 dark:text-slate-500" /> Biomechanics (Flexion vs Load)
              </h3>
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mb-3">Are high risk events occurring during deep knee bending?</p>
            <div className="h-40 w-full">
               <BiomechanicalScatterChart data={formattedChartData} />
            </div>
          </div>

          {/* Temp Chart */}
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Thermometer size={14} className="text-slate-400 dark:text-slate-500" /> Joint Inflammation Indicator
            </h3>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mb-3">Localized skin temperature trends indicating potential flare-ups.</p>
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-1.5 min-h-[120px]">
               <MiniLineChart data={skinTempData} stroke="#f43f5e" unit="°C" />
            </div>
          </div>
        </section>

        {/* ROW 5: DETAILED LOGS */}
        <section className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="border-b border-slate-50 dark:border-slate-800 p-3 flex justify-between items-center">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">Raw Telemetry Auditing</h3>
            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">Showing {tableRows.length} of {totalLogsCount}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                <tr>
                  {['Time', 'Activity', 'Risk Score', 'Flexion', 'Load', 'Heart Rate', 'Skin Temp', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {tableRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.time}</td>
                    <td className="px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 capitalize">{row.activity.toLowerCase()}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{row.score}</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.angle}</td>
                    <td className="px-4 py-2.5 text-[11px] text-sky-600 dark:text-sky-400 font-semibold">{row.force}</td>
                    <td className="px-4 py-2.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{row.bpm}</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.temp}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${row.status === 'High' ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400' : row.status === 'Medium' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
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
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-3 flex items-center justify-between">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-[10px] font-bold px-3 py-1.5 rounded-md border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-[10px] font-bold px-3 py-1.5 rounded-md border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-[11px] font-bold transition-all border whitespace-nowrap shrink-0 ${
        active 
          ? 'bg-[#2D5F8B] dark:bg-blue-600 text-white border-[#2D5F8B] dark:border-blue-600 shadow-sm' 
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
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 md:p-4 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-start mb-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${themes[color]}`}>{icon}</div>
        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${themes[color]}`}>{trend}</span>
      </div>
      <div>
        <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{value}</h4>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label, value }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1.5">
        <div className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
        <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      {value && <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{value}</span>}
    </div>
  );
}