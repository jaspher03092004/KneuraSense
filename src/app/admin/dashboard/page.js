'use client';

import { useState, useEffect } from 'react';
import { getPendingClinicians, approveClinician, rejectClinician, getDashboardAnalytics } from '@/actions/admin';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, LineChart, Line, Label
} from 'recharts';
import { 
  Users, Activity, AlertTriangle, CheckCircle, XCircle, Clock, 
  ArrowUpRight, TrendingUp, Calendar, X, Loader2, CalendarDays
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState({ clinicians: [], analytics: null });
  const [loading, setLoading] = useState(true);
  
  // Custom Modal & Date Filter State
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6);
    
    return {
      start: lastWeek.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  });
  
  const [actionModal, setActionModal] = useState({ isOpen: false, id: null, type: null, name: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Data whenever dateRange changes
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;

    const load = async () => {
      setLoading(true);
      const [c, a] = await Promise.all([
        getPendingClinicians(), 
        getDashboardAnalytics(dateRange.start, dateRange.end)
      ]);
      if (c.success && a.success) setData({ clinicians: c.data, analytics: a.data });
      setLoading(false);
    };
    
    // Safety check: ensure start is before end
    if (new Date(dateRange.start) <= new Date(dateRange.end)) {
      load();
    }
  }, [dateRange]);

  const executeAction = async () => {
    const { id, type } = actionModal;
    setActionLoading(true);
    
    const fn = type === 'approve' ? approveClinician : rejectClinician;
    
    if ((await fn(id)).success) {
      setData(prev => ({
        clinicians: prev.clinicians.filter(c => c.clinician_id !== id),
        analytics: { ...prev.analytics, kpis: { ...prev.analytics.kpis, 
          pendingApprovalsCount: Math.max(0, prev.analytics.kpis.pendingApprovalsCount - 1),
          totalApprovedClinicians: type === 'approve' ? prev.analytics.kpis.totalApprovedClinicians + 1 : prev.analytics.kpis.totalApprovedClinicians
        }}
      }));
    }
    setActionLoading(false);
    setActionModal({ isOpen: false, id: null, type: null, name: '' });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  if ((loading && !data.analytics) || !dateRange.start) {
    return <div className="p-10 animate-pulse bg-slate-50 h-full" />;
  }

  const { kpis, demographicsData, batteryHealth, recentAlerts, growthData, alertTrends, syncEfficiency } = data.analytics;
  const healthyDevicesCount = batteryHealth.find(b => b.name.includes('Good'))?.value || 0;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 font-sans antialiased relative">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-[#2C3E50] dark:text-white tracking-tight">System <span className="text-[#2D5F8B]">Insights</span></h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Edge AI telemetry and platform infrastructure.</p>
        </div>
        
        {/* CUSTOM DATE RANGE SELECTOR */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden p-1">
            <div className="px-2 flex items-center text-slate-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            
            <input 
              type="date" 
              value={dateRange.start}
              max={dateRange.end}
              onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-0 cursor-pointer py-1"
            />
            
            <span className="px-2 text-xs font-bold text-slate-400">to</span>
            
            <input 
              type="date" 
              value={dateRange.end}
              min={dateRange.start}
              max={todayStr}
              onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-0 cursor-pointer py-1"
            />
          </div>

          <div className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cloud Sync Active</span>
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Active Patients" val={kpis.totalPatients} icon={Users} cls="text-blue-600 bg-blue-50 border-blue-100" />
        <StatCard title="Approved Staff" val={kpis.totalApprovedClinicians} icon={CheckCircle} cls="text-emerald-600 bg-emerald-50 border-emerald-100" />
        <StatCard title="Pending Review" val={kpis.pendingApprovalsCount} icon={AlertTriangle} cls="text-amber-600 bg-amber-50 border-amber-100" alert={kpis.pendingApprovalsCount > 0} />
        <StatCard title="Active Wearables" val={kpis.activeDevices} icon={Activity} cls="text-indigo-600 bg-indigo-50 border-indigo-100" />
      </div>

      {/* TIER 1 CHARTS: GROWTH & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartBox title="Platform Adoption" sub="Registration velocity over selected range" colSpan="lg:col-span-2">
          {loading ? (
             <div className="w-full h-[220px] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#2D5F8B] animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5F8B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2D5F8B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClinicians" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="patients" name="Patients" stroke="#2D5F8B" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                <Area type="monotone" dataKey="clinicians" name="Clinicians" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorClinicians)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartBox>

        <ChartBox title="Alert Frequency" sub="Critical events over selected range">
          {loading ? (
            <div className="w-full h-[220px] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#2D5F8B] animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={alertTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="alerts" name="High Risk Alerts" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, fill: '#e11d48', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartBox>
      </div>

      {/* TIER 2 CHARTS: HARDWARE & DATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartBox title="Clinical Triage" sub="Patient diagnostic distribution">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={demographicsData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} width={80} />
              <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.4)'}} content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#2D5F8B" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Data Sync Latency" sub="Edge-to-cloud transfer speed">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={syncEfficiency} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} dy={5} />
              <YAxis hide />
              <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.4)'}} content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                {syncEfficiency.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Fleet Power Status" sub="Current battery health">
          <div className="flex flex-col items-center justify-center h-[180px] -mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={batteryHealth} 
                  innerRadius={50} 
                  outerRadius={70} 
                  paddingAngle={6} 
                  dataKey="value" 
                  stroke="none"
                  cornerRadius={4}
                >
                  {batteryHealth.map((e, i) => <Cell key={i} fill={e.fill} className="hover:opacity-80 transition-opacity cursor-pointer" />)}
                  <Label 
                    value={`${healthyDevicesCount}`} 
                    position="centerBottom" 
                    className="text-3xl font-black fill-slate-900 dark:fill-white" 
                    dy={-5}
                  />
                  <Label 
                    value="Healthy" 
                    position="centerTop" 
                    className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest" 
                    dy={12}
                  />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-1">
              {batteryHealth.map((e, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{backgroundColor: e.fill}}/>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {e.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartBox>
      </div>

      {/* DATA TABLES SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Clock className="w-4 h-4 text-[#2D5F8B]"/> Credentials Review</h3>
            <span className="bg-[#2D5F8B] text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">{data.clinicians.length} PENDING</span>
          </div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {data.clinicians.length === 0 ? (
                  <tr><td className="py-12 text-center text-slate-400 italic font-medium">No pending applications found.</td></tr>
                ) : (
                  data.clinicians.map(c => (
                    <tr key={c.clinician_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4"><div className="font-bold text-slate-700 dark:text-slate-200">{c.full_name}</div><div className="text-[10px] text-slate-400 font-medium">{c.email}</div></td>
                      <td className="p-4"><span className="text-[10px] font-bold text-[#2D5F8B] bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wide border border-blue-100/50">{c.specialization}</span></td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => setActionModal({ isOpen: true, id: c.clinician_id, type: 'approve', name: c.full_name })} 
                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-all"
                          >
                            <CheckCircle className="w-5 h-5"/>
                          </button>
                          <button 
                            onClick={() => setActionModal({ isOpen: true, id: c.clinician_id, type: 'reject', name: c.full_name })} 
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all"
                          >
                            <XCircle className="w-5 h-5"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-rose-500"/> Risk Telemetry Feed</h3>
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
            {recentAlerts.map(a => (
              <div key={a.id} className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-rose-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-white dark:bg-slate-900 flex flex-col items-center justify-center border border-slate-200 shadow-sm group-hover:border-rose-200 transition-colors">
                    <span className="text-rose-600 font-black text-xs leading-none">{a.riskScore}</span>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-1">Risk</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{a.patient.fullName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(a.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-rose-400 transition-colors" />
              </div>
            ))}
            {recentAlerts.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs italic">System clear. No recent alerts.</div>
            )}
          </div>
        </div>
      </div>

      {/* --- STANDARDIZED CONFIRMATION MODAL --- */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => !actionLoading && setActionModal({isOpen: false, id: null, type: null, name: ''})}></div>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-4 sm:p-5 md:p-6 max-w-[95%] sm:max-w-md w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 text-left">
            
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-md shrink-0 ${actionModal.type === 'approve' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                  {actionModal.type === 'approve' ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                    {actionModal.type === 'approve' ? 'Authorize Clinician' : 'Reject Application'}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Platform access review</p>
                </div>
              </div>
              <button 
                onClick={() => setActionModal({isOpen: false, id: null, type: null, name: ''})} 
                disabled={actionLoading}
                className="p-1 sm:p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className={`p-3 sm:p-4 rounded-md border ${actionModal.type === 'approve' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/30' : 'bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/30'}`}>
                <p className={`text-[11px] sm:text-xs font-bold leading-relaxed ${actionModal.type === 'approve' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {actionModal.type === 'approve' 
                    ? `Are you sure you want to approve Dr. ${actionModal.name}? They will immediately gain access to the clinical portal and patient onboarding tools.` 
                    : `Are you sure you want to reject the application for Dr. ${actionModal.name}? This action will permanently delete their pending profile from the database.`}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:pt-2">
                <button 
                  onClick={executeAction}
                  disabled={actionLoading}
                  className={`w-full py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 text-white disabled:opacity-50 shadow-sm ${actionModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  {actionLoading ? <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" /> : (actionModal.type === 'approve' ? 'Yes, Authorize Access' : 'Yes, Reject & Delete')}
                </button>
                <button 
                  onClick={() => setActionModal({isOpen: false, id: null, type: null, name: ''})}
                  disabled={actionLoading}
                  className="w-full py-2 sm:py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors text-[11px] sm:text-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ALIGNED HELPER COMPONENTS
const StatCard = ({ title, val, icon: Icon, cls, alert }) => (
  <div className={`bg-white dark:bg-slate-900 p-5 rounded-lg border ${alert ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-200/60 dark:border-slate-800'} transition-all shadow-sm group`}>
    <div className="flex justify-between items-start mb-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-md border ${cls} shrink-0 transition-transform group-hover:scale-110`}><Icon size={20} strokeWidth={2.5} /></div>
      {alert && <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Review</span>}
    </div>
    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{title}</p>
    <h4 className="text-3xl font-black text-[#2C3E50] dark:text-white tracking-tight">{val}</h4>
  </div>
);

const ChartBox = ({ title, sub, children, colSpan = "" }) => (
  <div className={`bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col ${colSpan}`}>
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-[11px]">{sub}</p>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => (
  active && payload && payload.length ? (
    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.12)] border-none text-[11px] font-bold">
      <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label || payload[0].name || payload[0].payload.name}</p>
      {payload.map((entry, index) => (
         <p key={index} className="text-slate-900 dark:text-white mb-0.5">
           {entry.name}: <span className="font-black" style={{color: entry.color || entry.fill}}>{entry.value}</span>
         </p>
      ))}
    </div>
  ) : null
);