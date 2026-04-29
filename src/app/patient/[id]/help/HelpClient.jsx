'use client';

import { useState } from 'react';
import { 
  Search, ChevronRight, Mail, Phone, 
  FileText, Wifi, Smartphone, ShieldAlert, 
  BookOpen, HelpCircle
} from 'lucide-react';

export default function HelpClient({ patient, latestLog, supportEmail}) {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { title: "Wi-Fi & Connection", icon: Wifi, desc: "Provisioning and network setup." },
    { title: "Using the Dashboard", icon: Smartphone, desc: "Navigating scores and history." },
    { title: "Understanding Alerts", icon: ShieldAlert, desc: "Haptic and LED statuses." },
    { title: "Account & Export", icon: BookOpen, desc: "Data export and settings." }
  ];

  const allFaqs = [
    { q: "How do I calibrate or zero my sensors?", a: "To ensure your knee angle readings are accurate, go to your Live Telemetry Dashboard and click 'SET STANDING BASELINE'. Stand straight and remain still for 5 seconds establishing your anatomical baseline." },
    { q: "How do I connect my KneuraSense device to Wi-Fi?", a: "When the device is blinking yellow, connect your phone to the KneuraSense network. A setup page will pop up where you can select your home Wi-Fi and enter the password." },
    { q: "What do the different LED light colors mean?", a: "Green is safe. Yellow/Amber is caution or calibration. Red is high stress and triggers vibration. Blue indicates system status or booting." },
    { q: "How is my Overuse Risk Score calculated?", a: "The Edge AI model computes your score by combining biomechanical (dual IMUs/FSR) and physiological (PPG/Temp) data adjusted for environment." },
    { q: "What happens if I lose my Wi-Fi connection?", a: "The device activates 'Offline Mode', saving logs to internal memory. Data will sync to the cloud once connectivity is restored." },
    { q: "How does the vibration alert work?", a: "The vibration motor provides immediate haptic feedback whenever your risk score exceeds your context-adjusted threshold." },
    { q: "Can I export my data to show my doctor?", a: "Yes. Use the 'History & Export' module to review long-term trends and export files for your clinician." }
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
        <span key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-yellow-100 rounded-sm px-0.5">{part}</span>
      ) : part
    );
  };

  return (
    <div className="pb-8 pt-4">
      {/* Compact Hero Section */}
      <div className="px-6 text-center max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Help Center
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xl mx-auto">
          Search for troubleshooting, guides, and tips for your KneuraSense wearable.
        </p>
        
        <div className="relative max-w-xl mx-auto group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#2D5F8B] transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help..." 
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-base text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#2D5F8B] focus:ring-2 focus:ring-[#2D5F8B]/10 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!searchQuery && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Topics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat, i) => (
                    <div key={i} className="group bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 transition-all cursor-pointer">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/50 text-[#2D5F8B] dark:text-blue-400 rounded-md w-fit mb-3">
                        <cat.icon size={20} />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{cat.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <HelpCircle className="text-[#2D5F8B] dark:text-blue-400" size={18} />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {searchQuery ? `Results (${filteredFaqs.length})` : "Common Questions"}
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFaqs.length > 0 ? filteredFaqs.map((item, i) => (
                  <details key={i} className="group transition-colors" open={!!searchQuery}>
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-[#2D5F8B] pr-4">
                        {highlightText(item.q, searchQuery)}
                      </span>
                      <ChevronRight size={16} className="text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
                    </summary>
                    <div className="px-4 pb-4 pt-1 text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        {highlightText(item.a, searchQuery)}
                      </div>
                    </div>
                  </details>
                )) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No results found.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3">Resources</h3>
              <div className="space-y-2">
                {/* Updated Download Link */}
                <a 
                  href="/resources/KneuraSense-User-Guide.pdf" 
                  download="KneuraSense-User-Guide.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100"
                >
                  <FileText size={16} className="text-[#2D5F8B] dark:text-blue-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">User Guide</p>
                    <p className="text-[10px] text-slate-500">PDF Guide</p>
                  </div>
                </a>
                
                <a 
                  href="/resources/wifi-pdf-guide.pdf" 
                  download="wifi-pdf-guide.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 group"
                >
                  <Wifi size={16} className="text-[#2D5F8B] dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Wi-Fi Guide</p>
                    <p className="text-[10px] text-slate-500">PDF Guide</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-[#E9F0F5] dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Still need help?</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-4">Support is available Mon-Fri, 9AM-5PM PHT.</p>
              <div className="space-y-2">
                <a 
                  href={`mailto:${supportEmail}`} 
                  className="flex items-center justify-center gap-2 w-full py-2 bg-[#2D5F8B] hover:bg-[#1f4263] text-white rounded-md text-xs font-bold transition-colors">
                  <Mail size={16} /> Email Support
                </a>
                <a href="tel:+639123456789" className="flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold transition-colors">
                  <Phone size={16} /> Call Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}