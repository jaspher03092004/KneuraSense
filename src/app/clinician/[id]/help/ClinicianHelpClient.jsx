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
    { title: "EHR Integration", icon: Database, desc: "Exporting CSVs and PDF reports for patient records." }
  ];

  const allFaqs = [
    { q: "How and when should a patient's device be calibrated?", a: "Calibration (Zeroing) is crucial for accurate joint kinematics. It should be done whenever the patient puts the device on or repositions it. Instruct the patient to stand perfectly straight with weight evenly distributed. From their Live Telemetry dashboard, click 'SET STANDING BASELINE'. They must remain entirely still for 5 seconds to establish a true 0-degree anatomical baseline." },
    { q: "How is the Overuse Risk Score calculated?", a: "The score is derived from a proprietary Edge AI model that fuses joint kinematics (flexion/extension angles) with applied force (FSR data) and physiological stress indicators (heart rate, skin temperature). It compares real-time load against the patient's calibrated baseline." },
    { q: "How do I register a new patient?", a: "Navigate to the 'Patients Management' tab and click 'Register New'. You will need their email address and the MAC address of their assigned KneuraSense device. An invitation will be sent to their email to complete setup." },
    { q: "How do I assign an existing patient to my care list?", a: "If a patient is already registered in the KneuraSense system, go to your Patient Management and input the patient's unique Patient registered email address to request access to their telemetry data." },
    { q: "How do I customize a patient's risk threshold?", a: "From the patient's individual profile, locate the Clinical Threshold Manager section. Use the slider to adjust the Clinical Baseline Threshold, which prescribes the Overuse Risk Score limit for that specific patient (defaults to 75 if not previously set). If the patient's device is online, clicking Update Prescription will instantly sync the new limit to the device otherwise, it will sync automatically the next time the device connects." },
    { q: "How do I export data to my EHR system?", a: "Go to a patient's individual profile and click 'Export Report' in the top right corner. You can download a HIPAA-compliant PDF summary of their monthly progress, or a raw CSV file of their telemetry data to attach to their EHR." },
    { q: "How do I assign a new Intervention or Care Plan?", a: "From the patient's detailed view, navigate to the 'Interventions' tab and click 'Add New'. You can add internal clinical notes, as well as patient-friendly instructions. The patient will be forced to acknowledge this update the next time they log in." },
    { q: "What triggers a 'Critical Alert' on my dashboard?", a: "A patient will flag as a Critical Alert if their Overuse Risk Score exceeds 80 for more than 5 consecutive minutes, indicating severe joint stress that requires immediate intervention or activity modification." },
    { q: "How do I transfer a patient to another clinician?", a: "From the Patient Directory, locate the patient card and click the Share icon (top right). Select 'Transfer to another clinician' and enter the email address of the clinician you wish to transfer the patient to. Once confirmed, the receiving clinician must accept the transfer request. The patient's historical data and device assignment will be transferred along with them." },
    { q: "What happens when I transfer a patient to another clinician?", a: "When you transfer a patient, the receiving clinician gains full access to their Live Dashboard, Historical Data, Interventions, and Clinical Thresholds. You will no longer have access to the patient's real-time data or be able to modify their settings. However, all historical data and clinical notes remain intact for continuity of care." },
    { q: "How do I release a patient from my care?", a: "From the Patient Directory, locate the patient card and click the Share icon. Select 'Release patient' and confirm the action. The patient will be unassigned from your clinic and will become available for any other clinician in the KneuraSense network to request access. The patient retains all their data and device assignments." },
    { q: "What is the difference between transferring and releasing a patient?", a: "Transferring assigns the patient's care to a specific clinician via email address, maintaining continuity of care. Releasing unassigns the patient, making them available for any clinician to request access. Use Transfer when moving a patient to a specific colleague, use Release when you no longer need to monitor them or when they're ending care with your clinic." },
    { q: "Can I transfer a patient back if I change my mind?", a: "Yes. If you released a patient and want to reassign them, go to the 'Assign Existing' button and enter their email address to request access again. If you transferred a patient to another clinician and want to get them back, contact that clinician to initiate a reverse transfer to you. Both clinicians must cooperate for the reversal." },
    { q: "What happens to a patient's device when they are transferred?", a: "The device ID address and all sensor data remain assigned to the patient and are transferred along with them. The receiving clinician will have immediate access to live sensor readings and historical telemetry. If the device was offline at the time of transfer, it will automatically sync with the new clinician's account the next time it connects to the network." },
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
    <div className="pb-8 pt-4">
      <div className="px-6 text-center max-w-3xl mx-auto mb-8">
        <div className="w-12 h-12 bg-[#2D5F8B] text-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Stethoscope size={24} />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Knowledge Base
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xl mx-auto">
          Welcome, Dr. {clinician?.full_name?.split(' ').pop() || 'Provider'}. Search for documentation on patient management and clinical features.
        </p>
        
        <div className="relative max-w-xl mx-auto group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#2D5F8B] transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation..." 
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-base text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#2D5F8B] focus:ring-4 focus:ring-[#2D5F8B]/10 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              {!searchQuery && (
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Browse by Topic</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categories.map((cat, i) => (
                        <div key={i} className="group bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#2D5F8B]/50 transition-all cursor-pointer">
                           <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-[#2D5F8B] dark:text-blue-400 rounded-md flex items-center justify-center mb-3 group-hover:bg-[#2D5F8B] group-hover:text-white transition-all">
                              <cat.icon size={20} />
                           </div>
                           <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{cat.title}</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{cat.desc}</p>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div>
                 <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="text-[#2D5F8B] dark:text-blue-400" size={20} />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {searchQuery ? `Search Results (${filteredFaqs.length})` : "Common Clinical Questions"}
                    </h3>
                 </div>
                 
                 <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                       {filteredFaqs.length > 0 ? filteredFaqs.map((item, i) => (
                         <details key={i} className="group transition-colors" open={!!searchQuery}>
                            <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                               <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-[#2D5F8B] transition-colors pr-4">
                                 {highlightText(item.q, searchQuery)}
                               </span>
                               <div className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-open:bg-[#2D5F8B] group-open:text-white transition-all">
                                 <ChevronRight size={14} className="text-slate-400 group-open:text-white transition-transform group-open:rotate-90" />
                               </div>
                            </summary>
                            <div className="px-4 pb-4 pt-1 text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                               {highlightText(item.a, searchQuery)}
                            </div>
                         </details>
                       )) : (
                         <div className="p-8 text-center flex flex-col items-center justify-center">
                            <Search className="text-slate-300 mb-2" size={32} />
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">No results found</h4>
                            <p className="text-xs text-slate-500 max-w-xs">Try adjusting your keywords.</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-5 shadow-sm border border-slate-800">
                 <h3 className="text-sm font-bold text-white mb-1">Provider Support</h3>
                 <p className="text-xs text-slate-400 mb-4">Get priority assistance from our team.</p>
                 <div className="space-y-2">
                    <a href={`mailto:providers@kneurasense.com`} className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-md text-xs font-bold transition-colors">
                        <Mail size={16} /> Email Success
                    </a>
                    <a href="tel:+639123456789" className="flex items-center justify-center gap-2 w-full py-2.5 bg-transparent text-white hover:bg-slate-800 border border-slate-700 rounded-md text-xs font-bold transition-colors">
                        <Phone size={16} /> Priority Line
                    </a>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                 <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Clinical Resources</h3>
                 <div className="space-y-1">
                    <a href="/KneuraSense_Clinical_Validation.pdf" download className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 text-[#2D5F8B] rounded-md flex items-center justify-center group-hover:bg-[#2D5F8B] group-hover:text-white transition-colors shrink-0">
                        <Activity size={16} />
                      </div>
                      <div>
                         <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">Validation Paper</p>
                         <p className="text-[10px] text-slate-500 mt-1">Study (PDF)</p>
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