"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientRegistrationSchema } from '@/lib/validations';
import PrivacyMask from '@/components/PrivacyMask';
import SmartDashboard from '@/components/SmartDashboard';
import { clinicianRegisterPatient } from '@/actions/clinicianRegisterPatient';
import {
  Search, Filter, Users, Activity, AlertCircle, WifiOff, Plus, ChevronLeft,
  ChevronRight, X, Clock, AlertTriangle, CheckCircle, Download, Loader2, ArrowRight
} from 'lucide-react';

export default function DashboardClient({ clinician, initialPatients, stats }) {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [registrationMessage, setRegistrationMessage] = useState({ type: '', text: '' });
  
  // State for Critical Alerts Toast
  const [alertToast, setAlertToast] = useState(null);
  
  // USE REF: Keeps track of who we already alerted about without causing re-renders
  const alertedPatientIds = useRef(new Set()); 

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: { oaDiagnosis: 'No', gender: '', affectedKnee: '', activityLevel: '' }
  });

  const isCompact = clinician?.compactView || false;
  const criticalAlertsEnabled = clinician?.criticalAlerts ?? true;

  // --- AUTO REFRESH DASHBOARD ---
  // Silently fetches new data from the database every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh(); 
    }, 10000); 
    
    return () => clearInterval(interval);
  }, [router]);

  // --- SMARTER TOAST NOTIFICATION ---
  useEffect(() => {
    if (!criticalAlertsEnabled) return;

    // Look for patients currently in high-risk
    const highRiskPatients = initialPatients.filter(p => p.status === 'high-risk');
    
    // Only alert for patients we haven't alerted for yet during this session
    const newHighRisk = highRiskPatients.filter(p => !alertedPatientIds.current.has(p.id));

    if (newHighRisk.length > 0) {
      // Add these new high-risk patients to our tracked ref list
      newHighRisk.forEach(p => alertedPatientIds.current.add(p.id));

      // Show the popup (Wrapped in timeout to prevent React render warnings)
      const showTimer = setTimeout(() => {
        setAlertToast({
          title: 'High Risk Alert',
          message: `${newHighRisk.length} new patient(s) reached a critical risk score!`
        });
      }, 100);

      const hideTimer = setTimeout(() => setAlertToast(null), 10100);
      
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [initialPatients, criticalAlertsEnabled]);


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
    if (score >= 70) return 'text-rose-500 dark:text-rose-400';
    if (score >= 40) return 'text-amber-500 dark:text-amber-400';
    return 'text-emerald-500 dark:text-emerald-400';
  };

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialPatients.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchesFilter = selectedFilter === 'all' || p.status === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [initialPatients, searchQuery, selectedFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, currentPage]);

  if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);

  const handleExport = () => {
    if (filteredPatients.length === 0) {
      alert("No patient data to export.");
      return;
    }

    const headers = ['Patient ID', 'Name', 'Age', 'Status', 'Risk Score', 'Last Active', 'Last Sensor Sync'];
    const rows = filteredPatients.map(p => [
      p.id, `"${p.name}"`, p.age, `"${p.status}"`, p.score, `"${p.lastActive}"`,
      `"${p.lastSensorSync ? new Date(p.lastSensorSync).toLocaleString() : 'N/A'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `patient_telemetry_export_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = async (data) => {
    setRegistrationMessage({ type: '', text: '' });
    try {
      const formDataObj = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) formDataObj.append(key, data[key]);
      });

      const result = await clinicianRegisterPatient(formDataObj);

      if (result.success) {
        setRegistrationMessage({ type: 'success', text: 'Patient registered successfully!' });
        setTimeout(() => {
          setShowModal(false);
          reset();
          setRegistrationMessage({ type: '', text: '' });
          window.location.reload(); 
        }, 1500);
      } else {
        setRegistrationMessage({ type: 'error', text: `Error: ${result.error || 'Registration failed'}` });
      }
    } catch (error) {
      console.error(error); 
      setRegistrationMessage({ type: 'error', text: 'An error occurred during registration.' });
    }
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans antialiased overflow-x-hidden p-4 md:p-8 relative">
      
      {/* Toast Notification for Critical Alerts */}
      {alertToast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-rose-50 dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 shadow-lg rounded-2xl p-4 flex gap-4 max-w-sm">
            <div className="bg-rose-100 dark:bg-rose-500/20 p-2 rounded-xl h-fit text-rose-600 dark:text-rose-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{alertToast.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{alertToast.message}</p>
            </div>
            <button onClick={() => setAlertToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-fit">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Clinician Portal</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monitor knee health telemetry and manage your patients</p>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center">
            <button onClick={handleExport} className="flex w-full md:w-auto items-center justify-center gap-2 px-4 md:px-6 py-2.5 bg-white dark:bg-slate-900 rounded-xl md:rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-xs md:text-sm whitespace-nowrap">
              <Download size={16} />
              Export Data
            </button>
            <button onClick={() => setShowModal(true)} className="flex w-full md:w-auto items-center justify-center gap-2 px-4 md:px-6 py-2.5 bg-slate-900 dark:bg-blue-600 rounded-xl md:rounded-full text-white font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm text-xs md:text-sm whitespace-nowrap">
              <Plus size={16} strokeWidth={3} />
              New Patient
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => {
             const iconMap = {
               'Users': <Users size={18} />,
               'Activity': <Activity size={18} />,
               'AlertCircle': <AlertTriangle size={18} />,
               'WifiOff': <WifiOff size={18} />
             };

            return (
              <div key={index} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:p-6 shadow-sm">
                <div className="mb-3 flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 shrink-0">
                  {iconMap[stat.icon]}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-lg md:text-2xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                </div>
                <p className="mt-1 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">{stat.label}</p>
              </div>
            )
          })}
        </section>

        {/* Filters and Search Area */}
        <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-6">
          <nav className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 snap-x touch-pan-x min-w-0 no-scrollbar">
            {filters.map((filter) => (
              <button 
                key={filter.id} 
                onClick={() => { setSelectedFilter(filter.id); setCurrentPage(1); }} 
                className={`px-4 md:px-6 py-2 rounded-full text-[11px] md:text-xs font-bold transition-all border whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  selectedFilter === filter.id 
                  ? 'bg-[#2D5F8B] dark:bg-blue-600 text-white border-[#2D5F8B] dark:border-blue-600 shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {filter.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
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
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 rounded-xl md:rounded-full border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 outline-none transition-all text-[13px] font-medium text-slate-600 dark:text-slate-300 shadow-sm" 
            />
          </div>
        </div>

        {/* Patient Directory Table & Cards */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="border-b border-slate-50 dark:border-slate-800 p-4 md:p-5 flex justify-between items-center">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100">Patient Directory</h3>
            <span className="text-[10px] md:text-xs font-medium text-slate-400 dark:text-slate-500">Showing {filteredPatients.length} records</span>
          </div>

          {paginated.length === 0 ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-600 mb-4">
                  <Search size={48} strokeWidth={1.5} />
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200 text-center">No Patients Found</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center px-4">Try adjusting your filters or search query.</p>
              </div>
            </div>
          ) : (
            <>
              {/* --- MOBILE CARD VIEW --- */}
              <div className="block md:hidden divide-y divide-slate-50 dark:divide-slate-800/50">
                {paginated.map((patient) => {
                  const statusConfig = getStatusConfig(patient.status);
                  return (
                    <div key={patient.id} className={`${isCompact ? 'p-3 space-y-3' : 'p-4 space-y-4'} hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`${isCompact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shadow-sm shrink-0`}>
                            {patient.initials}
                          </div>
                          <div className="min-w-0">
                            <div className={`font-bold text-slate-700 dark:text-slate-200 truncate ${isCompact ? 'text-xs' : 'text-sm'}`}>
                              <PrivacyMask defaultVisible={false}>{patient.name}</PrivacyMask>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">ID: {patient.id.substring(0, 8)} • Age: {patient.age}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className={`flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-lg ${isCompact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                          <p className={`font-mono font-bold ${isCompact ? 'text-xs' : 'text-sm'} ${getScoreColor(patient.score)}`}>
                            {patient.score}
                          </p>
                        </div>
                        <div className={`flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-lg ${isCompact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sync</p>
                          <p className={`font-bold text-slate-600 dark:text-slate-300 truncate text-right ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>{patient.lastActive}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedPatient({ id: patient.id, name: patient.name })} 
                        className={`w-full flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm ${isCompact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2.5 text-xs'}`}
                      >
                        Live View
                        <ArrowRight size={isCompact ? 12 : 14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* --- DESKTOP TABLE VIEW --- */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className={`${isCompact ? 'px-4 py-2 text-[9px]' : 'px-6 py-4 text-[10px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-all`}>Patient</th>
                      <th className={`${isCompact ? 'px-4 py-2 text-[9px]' : 'px-6 py-4 text-[10px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-all`}>Status</th>
                      <th className={`${isCompact ? 'px-4 py-2 text-[9px]' : 'px-6 py-4 text-[10px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-all`}>Risk Score</th>
                      <th className={`${isCompact ? 'px-4 py-2 text-[9px]' : 'px-6 py-4 text-[10px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-all`}>Last Sync</th>
                      <th className={`${isCompact ? 'px-4 py-2 text-[9px]' : 'px-6 py-4 text-[10px]'} text-right font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-all`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {paginated.map((patient) => {
                      const statusConfig = getStatusConfig(patient.status);
                      return (
                        <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className={`${isCompact ? 'px-4 py-2' : 'px-6 py-4'} transition-all`}>
                            <div className="flex items-center gap-4">
                              <div className={`${isCompact ? 'w-8 h-8 text-xs rounded-lg' : 'w-10 h-10 text-sm rounded-xl'} bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shadow-sm shrink-0 transition-all`}>
                                {patient.initials}
                              </div>
                              <div>
                                <div className={`font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap transition-all ${isCompact ? 'text-xs' : 'text-sm'}`}>
                                  <PrivacyMask defaultVisible={false}>{patient.name}</PrivacyMask>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">ID: {patient.id.substring(0, 8)} • Age: {patient.age}</p>
                              </div>
                            </div>
                          </td>
                          <td className={`${isCompact ? 'px-4 py-2' : 'px-6 py-4'} transition-all`}>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${statusConfig.bg} ${statusConfig.text}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className={`${isCompact ? 'px-4 py-2' : 'px-6 py-4'} transition-all`}>
                            <div className="flex items-center gap-3 max-w-[140px]">
                              <span className={`font-mono font-bold ${isCompact ? 'text-xs' : 'text-sm'} ${getScoreColor(patient.score)} transition-all`}>
                                {patient.score}
                              </span>
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${getScoreColor(patient.score).replace('text-', 'bg-')}`} style={{ width: `${patient.score}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className={`${isCompact ? 'px-4 py-2' : 'px-6 py-4'} transition-all`}>
                            <div className="flex flex-col">
                              <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap transition-all`}>
                                {patient.lastSensorSync ? new Date(patient.lastSensorSync).toLocaleDateString() : 'N/A'}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 mt-0.5">{patient.lastActive}</span>
                            </div>
                          </td>
                          <td className={`${isCompact ? 'px-4 py-2' : 'px-6 py-4'} text-right transition-all`}>
                            <button 
                              onClick={() => setSelectedPatient({ id: patient.id, name: patient.name })} 
                              className={`inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap ${isCompact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'}`}
                            >
                              Live View
                              <ArrowRight size={isCompact ? 12 : 14} />
                            </button>
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
                className={`flex items-center gap-1 text-xs md:text-sm font-bold px-3 md:px-4 py-2 rounded-lg border ${currentPage === 1 ? 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 pointer-events-none' : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm'}`}
              >
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} 
                disabled={currentPage >= totalPages} 
                className={`flex items-center gap-1 text-xs md:text-sm font-bold px-3 md:px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 pointer-events-none' : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm'}`}
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>

        {/* --- LIVE TELEMETRY MODAL --- */}
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setSelectedPatient(null)}></div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95dvh] overflow-hidden relative flex flex-col border border-slate-200 dark:border-slate-800">
               <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 md:px-6 py-4 flex justify-between items-center z-10 sticky top-0">
                 <div className="flex items-center gap-3 md:gap-4 min-w-0">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs md:text-sm shadow-sm shrink-0">
                      {selectedPatient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                   </div>
                   <div className="min-w-0">
                     <h2 className="text-sm md:text-lg font-extrabold text-slate-900 dark:text-white truncate tracking-tight">Live Telemetry</h2>
                     <p className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 truncate">ID: {selectedPatient.id}</p>
                   </div>
                 </div>
                 <button onClick={() => setSelectedPatient(null)} className="p-3 -mr-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors shrink-0">
                   <X size={20} />
                 </button>
               </div>
               <div className="p-2 md:p-6 overflow-y-auto no-scrollbar">
                 <SmartDashboard patientName={selectedPatient.name} patientId={selectedPatient.id} />
               </div>
            </div>
          </div>
        )}

        {/* --- REGISTRATION MODAL --- */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90dvh] overflow-y-auto relative border border-slate-100 dark:border-slate-800 no-scrollbar">
               <div className="flex justify-between items-start mb-6">
                 <div className="min-w-0 text-left">
                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Register Patient</h2>
                    <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Create a secure profile for telemetry tracking.</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-3 -mr-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 dark:hover:text-slate-200 shrink-0">
                   <X size={20} />
                 </button>
               </div>
               
               {registrationMessage.text && (
                <div className={`mb-6 p-4 rounded-xl text-xs md:text-sm font-bold flex items-center gap-3 ${registrationMessage.type === 'error' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'}`}>
                  {registrationMessage.type === 'error' ? <AlertTriangle size={16} className="shrink-0"/> : <CheckCircle size={16} className="shrink-0"/>}
                  {registrationMessage.text}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                    <input type="text" {...register("fullName")} className={`w-full px-4 py-2.5 bg-white dark:bg-slate-950 rounded-xl border focus:ring-4 outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm ${errors.fullName ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-100 dark:focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-slate-100 dark:focus:ring-slate-800'}`} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                    <input type="email" {...register("email")} className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm" placeholder="john@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Password <span className="text-rose-500">*</span></label>
                    <input type="password" {...register("password")} className={`w-full px-4 py-2.5 bg-white dark:bg-slate-950 rounded-xl border focus:ring-4 outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm ${errors.password ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-100 dark:focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-slate-100 dark:focus:ring-slate-800'}`} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Phone <span className="text-rose-500">*</span></label>
                    <input type="tel" {...register("phoneNumber")} className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Age <span className="text-rose-500">*</span></label>
                    <input type="number" {...register("age")} className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Gender <span className="text-rose-500">*</span></label>
                    <select {...register("gender")} className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">OA Diagnosis</label>
                    <select {...register("oaDiagnosis")} className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Activity Level <span className="text-rose-500">*</span></label>
                    <select {...register("activityLevel")} className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm">
                      <option value="">Select</option>
                      <option value="Sedentary">Sedentary</option>
                      <option value="Light">Light</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => { setShowModal(false); reset(); }} className="w-full md:flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors order-2 md:order-1 text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-70 transition-colors shadow-sm order-1 md:order-2 text-sm">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Register'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}