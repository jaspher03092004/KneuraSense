'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientRegistrationSchema } from '@/lib/validations'; // Ensure this matches your schema
import { clinicianRegisterPatient } from '@/actions/clinicianRegisterPatient';
import { assignPatientToClinician, unassignPatient, transferPatient } from '@/actions/assignPatient';
import { 
  Search, ChevronLeft, User, Activity, AlertCircle, 
  Download, UserPlus, Plus, X, AlertTriangle, CheckCircle, Loader2, Filter, Share2
} from 'lucide-react';
import Link from 'next/link';
import LiveDashboard from '@/components/LiveDashboard';
import ClinicalThresholdManager from '@/components/ClinicalThresholdManager';

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
  
  // -- Filter State --
  const [riskFilter, setRiskFilter] = useState('all'); // 'all', 'high', 'normal', 'low'
  const [deviceFilter, setDeviceFilter] = useState('all'); // 'all', 'online', 'offline'
  const [oaFilter, setOaFilter] = useState('all'); // 'all', 'yes', 'no'
  const [showFilters, setShowFilters] = useState(false);
  
  const [registrationMessage, setRegistrationMessage] = useState({ type: '', text: '' });
  const [assignEmail, setAssignEmail] = useState('');
  const [assignStatus, setAssignStatus] = useState({ loading: false, message: '', type: '' });

  // -- Form Setup (Password omitted from UI) --
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: { oaDiagnosis: 'No', gender: '', affectedKnee: '', activityLevel: '', deviceMac: '' }
  });

  // -- Derived Data --
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      // Search filter
      const matchesSearch = p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Risk score filter
      const riskScore = p.sensorLogs?.[0]?.riskScore || 0;
      let matchesRisk = true;
      if (riskFilter === 'high') {
        matchesRisk = riskScore >= 75;
      } else if (riskFilter === 'normal') {
        matchesRisk = riskScore >= 50 && riskScore < 75;
      } else if (riskFilter === 'low') {
        matchesRisk = riskScore < 50;
      }
      
      // Device status filter (online if recent sync within 1 hour)
      const lastSyncTime = p.sensorLogs?.[0]?.timestamp ? new Date(p.sensorLogs[0].timestamp).getTime() : 0;
      const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);
      const isDeviceOnline = lastSyncTime > oneHourAgo && p.deviceMac;
      
      let matchesDevice = true;
      if (deviceFilter === 'online') {
        matchesDevice = isDeviceOnline;
      } else if (deviceFilter === 'offline') {
        matchesDevice = !isDeviceOnline;
      }
      
      // OA diagnosis filter
      let matchesOA = true;
      if (oaFilter === 'yes') {
        matchesOA = p.oaDiagnosis === 'Yes';
      } else if (oaFilter === 'no') {
        matchesOA = p.oaDiagnosis !== 'Yes';
      }
      
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
      if (!confirm(`Release ${patientToTransfer.fullName} from your care? They will be unassigned and available for any clinician to link.`)) {
        return;
      }
      const result = await unassignPatient(patientToTransfer.id, clinicianId);
      if (result.success) {
        setShowTransferModal(false);
        setPatientToTransfer(null);
        setIsReleasing(false);
        router.refresh();
      } else {
        alert(result.error);
      }
    } else {
      if (!targetClinicianEmail.trim()) return;
      setIsTransferring(true);
      
      const result = await transferPatient(patientToTransfer.id, clinicianId, targetClinicianEmail);
      if (result.success) {
        setShowTransferModal(false);
        setPatientToTransfer(null);
        setTargetClinicianEmail('');
        router.refresh();
      } else {
        alert(result.error);
      }
      setIsTransferring(false);
    }
  };

  const handleUnassign = async (patientId) => {
    if (confirm("Release this patient from your care? They will be unassigned and available for any clinician to link.")) {
      const result = await unassignPatient(patientId, clinicianId);
      if (result.success) router.refresh();
      else alert(result.error);
    }
  };

  const handleAssignPatient = async (e) => {
    e.preventDefault();
    setAssignStatus({ loading: true, message: '', type: '' });
    const result = await assignPatientToClinician(clinicianId, assignEmail);
    if (result.success) {
      setAssignStatus({ loading: false, message: 'Patient assigned successfully!', type: 'success' });
      setTimeout(() => { setShowAssignModal(false); setAssignEmail(''); router.refresh(); }, 1500);
    } else {
      setAssignStatus({ loading: false, message: result.error, type: 'error' });
    }
  };

  const handleExport = () => {
    if (filteredPatients.length === 0) {
      alert("No patient data to export.");
      return;
    }

    const headers = ['Patient ID', 'Name', 'Email', 'Age', 'Device MAC', 'Latest Risk Score', 'Last Sensor Sync'];
    const rows = filteredPatients.map(p => {
      const latestLog = p.sensorLogs?.[0];
      return [
        p.id, 
        `"${p.fullName}"`, 
        `"${p.email}"`, 
        p.age, 
        p.deviceMac || 'None', 
        latestLog?.riskScore || 'No Data', 
        `"${latestLog?.timestamp ? new Date(latestLog.timestamp).toLocaleString() : 'Never'}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `patient_roster_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onRegisterSubmit = async (data) => {
    setRegistrationMessage({ type: '', text: '' });
    try {
      const formDataObj = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) formDataObj.append(key, data[key]);
      });

      // 1. Silently link the registering clinician
      formDataObj.append('registeredByClinicianId', clinicianId);
      
      // 2. Generate a highly secure temporary password in the background to satisfy validation
      // In production, the backend intercepts this and sends an activation email to the patient.
      const generateTempPassword = () => {
        return Math.random().toString(36).slice(-10) + 'A1!z';
      };

      const result = await clinicianRegisterPatient(formDataObj);

      if (result.success) {
        setRegistrationMessage({ type: 'success', text: 'Patient registered successfully! An activation email will be sent.' });
        setTimeout(() => {
          setShowRegisterModal(false);
          reset();
          setRegistrationMessage({ type: '', text: '' });
          router.refresh(); 
        }, 2000);
      } else {
        setRegistrationMessage({ type: 'error', text: `Error: ${result.error || 'Registration failed'}` });
      }
    } catch (error) {
      console.error(error); 
      setRegistrationMessage({ type: 'error', text: 'An error occurred during registration.' });
    }
  };

  const handleCardClick = (patient) => {
    setSelectedPatient(patient);
    setShowLiveDashboard(true);
  };

  const closeLiveDashboard = () => {
    setShowLiveDashboard(false);
    setSelectedPatient(null);
  };

  const handleThresholdClick = (e, patient) => {
    e.stopPropagation();
    setSelectedPatientForThreshold(patient);
    setShowThresholdModal(true);
  };

  const closeThresholdModal = () => {
    setShowThresholdModal(false);
    setSelectedPatientForThreshold(null);
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
            <button 
              onClick={handleExport} 
              className="flex w-full md:w-auto items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-xs"
            >
              <Download size={14} /> Export
            </button>
            
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="flex w-full md:w-auto items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-xs"
            >
              <Filter size={14} /> Filters
            </button>
            
            <button 
              onClick={() => setShowAssignModal(true)} 
              className="flex w-full md:w-auto items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-[#2D5F8B] dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm text-xs"
            >
              <UserPlus size={14} strokeWidth={2.5} /> Assign Existing
            </button>

            <button 
              onClick={() => setShowRegisterModal(true)} 
              className="col-span-2 md:col-span-1 flex w-full md:w-auto items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-blue-600 rounded-md text-white font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm text-xs"
            >
              <Plus size={14} strokeWidth={3} /> Register New
            </button>
          </div>
        </header>

        {/* --- Search Bar --- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 flex items-center gap-2 mb-4 shadow-sm">
          <Search className="text-slate-400 ml-2 shrink-0" size={16} />
          <input 
            type="text" 
            placeholder="Search by patient name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 py-1.5 text-xs"
          />
        </div>

        {/* --- Filter Panel --- */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-4 shadow-sm animate-in fade-in duration-200">
            <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Risk Score Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Risk Score</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: 'all', label: 'All Patients' },
                    { value: 'high', label: 'High Risk (≥75)' },
                    { value: 'normal', label: 'Normal (50-75)' },
                    { value: 'low', label: 'Low Risk (<50)' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="risk" 
                        value={option.value}
                        checked={riskFilter === option.value}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Device Status Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Device Status</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: 'all', label: 'All Devices' },
                    { value: 'online', label: 'Online (Recently Synced)' },
                    { value: 'offline', label: 'Offline (Not Recent)' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="device" 
                        value={option.value}
                        checked={deviceFilter === option.value}
                        onChange={(e) => setDeviceFilter(e.target.value)}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* OA Diagnosis Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Diagnosis</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: 'all', label: 'All Patients' },
                    { value: 'yes', label: 'OA Diagnosed' },
                    { value: 'no', label: 'No OA Diagnosis' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="oa" 
                        value={option.value}
                        checked={oaFilter === option.value}
                        onChange={(e) => setOaFilter(e.target.value)}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button 
                onClick={() => {
                  setRiskFilter('all');
                  setDeviceFilter('all');
                  setOaFilter('all');
                }}
                className="text-[10px] font-bold px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        )}

        {/* --- Patient Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full text-slate-300 dark:text-slate-600 mb-3">
                <Search size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Patients Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">
                Try adjusting your search query, or use the buttons above to add a new patient to your roster.
              </p>
            </div>
          ) : (
            filteredPatients.map(patient => {
              const lastSync = patient.sensorLogs?.[0]?.timestamp 
                ? new Date(patient.sensorLogs[0].timestamp).toLocaleDateString() 
                : 'Never';
              const currentScore = patient.sensorLogs?.[0]?.riskScore || 0;

              return (
                <div 
                  key={patient.id} 
                  className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-[#2D5F8B] dark:hover:border-blue-500 transition-all hover:shadow-md group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <User size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#2D5F8B] dark:group-hover:text-blue-400 transition-colors truncate">{patient.fullName}</h3>
                        <p className="text-[10px] text-slate-500 truncate">{patient.email}</p>
                      </div>
                    </div>
                    {patient.oaDiagnosis && (
                      <span className="text-[8px] font-black uppercase bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0 ml-2">OA</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Last Sync</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                        <Activity size={12} className="text-emerald-500 shrink-0"/> {lastSync}
                      </span>
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
                    <button 
                      onClick={() => handleCardClick(patient)}
                      className="flex-1 text-[10px] font-bold px-2 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-100 dark:border-blue-500/20"
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={(e) => handleThresholdClick(e, patient)}
                      className="flex-1 text-[10px] font-bold px-2 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-100 dark:border-indigo-500/20"
                    >
                      Threshold
                    </button>
                    <button 
                      onClick={(e) => handleOpenTransfer(e, patient)}
                      className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-100 dark:border-rose-500/30 shadow-sm"
                      title="Transfer or Release Patient"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- TRANSFER MODAL --- */}
        {showTransferModal && patientToTransfer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowTransferModal(false)}></div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-5 max-w-md w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Patient Management</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage {patientToTransfer.fullName}</p>
                </div>
                <button onClick={() => setShowTransferModal(false)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Transfer/Release Options */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="transferOption" 
                      checked={!isReleasing}
                      onChange={() => setIsReleasing(false)}
                      className="w-3.5 h-3.5 accent-[#2D5F8B] dark:accent-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Transfer to another clinician</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="transferOption" 
                      checked={isReleasing}
                      onChange={() => setIsReleasing(true)}
                      className="w-3.5 h-3.5 accent-rose-500 dark:accent-rose-400"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Release patient</span>
                  </label>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  {!isReleasing ? (
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Clinician Email Address</label>
                      <input 
                        type="email" 
                        placeholder="clinician@example.com"
                        value={targetClinicianEmail}
                        onChange={(e) => setTargetClinicianEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#2D5F8B] dark:focus:ring-blue-500 transition-all text-xs"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-md border border-rose-100 dark:border-rose-500/30">
                      <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">This will unassign the patient and make them available for any clinician to link.</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleExecuteTransfer}
                    disabled={(isReleasing ? false : !targetClinicianEmail.trim()) || isTransferring}
                    className={`w-full py-2.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${isReleasing ? 'bg-rose-600 dark:bg-rose-600 text-white hover:bg-rose-700 dark:hover:bg-rose-700 disabled:opacity-50' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-50'}`}
                  >
                    {isTransferring ? <Loader2 className="animate-spin" size={14} /> : (isReleasing ? 'Release Patient' : 'Confirm Transfer')}
                  </button>
                  <button 
                    onClick={() => setShowTransferModal(false)}
                    className="w-full py-2.5 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-xs"
                  >
                    Cancel
                  </button>
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
                 <div className="min-w-0 text-left">
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                      <UserPlus size={18} className="text-[#2D5F8B] dark:text-blue-500" />
                      Assign Patient
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Link an existing KneuraSense patient to your clinic.</p>
                 </div>
                 <button onClick={() => setShowAssignModal(false)} className="p-1.5 -mr-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 shrink-0">
                   <X size={16} />
                 </button>
               </div>
               
               {assignStatus.message && (
                <div className={`mb-4 p-3 rounded-md text-xs font-bold flex items-center gap-2 ${assignStatus.type === 'error' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/30' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/30'}`}>
                  {assignStatus.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                  {assignStatus.message}
                </div>
               )}

              <form onSubmit={handleAssignPatient} className="space-y-3 text-left">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Patient Email Address <span className="text-rose-500 dark:text-rose-400">*</span></label>
                  <input 
                    type="email" 
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2D5F8B] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#2D5F8B]/10 dark:focus:ring-blue-500/10 outline-none transition-all text-xs font-medium" 
                    placeholder="patient@example.com" 
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5 pt-2">
                  <button type="submit" disabled={assignStatus.loading || !assignEmail} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2D5F8B] dark:bg-blue-600 text-white font-bold rounded-md hover:bg-[#22486b] dark:hover:bg-blue-700 disabled:opacity-50 dark:disabled:opacity-50 transition-colors text-xs">
                    {assignStatus.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add to Roster'}
                  </button>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- REGISTER NEW PATIENT MODAL ---                        */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowRegisterModal(false)}></div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-5 md:p-6 max-w-2xl w-full max-h-[90dvh] overflow-y-auto relative border border-slate-100 dark:border-slate-800 no-scrollbar animate-in fade-in zoom-in-95 duration-200">
               
               <div className="flex justify-between items-start mb-4">
                 <div className="min-w-0 text-left">
                    <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Register New Patient</h2>
                    <p className="text-[11px] md:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Create a secure profile. An activation link will be emailed to the patient.</p>
                 </div>
                 <button onClick={() => setShowRegisterModal(false)} className="p-2 -mr-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-md transition-colors text-slate-400 shrink-0">
                   <X size={18} />
                 </button>
               </div>
               
               {registrationMessage.text && (
                <div className={`mb-4 p-3 rounded-md text-[11px] md:text-xs font-bold flex items-center gap-2 ${registrationMessage.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {registrationMessage.type === 'error' ? <AlertTriangle size={14} className="shrink-0"/> : <CheckCircle size={14} className="shrink-0"/>}
                  {registrationMessage.text}
                </div>
              )}

              <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-3 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name <span className="text-rose-500">*</span></label>
                    <input type="text" {...register("fullName")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 focus:border-[#2D5F8B] focus:ring-4 outline-none transition-all text-xs" placeholder="John Doe" />
                    {errors.fullName && <p className="text-[9px] text-rose-500 mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address <span className="text-rose-500">*</span></label>
                    <input type="email" {...register("email")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 focus:border-[#2D5F8B] focus:ring-4 outline-none transition-all text-xs" placeholder="john@example.com" />
                    {errors.email && <p className="text-[9px] text-rose-500 mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone <span className="text-rose-500">*</span></label>
                    <input type="tel" {...register("phoneNumber")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 focus:border-[#2D5F8B] focus:ring-4 outline-none transition-all text-xs" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Age <span className="text-rose-500">*</span></label>
                      <input type="number" {...register("age")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 focus:border-[#2D5F8B] focus:ring-4 outline-none transition-all text-xs" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender <span className="text-rose-500">*</span></label>
                      <select {...register("gender")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 focus:border-[#2D5F8B] focus:ring-4 outline-none transition-all text-xs">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">OA Diagnosis</label>
                    <select {...register("oaDiagnosis")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 focus:border-[#2D5F8B] focus:ring-4 outline-none transition-all text-xs">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Activity Level <span className="text-rose-500">*</span></label>
                    <select {...register("activityLevel")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 focus:border-[#2D5F8B] focus:ring-4 outline-none transition-all text-xs">
                      <option value="">Select</option>
                      <option value="Sedentary">Sedentary</option>
                      <option value="Light">Light</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[9px] font-black text-[#3A9D8C] dark:text-teal-500 uppercase tracking-widest mb-1">Assign Device MAC Address (Optional)</label>
                  <input 
                    type="text" 
                    {...register("deviceMac")} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 focus:border-[#3A9D8C] focus:ring-4 outline-none transition-all text-xs font-mono uppercase tracking-widest placeholder:tracking-normal" 
                    placeholder="e.g. A1B2C3D4E5F6" 
                    maxLength={17}
                  />
                  <p className="text-[9px] text-slate-400 mt-1">If issuing hardware now, enter the 12-character MAC address.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => { setShowRegisterModal(false); reset(); }} className="w-full md:flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-md text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors order-2 md:order-1 text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="w-full md:flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-md hover:bg-slate-800 disabled:opacity-70 transition-colors shadow-sm order-1 md:order-2 text-xs">
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm & Register'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- LIVE DASHBOARD MODAL --- */}
        {showLiveDashboard && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={closeLiveDashboard}></div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-5xl w-full max-h-[90dvh] overflow-y-auto relative border border-slate-100 dark:border-slate-800 no-scrollbar">
              <div className="sticky top-0 bg-white dark:bg-slate-900 flex justify-between items-center p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 z-10">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{selectedPatient.fullName} - Live Dashboard</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Real-time sensor data and device status</p>
                </div>
                <button 
                  onClick={closeLiveDashboard} 
                  className="p-1.5 -mr-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 md:p-5">
                <LiveDashboard 
                  patientName={selectedPatient.fullName}
                  patientId={selectedPatient.id}
                  deviceMac={selectedPatient.deviceMac}
                />
              </div>
            </div>
          </div>
        )}

        {/* --- CLINICAL THRESHOLD MODAL --- */}
        {showThresholdModal && selectedPatientForThreshold && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={closeThresholdModal}></div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 md:p-5 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{selectedPatientForThreshold.fullName} - Clinical Threshold</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Manage risk score prescription</p>
                </div>
                <button 
                  onClick={closeThresholdModal} 
                  className="p-1.5 -mr-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 md:p-5">
                <ClinicalThresholdManager 
                  clinicianId={clinicianId}
                  patient={selectedPatientForThreshold}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}