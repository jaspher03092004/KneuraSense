'use client';

import { useState, useTransition } from 'react';
import { addIntervention } from '@/actions/addIntervention';
import { 
  Stethoscope, Pill, Activity, FileText, Plus, ChevronLeft, Calendar, 
  User, CheckCircle, Clock, Filter, ChevronDown, Search, Activity as ActivityIcon, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InterventionsClient({ clinicianId, allPatients = [], interventions = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Form State
  const [selectedPatient, setSelectedPatient] = useState('');
  const [type, setType] = useState('Advice');

  // History Timeline State
  const [visibleCount, setVisibleCount] = useState(5); 
  const [filterPatientId, setFilterPatientId] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Searchable Dropdown States
  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const interventionTypes = [
    { id: 'Advice', icon: <FileText size={16}/>, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
    { id: 'Medication', icon: <Pill size={16}/>, color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' },
    { id: 'Exercise', icon: <Activity size={16}/>, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
    { id: 'Other', icon: <Stethoscope size={16}/>, color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10' },
  ];

  async function handleAddNote(formData) {
    if (!selectedPatient) {
      alert("Please select a patient before saving.");
      return;
    }

    startTransition(async () => {
      const result = await addIntervention(formData);
      if (result?.success) {
        document.getElementById('intervention-form').reset();
        setType('Advice');
        setSelectedPatient('');
        setFormSearchQuery('');
        setVisibleCount(5); 
        setFilterPatientId('All');
        setFilterStatus('All');
      } else {
        alert(result?.error || 'Failed to save intervention');
      }
    });
  }

  const filteredInterventions = interventions.filter(record => {
    const matchesPatient = filterPatientId === 'All' || record.patientId === filterPatientId;
    const matchesStatus = filterStatus === 'All' 
      ? true 
      : filterStatus === 'Acknowledged' 
        ? record.isAcknowledged 
        : !record.isAcknowledged; 

    return matchesPatient && matchesStatus;
  });

  const displayedInterventions = filteredInterventions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredInterventions.length;

  const formFilteredPatients = allPatients.filter(p => {
    const name = p.fullName || '';
    return name.toLowerCase().includes(formSearchQuery.toLowerCase());
  });
  
  const historyFilteredPatients = allPatients.filter(p => {
    const name = p.fullName || '';
    return name.toLowerCase().includes(filterSearchQuery.toLowerCase());
  });

  const selectedFormPatientName = allPatients.find(p => p.id === selectedPatient)?.fullName || '-- Search and Select Patient --';
  const selectedFilterPatientName = filterPatientId === 'All' 
    ? 'All Patients' 
    : allPatients.find(p => p.id === filterPatientId)?.fullName || 'All Patients';

  const statusLabels = {
    'All': 'All Statuses',
    'Pending': 'Pending Review',
    'Acknowledged': 'Acknowledged'
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-slate-800 antialiased p-4 md:p-8">
      <div className="mx-auto w-full max-w-[1400px]">
        
        <header className="mb-8 -mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Intervention Tracking</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Log clinical advice, prescriptions, and exercise modifications.</p>
          </div>
          <button 
            onClick={() => router.push(`/clinician/${clinicianId}/dashboard`)}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] md:text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm w-full md:w-auto"
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-1 space-y-6 sticky top-6 z-20">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Record</h2>
              </div>

              <form id="intervention-form" action={handleAddNote} className="space-y-4">
                <input type="hidden" name="clinicianId" value={clinicianId} />
                
                <div className="relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Select Patient</label>
                  <input type="hidden" name="patientId" value={selectedPatient} />
                  
                  <div 
                    onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-3 cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors"
                  >
                    <span className={selectedPatient ? "text-slate-900 dark:text-white font-medium line-clamp-1" : "text-slate-400"}>
                      {selectedFormPatientName}
                    </span>
                    <ChevronDown size={16} className="text-slate-400 shrink-0" />
                  </div>

                  {isFormDropdownOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setIsFormDropdownOpen(false)}></div>
                  )}

                  {isFormDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800 relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Search name..."
                          value={formSearchQuery}
                          onChange={(e) => setFormSearchQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg outline-none focus:border-blue-500"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1">
                        {formFilteredPatients.length === 0 ? (
                          <div className="p-3 text-center text-sm text-slate-500">No matching patients</div>
                        ) : (
                          formFilteredPatients.map(p => (
                            <div 
                              key={p.id}
                              onClick={() => {
                                setSelectedPatient(p.id);
                                setIsFormDropdownOpen(false);
                                setFormSearchQuery('');
                              }}
                              className={`px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${selectedPatient === p.id ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                              {p.fullName} {p.oaDiagnosis && <span className="text-[10px] ml-2 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">OA</span>}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Category</label>
                  <input type="hidden" name="type" value={type} />
                  <div className="grid grid-cols-2 gap-2">
                    {interventionTypes.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          type === t.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm' 
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {t.icon} <span className="hidden sm:inline">{t.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Summary / Action Taken</label>
                  <input 
                    name="title" 
                    type="text" 
                    required 
                    placeholder="e.g., Prescribed anti-inflammatory"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Detailed Notes</label>
                  <textarea 
                    name="notes" 
                    rows="4" 
                    required
                    placeholder="Provide additional details regarding the intervention, symptoms, or expected outcomes..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  {isPending ? 'Saving Record...' : 'Save Intervention'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Timeline */}
          <div className="lg:col-span-2 z-10">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 sm:p-8 transition-colors duration-300 min-h-full">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="text-slate-400" size={20} /> History
                </h2>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <button 
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-bold rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 outline-none transition-colors"
                    >
                      <ActivityIcon size={14} className="text-slate-400 hidden sm:block" />
                      {statusLabels[filterStatus]}
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>
                    {isStatusDropdownOpen && (
                      <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)}></div>
                    )}
                    {isStatusDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 p-1">
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <div 
                            key={value}
                            onClick={() => {
                              setFilterStatus(value);
                              setVisibleCount(5);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${filterStatus === value ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                      className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-bold rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 outline-none transition-colors"
                    >
                      <Filter size={14} className="text-slate-400 hidden sm:block" />
                      <span className="line-clamp-1 max-w-[100px] sm:max-w-[150px]">{selectedFilterPatientName}</span>
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>
                    {isFilterDropdownOpen && (
                      <div className="fixed inset-0 z-40" onClick={() => setIsFilterDropdownOpen(false)}></div>
                    )}
                    {isFilterDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 relative">
                          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Search patient filter..."
                            value={filterSearchQuery}
                            onChange={(e) => setFilterSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg outline-none focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                          <div 
                            onClick={() => {
                              setFilterPatientId('All');
                              setVisibleCount(5);
                              setIsFilterDropdownOpen(false);
                              setFilterSearchQuery('');
                            }}
                            className={`px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${filterPatientId === 'All' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            All Patients
                          </div>
                          {historyFilteredPatients.map(p => (
                            <div 
                              key={p.id}
                              onClick={() => {
                                setFilterPatientId(p.id);
                                setVisibleCount(5);
                                setIsFilterDropdownOpen(false);
                                setFilterSearchQuery('');
                              }}
                              className={`px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${filterPatientId === p.id ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                              {p.fullName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Locked timeline border for consistent mobile rendering */}
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8 pb-4">
                {displayedInterventions.length === 0 ? (
                  <div className="pl-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    No interventions found matching your current filters.
                  </div>
                ) : (
                  displayedInterventions.map((record) => {
                    const typeConfig = interventionTypes.find(t => t.id === record.type) || interventionTypes[3];
                    return (
                      <div key={record.id} className="relative pl-6 sm:pl-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Dot is locked to -17px perfectly centering it on the 2px border at ml-4 */}
                        <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center ${typeConfig.color}`}>
                          {typeConfig.icon}
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800/30 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${typeConfig.color}`}>
                                  {record.type}
                                </span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <User size={12}/> <span className="line-clamp-1 max-w-[120px] sm:max-w-none">{record.patient.fullName}</span>
                                </span>
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">{record.title}</h3>
                            </div>
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 shrink-0">
                              {new Date(record.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinical Notes</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {record.notes}
                            </p>
                          </div>

                          {/* Upgraded AI Patient-Facing Note Container */}
                          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 mt-4 relative overflow-hidden">
                            
                            <div className="flex items-center gap-2 mb-3">
                               <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                  <Sparkles size={14} />
                               </div>
                               <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                 Patient Care Plan
                               </span>
                            </div>
                            
                            {/* whitespace-pre-wrap ensures line breaks generated by the AI are respected */}
                            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                              {record.patientFriendlyNote || record.notes}
                            </div>
                            
                            {!record.patientFriendlyNote && (
                              <div className="mt-3 text-[11px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 p-2 sm:p-3 rounded-lg border border-amber-100 dark:border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                                AI generation skipped. Falling back to raw clinical notes.
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            {record.isAcknowledged ? (
                              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 w-full sm:w-auto">
                                <CheckCircle size={14} className="shrink-0" />
                                Patient Acknowledged ({new Date(record.acknowledgedAt).toLocaleDateString()})
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-500/20 w-full sm:w-auto">
                                <Clock size={14} className="shrink-0" />
                                Pending Patient Review
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 5)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-bold transition-colors w-full sm:w-auto justify-center"
                  >
                    <ChevronDown size={16} /> Load Older Records
                  </button>
                </div>
              )}
              
              {!hasMore && displayedInterventions.length > 0 && (
                <div className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                  End of History
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}