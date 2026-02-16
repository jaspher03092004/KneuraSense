'use client';

import { Download } from 'lucide-react';

export default function ExportButton({ logs, patientName }) {
  const handleExport = () => {
    if (!logs || logs.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Timestamp", "Risk Score", "Knee Angle (deg)", "Applied Force (N)",
      "Heart Rate (BPM)", "Skin Temp (C)", "Ambient Temp (C)", "Pressure (hPa)",
      "Latitude", "Longitude"
    ];

    const csvRows = logs.map(log => {
      const dateStr = new Date(log.timestamp).toLocaleString().replace(/,/g, '');
      return [
        dateStr, log.riskScore, log.angle, log.force, log.bpm || 0,
        log.skinTemp, log.ambientTemp || 0, log.pressure || 0, log.lat || 0, log.lng || 0
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    
    const safeName = patientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dateString = new Date().toISOString().split('T')[0];
    link.download = `KneuraSense_Export_${safeName}_${dateString}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={handleExport}
      className="flex h-11 w-full md:w-auto items-center justify-center gap-2 rounded-xl md:rounded-lg bg-slate-900 dark:bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 hover:bg-slate-800 dark:hover:bg-blue-700"
    >
      <Download size={16} />
      <span>Export</span>
    </button>
  );
}