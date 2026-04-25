'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSystemAuditLogs } from '@/actions/admin';
import { 
  ShieldCheck, Search, Filter, Download, Activity, 
  Key, FileWarning, Clock, User, Server, X, Globe, Terminal
} from 'lucide-react';

export default function SystemAudit() {
  const [auditData, setAuditData] = useState({ logs: [], stats: { totalLogs: 0, criticalActions: 0, loginEvents: 0 } });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchLogs = async () => {
      const result = await getSystemAuditLogs();
      if (result.success) setAuditData(result.data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    let filtered = auditData.logs;

    if (severityFilter === 'CRITICAL') {
      filtered = filtered.filter(l => ['DELETE', 'EXPORT', 'REVOKE', 'SUSPEND'].some(k => l.action.toUpperCase().includes(k)));
    } else if (severityFilter === 'INFO') {
      filtered = filtered.filter(l => !['DELETE', 'EXPORT', 'REVOKE', 'SUSPEND'].some(k => l.action.toUpperCase().includes(k)));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query) ||
        log.ipAddress?.includes(query) ||
        log.clinician?.full_name?.toLowerCase().includes(query) ||
        log.clinician?.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [auditData.logs, searchQuery, severityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    if (filteredLogs.length === 0) return alert("No logs to export.");
    const headers = ['Timestamp', 'Action', 'Actor', 'Target/Details', 'IP Address'];
    const rows = filteredLogs.map(l => [
      `"${new Date(l.createdAt).toLocaleString()}"`,
      `"${l.action}"`,
      `"${l.clinician?.full_name || 'System'}"`,
      `"${l.details || 'N/A'}"`,
      `"${l.ipAddress || 'Unknown'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `KneuraSense_Security_Audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getActionBadge = (action) => {
    const a = action.toUpperCase();
    if (a.includes('DELETE') || a.includes('REVOKE') || a.includes('SUSPEND')) {
      return 'bg-rose-50 text-rose-600 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    }
    if (a.includes('EXPORT') || a.includes('UPDATE') || a.includes('EDIT')) {
      return 'bg-amber-50 text-amber-600 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    }
    if (a.includes('LOGIN') || a.includes('AUTH') || a.includes('APPROVE')) {
      return 'bg-blue-50 text-blue-600 border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSeverityFilter('ALL');
    setCurrentPage(1);
  };

  if (loading) return <div className="p-10 animate-pulse bg-slate-50 h-full" />;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 animate-in fade-in duration-500 font-sans antialiased">
      
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-1">
        <div className="space-y-0.5">
          <h1 className="text-xl font-extrabold text-[#2C3E50] dark:text-white tracking-tight">System <span className="text-[#2D5F8B]">Audit</span></h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">HIPAA-compliant security, access, and activity logging.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-[11px]"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </header>

      {/* COMPACT KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          title="Total Events (500)" 
          val={auditData.stats.totalLogs} 
          icon={Activity} 
          cls="text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20" 
        />
        <StatCard 
          title="Critical Actions" 
          val={auditData.stats.criticalActions} 
          icon={FileWarning} 
          cls="text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30" 
          alert={auditData.stats.criticalActions > 0} 
        />
        <StatCard 
          title="Auth Events" 
          val={auditData.stats.loginEvents} 
          icon={Key} 
          cls="text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20" 
        />
        <StatCard 
          title="System Integrity" 
          val="100%" 
          icon={ShieldCheck} 
          cls="text-[#2D5F8B] bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20" 
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        
        {/* Compact Toolbar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
          
          <div className="flex items-center gap-2 w-full sm:w-auto group">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#2D5F8B] transition-colors pointer-events-none" />
              <select 
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-md outline-none focus:border-[#2D5F8B] focus:ring-1 focus:ring-[#2D5F8B] appearance-none shadow-sm cursor-pointer"
              >
                <option value="ALL">All Events</option>
                <option value="CRITICAL">Critical Actions Only</option>
                <option value="INFO">Standard Telemetry</option>
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#2D5F8B] transition-colors pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search user, IP, or action..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-8 py-1.5 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-700 rounded-md text-[11px] font-medium focus:border-[#2D5F8B] focus:ring-1 focus:ring-[#2D5F8B] outline-none transition-all dark:text-white shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* High-Density Audit Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap text-[9px]">Timestamp</th>
                <th className="px-4 py-2.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Event Type</th>
                <th className="px-4 py-2.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Actor</th>
                <th className="px-4 py-2.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Details</th>
                <th className="px-4 py-2.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right text-[9px]">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Terminal className="w-7 h-7 mb-2 opacity-30" />
                      <span className="font-bold text-slate-600 dark:text-slate-300 text-xs">No logs found</span>
                      <span className="text-[11px] mt-0.5 mb-3 italic">Try adjusting your search query or severity filter.</span>
                      {(searchQuery || severityFilter !== 'ALL') && (
                        <button 
                          onClick={clearFilters}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-bold transition-colors text-[10px] flex items-center gap-1.5"
                        >
                          <X className="w-3 h-3" /> Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <Clock className="w-2.5 h-2.5 opacity-70" />
                        {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {log.clinician ? <User className="w-2.5 h-2.5 text-[#2D5F8B] dark:text-blue-400" /> : <Server className="w-2.5 h-2.5 text-slate-400" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-200 text-[11px] leading-tight">{log.clinician?.full_name || 'System Auto'}</div>
                          <div className="text-[9px] text-slate-500 font-medium leading-tight">{log.clinician?.email || 'Internal Process'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium text-[11px]" title={log.details}>
                      <span className="inline-block max-w-[140px] sm:max-w-[180px] md:max-w-[260px] lg:max-w-sm truncate align-middle">
                        {log.details || <span className="text-slate-400 italic">No additional details recorded.</span>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1 font-mono text-[9px] bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded ml-auto">
                        <Globe className="w-2.5 h-2.5 opacity-60" />
                        {log.ipAddress || '0.0.0.0'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-2.5 flex items-center justify-between">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Previous
            </button>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// COMPACT HELPER COMPONENT
const StatCard = ({ title, val, icon: Icon, cls, alert }) => (
  <div className={`bg-white dark:bg-slate-900 p-4 rounded-lg border ${alert ? 'border-rose-200 dark:border-rose-900/50 ring-4 ring-rose-50 dark:ring-rose-900/10' : 'border-slate-200/60 dark:border-slate-800'} transition-all shadow-sm group`}>
    <div className="flex justify-between items-start mb-2">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${cls} shrink-0 transition-transform group-hover:scale-110`}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      {alert && <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter border border-rose-100 dark:border-rose-500/20">Review</span>}
    </div>
    <p className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-0">{title}</p>
    <h4 className="text-2xl font-black text-[#2C3E50] dark:text-white tracking-tight leading-none mt-1">{val}</h4>
  </div>
);