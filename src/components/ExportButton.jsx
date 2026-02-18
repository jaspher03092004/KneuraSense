'use client';

import { Download } from 'lucide-react';

export default function ExportButton({ logs, patientName }) {
  const handleExport = () => {
    if (!logs || logs.length === 0) {
      alert("No data available to export.");
      return;
    }

    // 1. Use descriptive headers with units for clarity
    const headers = [
      "Date & Time", 
      "Risk Level (0-100)", 
      "Knee Bend (Degrees)", 
      "Applied Pressure (Newtons)",
      "Heart Rate (BPM)", 
      "Skin Temperature (°C)", 
      "Room Temperature (°C)", 
      "Atmospheric Pressure (hPa)"
    ];

    const csvRows = logs.map(log => {
      // 2. Format the date to be human-readable (e.g., "Feb 19, 2026, 7:30 AM")
      const dateStr = new Date(log.timestamp).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).replace(/,/g, '');

      // 3. Round values and provide defaults to avoid confusing "0" or "null"
      return [
        dateStr, 
        log.riskScore, 
        log.angle.toFixed(1), // Show only 1 decimal place
        log.force, 
        log.bpm || "N/A",      // Use "N/A" instead of 0 for missing data
        log.skinTemp.toFixed(1), 
        log.ambientTemp ? log.ambientTemp.toFixed(1) : "N/A", 
        log.pressure ? Math.round(log.pressure) : "N/A"
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    
    // 4. Use a clear, descriptive filename
    const safeName = patientName.replace(/[^a-z0-9]/gi, '_');
    const dateString = new Date().toLocaleDateString().replace(/\//g, '-');
    link.download = `KneuraSense_Report_${safeName}_${dateString}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={handleExport}
      className="flex h-11 w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-all active:scale-95 hover:bg-slate-800 dark:hover:bg-blue-700"
    >
      <Download size={16} />
      <span>Download Report</span>
    </button>
  );
}