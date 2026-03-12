'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PrivacyMask from '@/components/PrivacyMask';
import { Search, ChevronLeft, AlertTriangle, Download } from 'lucide-react';

export default function AllPatientsClient({ patients, clinicianId, isCompact }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

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

  const filters = [
    { id: 'all', label: 'All Patients', count: patients.length },
    { id: 'high-risk', label: 'High Risk', count: patients.filter(p => p.status === 'high-risk').length },
    { id: 'caution', label: 'Caution', count: patients.filter(p => p.status === 'caution').length },
    { id: 'stable', label: 'Stable', count: patients.filter(p => p.status === 'stable').length },
    { id: 'offline', label: 'Offline', count: patients.filter(p => p.status === 'offline').length }
  ];

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchesFilter = selectedFilter === 'all' || p.status === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [patients, searchQuery, selectedFilter]);

  const handleExport = () => {
    if (filteredPatients.length === 0) {
      alert('No patient data to export.');
      return;
    }

    const headers = ['Patient ID', 'Name', 'Email', 'Age', 'Status', 'Risk Score', 'Last Active'];
    const rows = filteredPatients.map(p => [
      p.id,
      `"${p.name}"`,
      `"${p.email}"`,
      p.age,
      p.status,
      p.score,
      p.lastActive
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `all_patients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans antialiased overflow-x-hidden p-3 md:p-5 relative">
      <div className="max-w-[1400px] mx-auto space-y-4">
        
        {/* Header Section */}
        <header className="mb-4 -mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => router.back()}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                <ChevronLeft size={18} className="text-slate-600 dark:text-slate-400" />
              </button>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">All Patients</h1>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-9">View and export your complete patient roster</p>
          </div>
          <button 
            onClick={handleExport} 
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-xs"
          >
            <Download size={14} /> Export CSV
          </button>
        </header>

        {/* Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search by name, email, or ID..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 rounded-lg md:rounded-full border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800 outline-none transition-all text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm" 
          />
        </div>

        {/* Filters */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 snap-x touch-pan-x no-scrollbar">
          {filters.map((filter) => (
            <button 
              key={filter.id} 
              onClick={() => setSelectedFilter(filter.id)} 
              className={`px-3 md:px-5 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all border whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                selectedFilter === filter.id 
                ? 'bg-[#2D5F8B] dark:bg-blue-600 text-white border-[#2D5F8B] dark:border-blue-600 shadow-sm' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {filter.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                selectedFilter === filter.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </nav>

        {/* Patient Table */}
        <section className="-mt-1 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="border-b border-slate-50 dark:border-slate-800 p-3 flex justify-between items-center">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100">Patient Roster</h3>
            <span className="text-[9px] md:text-[10px] font-medium text-slate-400 dark:text-slate-500">Showing {filteredPatients.length} records</span>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="py-16 text-center">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-600 mb-3">
                  <Search size={36} strokeWidth={1.5} />
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">No Patients Found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Try adjusting your filters or search query.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredPatients.map((patient) => {
                  const statusConfig = getStatusConfig(patient.status);
                  return (
                    <div key={patient.id} className={`${isCompact ? 'p-2 space-y-2' : 'p-3 space-y-3'} hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`${isCompact ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs'} rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shadow-sm shrink-0`}>
                            {patient.initials}
                          </div>
                          <div className="min-w-0">
                            <PrivacyMask defaultVisible={false}>
                              <div className={`font-bold text-slate-700 dark:text-slate-200 truncate ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                                {patient.name}
                              </div>
                              <p className="text-[8px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">{patient.email}</p>
                            </PrivacyMask>
                            <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate">ID: {patient.id.substring(0, 8)}</p>
                          </div>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div className={`flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-md ${isCompact ? 'px-1.5 py-1' : 'px-2 py-1.5'}`}>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                          <p className={`font-mono font-bold ${isCompact ? 'text-[10px]' : 'text-xs'} ${getScoreColor(patient.score)}`}>
                            {patient.score}
                          </p>
                        </div>
                        <div className={`flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-md ${isCompact ? 'px-1.5 py-1' : 'px-2 py-1.5'}`}>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Activity</p>
                          <p className={`font-bold text-slate-600 dark:text-slate-300 truncate text-right ${isCompact ? 'text-[8px]' : 'text-[9px]'}`}>{patient.lastActive}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className={`${isCompact ? 'px-3 py-1.5 text-[8px]' : 'px-4 py-2 text-[9px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>Patient</th>
                      <th className={`${isCompact ? 'px-3 py-1.5 text-[8px]' : 'px-4 py-2 text-[9px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>Age</th>
                      <th className={`${isCompact ? 'px-3 py-1.5 text-[8px]' : 'px-4 py-2 text-[9px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>Status</th>
                      <th className={`${isCompact ? 'px-3 py-1.5 text-[8px]' : 'px-4 py-2 text-[9px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>Risk Score</th>
                      <th className={`${isCompact ? 'px-3 py-1.5 text-[8px]' : 'px-4 py-2 text-[9px]'} font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {filteredPatients.map((patient) => {
                      const statusConfig = getStatusConfig(patient.status);
                      return (
                        <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-3'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`${isCompact ? 'w-6 h-6 text-[10px] rounded-md' : 'w-8 h-8 text-xs rounded-lg'} bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shadow-sm shrink-0`}>
                                {patient.initials}
                              </div>
                              <PrivacyMask defaultVisible={false}>
                                <div>
                                  <div className={`font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                                    {patient.name}
                                  </div>
                                  <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{patient.email}</p>
                                  <p className="text-[9px] font-medium text-slate-400 mt-0.5">ID: {patient.id.substring(0, 8)}</p>
                                </div>
                              </PrivacyMask>
                            </div>
                          </td>
                          <td className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-3'}`}>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{patient.age}</span>
                          </td>
                          <td className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-3'}`}>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${statusConfig.bg} ${statusConfig.text}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-3'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${isCompact ? 'text-[10px]' : 'text-xs'} ${getScoreColor(patient.score)}`}>
                                {patient.score}
                              </span>
                              <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${getScoreColor(patient.score).replace('text-', 'bg-')}`} style={{ width: `${patient.score}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-3'}`}>
                            <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-semibold text-slate-600 dark:text-slate-300`}>
                              {patient.lastActive}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}