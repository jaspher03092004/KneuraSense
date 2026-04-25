// src/components/ExportCsvButton.jsx
'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';

export default function ExportCsvButton({ logs, patientName, className }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!logs || logs.length === 0) return alert("No data available to export.");
    setIsExporting(true);

    try {
      const headers = ['Timestamp', 'Risk Score', 'AI State', 'Knee Angle (°)', 'Force (N)', 'Skin Temp (°C)', 'Ambient Temp (°C)', 'BPM', 'Battery (%)'];
      
      const csvRows = logs.map(log => {
        const date = new Date(log.timestamp).toLocaleString().replace(/,/g, '');
        return [
          date, log.riskScore || 0, log.aiState || 'Unknown', log.angle || 0,
          log.force || 0, log.skinTemp || 0, log.ambientTemp || 0, log.bpm || 0, log.battery || 0
        ].join(','); 
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const safeName = (patientName || 'Patient').replace(/[^a-z0-9]/gi, '_');
      const dateString = new Date().toLocaleDateString().replace(/\//g, '-');
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KneuraSense_Data_${safeName}_${dateString}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("CSV Export failed:", error);
      alert("Failed to generate CSV report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={isExporting}
      className={`flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-all active:scale-95 hover:bg-emerald-700 disabled:opacity-70 ${className || "w-full md:w-auto"}`}
    >
      <FileSpreadsheet size={16} className={isExporting ? "animate-pulse" : ""} />
      <span>{isExporting ? 'Exporting CSV...' : 'Download CSV'}</span>
    </button>
  );
}