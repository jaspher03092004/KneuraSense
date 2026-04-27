"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PrivacyMask from '@/components/PrivacyMask';
import LiveDashboard from '@/components/LiveDashboard';
import {
  Search, Users, Activity, WifiOff, ChevronLeft, ChevronRight, 
  AlertTriangle, Eye, CheckCircle2, Stethoscope, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

export default function DashboardClient({ clinician, initialPatients, stats }) {
  const router = useRouter();
  const params = useParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'desc' });
  const pageSize = 6;

  const [showLiveDashboard, setShowLiveDashboard] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const handleTelemetryClick = (patient) => {
    setSelectedPatient(patient);
    setShowLiveDashboard(true);
  };

  const isCompact = clinician?.compactView || false;

  // --- AUTO REFRESH DASHBOARD ---
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh(); 
    }, 30000); 
    
    return () => clearInterval(interval);
  }, [router]);

  // --- FILTERS & STATS CONFIG ---
  const filters = [
    { id: 'all', label: 'All Patients', count: initialPatients.length },
    { id: 'high-risk', label: 'High Risk', count: initialPatients.filter(p => p.status === 'high-risk').length },
    { id: 'caution', label: 'Caution', count: initialPatients.filter(p => p.status === 'caution').length },
    { id: 'stable', label: 'Stable', count: initialPatients.filter(p => p.status === 'stable').length },
    { id: 'offline', label: 'Offline', count: initialPatients.filter(p => p.status === 'offline').length }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      'high-risk': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-500 dark:text-rose-400', label: 'High' },
      'caution': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-500 dark:text-amber-400', label: 'Medium' },
      'stable': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-500 dark:text-emerald-400', label: 'Low' },
      'offline': { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', label: 'Offline' }
    };
    return configs[status] || configs.stable;
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-rose-600 dark:text-rose-400';
    if (score >= 40) return 'text-amber-500 dark:text-amber-400';
    return 'text-emerald-500 dark:text-emerald-400';
  };

  // --- CHART 1: Risk Distribution ---
  const riskDistributionData = useMemo(() => {
    return [
      { name: 'Stable (Low)', value: initialPatients.filter(p => p.status === 'stable').length, fill: '#10b981' }, 
      { name: 'Caution (Med)', value: initialPatients.filter(p => p.status === 'caution').length, fill: '#f59e0b' }, 
      { name: 'High Risk', value: initialPatients.filter(p => p.status === 'high-risk').length, fill: '#f43f5e' }, 
      { name: 'Offline', value: initialPatients.filter(p => p.status === 'offline').length, fill: '#64748b' }, 
    ].filter(d => d.value > 0); 
  }, [initialPatients]);

  // --- CHART 2: Population Health (Risk by Age) ---
  const ageDemographicData = useMemo(() => {
    const ageGroups = { 
      '<40': { totalRisk: 0, count: 0 }, 
      '40-49': { totalRisk: 0, count: 0 }, 
      '50-59': { totalRisk: 0, count: 0 }, 
      '60+': { totalRisk: 0, count: 0 } 
    };

    initialPatients.forEach(p => {
      const age = parseInt(p.age);
      if (isNaN(age) || p.status === 'offline') return; 

      let group = '<40';
      if (age >= 60) group = '60+';
      else if (age >= 50) group = '50-59';
      else if (age >= 40) group = '40-49';

      ageGroups[group].totalRisk += p.score;
      ageGroups[group].count += 1;
    });

    return Object.keys(ageGroups).map(key => ({
      ageGroup: key,
      avgRisk: ageGroups[key].count > 0 ? Math.round(ageGroups[key].totalRisk / ageGroups[key].count) : 0,
      patientCount: ageGroups[key].count
    }));
  }, [initialPatients]);

  // --- SEARCH, FILTER, SORT & PAGINATION LOGIC ---
  const processedPatients = useMemo(() => {
    let result = [...initialPatients];
    
    const q = searchQuery.trim().toLowerCase();
    result = result.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchesFilter = selectedFilter === 'all' || p.status === selectedFilter;
      return matchesSearch && matchesFilter;
    });

    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [initialPatients, searchQuery, selectedFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(processedPatients.length / pageSize));
  
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedPatients.slice(start, start + pageSize);
  }, [processedPatients, currentPage]);

  if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans antialiased overflow-x-hidden p-4 md:p-8 relative">
      <div className="max-w-[1400px] mx-auto space-y-4 ">
        
        {/* Header Section */}
        <header className="mb-6 -mt-6  flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Clinician Portal</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monitor knee health telemetry across your active roster</p>
          </div>
        </header>

        {/* Dynamic Stats Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => {
             const iconMap = {
               'Users': <Users size={20} className="text-blue-600 dark:text-blue-400" />,
               'Activity': <Activity size={20} className="text-emerald-600 dark:text-emerald-400" />,
               'AlertCircle': <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />,
               'WifiOff': <WifiOff size={20} className="text-slate-600 dark:text-slate-400" />
             };

            return (
              <div key={index} className="relative overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-md transition-all duration-300 group">
                <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-all group-hover:scale-150 ${stat.bg.replace('bg-', 'bg-')}`}></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-md border ${stat.bg} ${stat.borderColor} shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                    {iconMap[stat.icon]}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500">
                    {stat.icon === 'AlertCircle' ? 'Needs Review' : 'Live'}
                  </span>
                </div>
                
                <div className="relative z-10">
                  <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </span>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {stat.label}
                  </p>
                </div>
              </div>
            )
          })}
        </section>

        {/* --- CLINIC POPULATION ANALYTICS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] lg:col-span-1">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Roster Health</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Current triage distribution</p>
            </div>
            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                  {initialPatients.filter(p => p.status !== 'offline').length}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active</span>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] lg:col-span-2 flex flex-col">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Average Risk by Age Demographic</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Identifying vulnerable populations in your roster</p>
            </div>
            <div className="flex-1 w-full min-h-[192px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDemographicData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="ageGroup" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={[0, 100]}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                    contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}
                    formatter={(value, name) => [name === 'avgRisk' ? `${value} / 100` : value, name === 'avgRisk' ? 'Avg Risk Score' : 'Patients']}
                  />
                  <Bar dataKey="avgRisk" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500}>
                    {ageDemographicData.map((entry, index) => {
                      let color = '#10b981'; 
                      if (entry.avgRisk >= 70) color = '#f43f5e'; 
                      else if (entry.avgRisk >= 40) color = '#f59e0b'; 
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Filters and Search Area */}
        <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-4">
          <nav className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 snap-x touch-pan-x min-w-0 no-scrollbar">
            {filters.map((filter) => (
              <button 
                key={filter.id} 
                onClick={() => { setSelectedFilter(filter.id); setCurrentPage(1); }} 
                className={`px-4 md:px-6 py-2 rounded-md text-[11px] md:text-xs font-bold transition-all border whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  selectedFilter === filter.id 
                  ? 'bg-[#2D5F8B] dark:bg-blue-600 text-white border-[#2D5F8B] dark:border-blue-600 shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {filter.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-black ${
                  selectedFilter === filter.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </nav>
          
          <div className="relative w-full xl:w-80 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 rounded-md md:rounded-md border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 outline-none transition-all text-[13px] font-medium text-slate-600 dark:text-slate-300 shadow-sm" 
            />
          </div>
        </div>

        {/* Patient Directory Table & Cards */}
        <section className="-mt-4 overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative">
          <div className="overflow-hidden border-b border-slate-100 dark:border-slate-800/80 p-4 md:p-5 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Patient Roster
              {sortConfig.key === 'score' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 ml-2 border border-rose-100 dark:border-rose-500/20">
                  Sorted by Risk
                </span>
              )}
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-[10px] md:text-xs font-medium text-slate-400 dark:text-slate-500">Showing {processedPatients.length} records</span>
              <Link href={`/clinician/${params.id}/dashboard/all-patients`} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-[10px] md:text-xs font-bold">
                <Eye size={14} /> View All
              </Link>
            </div>
          </div>

          {paginated.length === 0 ? (
            <div className="py-24 text-center animate-in fade-in duration-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 mb-4 ring-8 ring-slate-50/50 dark:ring-slate-800/20">
                {selectedFilter === 'high-risk' ? <CheckCircle2 size={32} className="text-emerald-500" /> : <Search size={32} />}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {selectedFilter === 'high-risk' ? "No High-Risk Patients" : "No Patients Found"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {selectedFilter === 'high-risk' 
                  ? "Excellent! None of your patients are currently exhibiting critical joint stress." 
                  : "Try adjusting your search query or filters to find what you're looking for."}
              </p>
            </div>
          ) : (
            <>
              {/* --- MOBILE CARD VIEW --- */}
              <div className="block md:hidden divide-y divide-slate-50 dark:divide-slate-800/50">
                {paginated.map((patient) => {
                  const statusConfig = getStatusConfig(patient.status);
                  const sparklineData = patient.recentScores || [40, 45, 60, 55, 70, patient.score || 0]; 

                  return (
                    <div key={patient.id} className={`${isCompact ? 'p-3 space-y-3' : 'p-4 space-y-4'} hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`${isCompact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shadow-sm shrink-0`}>
                              {patient.initials}
                            </div>
                            {patient.status !== 'offline' && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <PrivacyMask defaultVisible={false}>
                              <div className={`font-bold text-slate-700 dark:text-slate-200 truncate ${isCompact ? 'text-xs' : 'text-sm'}`}>
                                {patient.name}
                              </div>
                              <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">{patient.email}</p>
                            </PrivacyMask>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{patient.mrn || 'No MRN'} • Age: {patient.age}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-sm shrink-0 border border-transparent ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className={`flex flex-col justify-center bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-md ${isCompact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
                          <div className="flex justify-between items-end mb-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                            <p className={`font-mono font-bold ${isCompact ? 'text-xs' : 'text-sm'} ${getScoreColor(patient.score)}`}>
                              {patient.score}
                            </p>
                          </div>
                          {/* Sparkline for Mobile View */}
                          <div className="h-4 w-full flex items-end gap-[2px]">
                            {sparklineData.map((historicalScore, i) => {
                              const heightPct = Math.max(15, (historicalScore / 100) * 100);
                              return (
                                <div key={i} className="group/spark relative flex-1 h-full flex items-end">
                                  <div 
                                    className={`w-full rounded-[1px] opacity-70 group-hover/spark:opacity-100 transition-opacity ${getScoreColor(historicalScore).replace('text-', 'bg-')}`}
                                    style={{ height: `${heightPct}%` }}
                                  />
                                  {/* Mobile Custom Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/spark:flex z-50">
                                    <span className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold py-0.5 px-1.5 rounded-sm shadow-lg">
                                      {historicalScore}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className={`flex flex-col justify-center bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-md ${isCompact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sync</p>
                          <p className={`font-bold text-slate-600 dark:text-slate-300 truncate ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>{patient.lastActive}</p>
                        </div>
                      </div>

                      {/* QUICK ACTIONS FOR MOBILE - Enhanced for Dark Mode & Touch Targets */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-2">
                        <Link 
                          href={`/clinician/${params.id}/interventions?patientId=${patient.id}`}
                          className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30 rounded-md text-xs font-bold transition-colors border border-rose-100 dark:border-rose-500/20"
                        >
                          <Stethoscope size={14} /> Intervene
                        </Link>
                        <button 
                          onClick={() => handleTelemetryClick(patient)}
                          className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 rounded-md text-xs font-bold transition-colors border border-indigo-100 dark:border-indigo-500/20"
                        >
                          <Activity size={14} /> Telemetry
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* --- DESKTOP TABLE VIEW --- */}
              <div className="overflow-x-hidden hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-y border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className={`${isCompact ? 'px-4 py-2 text-[9px]' : 'px-6 py-4 text-[10px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>Patient</th>
                      <th className={`${isCompact ? 'px-4 py-2 text-[9px]' : 'px-6 py-4 text-[10px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>Status</th>
                      <th className={`${isCompact ? 'px-4 py-2 text-[9px]' : 'px-6 py-4 text-[10px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 transition-colors`} onClick={() => setSortConfig({ key: 'score', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                        Risk Score {sortConfig.key === 'score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className={`${isCompact ? 'px-4 py-2 text-[9px]' : 'px-6 py-4 text-[10px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>Last Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 relative">
                    {paginated.map((patient) => {
                      const statusConfig = getStatusConfig(patient.status);
                      const sparklineData = patient.recentScores || [40, 45, 60, 55, 70, patient.score || 0]; 

                      return (
                        <tr key={patient.id} className="relative hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 group border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                          <td className={`${isCompact ? 'px-4 py-2' : 'px-6 py-4'}`}>
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className={`${isCompact ? 'w-8 h-8 text-xs rounded-md' : 'w-10 h-10 text-sm rounded-md'} bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shadow-sm shrink-0`}>
                                  {patient.initials}
                                </div>
                                {patient.status !== 'offline' && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                                  </span>
                                )}
                              </div>
                              <PrivacyMask defaultVisible={false}>
                                <div>
                                  <div className={`font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap ${isCompact ? 'text-xs' : 'text-sm'}`}>
                                    {patient.name}
                                  </div>
                                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{patient.mrn || 'No MRN'} • Age: {patient.age}</p>
                                </div>
                              </PrivacyMask>
                            </div>
                          </td>
                          
                          <td className={`${isCompact ? 'px-4 py-2' : 'px-6 py-4'}`}>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-sm border border-transparent ${statusConfig.bg} ${statusConfig.text}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          
                          <td className={`${isCompact ? 'px-4 py-2' : 'px-6 py-4'}`}>
                            <div className="flex items-center gap-4 max-w-[180px]">
                              <span className={`font-mono font-bold ${isCompact ? 'text-xs' : 'text-sm'} ${getScoreColor(patient.score)} w-8`}>
                                {patient.score}
                              </span>
                              
                              {/* Sparkline with Custom CSS Tooltip */}
                              <div className="flex-1 h-6 flex items-end gap-[2px]">
                                {sparklineData.map((historicalScore, i) => {
                                  const heightPct = Math.max(15, (historicalScore / 100) * 100);
                                  return (
                                    <div key={i} className="group/spark relative flex-1 h-full flex items-end cursor-pointer">
                                      <div 
                                        className={`w-full rounded-sm opacity-70 group-hover/spark:opacity-100 transition-opacity ${getScoreColor(historicalScore).replace('text-', 'bg-')}`}
                                        style={{ height: `${heightPct}%` }}
                                      />
                                      {/* Custom CSS Hover Tooltip */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/spark:flex z-50">
                                        <span className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold py-0.5 px-1.5 rounded-sm whitespace-nowrap shadow-lg">
                                          {historicalScore}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                          
                          {/* Quick Actions overlay triggering on hover */}
                          <td className={`${isCompact ? 'px-4 py-2' : 'px-6 py-4'} relative`}>
                            <div className="flex flex-col group-hover:opacity-0 transition-opacity duration-200">
                              <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap`}>
                                {isMounted ? (patient.lastSensorSync ? new Date(patient.lastSensorSync).toLocaleDateString() : 'N/A') : 'Loading...'}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 mt-0.5">{patient.lastActive}</span>
                            </div>
                            
                            {/* Desktop Quick Actions - Enhanced for Dark Mode */}
                            <div className="absolute inset-y-0 right-0 flex items-center justify-end gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-10 bg-gradient-to-l from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 pl-16 pr-6">
                              <Link 
                                href={`/clinician/${params.id}/interventions?patientId=${patient.id}`} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30 rounded-md text-xs font-bold transition-colors shadow-sm border border-rose-100 dark:border-rose-500/20"
                              >
                                <Stethoscope size={14} /> Intervene
                              </Link>
                              
                              <button 
                                onClick={() => handleTelemetryClick(patient)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 rounded-md text-xs font-bold transition-colors shadow-sm border border-indigo-100 dark:border-indigo-500/20"
                              >
                                <Activity size={14} /> Telemetry
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
              <button 
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} 
                disabled={currentPage <= 1} 
                className={`flex items-center gap-1 text-xs md:text-sm font-bold px-3 md:px-4 py-2 rounded-md border transition-all ${currentPage === 1 ? 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 pointer-events-none' : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'}`}
              >
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} 
                disabled={currentPage >= totalPages} 
                className={`flex items-center gap-1 text-xs md:text-sm font-bold px-3 md:px-4 py-2 rounded-md border transition-all ${currentPage === totalPages ? 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 pointer-events-none' : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'}`}
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>

        {/* --- LIVE DASHBOARD MODAL --- */}
        {showLiveDashboard && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowLiveDashboard(false)}></div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90dvh] overflow-y-auto relative border border-slate-100 dark:border-slate-800 no-scrollbar">
              <div className="sticky top-0 bg-white dark:bg-slate-900 flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 z-10">
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{selectedPatient.name} - Live Dashboard</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Real-time sensor data and device status</p>
                </div>
                <button 
                  onClick={() => setShowLiveDashboard(false)} 
                  className="p-2 -mr-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <LiveDashboard 
                  patientName={selectedPatient.name}
                  patientId={selectedPatient.id}
                  deviceMac={selectedPatient.deviceMac}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}