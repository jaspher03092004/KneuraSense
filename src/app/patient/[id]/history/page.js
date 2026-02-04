import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import RefreshButton from '@/components/RefreshButton';
import { 
  Calendar, 
  Download, 
  Bell, 
  Activity, 
  Mountain, 
  Cloud, 
  ChevronLeft, 
  ChevronRight,
  Footprints,
  Layers,
  Clock,
  Zap,
  Thermometer
} from 'lucide-react';

export default async function HistoryPage({ params }) {
  const { id } = await params;
  
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, fullName: true }
  });

  if (!patient) redirect('/login');

  const recentData = [
    { time: '14:30', score: 55, angle: '35°', force: '92 N', temp: '33.2°C', terrain: 'Stairs', weather: 'Warm', status: 'Medium' },
    { time: '14:15', score: 28, angle: '12°', force: '45 N', temp: '32.6°C', terrain: 'Flat', weather: 'Warm', status: 'Low' },
    { time: '14:00', score: 76, angle: '42°', force: '110 N', temp: '33.5°C', terrain: 'Incline', weather: 'Hot', status: 'High' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:p-8">
        
        {/* Responsive Header */}
        <header className="mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">History & Trends</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Correlation analysis for {patient.fullName}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <RefreshButton className="w-full justify-center h-10 sm:h-11" />
            </div>
            <button className="flex h-10 sm:h-11 flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-lg transition-transform active:scale-95 hover:bg-slate-800">
              <Download size={16} className="sm:block hidden" />
              <Download size={14} className="sm:hidden" />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Scrollable Filters - Prevents wrapping layout breaks on small screens */}
        <nav className="mb-6 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar md:overflow-visible md:pb-0 -mx-3 sm:-mx-4 px-3 sm:px-4 md:mx-0 md:px-0">
          <div className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-white px-2 sm:px-3 shadow-sm border border-slate-100 shrink-0">
            <Calendar size={14} className="sm:block hidden text-slate-400" />
            <Calendar size={12} className="sm:hidden text-slate-400" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-700">Filter:</span>
          </div>
          {['Today', 'This Week', 'This Month', 'Custom'].map((label, i) => (
            <button 
              key={label}
              className={`h-9 sm:h-10 rounded-lg sm:rounded-xl px-3 sm:px-5 text-[10px] sm:text-xs font-bold transition-all shrink-0 ${
                i === 0 
                ? 'bg-[#2D5F8B] text-white shadow-md' 
                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Adaptive Metrics Grid - 2 cols on mobile, 4 on desktop */}
        <section className="mb-6 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:gap-6">
          <StatCard icon={<Activity size={18} />} value="42" label="Risk Score" trend="↓ 12%" color="emerald" />
          <StatCard icon={<Bell size={18} />} value="3" label="Alerts" trend="↓ 2" color="emerald" />
          <StatCard icon={<Footprints size={18} />} value="4.2" label="Hrs/Day" trend="0%" color="slate" />
          <StatCard icon={<Layers size={18} />} value="18" label="Stair Mins" trend="↑ 5m" color="rose" />
        </section>

        {/* Chart Section - Taller on mobile for better touch/detail */}
        <section className="mb-6 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 md:p-8 shadow-sm">
          <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-slate-50 text-slate-600">
                <Activity size={18} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Risk Patterns</h3>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <LegendItem color="bg-rose-500" label="Risk" />
              <LegendItem color="bg-orange-400" label="Threshold" />
              <LegendItem color="bg-slate-200" label="Safe" />
            </div>
          </div>
          <div className="aspect-[4/3] w-full rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex items-center justify-center md:aspect-[21/9]">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300">Trend Visualization</span>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
           <CorrelationCard title="Terrain Correlation" icon={<Mountain size={18} />} color="blue" />
           <CorrelationCard title="Weather Correlation" icon={<Cloud size={18} />} color="sky" />
        </div>

        {/* Data Points - Full Transformation for Mobile */}
        <section className="mt-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 p-3 sm:p-5">
            <h3 className="text-sm sm:text-base font-bold text-slate-800">Recent Logs</h3>
            <div className="flex gap-1.5 sm:gap-2">
              <button className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-slate-100 text-slate-400 active:bg-slate-50 hover:border-slate-200"><ChevronLeft size={16} /></button>
              <button className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-slate-100 text-slate-400 active:bg-slate-50 hover:border-slate-200"><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Mobile Card Layout (Hidden on MD+) */}
          <div className="md:hidden divide-y divide-slate-50">
            {recentData.map((row, i) => (
              <div key={i} className="p-4 sm:p-5">
                <div className="mb-3 sm:mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-slate-900 text-sm sm:text-base">
                    <Clock size={13} className="sm:block hidden text-slate-400" />
                    <Clock size={12} className="sm:hidden text-slate-400" />
                    {row.time}
                  </div>
                  <span className={`rounded-lg px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-tight ${
                    row.score > 70 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    Score: {row.score}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <MobileDataItem label="Angle" value={row.angle} />
                  <MobileDataItem label="Force" value={row.force} />
                  <MobileDataItem label="Terrain" value={row.terrain} />
                  <MobileDataItem label="Temp" value={row.temp} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (Hidden on < MD) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  {['Time', 'Score', 'Angle', 'Force', 'Temp', 'Terrain', 'Status'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentData.map((row, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.time}</td>
                    <td className="px-6 py-4"><span className="font-mono font-bold text-slate-900">{row.score}</span></td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.angle}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.force}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.temp}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{row.terrain}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${row.status === 'High' ? 'text-rose-500' : 'text-slate-400'}`}>
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
    </div>
  );
}

// --- Specialized Responsive Components ---

function StatCard({ icon, value, label, trend, color }) {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-50 text-slate-500'
  };
  return (
    <div className="relative overflow-hidden rounded-lg sm:rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 md:p-6 shadow-sm">
      <div className="mb-2 sm:mb-3 md:mb-4 flex h-8 sm:h-9 md:h-10 w-8 sm:w-9 md:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-slate-50 text-slate-400">
        <span className="text-base sm:text-lg md:text-xl">{icon.props.size === 18 ? icon : icon}</span>
      </div>
      <div className="flex items-baseline gap-0.5 sm:gap-1 md:gap-2">
        <span className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900">{value}</span>
        <span className={`rounded-md px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold ${colorStyles[color]}`}>{trend}</span>
      </div>
      <p className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{label}</p>
    </div>
  );
}

function MobileDataItem({ label, value }) {
  return (
    <div className="rounded-lg sm:rounded-xl bg-slate-50/80 p-2 sm:p-3">
      <span className="block text-[8px] sm:text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-0.5">{label}</span>
      <span className="block text-xs sm:text-sm font-bold text-slate-700">{value}</span>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

function CorrelationCard({ title, icon, color }) {
  const theme = color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-sky-50 text-sky-600';
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
      <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <div className={`flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl ${theme}`}>
          {icon}
        </div>
        <h4 className="text-sm sm:text-base font-bold text-slate-800">{title}</h4>
      </div>
      <div className="aspect-video w-full rounded-lg sm:rounded-2xl border-2 border-dashed border-slate-50 bg-slate-50/30 flex items-center justify-center">
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-300">Analysis Preview</span>
      </div>
    </div>
  );
}