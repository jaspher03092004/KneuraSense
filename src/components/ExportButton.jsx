'use client';

import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import BiomechanicalReportTemplate from './BiomechanicalReportTemplate';

export default function ExportButton({ logs, patientName, clinicianName, deviceMac, patientId, className }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const reportRef = useRef();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExport = async () => {
    if (!logs || logs.length === 0) {
      alert("No data available to export.");
      return;
    }

    setIsExporting(true);

    try {
      // Import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      
      const safeName = (patientName || 'Patient').replace(/[^a-z0-9]/gi, '_');
      const dateString = new Date().toLocaleDateString().replace(/\//g, '-');

      // html2pdf Options
      const opt = {
        margin:       0.5, // Adds a 0.5-inch margin to EVERY page automatically
        filename:     `KneuraSense_Report_${safeName}_${dateString}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true }, 
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] } // Enables CSS page breaks
      };

      // Generate the visual PDF (NO CSV logic here)
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to generate PDF report.");
    } finally {
      setIsExporting(false);
    }
  };

  // Auto-calculate metrics
  const metrics = {
    totalLogs: logs?.length || 0,
    meanRisk: logs?.length ? Math.round(logs.reduce((acc, log) => acc + (log.riskScore || 0), 0) / logs.length) : 0,
    criticalCount: logs?.filter(log => log.riskScore >= 75).length || 0,
    peakForce: logs?.length ? Math.max(...logs.map(log => log.force || 0)) : 0,
    meanSkinTemp: logs?.length ? (logs.reduce((acc, log) => acc + (log.skinTemp || 0), 0) / logs.length).toFixed(1) : "N/A",
    avgAmbientTemp: logs?.length ? (logs.reduce((acc, log) => acc + (log.ambientTemp || 0), 0) / logs.length).toFixed(1) : "N/A"
  };

  const patientData = {
    name: patientName || "N/A",
    id: patientId || ("KN-" + Math.floor(Math.random() * 90000 + 10000)),
    deviceId: deviceMac || "Not Assigned",
    physician: clinicianName || "Not Assigned"
  };

  return (
    <>
      <button 
        onClick={handleExport}
        disabled={isExporting}
        className={`flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-all active:scale-95 hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed ${className || "w-full md:w-auto"}`}
      >
        <Download size={16} className={isExporting ? "animate-bounce" : ""} />
        <span>{isExporting ? 'Generating PDF...' : 'Download Report'}</span>
      </button>

      {/* Hidden PDF Template Container */}
      {isMounted && (
        <div style={{ position: 'absolute', top: '-9999px', left: 0, width: '8.5in', overflow: 'hidden' }}>
          <BiomechanicalReportTemplate 
            ref={reportRef} 
            patientData={patientData} 
            metrics={metrics} 
            logs={logs} 
          />
        </div>
      )}
    </>
  );
}