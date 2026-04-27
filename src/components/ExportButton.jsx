'use client';

import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import BiomechanicalReportTemplate from './BiomechanicalReportTemplate';

export default function ExportButton({ 
  patientId, 
  patientName, 
  clinicianName, 
  deviceMac, 
  mrn, 
  riskThreshold, 
  className 
}) {
  const threshold = riskThreshold || 75;
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [fetchedLogs, setFetchedLogs] = useState([]); 
  const reportRef = useRef();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // 1. Fetch the logs on-demand from your API route
      const response = await fetch(`/api/patient/${patientId}/export`);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const { logs } = await response.json();

      if (!logs || logs.length === 0) {
        alert("No data available to export for this patient.");
        setIsExporting(false);
        return;
      }

      // Update state with fetched logs for the template
      setFetchedLogs(logs);

      // 2. Import html2pdf dynamically
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Small delay to ensure the template renders the new data
      await new Promise(resolve => setTimeout(resolve, 400));

      const element = reportRef.current;
      const safeName = (patientName || 'Patient').replace(/[^a-z0-9]/gi, '_');
      const dateString = new Date().toLocaleDateString().replace(/\//g, '-');

      const opt = {
        margin:       0.5,
        filename:     `KneuraSense_Report_${safeName}_${dateString}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true }, 
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to generate PDF report.");
    } finally {
      setIsExporting(false);
    }
  };

  const patientData = {
    name: patientName || "N/A",
    id: mrn || "No MRN",
    deviceId: deviceMac || "Not Assigned",
    physician: clinicianName || "Not Assigned"
  };

  // Metrics calculated from the newly fetched logs
  const metrics = {
    totalLogs: fetchedLogs.length,
    meanRisk: fetchedLogs.length ? Math.round(fetchedLogs.reduce((acc, log) => acc + (log.riskScore || 0), 0) / fetchedLogs.length) : 0,
    criticalCount: fetchedLogs.filter(log => log.riskScore >= threshold).length,
    peakForce: fetchedLogs.length ? Math.max(...fetchedLogs.map(log => log.force || 0)) : 0,
    meanSkinTemp: fetchedLogs.length ? (fetchedLogs.reduce((acc, log) => acc + (log.skinTemp || 0), 0) / fetchedLogs.length).toFixed(1) : "N/A",
    avgAmbientTemp: fetchedLogs.length ? (fetchedLogs.reduce((acc, log) => acc + (log.ambientTemp || 0), 0) / fetchedLogs.length).toFixed(1) : "N/A"
  };

  return (
    <>
      <button 
        onClick={handleExport}
        disabled={isExporting}
        className={`flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-all active:scale-95 hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed ${className || "w-full md:w-auto"}`}
      >
        <Download size={16} className={isExporting ? "animate-bounce" : ""} />
        <span>{isExporting ? 'Preparing PDF...' : 'Download PDF'}</span>
      </button>

      {/* Hidden PDF Template Container */}
      {isMounted && (
        <div style={{ position: 'absolute', top: '-9999px', left: 0, width: '8.5in', overflow: 'hidden' }}>
          <BiomechanicalReportTemplate 
            ref={reportRef} 
            patientData={patientData} 
            metrics={metrics} 
            logs={fetchedLogs} 
            riskThreshold={threshold}
          />
        </div>
      )}
    </>
  );
}