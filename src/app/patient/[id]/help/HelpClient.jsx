'use client';

import { useState } from 'react';
import { 
  Search, ChevronRight, Mail, Phone, 
  FileText, Wifi, Smartphone, ShieldAlert, 
  Activity, Clock, BookOpen, HelpCircle
} from 'lucide-react';

export default function HelpClient({ patient, latestLog }) {
  const [searchQuery, setSearchQuery] = useState("");

  const deviceStatus = latestLog 
    ? (latestLog.battery > 20 ? "Online & Syncing" : "Low Battery") 
    : "Offline / Disconnected";
  
  const statusColor = deviceStatus === "Online & Syncing" 
    ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20"
    : deviceStatus === "Low Battery"
    ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20"
    : "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700";

  const categories = [
    { title: "Wi-Fi & Connection", icon: Wifi, desc: "Provisioning, offline mode, and network setup." },
    { title: "Using the Dashboard", icon: Smartphone, desc: "Navigating your stress score, calibration, and history." },
    { title: "Understanding Alerts", icon: ShieldAlert, desc: "Haptic feedback and LED statuses." },
    { title: "Account & Export", icon: BookOpen, desc: "Data export and profile settings." }
  ];

  const allFaqs = [
    { q: "How do I calibrate or zero my sensors?", a: "To ensure your knee angle readings are completely accurate, you must calibrate the sensors while wearing the device. Go to your Live Telemetry Dashboard and click 'SET STANDING BASELINE'. Stand perfectly straight with your weight evenly distributed, and remain completely still for 5 seconds until you see the success message. This establishes your personal 0-degree baseline." },
    { q: "How do I connect my KneuraSense device to Wi-Fi?", a: "When the device is in Provisioning Mode (indicated by a blinking yellow LED), it creates its own temporary Wi-Fi network. Go to your phone's Wi-Fi settings and connect to the KneuraSense network. A 'Captive Portal' setup page will automatically pop up on your screen where you can select your home Wi-Fi network and enter the password." },
    { q: "What do the different LED light colors mean?", a: "Green indicates a 'safe' status. Yellow/Amber serves as a 'caution' warning or calibration mode. Red signifies a 'high stress' alert and triggers the vibration motor. Blue is used for system status, such as when the device is booting up." },
    { q: "How is my Overuse Risk Score calculated?", a: "The Edge AI model computes your score by combining biomechanical data (from the dual IMUs and FSR) and physiological data (from the PPG and temperature sensors), which is then dynamically adjusted based on environmental factors like terrain and weather." },
    { q: "What happens if I lose my Wi-Fi connection?", a: "If the Wi-Fi connection fails, the device automatically activates an 'Offline Mode'. It will continue to monitor your knee stress and save the sensor logs to its internal memory. The data will sync to the cloud once connectivity is restored." },
    { q: "How does the vibration alert work?", a: "The vibration motor provides immediate haptic feedback (buzzing) whenever your overuse risk score exceeds the context-adjusted threshold, prompting you to reduce load immediately." },
    { q: "Can I export my data to show my doctor?", a: "Yes. The Web Dashboard features a 'History & Export' module where you can review your long-term data trends and export them for your clinician to review." }
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
      <div className="px-6 text-center max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5">
          Hi {patient?.fullName?.split(' ')[0] || 'User'}, how can we help?
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Search our knowledge base for troubleshooting, guides, and tips on using your KneuraSense wearable device.
        </p>
        
        <div className="relative max-w-2xl mx-auto group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-400 group-focus-within:text-[#2D5F8B] dark:group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for 'Wi-Fi', 'Calibrate', 'Risk Score'..." 
            className="w-full pl-16 pr-24 py-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-lg text-slate-900 dark:text-white shadow-sm hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-[#2D5F8B] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#2D5F8B]/10 dark:focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              {!searchQuery && (
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Browse Topics</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {categories.map((cat, i) => (
                        <div key={i} className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer">
                           <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-[#2D5F8B] dark:text-blue-400 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                              <cat.icon size={24} />
                           </div>
                           <h4 className="font-bold text-slate-800 dark:text-slate-200">{cat.title}</h4>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{cat.desc}</p>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <HelpCircle className="text-[#2D5F8B] dark:text-blue-400" size={20} />
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {searchQuery ? `Search Results (${filteredFaqs.length})` : "Frequently Asked Questions"}
                    </h3>
                 </div>
                 <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFaqs.length > 0 ? filteredFaqs.map((item, i) => (
                      <details key={i} className="group open:bg-blue-50/30 dark:open:bg-blue-900/10 transition-colors" open={!!searchQuery}>
                         <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-[#2D5F8B] dark:group-hover:text-blue-400 transition-colors pr-4">
                              {highlightText(item.q, searchQuery)}
                            </span>
                            <ChevronRight size={18} className="text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
                         </summary>
                         <div className="px-6 pb-6 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                               {highlightText(item.a, searchQuery)}
                            </div>
                         </div>
                      </details>
                    )) : (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No answers found for &quot;{searchQuery}&quot;. Try adjusting your keywords or contact support below.
                      </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                 <h3 className="font-bold text-slate-900 dark:text-white mb-4">Resources</h3>
                 <div className="space-y-3">
                    <a href="/KneuraSense_Manual.pdf" download className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                      <div className="text-[#2D5F8B] dark:text-blue-400"><FileText size={20} /></div>
                      <div>
                         <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#2D5F8B]">Download User Manual</p>
                         <p className="text-xs text-slate-500">PDF Guide (2.1 MB)</p>
                      </div>
                    </a>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-left">
                      <div className="text-[#2D5F8B] dark:text-blue-400"><Wifi size={20} /></div>
                      <div>
                         <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#2D5F8B]">Video: Wi-Fi Provisioning</p>
                         <p className="text-xs text-slate-500">1.5 min watch</p>
                      </div>
                    </button>
                 </div>
              </div>

              <div className="bg-[#E9F0F5] dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                 <h3 className="font-bold text-slate-900 dark:text-white mb-2">Still need help?</h3>
                 <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Our support team is available Monday to Friday, 9AM to 5PM PHT.</p>
                 <div className="space-y-3">
                    <a href={`mailto:support@kneurasense.com?subject=Support Request - ${patient?.fullName || 'User'}`} className="flex items-center justify-center gap-2 w-full py-3 bg-[#2D5F8B] hover:bg-[#1f4263] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm">
                       <Mail size={18} /> Email Support
                    </a>
                    <a href="tel:+639123456789" className="flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-medium transition-colors shadow-sm">
                       <Phone size={18} /> Call +63 912 345 6789
                    </a>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}