'use client';

import { useState } from 'react';
import { 
  Search, ChevronRight, Mail, Phone, 
  FileText, Users, Activity, Database, 
  HelpCircle, Stethoscope, BookOpen
} from 'lucide-react';

export default function ClinicianHelpClient({ clinician }) {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { title: "Clinical Validity", icon: Activity, desc: "Understanding the Overuse Risk Score and algorithms." },
    { title: "Patient Management", icon: Users, desc: "Onboarding, sensor calibration, and alerts." },
    { title: "RPM Billing & Compliance", icon: FileText, desc: "Time tracking for CPT codes (99453, 99454, 99457)." },
    { title: "EHR Integration", icon: Database, desc: "Exporting CSVs and PDF reports for patient records." }
  ];

  const allFaqs = [
    { q: "How and when should a patient's device be calibrated?", a: "Calibration (Zeroing) is crucial for accurate joint kinematics. It should be done whenever the patient puts the device on or repositions it. Instruct the patient to stand perfectly straight with weight evenly distributed. From their Live Telemetry dashboard, click 'SET STANDING BASELINE'. They must remain entirely still for 5 seconds to establish a true 0-degree anatomical baseline." },
    { q: "How is the Overuse Risk Score calculated?", a: "The score is derived from a proprietary Edge AI model that fuses joint kinematics (flexion/extension angles) with applied force (FSR data) and physiological stress indicators (heart rate, skin temperature). It compares real-time load against the patient's calibrated baseline." },
    { q: "How do I register a new patient?", a: "Navigate to the 'Patients Management' tab and click 'Register New'. You will need their email address and the MAC address of their assigned KneuraSense device. An invitation will be sent to their email to complete setup." },
    { q: "How do I assign an existing patient to my care list?", a: "If a patient is already registered in the KneuraSense system, go to your Patient Management and input the patient's unique Patient registered email address to request access to their telemetry data." },
    { q: "How do I customize a patient's risk threshold?", a: "From the patient's individual profile, locate the Clinical Threshold Manager section. Use the slider to adjust the Clinical Baseline Threshold, which prescribes the Overuse Risk Score limit for that specific patient (defaults to 75 if not previously set). If the patient's device is online, clicking Update Prescription will instantly sync the new limit to the device otherwise, it will sync automatically the next time the device connects." },
    { q: "Which CPT codes can I bill for using KneuraSense?", a: "KneuraSense supports Remote Patient Monitoring (RPM) workflows. You can typically bill CPT 99453 for initial setup, CPT 99454 for monthly device supply (requires 16 days of data transmission), and CPT 99457/99458 for clinical time spent reviewing the data. Please consult your billing department for compliance." },
    { q: "How do I export data to my EHR system?", a: "Go to a patient's individual profile and click 'Export Report' in the top right corner. You can download a HIPAA-compliant PDF summary of their monthly progress, or a raw CSV file of their telemetry data to attach to their EHR." },
    { q: "How do I assign a new Intervention or Care Plan?", a: "From the patient's detailed view, navigate to the 'Interventions' tab and click 'Add New'. You can add internal clinical notes, as well as patient-friendly instructions. The patient will be forced to acknowledge this update the next time they log in." },
    { q: "What triggers a 'Critical Alert' on my dashboard?", a: "A patient will flag as a Critical Alert if their Overuse Risk Score exceeds 80 for more than 5 consecutive minutes, indicating severe joint stress that requires immediate intervention or activity modification." },
    { q: "How do I transfer a patient to another clinician?", a: "From the Patient Directory, locate the patient card and click the Share icon (top right). Select 'Transfer to another clinician' and enter the email address of the clinician you wish to transfer the patient to. Once confirmed, the receiving clinician must accept the transfer request. The patient's historical data and device assignment will be transferred along with them." },
    { q: "What happens when I transfer a patient to another clinician?", a: "When you transfer a patient, the receiving clinician gains full access to their Live Dashboard, Historical Data, Interventions, and Clinical Thresholds. You will no longer have access to the patient's real-time data or be able to modify their settings. However, all historical data and clinical notes remain intact for continuity of care." },
    { q: "How do I release a patient from my care?", a: "From the Patient Directory, locate the patient card and click the Share icon. Select 'Release patient' and confirm the action. The patient will be unassigned from your clinic and will become available for any other clinician in the KneuraSense network to request access. The patient retains all their data and device assignments." },
    { q: "What is the difference between transferring and releasing a patient?", a: "Transferring assigns the patient's care to a specific clinician via email address, maintaining continuity of care. Releasing unassigns the patient, making them available for any clinician to request access. Use Transfer when moving a patient to a specific colleague, use Release when you no longer need to monitor them or when they're ending care with your clinic." },
    { q: "Can I transfer a patient back if I change my mind?", a: "Yes. If you released a patient and want to reassign them, go to the 'Assign Existing' button and enter their email address to request access again. If you transferred a patient to another clinician and want to get them back, contact that clinician to initiate a reverse transfer to you. Both clinicians must cooperate for the reversal." },
    { q: "What happens to a patient's device when they are transferred?", a: "The device MAC address and all sensor data remain assigned to the patient and are transferred along with them. The receiving clinician will have immediate access to live sensor readings and historical telemetry. If the device was offline at the time of transfer, it will automatically sync with the new clinician's account the next time it connects to the network." },
    { q: "Can I see data from patients I've released?", a: "No. Once a patient is released, you lose access to all real-time data and the ability to view their dashboard. Historical data you collected while they were in your care remains in the system for audit and compliance purposes, but you cannot actively monitor their status anymore." }
  ];

  const filteredFaqs = allFaqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-yellow-100 rounded-sm px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="pb-16 pt-8">
      <div className="px-6 text-center max-w-4xl mx-auto mb-16">
        <div className="w-16 h-16 bg-[#2D5F8B] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
          <Stethoscope size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Clinician Knowledge Base
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg mb-10 max-w-2xl mx-auto">
          Welcome, Dr. {clinician?.full_name?.split(' ').pop() || 'Provider'}. Search for documentation on patient management, clinical validity, and platform features.
        </p>
        
        <div className="relative max-w-2xl mx-auto group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-400 group-focus-within:text-[#2D5F8B] dark:group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for 'Calibrate', 'Billing', 'Export'..." 
            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-lg text-slate-900 dark:text-white shadow-sm hover:shadow-md focus:outline-none focus:border-[#2D5F8B] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#2D5F8B]/10 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-10">
              {!searchQuery && (
                <div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Browse by Topic</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {categories.map((cat, i) => (
                        <div key={i} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#2D5F8B]/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer">
                           <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-[#2D5F8B] dark:text-blue-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#2D5F8B] group-hover:text-white transition-all">
                              <cat.icon size={22} />
                           </div>
                           <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">{cat.title}</h4>
                           <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{cat.desc}</p>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div>
                 <div className="flex items-center gap-3 mb-6">
                    <HelpCircle className="text-[#2D5F8B] dark:text-blue-400" size={24} />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {searchQuery ? `Search Results (${filteredFaqs.length})` : "Common Clinical Questions"}
                    </h3>
                 </div>
                 
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                       {filteredFaqs.length > 0 ? filteredFaqs.map((item, i) => (
                         <details key={i} className="group transition-colors" open={!!searchQuery}>
                            <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                               <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#2D5F8B] dark:group-hover:text-blue-400 transition-colors pr-4">
                                 {highlightText(item.q, searchQuery)}
                               </span>
                               <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-open:bg-[#2D5F8B] group-open:border-[#2D5F8B] group-open:text-white dark:group-open:bg-blue-600 dark:group-open:border-blue-600 transition-all">
                                 <ChevronRight size={16} className="text-slate-400 group-open:text-white transition-transform group-open:rotate-90" />
                               </div>
                            </summary>
                            <div className="px-6 pb-6 pt-2 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                               {highlightText(item.a, searchQuery)}
                            </div>
                         </details>
                       )) : (
                         <div className="p-10 text-center flex flex-col items-center justify-center">
                           <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                             <Search className="text-slate-400" size={24} />
                           </div>
                           <h4 className="font-bold text-slate-900 dark:text-white mb-2">No results found</h4>
                           <p className="text-slate-500 dark:text-slate-400 max-w-xs">
                             We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try adjusting your keywords.
                           </p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-800 dark:border-slate-700">
                 <h3 className="font-bold text-white mb-2">Provider Support</h3>
                 <p className="text-sm text-slate-400 mb-6">Get priority assistance from our clinical success team.</p>
                 <div className="space-y-3">
                    <a href={`mailto:providers@kneurasense.com?subject=Provider Support - Dr. ${clinician?.full_name || ''}`} className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-semibold transition-colors shadow-sm">
                       <Mail size={18} /> Email Success Team
                    </a>
                    <a href="tel:+639123456789" className="flex items-center justify-center gap-2 w-full py-3 bg-transparent text-white hover:bg-slate-800 border border-slate-700 rounded-xl font-semibold transition-colors">
                       <Phone size={18} /> Priority Line
                    </a>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                 <h3 className="font-bold text-slate-900 dark:text-white mb-4">Clinical Resources</h3>
                 <div className="space-y-1">
                    <a href="/KneuraSense_Clinical_Validation.pdf" download className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-[#2D5F8B] dark:text-blue-400 rounded-full flex items-center justify-center group-hover:bg-[#2D5F8B] group-hover:text-white transition-colors shrink-0">
                        <Activity size={18} />
                      </div>
                      <div>
                         <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Validation Whitepaper</p>
                         <p className="text-xs text-slate-500">Clinical Study (PDF)</p>
                      </div>
                    </a>
                    <a href="/KneuraSense_RPM_Billing_Guide.pdf" download className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-[#2D5F8B] dark:text-blue-400 rounded-full flex items-center justify-center group-hover:bg-[#2D5F8B] group-hover:text-white transition-colors shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div>
                         <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">RPM Billing Guide</p>
                         <p className="text-xs text-slate-500">CPT Codes & Compliance</p>
                      </div>
                    </a>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}