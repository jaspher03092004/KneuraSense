import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import HistoryCharts, { MiniLineChart, MiniAreaChart, MiniBarChart } from '@/components/HistoryCharts';
import RefreshButton from '@/components/RefreshButton';
import ExportButton from '@/components/ExportButton';
import Link from 'next/link';
import { 
  Bell, Activity, Mountain, Footprints, 
  SearchX, Thermometer, HeartPulse, Wind, 
  ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';

function downsamplePeaks(logs, maxPoints = 100) {
  if (logs.length <= maxPoints) return logs;
  const step = Math.ceil(logs.length / maxPoints);
  const sampled = [];
  
  for (let i = 0; i < logs.length; i += step) {
    const chunk = logs.slice(i, i + step);
    const peakLog = chunk.reduce((prev, current) => 
      (prev.riskScore > current.riskScore) ? prev : current
    );
    sampled.push(peakLog);
  }
  return sampled;
}

export default async function HistoryPage({ params, searchParams }) {
  const { id } = await params;
  
  const { range, start, end, page = "1" } = await searchParams;
  const currentPage = parseInt(page);
  const itemsPerPage = 10; 

  let startDate = new Date();
  let endDate = new Date();
  let rangeLabel = "Last 24 Hours";

  if (start && end) {
    startDate = new Date(start);
    endDate = new Date(end);
    endDate.setHours(23, 59, 59); 
    rangeLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  } else if (range === '7d') {
    startDate.setDate(startDate.getDate() - 7);
    rangeLabel = "Last 7 Days";
  } else if (range === '30d') {
    startDate.setDate(startDate.getDate() - 30);
    rangeLabel = "Last 30 Days";
  } else {
    startDate.setHours(startDate.getHours() - 24); 
  }

  const patientInfo = await prisma.patient.findUnique({
    where: { id },
    select: { 
      id: true,
      mrn: true,
      fullName: true, // Patient model uses fullName
      riskThreshold: true,
      deviceMac: true,
      clinician: {
        select: {
          full_name: true // Clinician model uses full_name!
        }
      }
    }
  });
  if (!patientInfo) redirect('/login');

  const threshold = patientInfo.riskThreshold ?? 75;

  const totalLogsCount = await prisma.sensorLog.count({
    where: { patientId: id, timestamp: { gte: startDate, lte: endDate } }
  });

  const paginatedLogs = await prisma.sensorLog.findMany({
    where: { patientId: id, timestamp: { gte: startDate, lte: endDate } },
    orderBy: { timestamp: 'desc' },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
  });

  const rawChartLogs = await prisma.sensorLog.findMany({
    where: { patientId: id, timestamp: { gte: startDate, lte: endDate } },
    orderBy: { timestamp: 'asc' }, 
  });

  const hasData = totalLogsCount > 0;
  const totalPages = Math.ceil(totalLogsCount / itemsPerPage);

  const avgRisk = hasData ? Math.round(rawChartLogs.reduce((acc, log) => acc + log.riskScore, 0) / totalLogsCount) : 0;
  const highRiskCount = rawChartLogs.filter(log => log.riskScore >= threshold).length;
  const avgTemp = hasData ? (rawChartLogs.reduce((acc, log) => acc + log.skinTemp, 0) / totalLogsCount).toFixed(1) : 0;
  
  const validBPMLogs = rawChartLogs.filter(log => log.bpm && log.bpm > 0);
  const avgBPM = validBPMLogs.length > 0 ? Math.round(validBPMLogs.reduce((acc, log) => acc + log.bpm, 0) / validBPMLogs.length) : 0;

  const safeChartLogs = downsamplePeaks(rawChartLogs, 100);

  // Helper for consistent PHT formatting
  const timeOpts = { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' };
  const dateOpts = { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

  const chartData = safeChartLogs.map(log => ({
    time: log.timestamp.toLocaleTimeString('en-US', timeOpts),
    score: log.riskScore,
    angle: log.angle,
    force: log.force,
  }));

  const terrainData = safeChartLogs.map(log => ({ 
    time: log.timestamp.toLocaleTimeString('en-US', timeOpts), val: log.angle 
  }));
  const envData = safeChartLogs.map(log => ({ 
    time: log.timestamp.toLocaleTimeString('en-US', timeOpts), val: log.skinTemp 
  }));
  const bpmData = safeChartLogs.map(log => ({ 
    time: log.timestamp.toLocaleTimeString('en-US', timeOpts), val: log.bpm || 0 
  }));
  const pressureData = safeChartLogs.map(log => ({ 
    time: log.timestamp.toLocaleTimeString('en-US', timeOpts), val: log.pressure || 0 
  }));

  const tableRows = paginatedLogs.map(log => ({
    time: log.timestamp.toLocaleString('en-US', dateOpts),
    score: log.riskScore,
    angle: `${log.angle.toFixed(1)}°`,
    bpm: log.bpm && log.bpm > 0 ? `${log.bpm} bpm` : '--',
    temp: `${log.skinTemp.toFixed(1)}°C`,
    status: log.riskScore >= threshold ? 'High' : log.riskScore >= (threshold - 15) ? 'Medium' : 'Low'
  }));

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-slate-800 antialiased overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1400px] px-3 py-4 md:p-5">
        
        {/* Header */}
        <header className="-mt-4 mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl flex items-center gap-3">
              History & Trends
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 align-middle">
                {patientInfo.mrn || 'No MRN'}
              </span>
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{patientInfo.fullName} • {rangeLabel}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center">
             <div className="w-full"><RefreshButton className="w-full" /></div>
             <ExportButton 
                logs={rawChartLogs} 
                patientName={patientInfo?.fullName} 
                mrn={patientInfo?.mrn}
                deviceMac={patientInfo?.deviceMac || "Not Assigned"} 
                clinicianName={patientInfo?.clinician?.full_name ? `Dr. ${patientInfo.clinician.full_name}` : "Not Assigned"} 
                riskThreshold={threshold}
                className="w-full" 
              />
          </div>
        </header>

        {/* Navigation & Custom Date Form */}
        <div className="mb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <nav className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 snap-x touch-pan-x min-w-0">
            <FilterLink label="24 Hours" active={!range && !start} href={`/patient/${id}/history`} />
            <FilterLink label="7 Days" active={range === '7d'} href={`/patient/${id}/history?range=7d`} />
            <FilterLink label="30 Days" active={range === '30d'} href={`/patient/${id}/history?range=30d`} />
          </nav>

          <form method="GET" action={`/patient/${id}/history`} className="flex flex-col sm:flex-row w-full xl:w-fit items-stretch sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl md:rounded-full border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between sm:justify-start gap-2 px-1 w-full sm:w-auto">
              <Calendar size={14} className="text-slate-400 dark:text-slate-500 shrink-0 hidden sm:block" />
              <input type="date" name="start" required defaultValue={start || ''} className="text-[13px] text-slate-600 dark:text-slate-300 bg-transparent outline-none cursor-pointer w-full sm:w-auto dark:[color-scheme:dark]" />
              <span className="text-slate-300 dark:text-slate-600 text-xs font-bold shrink-0">to</span>
              <input type="date" name="end" required defaultValue={end || ''} className="text-[13px] text-slate-600 dark:text-slate-300 bg-transparent outline-none cursor-pointer w-full sm:w-auto dark:[color-scheme:dark]" />
            </div>
            <button type="submit" className="bg-slate-900 dark:bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl md:rounded-full hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shrink-0 w-full sm:w-auto text-center">
              Apply Filter
            </button>
          </form>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-600 mb-4"><SearchX size={40} strokeWidth={1.5} /></div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 text-center">No History Available</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium text-center px-4">Try adjusting your date range.</p>
          </div>
        ) : (
          <div className="space-y-3">
            
            {/* Stats Grid */}
            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
              <StatCard icon={<Activity size={18} />} value={avgRisk} label="Avg Risk" trend={avgRisk > 50 ? "High" : "Normal"} color={avgRisk > 50 ? "rose" : "emerald"} />
              <StatCard icon={<Bell size={18} />} value={highRiskCount} label="High Risks" trend="Events" color={highRiskCount > 0 ? "rose" : "slate"} />
              <StatCard icon={<HeartPulse size={18} />} value={avgBPM} label="Avg BPM" trend="Pulse" color="rose" />
              <StatCard icon={<Thermometer size={18} />} value={avgTemp} label="Avg Temp" trend="°C" color="emerald" />
              <StatCard icon={<Footprints size={18} />} value={totalLogsCount} label="Total Logs" trend="Readings" color="slate" className="col-span-2 sm:col-span-1" />
            </section>

            {/* Main Trend Chart */}
            <section className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 md:p-4 shadow-sm overflow-hidden transition-colors duration-300">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><Activity size={16} /></div>
                  <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">Risk Score Trend</h3>
                </div>
                <div className="flex gap-3">
                  <LegendItem color="bg-rose-500 dark:bg-rose-400" label="Critical Event Marker" />
                </div>
              </div>
              <div className="aspect-[4/3] w-full min-w-0 rounded-lg border-2 border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900 md:aspect-[5/1]">
                 <HistoryCharts data={chartData} riskThreshold={threshold} />
              </div>
            </section>

            {/* Specialized Correlation Mini-Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
               <CorrelationCard title="Knee Flexion" icon={<Mountain size={16} />} color="blue" data={terrainData} unit="°" chartType="line" />
               <CorrelationCard title="Heart Rate" icon={<HeartPulse size={16} />} color="rose" data={bpmData} unit=" bpm" chartType="area" />
               <CorrelationCard title="Skin Temp" icon={<Thermometer size={16} />} color="sky" data={envData} unit="°C" chartType="line" />
               <CorrelationCard title="Atmos Pressure" icon={<Wind size={16} />} color="slate" data={pressureData} unit=" hPa" chartType="bar" />
            </div>

            {/* Paginated Logs Table */}
            <section className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300">
              <div className="border-b border-slate-50 dark:border-slate-800 p-3 md:p-4 flex justify-between items-center">
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">Detailed Logs</h3>
                <span className="text-[10px] md:text-xs font-medium text-slate-400 dark:text-slate-500">Showing {tableRows.length} of {totalLogsCount}</span>
              </div>

              {/* MOBILE TABLE VIEW */}
              <div className="block md:hidden divide-y divide-slate-50 dark:divide-slate-800/50">
                {tableRows.map((row, i) => (
                  <div key={i} className="p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{row.time}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                          row.status === 'High' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                      }`}>
                        {row.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded-lg">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                        <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-200">{row.score}</p>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded-lg">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Angle</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{row.angle}</p>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded-lg">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">BPM</p>
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{row.bpm}</p>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded-lg">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temp</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{row.temp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                    <tr>
                      {['Time', 'Score', 'Angle', 'Heart Rate', 'Skin Temp', 'Status'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {tableRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.time}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">{row.score}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400">{row.angle}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400">{row.bpm}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400">{row.temp}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${row.status === 'High' ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-3 flex items-center justify-between">
                  <Link 
                    href={`/patient/${id}/history?page=${currentPage > 1 ? currentPage - 1 : 1}${start ? `&start=${start}&end=${end}` : ''}${range ? `&range=${range}` : ''}`}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border ${currentPage === 1 ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 pointer-events-none' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm'}`}
                  >
                    <ChevronLeft size={14} /> <span className="hidden sm:inline">Prev</span>
                  </Link>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                  <Link 
                    href={`/patient/${id}/history?page=${currentPage < totalPages ? currentPage + 1 : totalPages}${start ? `&start=${start}&end=${end}` : ''}${range ? `&range=${range}` : ''}`}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border ${currentPage === totalPages ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 pointer-events-none' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm'}`}
                  >
                    <span className="hidden sm:inline">Next</span> <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  );
}

function FilterLink({ label, active, href }) {
  return (
    <Link href={href} className={`px-3 md:px-5 py-1.5 rounded-full text-[11px] md:text-xs font-bold transition-all border whitespace-nowrap shrink-0 ${
      active ? 'bg-[#2D5F8B] dark:bg-blue-600 text-white border-[#2D5F8B] dark:border-blue-600 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
    }`}>
      {label}
    </Link>
  );
}

function StatCard({ icon, value, label, trend, color, className = "" }) {
  const colorStyles = { 
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', 
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400', 
    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
  };
  return (
    <div className={`rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 md:p-4 shadow-sm transition-colors duration-300 ${className}`}>
      <div className="mb-2 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shrink-0">{icon}</div>
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
    sky: { bg: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400', stroke: '#0ea5e9' }, 
    rose: { bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400', stroke: '#f43f5e' }, 
    slate: { bg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400', stroke: '#64748b' }
  };
  const theme = themes[color] || themes.blue;

  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 md:p-4 shadow-sm min-w-0 transition-colors duration-300">
      <div className="mb-2.5 flex items-center gap-2">
        <div className={`flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-lg md:rounded-xl ${theme.bg}`}>{icon}</div>
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm">{title}</h4>
      </div>
      <div className="h-24 md:h-28 w-full min-w-0 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 p-2">
        {chartType === 'area' ? <MiniAreaChart data={data} stroke={theme.stroke} unit={unit} /> : chartType === 'bar' ? <MiniBarChart data={data} stroke={theme.stroke} unit={unit} /> : <MiniLineChart data={data} stroke={theme.stroke} unit={unit} />}
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