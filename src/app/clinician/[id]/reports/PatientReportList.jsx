'use client';

import { useState, useMemo } from 'react';
import { Users, Search, FileDown, Calendar } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import ExportCsvButton from '@/components/ExportCsvButton';

export default function PatientReportList({ patients }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // NEW: Date range state for filtering exports
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Automatically filter the list as the user types
  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    
    const query = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.fullName.toLowerCase().includes(query) || 
      (p.mrn && p.mrn.toLowerCase().includes(query))
    );
  }, [patients, searchQuery]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* HEADER & CONTROLS */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-slate-500" />
            Patient Data Export
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Select a date range and download patient reports.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* NEW: Date Range Pickers */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 px-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm w-full sm:w-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-xs bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 p-1"
            />
            <span className="text-slate-300">|</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-xs bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 p-1"
            />
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* PATIENT LIST */}
      <div className="p-3">
        {filteredPatients.length === 0 ? (
          <div className="p-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center flex flex-col items-center justify-center">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {searchQuery ? "No matching patients found" : "No Patients Found"}
            </h3>
            {!searchQuery && (
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Register patients to your dashboard to see them here.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredPatients.map(patient => (
              <div 
                key={patient.id} 
                className="flex flex-col xl:flex-row xl:items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800/50">
                    {patient.fullName.charAt(0).toUpperCase() /* From Patient Model cite: 2 */}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-none">
                      {patient.fullName /* From Patient Model cite: 2 */} 
                      <span className="text-slate-400 font-normal ml-1">
                        ({patient.mrn || 'No MRN' /* From Patient Model cite: 2 */})
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {patient._count?.sensorLogs?.toLocaleString() || 0} total logs available
                    </p>
                  </div>
                </div>
                
                <div className="shrink-0 flex gap-2">
                  <ExportButton 
                    patientId={patient.id} 
                    patientName={patient.fullName} 
                    mrn={patient.mrn}
                    deviceMac={patient.deviceMac}
                    riskThreshold={patient.riskThreshold}
                    clinicianName={patient.clinician?.full_name}
                    startDate={dateRange.start} // Pass range to PDF generator
                    endDate={dateRange.end}     // Pass range to PDF generator
                    className="text-xs py-1.5 px-3"
                  />
                  <ExportCsvButton 
                    patientId={patient.id} 
                    patientName={patient.fullName} 
                    startDate={dateRange.start} // Pass range to CSV generator
                    endDate={dateRange.end}     // Pass range to CSV generator
                    className="text-xs py-1.5 px-3" 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}