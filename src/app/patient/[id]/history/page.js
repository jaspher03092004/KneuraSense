import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import HistoryCharts from '@/components/HistoryCharts';
import RefreshButton from '@/components/RefreshButton';
import Link from 'next/link';
import { 
  Calendar, Download, Bell, Activity, 
  Mountain, Cloud, Footprints, Layers, Clock, SearchX
} from 'lucide-react';

export default async function HistoryPage({ params, searchParams }) {
  const { id } = await params;
  const { range } = await searchParams; // Captures ?range=7d or ?range=30d

  // 1. Define the Time Window
  let startDate = new Date();
  let rangeLabel = "Last 24 Hours";

  if (range === '7d') {
    startDate.setDate(startDate.getDate() - 7);
    rangeLabel = "Last 7 Days";
  } else if (range === '30d') {
    startDate.setDate(startDate.getDate() - 30);
    rangeLabel = "Last 30 Days";
  } else {
    startDate.setHours(startDate.getHours() - 24); // Default: 24h 
  }

  // 2. Fetch Filtered Logs 
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { 
      id: true, 
      fullName: true,
      sensorLogs: {
        where: {
          timestamp: { gte: startDate } // Only get logs AFTER the startDate
        },
        orderBy: { timestamp: 'desc' },
      }
    }
  });

  if (!patient) redirect('/login');

  const logs = patient.sensorLogs || [];
  const hasData = logs.length > 0; // Check if any logs exist for this range

  // 3. Prepare Data for UI (Only if hasData is true)
  const avgRisk = hasData 
    ? Math.round(logs.reduce((acc, log) => acc + log.riskScore, 0) / logs.length) 
    : 0;
  
  const highRiskCount = logs.filter(log => log.riskScore > 70).length;
  const avgTemp = hasData
    ? (logs.reduce((acc, log) => acc + log.skinTemp, 0) / logs.length).toFixed(1)
    : 0;

  // Chart Data (Full Set)
  const chartData = logs.map(log => ({
    time: log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: log.riskScore,
  })).reverse();

  // Table Data (Limited to Last 5 Logs) 
  const recentLogsTable = logs.slice(0, 5).map(log => ({
    time: log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: log.riskScore,
    angle: `${log.angle.toFixed(1)}°`,
    force: `${log.force} N`,
    temp: `${log.skinTemp.toFixed(1)}°C`,
    status: log.riskScore > 70 ? 'High' : log.riskScore > 40 ? 'Medium' : 'Low'
  }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:p-8">
        
        {/* Persistent Header */}
        <header className="mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">History & Trends</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500">{patient.fullName} • {rangeLabel}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <RefreshButton className="w-full justify-center h-10 sm:h-11" />
             <button className="flex h-10 sm:h-11 flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-lg transition-transform active:scale-95">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Persistent Filters */}
        <nav className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <FilterLink label="24 Hours" active={!range} href={`/patient/${id}/history`} />
          <FilterLink label="7 Days" active={range === '7d'} href={`/patient/${id}/history?range=7d`} />
          <FilterLink label="30 Days" active={range === '30d'} href={`/patient/${id}/history?range=30d`} />
        </nav>

        {/* --- CONDITIONAL RENDERING --- */}
        {!hasData ? (
          /* NO DATA VIEW: Displays when filter returns 0 results */
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm animate-in fade-in zoom-in duration-300">
            <div className="p-5 bg-slate-50 rounded-full text-slate-300 mb-4">
              <SearchX size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">No History Available</h2>
            <p className="text-sm text-slate-500 max-w-xs text-center mt-2 font-medium">
              We couldn&apos;t find any recordings for the {rangeLabel.toLowerCase()}. Check your connection or try a different filter.
            </p>
          </div>
        ) : (
          /* DATA EXISTS VIEW: Full Analytics */
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Stats Grid */}
            <section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:gap-6">
              <StatCard icon={<Activity size={18} />} value={avgRisk} label="Avg Risk" trend={avgRisk > 50 ? "High" : "Normal"} color={avgRisk > 50 ? "rose" : "emerald"} />
              <StatCard icon={<Bell size={18} />} value={highRiskCount} label="High Risks" trend="Events" color={highRiskCount > 0 ? "rose" : "slate"} />
              <StatCard icon={<Footprints size={18} />} value={logs.length} label="Total Logs" trend="Total" color="slate" />
              <StatCard icon={<Layers size={18} />} value={avgTemp} label="Avg Temp" trend="°C" color="emerald" />
            </section>

            {/* Main Chart */}
            <section className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 md:p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600"><Activity size={18} /></div>
                  <h3 className="text-lg font-bold text-slate-800">Trend Analysis</h3>
                </div>
                <div className="hidden sm:flex gap-4">
                  <LegendItem color="bg-rose-500" label="Risk Zone" />
                  <LegendItem color="bg-orange-400" label="Threshold (70)" />
                </div>
              </div>
              <div className="aspect-[4/3] w-full rounded-2xl border-2 border-slate-50 bg-white md:aspect-[21/9]">
                 <HistoryCharts data={chartData} /> 
              </div>
            </section>

            {/* ANALYSIS CARDS (Preserved) */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
               <CorrelationCard title="Terrain Analysis" icon={<Mountain size={18} />} color="blue" />
               <CorrelationCard title="Environment" icon={<Cloud size={18} />} color="sky" />
            </div>

            {/* DATA TABLE: RECENT LOGS (Last 5) */}
            <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-50 p-5">
                <h3 className="text-base font-bold text-slate-800">Recent Logs (Last 5)</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50/50">
                    <tr>
                      {['Time', 'Score', 'Angle', 'Force', 'Temp', 'Status'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentLogsTable.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{row.time}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{row.score}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{row.angle}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{row.force}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{row.temp}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                              row.status === 'High' ? 'text-rose-500' : 'text-emerald-500'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS (Keep these as they are) ---

function FilterLink({ label, active, href }) {
  return (
    <Link href={href} className={`px-6 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
      active ? 'bg-[#2D5F8B] text-white border-[#2D5F8B] shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
    }`}>
      {label}
    </Link>
  );
}

function StatCard({ icon, value, label, trend, color }) {
  const colorStyles = { emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600', slate: 'bg-slate-50 text-slate-500' };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">{icon}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-slate-900">{value}</span>
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${colorStyles[color]}`}>{trend}</span>
      </div>
      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{label}</p>
    </div>
  );
}

function CorrelationCard({ title, icon, color }) {
  const theme = color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-sky-50 text-sky-600';
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme}`}>{icon}</div>
        <h4 className="font-bold text-slate-800">{title}</h4>
      </div>
      <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-slate-50 bg-slate-50/30 flex items-center justify-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Analysis Preview</span>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}