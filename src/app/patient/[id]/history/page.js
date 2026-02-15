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

// --- ALGORITHM: Peak-Preserving Aggregation ---
// Condenses massive arrays into max 100 points while keeping critical spikes
function downsamplePeaks(logs, maxPoints = 100) {
  if (logs.length <= maxPoints) return logs;
  const step = Math.ceil(logs.length / maxPoints);
  const sampled = [];
  
  for (let i = 0; i < logs.length; i += step) {
    const chunk = logs.slice(i, i + step);
    // Find the log with the highest risk score in this time chunk
    const peakLog = chunk.reduce((prev, current) => 
      (prev.riskScore > current.riskScore) ? prev : current
    );
    sampled.push(peakLog);
  }
  return sampled;
}

export default async function HistoryPage({ params, searchParams }) {
  const { id } = await params;
  
  // Parse URL Parameters for Pagination and Custom Dates
  const { range, start, end, page = "1" } = await searchParams;
  const currentPage = parseInt(page);
  const itemsPerPage = 10; // Show 10 logs per table page

  // 1. Define the Time Window
  let startDate = new Date();
  let endDate = new Date();
  let rangeLabel = "Last 24 Hours";

  if (start && end) {
    startDate = new Date(start);
    endDate = new Date(end);
    endDate.setHours(23, 59, 59); // End of the selected day
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

  // 2. Fetch Aggregated Stats & Total Count (For Pagination)
  const patientInfo = await prisma.patient.findUnique({
    where: { id },
    select: { fullName: true }
  });
  if (!patientInfo) redirect('/login');

  const totalLogsCount = await prisma.sensorLog.count({
    where: { patientId: id, timestamp: { gte: startDate, lte: endDate } }
  });

  // Fetch only the logs needed for the current table page
  const paginatedLogs = await prisma.sensorLog.findMany({
    where: { patientId: id, timestamp: { gte: startDate, lte: endDate } },
    orderBy: { timestamp: 'desc' },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
  });

  // Fetch raw logs for the charts (downsampled for performance)
  const rawChartLogs = await prisma.sensorLog.findMany({
    where: { patientId: id, timestamp: { gte: startDate, lte: endDate } },
    orderBy: { timestamp: 'asc' }, // Ascending for charts
  });

  const hasData = totalLogsCount > 0;
  const totalPages = Math.ceil(totalLogsCount / itemsPerPage);

  // 3. Prepare Data for UI
  const avgRisk = hasData ? Math.round(rawChartLogs.reduce((acc, log) => acc + log.riskScore, 0) / totalLogsCount) : 0;
  const highRiskCount = rawChartLogs.filter(log => log.riskScore > 70).length;
  const avgTemp = hasData ? (rawChartLogs.reduce((acc, log) => acc + log.skinTemp, 0) / totalLogsCount).toFixed(1) : 0;
  
  const validBPMLogs = rawChartLogs.filter(log => log.bpm && log.bpm > 0);
  const avgBPM = validBPMLogs.length > 0 ? Math.round(validBPMLogs.reduce((acc, log) => acc + log.bpm, 0) / validBPMLogs.length) : 0;

  // Apply Data Aggregation for safe chart rendering
  const safeChartLogs = downsamplePeaks(rawChartLogs, 100);

  // Main Chart Data (Now includes angle and force for the tooltip!)
  const chartData = safeChartLogs.map(log => ({
    time: log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: log.riskScore,
    angle: log.angle,
    force: log.force,
  }));

  // --- SYNCHRONIZED MINI-CHART DATA ---
  // Using safeChartLogs so the mini-charts perfectly match the main chart's timeline
  const terrainData = safeChartLogs.map(log => ({ 
    time: log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
    val: log.angle 
  }));
  const envData = safeChartLogs.map(log => ({ 
    time: log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
    val: log.skinTemp 
  }));
  const bpmData = safeChartLogs.map(log => ({ 
    time: log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
    val: log.bpm || 0 
  }));
  const pressureData = safeChartLogs.map(log => ({ 
    time: log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
    val: log.pressure || 0 
  }));

  // Map the paginated table rows
  const tableRows = paginatedLogs.map(log => ({
    time: log.timestamp.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    score: log.riskScore,
    angle: `${log.angle.toFixed(1)}°`,
    bpm: log.bpm && log.bpm > 0 ? `${log.bpm} bpm` : '--',
    temp: `${log.skinTemp.toFixed(1)}°C`,
    status: log.riskScore > 70 ? 'High' : log.riskScore > 40 ? 'Medium' : 'Low'
  }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:p-8">
        
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">History & Trends</h1>
            <p className="text-sm font-medium text-slate-500">{patientInfo.fullName} • {rangeLabel}</p>
          </div>
          <div className="flex items-center gap-2">
             <RefreshButton className="flex-1 md:flex-none" />
             <ExportButton logs={rawChartLogs} patientName={patientInfo.fullName} />
          </div>
        </header>

        {/* Navigation & Custom Date Form */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <nav className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar snap-x touch-pan-x">
            <FilterLink label="24 Hours" active={!range && !start} href={`/patient/${id}/history`} />
            <FilterLink label="7 Days" active={range === '7d'} href={`/patient/${id}/history?range=7d`} />
            <FilterLink label="30 Days" active={range === '30d'} href={`/patient/${id}/history?range=30d`} />
          </nav>

          {/* Native HTML Form for Custom Dates (Updates URL parameters) */}
          <form method="GET" action={`/patient/${id}/history`} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm w-fit">
            <Calendar size={14} className="text-slate-400" />
            <input type="date" name="start" required defaultValue={start || ''} className="text-xs text-slate-600 bg-transparent outline-none cursor-pointer" />
            <span className="text-slate-300 text-xs font-bold">to</span>
            <input type="date" name="end" required defaultValue={end || ''} className="text-xs text-slate-600 bg-transparent outline-none cursor-pointer" />
            <button type="submit" className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors">
              Apply
            </button>
          </form>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
            <div className="p-5 bg-slate-50 rounded-full text-slate-300 mb-4"><SearchX size={48} strokeWidth={1.5} /></div>
            <h2 className="text-xl font-bold text-slate-800">No History Available</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Try adjusting your date range.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Stats Grid */}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
              <StatCard icon={<Activity size={18} />} value={avgRisk} label="Avg Risk" trend={avgRisk > 50 ? "High" : "Normal"} color={avgRisk > 50 ? "rose" : "emerald"} />
              <StatCard icon={<Bell size={18} />} value={highRiskCount} label="High Risks" trend="Events" color={highRiskCount > 0 ? "rose" : "slate"} />
              <StatCard icon={<HeartPulse size={18} />} value={avgBPM} label="Avg BPM" trend="Pulse" color="rose" />
              <StatCard icon={<Thermometer size={18} />} value={avgTemp} label="Avg Temp" trend="°C" color="emerald" />
              <StatCard icon={<Footprints size={18} />} value={totalLogsCount} label="Total Logs" trend="Readings" color="slate" />
            </section>

            {/* Main Trend Chart */}
            <section className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600"><Activity size={18} /></div>
                  <h3 className="text-lg font-bold text-slate-800">Risk Score Trend</h3>
                </div>
                <div className="hidden sm:flex gap-4">
                  <LegendItem color="bg-rose-500" label="Critical Event Marker" />
                </div>
              </div>
              <div className="aspect-[2/1] w-full rounded-2xl border-2 border-slate-50 bg-white md:aspect-[4/1]">
                 <HistoryCharts data={chartData} /> 
              </div>
            </section>

            {/* Specialized Correlation Mini-Charts */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
               <CorrelationCard title="Terrain (Angle)" icon={<Mountain size={18} />} color="blue" data={terrainData} unit="°" chartType="line" />
               <CorrelationCard title="Heart Rate" icon={<HeartPulse size={18} />} color="rose" data={bpmData} unit=" bpm" chartType="area" />
               <CorrelationCard title="Skin Temp" icon={<Thermometer size={18} />} color="sky" data={envData} unit="°C" chartType="line" />
               <CorrelationCard title="Atmos Pressure" icon={<Wind size={18} />} color="slate" data={pressureData} unit=" hPa" chartType="bar" />
            </div>

            {/* Paginated Logs Table */}
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-50 p-5 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-800">Detailed Logs</h3>
                <span className="text-xs font-medium text-slate-400">Showing {tableRows.length} of {totalLogsCount}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr>
                      {['Time', 'Score', 'Angle', 'Heart Rate', 'Skin Temp', 'Status'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tableRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap">{row.time}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{row.score}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{row.angle}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-rose-600">{row.bpm}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{row.temp}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${row.status === 'High' ? 'text-rose-500' : 'text-emerald-500'}`}>
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
                <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex items-center justify-between">
                  <Link 
                    href={`/patient/${id}/history?page=${currentPage > 1 ? currentPage - 1 : 1}${start ? `&start=${start}&end=${end}` : ''}${range ? `&range=${range}` : ''}`}
                    className={`flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-lg border ${currentPage === 1 ? 'text-slate-300 border-slate-200 pointer-events-none' : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-100 shadow-sm'}`}
                  >
                    <ChevronLeft size={16} /> Previous
                  </Link>
                  <span className="text-xs font-bold text-slate-500">Page {currentPage} of {totalPages}</span>
                  <Link 
                    href={`/patient/${id}/history?page=${currentPage < totalPages ? currentPage + 1 : totalPages}${start ? `&start=${start}&end=${end}` : ''}${range ? `&range=${range}` : ''}`}
                    className={`flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'text-slate-300 border-slate-200 pointer-events-none' : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-100 shadow-sm'}`}
                  >
                    Next <ChevronRight size={16} />
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

// --- Helper Components ---
function FilterLink({ label, active, href }) {
  return (
    <Link href={href} className={`px-6 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap snap-center ${
      active ? 'bg-[#2D5F8B] text-white border-[#2D5F8B] shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
    }`}>
      {label}
    </Link>
  );
}

function StatCard({ icon, value, label, trend, color }) {
  const colorStyles = { emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600', slate: 'bg-slate-50 text-slate-500' };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">{icon}</div>
      <div className="flex flex-col gap-1">
        <span className="text-xl font-black text-slate-900 md:text-2xl">{value}</span>
        <span className={`w-fit rounded-md px-1.5 py-0.5 text-[9px] font-bold ${colorStyles[color]}`}>{trend}</span>
      </div>
      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}

function CorrelationCard({ title, icon, color, data, unit, chartType = 'line' }) {
  const themes = { blue: { bg: 'bg-blue-50 text-blue-600', stroke: '#3b82f6' }, sky: { bg: 'bg-sky-50 text-sky-600', stroke: '#0ea5e9' }, rose: { bg: 'bg-rose-50 text-rose-600', stroke: '#f43f5e' }, slate: { bg: 'bg-slate-50 text-slate-600', stroke: '#64748b' }};
  const theme = themes[color] || themes.blue;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.bg}`}>{icon}</div>
        <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
      </div>
      <div className="h-32 w-full rounded-2xl bg-slate-50/50 p-2">
        {chartType === 'area' ? <MiniAreaChart data={data} stroke={theme.stroke} unit={unit} /> : chartType === 'bar' ? <MiniBarChart data={data} stroke={theme.stroke} unit={unit} /> : <MiniLineChart data={data} stroke={theme.stroke} unit={unit} />}
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-[10px] font-black uppercase text-slate-500">{label}</span>
    </div>
  );
}