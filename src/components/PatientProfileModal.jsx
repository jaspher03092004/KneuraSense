'use client';

import { User, Activity, AlertCircle, Share2, Download, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { calculateAge, calculateBMI, getBMICategory } from '@/lib/utils'; // <-- Added import

export default function PatientProfileModal({ isOpen, onClose, patient }) {
  if (!isOpen || !patient) return null;

  // REMOVED local calculateAge, calculateBMI, and getBMICategory functions

  const handleDownloadRecord = () => {
    const doc = new jsPDF();
    let y = 20;
    const lineHeight = 8;
    const leftMargin = 20;

    const addSectionHeader = (title) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(45, 95, 139); 
      doc.text(title, leftMargin, y);
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, y, 190, y);
      y += 6;
      doc.setTextColor(0, 0, 0); 
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("KNEURASENSE MEDICAL RECORD", leftMargin, y);
    y += lineHeight;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, leftMargin, y);
    y += lineHeight * 1.5;

    // Sections
    addSectionHeader("1. PATIENT DEMOGRAPHICS");
    doc.text(`Name: ${patient.fullName}`, leftMargin, y); y += lineHeight;
    doc.text(`MRN: ${patient.mrn || 'N/A'}`, leftMargin, y); y += lineHeight;
    doc.text(`Date of Birth: ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'} (Age: ${calculateAge(patient.dateOfBirth)})`, leftMargin, y); y += lineHeight;
    doc.text(`Gender: ${patient.gender || 'N/A'}`, leftMargin, y); y += lineHeight;
    doc.text(`Phone: ${patient.phoneNumber || 'N/A'}`, leftMargin, y); y += lineHeight;
    doc.text(`Email: ${patient.email}`, leftMargin, y); y += lineHeight * 1.2;
    doc.text(`Occupation: ${patient.occupation || 'N/A'}`, leftMargin, y);

    const bmi = calculateBMI(patient.weightKg, patient.heightCm);
    const bmiCat = getBMICategory(bmi);

    addSectionHeader("2. BIOMETRICS");
    doc.text(`Height: ${patient.heightCm ? patient.heightCm + ' cm' : 'N/A'}`, leftMargin, y); y += lineHeight;
    doc.text(`Weight: ${patient.weightKg ? patient.weightKg + ' kg' : 'N/A'}`, leftMargin, y); y += lineHeight;
    doc.text(`BMI: ${bmi ? `${bmi} (${bmiCat})` : 'N/A'}`, leftMargin, y); y += lineHeight * 1.2;

    addSectionHeader("3. MEDICAL CONTEXT");
    doc.text(`OA Diagnosis: ${patient.oaDiagnosis ? 'Yes' : 'No'}`, leftMargin, y); y += lineHeight;
    doc.text(`Affected Knee: ${patient.affectedKnee || 'N/A'}`, leftMargin, y); y += lineHeight;
    doc.text(`Activity Level: ${patient.activityLevel || 'N/A'}`, leftMargin, y); y += lineHeight * 1.2;

    addSectionHeader("4. EMERGENCY CONTACT");
    doc.text(`Name: ${patient.emergencyContactName || 'None Provided'}`, leftMargin, y); y += lineHeight;
    doc.text(`Phone: ${patient.emergencyContactPhone || 'N/A'}`, leftMargin, y); y += lineHeight * 1.2;

    addSectionHeader("5. HARDWARE & PREFERENCES");
    doc.text(`Device ID: ${patient.deviceMac || 'Unassigned'}`, leftMargin, y); y += lineHeight;
    doc.text(`Risk Threshold Target: ${patient.riskThreshold ?? 75}`, leftMargin, y); y += lineHeight;

    const safeName = patient.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Medical_Record_${safeName}_${dateStr}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-5 md:p-6 max-w-2xl w-full max-h-[90dvh] overflow-y-auto relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
         
         <div className="flex justify-between items-start mb-6">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#2D5F8B] dark:text-blue-400 font-bold text-xl border border-blue-100 dark:border-blue-800 shrink-0">
                {patient.fullName.charAt(0)}
              </div>
              <div className="min-w-0 text-left">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">{patient.fullName}</h2>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">MRN: {patient.mrn || 'PENDING'}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 -mr-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 shrink-0">
             <X size={18} />
           </button>
         </div>
         
         <div className="space-y-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Demographics */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-[#2D5F8B] dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><User size={14}/> Demographics</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">DOB (Age)</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'} ({calculateAge(patient.dateOfBirth)})</span></p>
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Gender</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.gender || 'N/A'}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Phone</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.phoneNumber || 'N/A'}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Email</span> <span className="font-semibold text-slate-900 dark:text-slate-200 truncate ml-4" title={patient.email}>{patient.email}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Occupation</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.occupation || 'Not specified'}</span></p>
                </div>
              </div>

              {/* Biometrics */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Activity size={14}/> Biometrics</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Height</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.heightCm ? `${patient.heightCm} cm` : 'N/A'}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Weight</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.weightKg ? `${patient.weightKg} kg` : 'N/A'}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">BMI</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{calculateBMI(patient.weightKg, patient.heightCm) ? `${calculateBMI(patient.weightKg, patient.heightCm)} (${getBMICategory(calculateBMI(patient.weightKg, patient.heightCm))})` : 'N/A'}</span></p>
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                     <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Activity Level</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.activityLevel || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              {/* Medical & Device */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-[#3A9D8C] dark:text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><AlertCircle size={14}/> Medical Context</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">OA Diagnosis</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.oaDiagnosis ? 'Yes' : 'No'}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Affected Knee</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.affectedKnee || 'N/A'}</span></p>
                  <p className="flex justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700"><span className="text-slate-500 dark:text-slate-400">Device ID</span> <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{patient.deviceMac || 'None'}</span></p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Share2 size={14}/> Emergency Contact</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex flex-col"><span className="text-slate-500 dark:text-slate-400 text-xs">Contact Name</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.emergencyContactName || 'None Provided'}</span></p>
                  <p className="flex flex-col mt-2"><span className="text-slate-500 dark:text-slate-400 text-xs">Phone Number</span> <span className="font-semibold text-slate-900 dark:text-slate-200">{patient.emergencyContactPhone || 'N/A'}</span></p>
                </div>
              </div>
           </div>

           <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors text-sm">
               Close
             </button>
             <button onClick={handleDownloadRecord} className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-md hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm text-sm">
               <Download size={16} /> Download Medical PDF
             </button>
           </div>
         </div>
      </div>
    </div>
  );
}