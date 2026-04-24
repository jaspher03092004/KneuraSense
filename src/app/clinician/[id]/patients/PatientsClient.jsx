'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { assignPatientToClinician, unassignPatient, transferPatient } from '@/actions/assignPatient';
import { 
  Search, User, Activity, AlertCircle, 
  Download, UserPlus, Plus, X, AlertTriangle, CheckCircle, Loader2, Filter, Share2
} from 'lucide-react';
import LiveDashboard from '@/components/LiveDashboard';
import ClinicalThresholdManager from '@/components/ClinicalThresholdManager';
import STSClinicalTest from '@/components/SLETClinicalTest'; 
import RegisterPatientModal from '@/components/RegisterPatientModal';
import PatientProfileModal from '@/components/PatientProfileModal';
import { calculateAge } from '@/lib/utils';

export default function PatientsClient({ clinicianId, patients }) {
  const router = useRouter();
  
  // -- State --
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showLiveDashboard, setShowLiveDashboard] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [selectedPatientForThreshold, setSelectedPatientForThreshold] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [patientToTransfer, setPatientToTransfer] = useState(null);
  const [targetClinicianEmail, setTargetClinicianEmail] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const [showStsModal, setShowStsModal] = useState(false);
  const [selectedPatientForSts, setSelectedPatientForSts] = useState(null);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [patientForProfile, setPatientForProfile] = useState(null);
  
  const [riskFilter, setRiskFilter] = useState('all'); 
  const [deviceFilter, setDeviceFilter] = useState('all'); 
  const [oaFilter, setOaFilter] = useState('all'); 
  const [showFilters, setShowFilters] = useState(false);
  
  const [assignEmail, setAssignEmail] = useState('');
  const [assignStatus, setAssignStatus] = useState({ loading: false, message: '', type: '' });

  // -- Derived Data --
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const riskScore = p.sensorLogs?.[0]?.riskScore || 0;
      let matchesRisk = true;
      if (riskFilter === 'high') matchesRisk = riskScore >= 75;
      else if (riskFilter === 'normal') matchesRisk = riskScore >= 50 && riskScore < 75;
      else if (riskFilter === 'low') matchesRisk = riskScore < 50;
      
      const lastSyncTime = p.sensorLogs?.[0]?.timestamp ? new Date(p.sensorLogs[0].timestamp).getTime() : 0;
      const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);
      const isDeviceOnline = lastSyncTime > oneHourAgo && p.deviceMac;
      
      let matchesDevice = true;
      if (deviceFilter === 'online') matchesDevice = isDeviceOnline;
      else if (deviceFilter === 'offline') matchesDevice = !isDeviceOnline;
      
      let matchesOA = true;
      if (oaFilter === 'yes') matchesOA = p.oaDiagnosis === 'Yes';
      else if (oaFilter === 'no') matchesOA = p.oaDiagnosis !== 'Yes';
      
      return matchesSearch && matchesRisk && matchesDevice && matchesOA;
    });
  }, [patients, searchQuery, riskFilter, deviceFilter, oaFilter]);

  // -- Handlers --
  const handleOpenTransfer = (e, patient) => {
    e.stopPropagation();
    setPatientToTransfer(patient);
    setShowTransferModal(true);
    setTargetClinicianEmail('');
    setIsReleasing(false);
  };

  const handleExecuteTransfer = async () => {
    if (isReleasing) {
      if (!confirm(`Release ${patientToTransfer.fullName} from your care? They will be unassigned.`)) return;
      const result = await unassignPatient(patientToTransfer.id, clinicianId);
      if (result.success) {
        setShowTransferModal(false);
        setPatientToTransfer(null);
        setIsReleasing(false);
        router.refresh();
      } else alert(result.error);
    } else {
      if (!targetClinicianEmail.trim()) return;
      setIsTransferring(true);
      const result = await transferPatient(patientToTransfer.id, clinicianId, targetClinicianEmail);
      if (result.success) {
        setShowTransferModal(false);
        setPatientToTransfer(null);
        setTargetClinicianEmail('');
        router.refresh();
      } else alert(result.error);
      setIsTransferring(false);
    }
  };

  const handleAssignPatient = async (e) => {
    e.preventDefault();
    setAssignStatus({ loading: true, message: '', type: '' });
    const result = await assignPatientToClinician(clinicianId, assignEmail);
    if (result.success) {
      setAssignStatus({ loading: false, message: 'Patient assigned successfully!', type: 'success' });
      setTimeout(() => { setShowAssignModal(false); setAssignEmail(''); router.refresh(); }, 1500);
    } else setAssignStatus({ loading: false, message: result.error, type: 'error' });
  };

  const handleExport = () => {
    if (filteredPatients.length === 0) return alert("No patient data to export.");
    const headers = ['MRN', 'Name', 'Email', 'Age', 'Device MAC', 'Latest Risk Score', 'Last Sensor Sync'];
    const rows = filteredPatients.map(p => {
      const latestLog = p.sensorLogs?.[0];
      return [
        p.mrn || 'N/A', `"${p.fullName}"`, `"${p.email}"`, calculateAge(p.dateOfBirth), 
        p.deviceMac || 'None', latestLog?.riskScore || 'No Data', 
        `"${latestLog?.timestamp ? new Date(latestLog.timestamp).toLocaleString() : 'Never'}"`
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `patient_roster_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen p-3 md:p-5 font-sans text-slate-800 antialiased relative">
      <div className="mx-auto w-full max-w-[1400px]">
        
        {/* --- Header & Actions --- */}
        <header className="mb-5 -mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">Patient Directory</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage, register, and assign your clinic&apos;s patients.</p>
          </div>
          
          <div className="grid grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto">
            <button onClick={handleExport} className="flex w-full md:w-auto items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-xs">
              <Download size={14} /> Export
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="flex w-full md:w-auto items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-xs">
              <Filter size={14} /> Filters
            </button>
            <button onClick={() => setShowAssignModal(true)} className="flex w-full md:w-auto items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-[#2D5F8B] dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm text-xs">
              <UserPlus size={14} strokeWidth={2.5} /> Assign Existing
            </button>
            <button onClick={() => setShowRegisterModal(true)} className="col-span-2 md:col-span-1 flex w-full md:w-auto items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-blue-600 rounded-md text-white font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm text-xs">
              <Plus size={14} strokeWidth={3} /> Register New
            </button>
          </div>
        </header>

        {/* --- Search Bar --- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 flex items-center gap-2 mb-4 shadow-sm">
          <Search className="text-slate-400 ml-2 shrink-0" size={16} />
          <input type="text" placeholder="Search by patient name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 py-1.5 text-xs"/>
        </div>

        {/* --- Filter Panel --- */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-4 shadow-sm animate-in fade-in duration-200">
            <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Risk Score</label>
                <div className="flex flex-col gap-1.5">
                  {[{ value: 'all', label: 'All Patients' }, { value: 'high', label: 'High Risk (≥75)' }, { value: 'normal', label: 'Normal (50-75)' }, { value: 'low', label: 'Low Risk (<50)' }].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="risk" value={option.value} checked={riskFilter === option.value} onChange={(e) => setRiskFilter(e.target.value)} className="w-3.5 h-3.5 accent-blue-600" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Device Status</label>
                <div className="flex flex-col gap-1.5">
                  {[{ value: 'all', label: 'All Devices' }, { value: 'online', label: 'Online (Recently Synced)' }, { value: 'offline', label: 'Offline (Not Recent)' }].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="device" value={option.value} checked={deviceFilter === option.value} onChange={(e) => setDeviceFilter(e.target.value)} className="w-3.5 h-3.5 accent-blue-600" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Diagnosis</label>
                <div className="flex flex-col gap-1.5">
                  {[{ value: 'all', label: 'All Patients' }, { value: 'yes', label: 'OA Diagnosed' }, { value: 'no', label: 'No OA Diagnosis' }].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="oa" value={option.value} checked={oaFilter === option.value} onChange={(e) => setOaFilter(e.target.value)} className="w-3.5 h-3.5 accent-blue-600" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button onClick={() => { setRiskFilter('all'); setDeviceFilter('all'); setOaFilter('all'); }} className="text-[10px] font-bold px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Reset All</button>
            </div>
          </div>
        )}

        {/* --- Patient Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full text-slate-300 dark:text-slate-600 mb-3"><Search size={36} strokeWidth={1.5} /></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Patients Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">Try adjusting your search query or add a new patient.</p>
            </div>
          ) : (
            filteredPatients.map(patient => {
              const lastSync = patient.sensorLogs?.[0]?.timestamp ? new Date(patient.sensorLogs[0].timestamp).toLocaleDateString() : 'Never';
              const currentScore = patient.sensorLogs?.[0]?.riskScore || 0;

              return (
                <div key={patient.id} className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-[#2D5F8B] dark:hover:border-blue-500 transition-all hover:shadow-md group relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3 cursor-pointer group/header" onClick={() => { setPatientForProfile(patient); setShowProfileModal(true); }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 group-hover/header:bg-[#2D5F8B] group-hover/header:text-white transition-colors shadow-sm"><User size={16} /></div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover/header:text-[#2D5F8B] dark:group-hover:text-blue-400 transition-colors truncate">{patient.fullName} <span className="text-[10px] font-bold text-[#2D5F8B] dark:text-blue-400 ml-1 opacity-0 group-hover/header:opacity-100 transition-opacity">Profile &rarr;</span></h3>
                        <p className="text-[10px] text-slate-500 truncate">{patient.email}</p>
                      </div>
                    </div>
                    {patient.oaDiagnosis && <span className="text-[8px] font-black uppercase bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0 ml-2">OA</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Last Sync</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate"><Activity size={12} className="text-emerald-500 shrink-0"/> {lastSync}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latest Score</span>
                      <span className={`text-xs font-bold flex items-center gap-1 truncate ${currentScore >= 75 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {currentScore >= 75 && <AlertCircle size={12} className="shrink-0"/>}
                        {currentScore > 0 ? `${currentScore} / 100` : 'No Data'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => { setSelectedPatient(patient); setShowLiveDashboard(true); }} className="flex-1 text-[10px] font-bold px-2 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-100 dark:border-blue-500/20">Dashboard</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedPatientForThreshold(patient); setShowThresholdModal(true); }} className="flex-1 text-[10px] font-bold px-2 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-100 dark:border-indigo-500/20">Threshold</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedPatientForSts(patient); setShowStsModal(true); }} className="flex-1 text-[10px] font-bold px-2 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-100 dark:border-emerald-500/20">SLET Test</button>
                    <button onClick={(e) => handleOpenTransfer(e, patient)} className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-100 dark:border-rose-500/30 shadow-sm" title="Transfer or Release Patient"><Share2 size={14} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- MODALS --- */}
        <RegisterPatientModal 
          isOpen={showRegisterModal} 
          onClose={() => setShowRegisterModal(false)} 
          clinicianId={clinicianId} 
          onSuccess={() => router.refresh()} 
        />
        
        <PatientProfileModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)} 
          patient={patientForProfile} 
        />

        {/* --- TRANSFER MODAL --- */}
        {showTransferModal && patientToTransfer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowTransferModal(false)}></div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-5 max-w-md w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-4">
                <div><h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Patient Management</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage {patientToTransfer.fullName}</p></div>
                <button onClick={() => setShowTransferModal(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={!isReleasing} onChange={() => setIsReleasing(false)} className="w-3.5 h-3.5 accent-[#2D5F8B]" /><span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Transfer to another clinician</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={isReleasing} onChange={() => setIsReleasing(true)} className="w-3.5 h-3.5 accent-rose-500" /><span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Release patient</span></label>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  {!isReleasing ? (
                    <div><label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Clinician Email</label><input type="email" placeholder="clinician@example.com" value={targetClinicianEmail} onChange={(e) => setTargetClinicianEmail(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] text-xs"/></div>
                  ) : (<div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-md border border-rose-100"><p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">This will unassign the patient.</p></div>)}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={handleExecuteTransfer} disabled={(isReleasing ? false : !targetClinicianEmail.trim()) || isTransferring} className={`w-full py-2.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 ${isReleasing ? 'bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50' : 'bg-slate-900 dark:bg-blue-600 text-white disabled:opacity-50'}`}>{isTransferring ? <Loader2 className="animate-spin" size={14} /> : (isReleasing ? 'Release Patient' : 'Confirm Transfer')}</button>
                  <button onClick={() => setShowTransferModal(false)} className="w-full py-2.5 text-slate-500 font-bold hover:text-slate-700 transition-colors text-xs">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ASSIGN PATIENT MODAL ---*/}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-5 md:p-6 max-w-md w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
               <div className="flex justify-between items-start mb-4">
                 <div className="min-w-0 text-left"><h2 className="text-lg font-extrabold tracking-tight flex items-center gap-1.5"><UserPlus size={18} className="text-[#2D5F8B]" /> Assign Patient</h2><p className="text-xs font-medium text-slate-500 mt-1">Link an existing KneuraSense patient.</p></div>
                 <button onClick={() => setShowAssignModal(false)} className="p-1.5 -mr-1.5 bg-slate-50 dark:bg-slate-800 rounded-md text-slate-400"><X size={16} /></button>
               </div>
               {assignStatus.message && (
                <div className={`mb-4 p-3 rounded-md text-xs font-bold flex items-center gap-2 ${assignStatus.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{assignStatus.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}{assignStatus.message}</div>
               )}
              <form onSubmit={handleAssignPatient} className="space-y-3 text-left">
                <div><label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Patient Email <span className="text-rose-500">*</span></label><input type="email" value={assignEmail} onChange={(e) => setAssignEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md text-xs" required/></div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <button type="submit" disabled={assignStatus.loading || !assignEmail} className="w-full flex justify-center gap-1.5 px-3 py-2 bg-[#2D5F8B] text-white font-bold rounded-md disabled:opacity-50 text-xs">{assignStatus.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add to Roster'}</button>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="w-full px-3 py-2 bg-slate-50 border rounded-md text-slate-700 font-bold text-xs">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- LIVE DASHBOARD MODAL --- */}
        {showLiveDashboard && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowLiveDashboard(false)}></div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-5xl w-full max-h-[90dvh] overflow-y-auto relative border border-slate-100 dark:border-slate-800 no-scrollbar">
              <div className="sticky top-0 bg-white dark:bg-slate-900 flex justify-between items-center p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 z-10">
                <div className="min-w-0"><h2 className="text-lg md:text-xl font-extrabold">{selectedPatient.fullName} - Live Dashboard</h2></div>
                <button onClick={() => setShowLiveDashboard(false)} className="p-1.5 -mr-1.5 bg-slate-50 rounded-md text-slate-400"><X size={18} /></button>
              </div>
              <div className="p-4 md:p-5"><LiveDashboard patientName={selectedPatient.fullName} patientId={selectedPatient.id} deviceMac={selectedPatient.deviceMac}/></div>
            </div>
          </div>
        )}

        {/* --- CLINICAL THRESHOLD MODAL --- */}
        {showThresholdModal && selectedPatientForThreshold && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowThresholdModal(false)}></div>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full relative">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-extrabold">{selectedPatientForThreshold.fullName} - Clinical Threshold</h2>
                <button onClick={() => setShowThresholdModal(false)} className="p-1.5 rounded-md"><X size={18} /></button>
              </div>
              <div className="p-4"><ClinicalThresholdManager clinicianId={clinicianId} patient={selectedPatientForThreshold}/></div>
            </div>
          </div>
        )}

        {/* --- STS CLINICAL TEST MODAL --- */}
        {showStsModal && selectedPatientForSts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowStsModal(false); setSelectedPatientForSts(null); }}></div>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full relative">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-extrabold">{selectedPatientForSts.fullName} - SLET Test</h2>
                <button onClick={() => { setShowStsModal(false); setSelectedPatientForSts(null); }} className="p-1.5 rounded-md"><X size={18} /></button>
              </div>
              <div className="p-4 bg-slate-50 rounded-b-lg"><STSClinicalTest deviceMac={selectedPatientForSts.deviceMac} patientId={selectedPatientForSts.id} clinicianId={clinicianId}/></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}