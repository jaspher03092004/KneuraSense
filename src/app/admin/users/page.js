'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  getSystemUsers, 
  getPendingClinicians, 
  toggleClinicianAccess, 
  approveClinician, 
  rejectClinician,
  updateUserProfile,
  deleteSystemUser,
  adminTriggerPasswordReset
} from '@/actions/admin';
import { 
  Users, Stethoscope, Search, ShieldBan, CheckCircle, 
  X, AlertTriangle, Loader2, UserCog, Clock, XCircle, User, 
  UserX, Hash, MoreVertical, Edit, Trash2, KeyRound
} from 'lucide-react';

export default function UserManagement() {
  const [data, setData] = useState({ clinicians: [], patients: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('clinicians'); // 'clinicians' | 'patients' | 'pending'
  
  // Unified Management Modal State
  const [manageModal, setManageModal] = useState({ isOpen: false, user: null, role: null });
  const [editForm, setEditForm] = useState({ full_name: '', email: '', specialization: '', clinicianId: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingActionId, setPendingActionId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const [usersRes, pendingRes] = await Promise.all([
        getSystemUsers(),
        getPendingClinicians()
      ]);
      
      if (usersRes.success && pendingRes.success) {
        const pendingIds = new Set(pendingRes.data.map(p => p.clinician_id));
        const activeClinicians = usersRes.data.clinicians.filter(c => !pendingIds.has(c.clinician_id));
        
        setData({ 
          clinicians: activeClinicians, 
          patients: usersRes.data.patients, 
          pending: pendingRes.data 
        });
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (activeTab === 'clinicians') {
      return data.clinicians.filter(c => 
        c.full_name?.toLowerCase().includes(query) || 
        c.email?.toLowerCase().includes(query) ||
        c.specialization?.toLowerCase().includes(query)
      );
    } else if (activeTab === 'patients') {
      return data.patients.filter(p => 
        p.fullName?.toLowerCase().includes(query) || 
        p.email?.toLowerCase().includes(query) ||
        p.clinician?.full_name?.toLowerCase().includes(query)
      );
    } else {
      return data.pending.filter(p => 
        p.full_name?.toLowerCase().includes(query) || 
        p.email?.toLowerCase().includes(query)
      );
    }
  }, [data, searchQuery, activeTab]);

  // --- MODAL HANDLERS ---
  const openManageModal = (user, role) => {
    setManageModal({ isOpen: true, user, role });
    setEditForm({
      full_name: role === 'clinician' ? user.full_name : user.fullName,
      email: user.email || '',
      specialization: user.specialization || '',
      clinicianId: user.clinicianId || '',
      // Add all Patient specific fields
      mrn: user.mrn || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user.gender || '',
      heightCm: user.heightCm || '',
      weightKg: user.weightKg || '',
      phoneNumber: user.phoneNumber || '',
      emergencyContactName: user.emergencyContactName || '',
      emergencyContactPhone: user.emergencyContactPhone || '',
      oaDiagnosis: user.oaDiagnosis ? 'true' : 'false',
      affectedKnee: user.affectedKnee || '',
      occupation: user.occupation || '',
      activityLevel: user.activityLevel || '',
    });
  };

  const closeManageModal = () => {
    if (!actionLoading) setManageModal({ isOpen: false, user: null, role: null });
  };

  // --- ACTIONS ---
  const handleUpdateProfile = async () => {
    const { user, role } = manageModal;
    setActionLoading(true);
    
    // Map form data based on role schema, applying strict type casting for Prisma
    const updateData = role === 'clinician' 
      ? { full_name: editForm.full_name, email: editForm.email, specialization: editForm.specialization }
      : { 
          fullName: editForm.full_name, 
          email: editForm.email, 
          clinicianId: editForm.clinicianId || null,
          mrn: editForm.mrn || null,
          dateOfBirth: editForm.dateOfBirth ? new Date(editForm.dateOfBirth) : undefined, // Undefined ignores it if blank
          gender: editForm.gender || null,
          heightCm: editForm.heightCm ? parseFloat(editForm.heightCm) : null,
          weightKg: editForm.weightKg ? parseFloat(editForm.weightKg) : null,
          phoneNumber: editForm.phoneNumber || undefined, // required field
          emergencyContactName: editForm.emergencyContactName || null,
          emergencyContactPhone: editForm.emergencyContactPhone || null,
          oaDiagnosis: editForm.oaDiagnosis === 'true',
          affectedKnee: editForm.affectedKnee || null,
          occupation: editForm.occupation || null,
          activityLevel: editForm.activityLevel || null,
        };

    const result = await updateUserProfile(role === 'clinician' ? user.clinician_id : user.id, role, updateData);
    
    if (result.success) {
      setData(prev => {
        if (role === 'clinician') {
          return { ...prev, clinicians: prev.clinicians.map(c => c.clinician_id === user.clinician_id ? { ...c, ...updateData } : c) };
        } else {
          const matchedClinician = prev.clinicians.find(c => c.clinician_id === updateData.clinicianId);
          return { ...prev, patients: prev.patients.map(p => p.id === user.id ? { ...p, ...updateData, clinician: matchedClinician || null } : p) };
        }
      });
      alert(result.message);
      closeManageModal();
    } else {
      alert(result.error);
    }
    setActionLoading(false);
  };

  const handleToggleAccess = async () => {
    const { user } = manageModal;
    setActionLoading(true);
    const result = await toggleClinicianAccess(user.clinician_id, user.isApproved);
    if (result.success) {
      setData(prev => ({
        ...prev,
        clinicians: prev.clinicians.map(c => c.clinician_id === user.clinician_id ? { ...c, isApproved: !c.isApproved } : c)
      }));
      setManageModal(prev => ({ ...prev, user: { ...prev.user, isApproved: !prev.user.isApproved } }));
    } else {
      alert(result.error);
    }
    setActionLoading(false);
  };

  const handlePasswordReset = async () => {
    setActionLoading(true);
    const result = await adminTriggerPasswordReset(manageModal.user.email);
    alert(result.success ? result.message : result.error);
    setActionLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!confirm(`WARNING: Are you sure you want to permanently delete ${manageModal.role === 'clinician' ? 'Dr. ' : ''}${editForm.full_name}? This action cannot be undone and will destroy all associated data.`)) return;
    
    setActionLoading(true);
    const { user, role } = manageModal;
    const result = await deleteSystemUser(role === 'clinician' ? user.clinician_id : user.id, role);
    
    if (result.success) {
      setData(prev => ({
        ...prev,
        clinicians: role === 'clinician' ? prev.clinicians.filter(c => c.clinician_id !== user.clinician_id) : prev.clinicians,
        patients: role === 'patient' ? prev.patients.filter(p => p.id !== user.id) : prev.patients
      }));
      closeManageModal();
    } else {
      alert(result.error);
    }
    setActionLoading(false);
  };

  const handlePendingAction = async (id, actionFn, type) => {
    if (!confirm(type === 'approve' ? 'Authorize this clinician?' : 'Reject and delete this application?')) return;
    
    setPendingActionId(id);
    const result = await actionFn(id);
    
    if (result.success) {
      setData(prev => {
        const processed = prev.pending.find(c => c.clinician_id === id);
        return {
          ...prev,
          pending: prev.pending.filter(c => c.clinician_id !== id),
          clinicians: type === 'approve' && processed ? [{ ...processed, isApproved: true, _count: { patients: 0 } }, ...prev.clinicians] : prev.clinicians
        };
      });
      if (data.pending.length === 1 && type === 'approve') setActiveTab('clinicians');
    } else {
      alert(result.error);
    }
    setPendingActionId(null);
  };

  if (loading) return <div className="p-6 sm:p-10 animate-pulse bg-slate-50 h-full" />;

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-[1400px] mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500 font-sans antialiased relative">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 sm:gap-4 mb-1 sm:mb-2">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2C3E50] dark:text-white tracking-tight">User <span className="text-[#2D5F8B]">Directory</span></h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Manage platform access, clinician rosters, and patient assignments.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white dark:bg-slate-900 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-0.5 sm:p-1 bg-blue-50 dark:bg-blue-500/10 rounded"><Stethoscope className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400" /></div>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{data.clinicians.length} Staff</span>
            </div>
            <div className="w-px h-4 sm:h-5 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-0.5 sm:p-1 bg-emerald-50 dark:bg-emerald-500/10 rounded"><Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" /></div>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{data.patients.length} Patients</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px]">
        
        {/* Toolbar & Tabs */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col xl:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
          <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-md w-full xl:w-auto overflow-x-auto no-scrollbar scroll-smooth">
            <button onClick={() => { setActiveTab('clinicians'); setSearchQuery(''); }} className={`flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded transition-all whitespace-nowrap ${activeTab === 'clinicians' ? 'bg-white dark:bg-slate-700 text-[#2D5F8B] dark:text-blue-400 shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><UserCog className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Clinician Directory</button>
            <button onClick={() => { setActiveTab('patients'); setSearchQuery(''); }} className={`flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded transition-all whitespace-nowrap ${activeTab === 'patients' ? 'bg-white dark:bg-slate-700 text-[#2D5F8B] dark:text-blue-400 shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Patient Roster</button>
            <button onClick={() => { setActiveTab('pending'); setSearchQuery(''); }} className={`flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded transition-all whitespace-nowrap ${activeTab === 'pending' ? 'bg-white dark:bg-slate-700 text-[#2D5F8B] dark:text-blue-400 shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Pending Requests {data.pending.length > 0 && (<span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black ${activeTab === 'pending' ? 'bg-[#2D5F8B] text-white dark:bg-blue-500/20 dark:text-blue-400' : 'bg-rose-500 text-white'}`}>{data.pending.length}</span>)}</button>
          </div>
          <div className="relative w-full xl:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-focus-within:text-[#2D5F8B] transition-colors" />
            <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 sm:pl-9 pr-8 py-1.5 sm:py-2 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-700 rounded-md text-[11px] sm:text-xs font-medium focus:border-[#2D5F8B] focus:ring-1 focus:ring-[#2D5F8B] outline-none transition-all dark:text-white shadow-sm" />
            {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><X className="w-3 h-3" /></button>)}
          </div>
        </div>

        {/* --- CLINICIANS TABLE --- */}
        {activeTab === 'clinicians' && (
          <div className="overflow-x-auto flex-1 pb-4 sm:pb-0 relative">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Medical Professional</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Specialization</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Assigned Patients</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Access Status</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px] text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredData.length === 0 ? (
                  <tr><td colSpan="5" className="py-16 sm:py-20 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><UserX className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 opacity-30" /><span className="font-medium italic text-[11px] sm:text-xs">No active clinicians found.</span></div></td></tr>
                ) : (
                  filteredData.map(c => (
                    <tr key={c.clinician_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div className="flex items-center gap-2.5 sm:gap-3"><div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0"><User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" /></div><div><div className="font-bold text-slate-900 dark:text-slate-200 text-[11px] sm:text-xs">{c.full_name}</div><div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{c.email}</div></div></div></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><span className="text-[9px] sm:text-[10px] font-bold text-[#2D5F8B] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 sm:py-1 rounded-md uppercase tracking-wide border border-blue-100/50 dark:border-blue-500/10">{c.specialization}</span></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-slate-200/60 dark:border-slate-700 text-[10px] sm:text-xs">{c._count?.patients || 0}</span></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">{c.isApproved ? (<div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] sm:text-xs"><CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Active</div>) : (<div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[10px] sm:text-xs"><ShieldBan className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Suspended</div>)}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                        <button onClick={() => openManageModal(c, 'clinician')} className="px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all border border-slate-200/80 dark:border-slate-700 inline-flex items-center justify-center shadow-sm hover:border-slate-300 dark:hover:border-slate-600 text-[10px] sm:text-xs">
                          <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- PATIENTS TABLE --- */}
        {activeTab === 'patients' && (
          <div className="overflow-x-auto flex-1 pb-4 sm:pb-0 relative">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Patient Profile</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Supervising Clinician</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Diagnostics</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Latest Telemetry</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px] text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredData.length === 0 ? (
                  <tr><td colSpan="5" className="py-16 sm:py-20 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><UserX className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 opacity-30" /><span className="font-medium italic text-[11px] sm:text-xs">No patients found.</span></div></td></tr>
                ) : (
                  filteredData.map(p => {
                    const score = p.sensorLogs?.[0]?.riskScore;
                    const isHighRisk = score >= 75;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div className="flex items-center gap-2.5 sm:gap-3"><div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0"><User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" /></div><div><div className="font-bold text-slate-900 dark:text-slate-200 text-[11px] sm:text-xs">{p.fullName}</div><div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{p.email}</div></div></div></td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap text-[11px] sm:text-xs">{p.clinician?.full_name ? `Dr. ${p.clinician.full_name.split(' ').pop()}` : <span className="italic text-slate-400">Unassigned</span>}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">{p.oaDiagnosis === 'Yes' || p.oaDiagnosis === true ? (<span className="text-[8px] sm:text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-500/10 text-[#2D5F8B] dark:text-blue-400 px-2 py-0.5 sm:py-1 rounded border border-blue-100/50 dark:border-blue-500/20">Confirmed OA</span>) : (<span className="text-[8px] sm:text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 sm:py-1 rounded border border-slate-200/60 dark:border-slate-700">At-Risk</span>)}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">{score ? (<div className="flex items-center gap-1.5 sm:gap-2"><span className={`font-black text-[11px] sm:text-xs ${isHighRisk ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>{score}</span>{isHighRisk && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)] shrink-0" />}</div>) : (<span className="text-slate-400 italic text-[11px] sm:text-xs">No Data</span>)}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                          <button onClick={() => openManageModal(p, 'patient')} className="px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all border border-slate-200/80 dark:border-slate-700 inline-flex items-center justify-center shadow-sm hover:border-slate-300 dark:hover:border-slate-600 text-[10px] sm:text-xs">
                            <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- PENDING REQUESTS TABLE (UNCHANGED) --- */}
        {activeTab === 'pending' && (
           <div className="overflow-x-auto flex-1 pb-4 sm:pb-0 relative">
            <table className="w-full text-left text-xs min-w-[700px]">
              {/* Keep existing pending table markup exactly as it was */}
              <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px] whitespace-nowrap">Applicant Profile</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px] whitespace-nowrap">Specialization</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px] whitespace-nowrap">License / NPI</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px] whitespace-nowrap">Applied Date</th>
                  <th className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px] text-right whitespace-nowrap">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredData.length === 0 ? (
                  <tr><td colSpan="5" className="py-16 sm:py-20 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2 sm:mb-3"><CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 opacity-50" /></div><span className="font-bold text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs">Queue is clear!</span></div></td></tr>
                ) : (
                  filteredData.map(c => (
                    <tr key={c.clinician_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div className="flex items-center gap-2.5 sm:gap-3"><div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0"><User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" /></div><div><div className="font-bold text-slate-900 dark:text-slate-200 text-[11px] sm:text-xs">{c.full_name}</div><div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{c.email}</div></div></div></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><span className="text-[9px] sm:text-[10px] font-bold text-[#2D5F8B] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 sm:py-1 rounded-md uppercase tracking-wide border border-blue-100/50 dark:border-blue-500/10">{c.specialization}</span></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><span className="font-mono text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 sm:py-1 rounded border border-slate-200/60 dark:border-slate-700">{c.licenseNumber || 'Not Provided'}</span></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5 sm:gap-2">
                          <button onClick={() => handlePendingAction(c.clinician_id, approveClinician, 'approve')} disabled={pendingActionId === c.clinician_id} className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-md hover:bg-emerald-50 hover:text-emerald-600 font-bold transition-all border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 shadow-sm"><CheckCircle className="w-3 h-3" /> Approve</button>
                          <button onClick={() => handlePendingAction(c.clinician_id, rejectClinician, 'reject')} disabled={pendingActionId === c.clinician_id} className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-md hover:bg-rose-50 hover:text-rose-600 font-bold transition-all border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 shadow-sm"><XCircle className="w-3 h-3" /> Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- UNIFIED MANAGE USER MODAL --- */}
      {manageModal.isOpen && manageModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={closeManageModal}></div>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-5 md:p-6 max-w-[95%] sm:max-w-lg w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 text-left max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-[#2D5F8B]" /> Manage Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Editing {manageModal.role === 'clinician' ? 'Clinician' : 'Patient'} • <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{manageModal.role === 'clinician' ? manageModal.user.clinician_id.split('-')[0] : manageModal.user.id.split('-')[0]}</span>
                </p>
              </div>
              <button onClick={closeManageModal} className="p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              {/* SECTION 1: PROFILE EDITING */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1.5">Profile Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                    <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] focus:ring-1 focus:ring-[#2D5F8B] outline-none transition-all dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] focus:ring-1 focus:ring-[#2D5F8B] outline-none transition-all dark:text-white" />
                  </div>
                  
                  {manageModal.role === 'clinician' && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Specialization</label>
                      <input type="text" value={editForm.specialization} onChange={e => setEditForm({...editForm, specialization: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] focus:ring-1 focus:ring-[#2D5F8B] outline-none transition-all dark:text-white" />
                    </div>
                  )}

                  {manageModal.role === 'patient' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                        <input type="tel" value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Date of Birth</label>
                        <input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">MRN</label>
                        <input type="text" value={editForm.mrn} onChange={e => setEditForm({...editForm, mrn: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Gender</label>
                        <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white">
                          <option value="">Unspecified</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Height (cm)</label>
                        <input type="number" step="0.1" value={editForm.heightCm} onChange={e => setEditForm({...editForm, heightCm: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Weight (kg)</label>
                        <input type="number" step="0.1" value={editForm.weightKg} onChange={e => setEditForm({...editForm, weightKg: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">OA Diagnosis</label>
                        <select value={editForm.oaDiagnosis} onChange={e => setEditForm({...editForm, oaDiagnosis: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white">
                          <option value="false">Yes</option>
                          <option value="true">No</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Affected Knee</label>
                        <select value={editForm.affectedKnee} onChange={e => setEditForm({...editForm, affectedKnee: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white">
                          <option value="">Unspecified</option>
                          <option value="Left">Left</option>
                          <option value="Right">Right</option>
                          <option value="Both">Both</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Occupation</label>
                        <select value={editForm.occupation} onChange={e => setEditForm({...editForm, occupation: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white">
                          <option value="">Unspecified</option>
                          <option value="Retired">Retired</option>
                          <option value="Sedentary">Sedentary</option>
                          <option value="Light Duty">Light Duty</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Heavy Duty">Heavy Duty</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Activity Level</label>
                        <select value={editForm.activityLevel} onChange={e => setEditForm({...editForm, activityLevel: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white">
                          <option value="">Unspecified</option>
                          <option value="Sedentary (Mostly sitting, little to no exercise)">
                            Sedentary (Mostly sitting, little to no exercise)
                          </option>
                          <option value="Light (Light walking or standing, exercise 1-3 days/week)">
                            Light (Light walking or standing, exercise 1-3 days/week)
                          </option>
                          <option value="Moderate (Active movement, exercise 3-5 days/week)">
                            Moderate (Active movement, exercise 3-5 days/week)
                          </option>
                          <option value="Heavy (Physically demanding work or intense exercise)">
                            Heavy (Physically demanding work or intense exercise)
                          </option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Emerg. Contact Name</label>
                        <input type="text" value={editForm.emergencyContactName} onChange={e => setEditForm({...editForm, emergencyContactName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Emerg. Contact Phone</label>
                        <input type="text" value={editForm.emergencyContactPhone} onChange={e => setEditForm({...editForm, emergencyContactPhone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white" />
                      </div>

                      <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Clinician</label>
                        <select value={editForm.clinicianId} onChange={e => setEditForm({...editForm, clinicianId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium focus:border-[#2D5F8B] outline-none transition-all dark:text-white">
                          <option value="">Unassigned</option>
                          {data.clinicians.map(c => (
                            <option key={c.clinician_id} value={c.clinician_id}>Dr. {c.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <button onClick={handleUpdateProfile} disabled={actionLoading} className="w-full mt-2 py-2 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex justify-center items-center gap-2">
                  <Edit className="w-3.5 h-3.5" /> Save Profile Changes
                </button>
              </div>

              {/* SECTION 2: SECURITY & ACCESS */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1.5">Security & Access</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={handlePasswordReset} disabled={actionLoading} className="w-full p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:border-[#2D5F8B] dark:hover:border-[#2D5F8B] bg-white dark:bg-slate-900 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-[#2D5F8B] dark:text-blue-400 rounded"><KeyRound className="w-4 h-4" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#2D5F8B] transition-colors">Force Password Reset</p>
                        <p className="text-[10px] text-slate-500">Email a secure recovery link.</p>
                      </div>
                    </div>
                  </button>
                  
                  {manageModal.role === 'clinician' && (
                    <button onClick={handleToggleAccess} disabled={actionLoading} className={`w-full p-3 rounded-md border transition-all flex items-center justify-between group ${manageModal.user.isApproved ? 'border-amber-200 bg-amber-50 hover:border-amber-400' : 'border-emerald-200 bg-emerald-50 hover:border-emerald-400'}`}>
                      <div className="flex items-center gap-3 text-left">
                        <div className={`p-1.5 rounded ${manageModal.user.isApproved ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {manageModal.user.isApproved ? <ShieldBan className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold transition-colors ${manageModal.user.isApproved ? 'text-amber-800 group-hover:text-amber-600' : 'text-emerald-800 group-hover:text-emerald-600'}`}>
                            {manageModal.user.isApproved ? 'Suspend Platform Access' : 'Restore Platform Access'}
                          </p>
                          <p className={`text-[10px] ${manageModal.user.isApproved ? 'text-amber-600/80' : 'text-emerald-600/80'}`}>
                            {manageModal.user.isApproved ? 'Immediately lock account.' : 'Re-enable login capabilities.'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION 3: DANGER ZONE */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest border-b border-rose-100 dark:border-rose-900/30 pb-1.5">Danger Zone</h3>
                <button onClick={handleDeleteUser} disabled={actionLoading} className="w-full p-3 rounded-md border border-rose-200 dark:border-rose-800/50 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 bg-white dark:bg-slate-900 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded"><Trash2 className="w-4 h-4" /></div>
                    <div>
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-400 group-hover:text-rose-600 transition-colors">Permanently Delete User</p>
                      <p className="text-[10px] text-rose-500/80 dark:text-rose-500/60">Destroy all associated data and records.</p>
                    </div>
                  </div>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}