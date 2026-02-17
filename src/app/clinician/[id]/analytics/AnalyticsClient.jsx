'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HistoryCharts, { MiniLineChart, MiniAreaChart } from '@/components/HistoryCharts';
import ExportButton from '@/components/ExportButton';
import { 
  Activity, Mountain, ChevronLeft, ChevronRight, User, AlertTriangle, Zap, Users
} from 'lucide-react';

const Breadcrumb = ({ items }) => (
  <nav className="flex items-center space-x-2 mb-6 text-sm font-medium">
    {items.map((item, index) => (
      <div key={index} className="flex items-center">
        {index > 0 && <span className="text-slate-300 dark:text-slate-600 mx-2">/</span>}
        <span className={index === items.length - 1 ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-blue-600 dark:text-blue-500'}>
          {item}
        </span>
      </div>
    ))}
  </nav>
);

export default function AnalyticsClient({ clinicianId, patientData, chartData, rawLogs, allPatients }) {
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState("24h");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // INTERCEPTOR: IF NO PATIENT IS SELECTED, SHOW THE PATIENT SELECTION SCREEN
  if (!patientData) {
    return (
      <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-slate-800 antialiased p-4 md:p-8">
        <div className="mx-auto w-full max-w-5xl">
          
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Select a Patient</h1>
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
                onClick={() => router.push(`/clinician/${clinicianId}/analytics?patientId=${p.id}`)} 
                className="cursor-pointer group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300"
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
            
            {(!allPatients || allPatients.length === 0) && (
              <div className="col-span-full p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <Users size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Patients Found</h3>
                <p className="text-slate-500 dark:text-slate-500 font-medium mt-1">There are no patients registered in the system yet.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // MAIN DASHBOARD (Only renders if a patientId is in the URL)
  // Format data for Recharts
  const formattedChartData = chartData?.map(d => ({
    time: `${d.hour}:00`,
    score: d.risk,
    angle: d.angle,
    force: d.force
  })) || [];

  const angleData = formattedChartData.map(d => ({ time: d.time, val: d.angle }));
  const forceData = formattedChartData.map(d => ({ time: d.time, val: d.force }));

  // Metrics
  const hasData = formattedChartData.length > 0;
  const avgAngle = hasData ? Math.round(formattedChartData.reduce((acc, p) => acc + p.angle, 0) / formattedChartData.length) : 0;
  const avgForce = hasData ? Math.round(formattedChartData.reduce((acc, p) => acc + p.force, 0) / formattedChartData.length) : 0;
  const highRiskCount = formattedChartData.filter(d => d.score >= 70).length;

  // Pagination Logic for Detailed Logs
  const totalLogsCount = rawLogs?.length || 0;
  const totalPages = Math.ceil(totalLogsCount / itemsPerPage);
  const paginatedLogs = rawLogs?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  const tableRows = paginatedLogs.map(log => ({
    time: new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    score: log.riskScore,
    angle: `${log.angle?.toFixed(1) || 0}°`,
    bpm: log.bpm && log.bpm > 0 ? `${log.bpm} bpm` : '--',
    temp: `${log.skinTemp?.toFixed(1) || 0}°C`,
    status: log.riskScore > 70 ? 'High' : log.riskScore > 40 ? 'Medium' : 'Low'
  }));
  
  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-slate-800 antialiased overflow-x-hidden p-4 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        
        {/* Header Section */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Patient Data Analysis</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deep dive into patient biomechanics and risk patterns</p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:items-center">
            {/* The back button now removes the ?patientId query, returning them to the selection grid */}
            <button 
              onClick={() => router.push(`/clinician/${clinicianId}/analytics`)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] md:text-xs font-bold uppercase tracking-wider px-4 py-2.5 md:px-6 md:py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap"
            >
              <Users size={16} /> Switch Patient
            </button>
            <div className="w-full sm:w-auto">
               <ExportButton logs={rawLogs} patientName={patientData?.name || 'Patient'} className="w-full sm:w-auto md:px-6 md:py-3" />
            </div>
          </div>
        </header>

        {/* Patient Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-8 transition-colors duration-300">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
              <User size={32} />
            </div>
            
            <div className="flex-1 w-full overflow-hidden">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{patientData?.name || 'Unknown Patient'}</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">ID</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{patientData?.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Age</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{patientData?.age}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Diagnosis</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{patientData?.diagnosis}</span>
                </div>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{patientData?.history}</p>
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <nav className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 min-w-0 w-full sm:w-auto">
            <FilterLink label="24 Hours" active={activePeriod === '24h'} onClick={() => setActivePeriod('24h')} />
            <FilterLink label="7 Days" active={activePeriod === '7d'} onClick={() => setActivePeriod('7d')} />
            <FilterLink label="30 Days" active={activePeriod === '30d'} onClick={() => setActivePeriod('30d')} />
          </nav>
        </div>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard icon={<Activity size={18} />} value={patientData?.avgRisk || 0} label="Avg Risk Score" trend={patientData?.avgRisk > 50 ? "High" : "Normal"} color={patientData?.avgRisk > 50 ? "rose" : "emerald"} />
          <StatCard icon={<AlertTriangle size={18} />} value={highRiskCount} label="High Risk Events" trend="Events" color={highRiskCount > 0 ? "rose" : "slate"} />
          <StatCard icon={<Mountain size={18} />} value={`${avgAngle}°`} label="Avg Flexion" trend="Angle" color="blue" />
          <StatCard icon={<Zap size={18} />} value={`${avgForce}N`} label="Avg Force" trend="Load" color="sky" />
        </section>

        {/* Main Trend Chart */}
        <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:p-6 shadow-sm overflow-hidden transition-colors duration-300 mb-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><Activity size={18} /></div>
              <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200">Risk Score Timeline</h3>
            </div>
            <div className="flex gap-4">
              <LegendItem color="bg-rose-500 dark:bg-rose-400" label="Critical Event Marker" />
            </div>
          </div>
          <div className="aspect-[4/3] w-full min-w-0 rounded-2xl border-2 border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900 md:aspect-[4/1]">
             <HistoryCharts data={formattedChartData} /> 
          </div>
        </section>

        {/* Specialized Correlation Mini-Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
           <CorrelationCard title="Knee Flexion Angle" icon={<Mountain size={18} />} color="blue" data={angleData} unit="°" chartType="line" />
           <CorrelationCard title="Compressive Force" icon={<Zap size={18} />} color="sky" data={forceData} unit="N" chartType="area" />
        </div>

        {/* Detailed Logs Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300">
          <div className="border-b border-slate-50 dark:border-slate-800 p-4 md:p-5 flex justify-between items-center">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">Detailed Logs</h3>
            <span className="text-[10px] md:text-xs font-medium text-slate-400 dark:text-slate-500">Showing {tableRows.length} of {totalLogsCount}</span>
          </div>

          {/* MOBILE TABLE VIEW */}
          <div className="block md:hidden divide-y divide-slate-50 dark:divide-slate-800/50">
            {tableRows.map((row, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{row.time}</span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                      row.status === 'High' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                  }`}>
                    {row.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-200">{row.score}</p>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Angle</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{row.angle}</p>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">BPM</p>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{row.bpm}</p>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temp</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{row.temp}</p>
                  </div>
                </div>
              </div>
            ))}
            {tableRows.length === 0 && (
              <div className="p-8 text-center text-sm font-medium text-slate-400">No logs available.</div>
            )}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  {['Time', 'Score', 'Angle', 'Heart Rate', 'Skin Temp', 'Status'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {tableRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.time}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">{row.score}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{row.angle}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-rose-600 dark:text-rose-400">{row.bpm}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{row.temp}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${row.status === 'High' ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tableRows.length === 0 && (
              <div className="p-8 text-center text-sm font-medium text-slate-400">No context logs recorded.</div>
            )}
          </div>

          {/* Table Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 text-xs md:text-sm font-bold px-3 md:px-4 py-2 rounded-lg border ${currentPage === 1 ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 pointer-events-none' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm'}`}
              >
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 text-xs md:text-sm font-bold px-3 md:px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 pointer-events-none' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm'}`}
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// --- Helper Components ---

function FilterLink({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 md:px-6 py-2 rounded-full text-[11px] md:text-xs font-bold transition-all border whitespace-nowrap shrink-0 ${
        active ? 'bg-[#2D5F8B] dark:bg-blue-600 text-white border-[#2D5F8B] dark:border-blue-600 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ icon, value, label, trend, color, className = "" }) {
  const colorStyles = { 
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', 
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400', 
    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    sky: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
  };
  return (
    <div className={`rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:p-6 shadow-sm transition-colors duration-300 ${className}`}>
      <div className="mb-3 flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shrink-0">{icon}</div>
      <div className="flex flex-col gap-1">
        <span className="text-lg md:text-2xl font-black text-slate-900 dark:text-white">{value}</span>
        <span className={`w-fit rounded-md px-1.5 py-0.5 text-[8px] md:text-[9px] font-bold ${colorStyles[color]}`}>{trend}</span>
      </div>
      <p className="mt-1 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">{label}</p>
    </div>
  );
}

function CorrelationCard({ title, icon, color, data, unit, chartType = 'line' }) {
  const themes = { 
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400', stroke: '#3b82f6' }, 
    sky: { bg: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400', stroke: '#0ea5e9' }
  };
  const theme = themes[color] || themes.blue;

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:p-5 shadow-sm min-w-0 transition-colors duration-300">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg md:rounded-xl ${theme.bg}`}>{icon}</div>
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm">{title}</h4>
      </div>
      <div className="h-28 md:h-32 w-full min-w-0 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 p-2">
        {chartType === 'area' ? <MiniAreaChart data={data} stroke={theme.stroke} unit={unit} /> : <MiniLineChart data={data} stroke={theme.stroke} unit={unit} />}
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
      <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}