'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';

export default function ExportCsvButton({ patientId, patientName, startDate, endDate, className }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // 1. Fetch the 10,000 logs on-demand
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await fetch(`/api/patient/${patientId}/export${queryString}`);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const { logs } = await response.json();

      if (!logs || logs.length === 0) {
        alert("No data available to export.");
        setIsExporting(false);
        return;
      }

      // 2. Generate CSV with expanded field set
      const headers = ['Patient ID', 'Timestamp', 'Angle (°)', 'Force (N)', 'Skin Temp (°C)', 'Battery (%)', 'Risk Score', 'Weather Temp (°C)', 'Ambient Temp (°C)', 'BPM', 'Pressure', 'Shank Pitch (°)', 'Thigh Pitch (°)', 'AI State', 'Offline Mode', 'WiFi SSID'];
      
      const csvRows = logs.map(log => {
        const date = new Date(log.timestamp).toLocaleString().replace(/,/g, '');
        return [
          patientId,
          date, 
          log.angle || 0, 
          log.force || 0, 
          log.skinTemp || 0, 
          log.battery || 0, 
          log.riskScore || 0, 
          log.weatherTemp || 0, 
          log.ambientTemp || 0, 
          log.bpm || 0, 
          log.pressure || 0,
          log.shankPitch || 0,
          log.thighPitch || 0,
          log.aiState || 'Unknown', 
          log.offlineMode || false,
          log.wifiSsid || 'N/A'
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
      alert("Failed to generate CSV report. The server might be busy.");
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
      <span>{isExporting ? 'Fetching Logs...' : 'Download CSV'}</span>
    </button>
  );
}