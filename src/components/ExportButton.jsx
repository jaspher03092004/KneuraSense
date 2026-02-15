'use client';

import { Download } from 'lucide-react';

export default function ExportButton({ logs, patientName }) {
  const handleExport = () => {
    if (!logs || logs.length === 0) {
      alert("No data available to export.");
      return;
    }

    // 1. Define the CSV Column Headers
    const headers = [
      "Timestamp",
      "Risk Score",
      "Knee Angle (deg)",
      "Applied Force (N)",
      "Heart Rate (BPM)",
      "Skin Temp (C)",
      "Ambient Temp (C)",
      "Pressure (hPa)",
      "Latitude",
      "Longitude"
    ];

    // 2. Map the data into CSV rows
    const csvRows = logs.map(log => {
      // Format the date so Excel reads it cleanly (removing commas that break CSVs)
      const dateStr = new Date(log.timestamp).toLocaleString().replace(/,/g, '');
      
      return [
        dateStr,
        log.riskScore,
        log.angle,
        log.force,
        log.bpm || 0,
        log.skinTemp,
        log.ambientTemp || 0,
        log.pressure || 0,
        log.lat || 0,
        log.lng || 0
      ].join(',');
    });

    // 3. Combine headers and rows
    const csvString = [headers.join(','), ...csvRows].join('\n');

    // 4. Create a downloadable Blob object
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 5. Create a hidden HTML link, click it automatically, and clean it up
    const link = document.createElement('a');
    link.href = url;
    
    // Create a clean filename (e.g., KneuraSense_Export_juan_dela_cruz_2026-02-15.csv)
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
      className="flex h-11 flex-1 md:flex-none items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-lg transition-transform active:scale-95 hover:bg-slate-800"
    >
      <Download size={16} />
      <span>Export</span>
    </button>
  );
}