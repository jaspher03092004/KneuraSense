import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { 
  Search, ChevronRight, MessageCircle, Phone, Mail, 
  FileText, Smartphone, Bluetooth, ShieldAlert, CheckCircle2,
  PlayCircle, LifeBuoy, Clock, ArrowRight
} from 'lucide-react';

export default async function HelpPage({ params }) {
  const { id } = await params;
  
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, fullName: true, email: true }
  });

  if (!patient) redirect('/login');

  const recentTicket = {
    id: "#8821",
    subject: "Syncing Issue with Left Knee Sleeve",
    status: "Resolved",
    date: "Yesterday",
    agent: "Sarah M."
  };

  const categories = [
    { title: "Device & Hardware", icon: Bluetooth, count: 5, desc: "Pairing, battery, and sensors" },
    { title: "App & Account", icon: Smartphone, count: 8, desc: "Login, data export, and settings" },
    { title: "Medical Alerts", icon: ShieldAlert, count: 3, desc: "Understanding risk scores" },
    { title: "Billing & Plans", icon: FileText, count: 2, desc: "Invoices and subscription" },
  ];

  const faqs = [
    { q: "My KneuraSense device isn't pairing.", a: "Ensure Bluetooth is enabled. If the LED blinks red, charge for 20 mins." },
    { q: "What does the red light mean?", a: "Solid red indicates battery < 20%. Pulsing red means high-impact stress detected." },
    { q: "How is my Risk Score calculated?", a: "It combines knee flexion angle, impact force (N), and activity duration." },
  ];

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Help Center</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Support resources and troubleshooting for {patient.fullName}</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
               <FileText size={16} /> User Manual
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-[#2D5F8B] dark:bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-colors shadow-sm">
               <MessageCircle size={16} /> Live Chat
             </button>
          </div>
        </div>

        {/* Search & Quick Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-center relative overflow-hidden transition-colors duration-300">
              <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none"></div>
              
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">How can we help?</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search for issues..." 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 rounded-lg">
                    <LifeBuoy size={20} />
                 </div>
                 <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-bold rounded-full border border-teal-100 dark:border-teal-500/20">
                    {recentTicket.status}
                 </span>
              </div>
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Last Ticket</p>
                 <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">{recentTicket.subject}</h3>
                 <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <Clock size={12} /> Updated {recentTicket.date} by {recentTicket.agent}
                 </div>
              </div>
           </div>
        </div>

        {/* Browse by Category */}
        <div>
           <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">Browse Topics</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <div key={i} className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-200 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer">
                   <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                         <cat.icon size={20} />
                      </div>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">{cat.count} articles</span>
                   </div>
                   <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{cat.title}</h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{cat.desc}</p>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                 <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Frequently Asked Questions</h3>
                 </div>
                 <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {faqs.map((item, i) => (
                      <details key={i} className="group open:bg-blue-50/10 dark:open:bg-blue-900/10 transition-colors">
                         <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#2D5F8B] dark:group-hover:text-blue-400 transition-colors">{item.q}</span>
                            <ChevronRight size={16} className="text-slate-400 transition-transform group-open:rotate-90" />
                         </summary>
                         <div className="px-5 pb-5 pt-0 text-sm text-slate-500 dark:text-slate-400 leading-relaxed pl-5">
                            <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1">
                               {item.a}
                            </div>
                         </div>
                      </details>
                    ))}
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 transition-colors duration-300">
                 <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Video Tutorials</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TutorialCard title="How to wear the sleeve" duration="2:15" />
                    <TutorialCard title="Understanding alerts" duration="1:45" />
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300">
                 <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm uppercase tracking-wide">Contact Support</h3>
                 
                 <div className="space-y-3">
                    <a href="tel:1234567890" className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-all group">
                       <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 shadow-sm transition-colors">
                          <Phone size={18} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Phone Support</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">+1 (800) 555-0199</p>
                       </div>
                    </a>
                 </div>
              </div>
              
              <div className="bg-[#E9F0F5] dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1.5 bg-white dark:bg-slate-900 rounded-md shadow-sm text-blue-600 dark:text-blue-400">
                        <CheckCircle2 size={16} />
                     </div>
                     <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Quick Tip</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                     Most connection issues are resolved by turning Bluetooth off and on again, or by restarting the KneuraSense app.
                  </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function TutorialCard({ title, duration }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-sm cursor-pointer transition-all group bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800">
      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shadow-sm">
         <PlayCircle size={20} />
      </div>
      <div>
         <p className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{title}</p>
         <p className="text-xs text-slate-400">{duration}</p>
      </div>
    </div>
  );
}