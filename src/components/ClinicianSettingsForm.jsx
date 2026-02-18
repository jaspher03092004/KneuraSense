'use client';

import { useState } from 'react';
import Link from 'next/link';
import { changePassword } from '@/actions/changePassword';
import { updateClinicianPreferences } from '@/actions/updateClinicianPreferences';
import { 
  Bell, Lock, ChevronRight, Save, X, 
  Loader2, CheckCircle, AlertCircle, Eye
} from 'lucide-react';

export default function ClinicianSettingsForm({ clinician }) {
  // --- STATE: Clinician Preferences ---
  // Initialized with DB values, defaulting to true/false if undefined
  const [emailAlerts, setEmailAlerts] = useState(clinician.emailAlerts ?? true);
  const [criticalAlerts, setCriticalAlerts] = useState(clinician.criticalAlerts ?? true);
  const [compactView, setCompactView] = useState(clinician.compactView ?? false);
  
  const [saveStatus, setSaveStatus] = useState({ loading: false, success: false, error: null });

  // --- STATE: Password Modal ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: null, success: null });

  const getTimeAgo = (dateInput) => {
    if (!dateInput) return 'Unknown';
    const date = new Date(dateInput);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  };

  const handleSavePreferences = async () => {
    setSaveStatus({ loading: true, success: false, error: null });
    
    const result = await updateClinicianPreferences(clinician.clinician_id, {
      criticalAlerts,
      emailAlerts,
      compactView
    });

    if (result.success) {
      setSaveStatus({ loading: false, success: true, error: null });
      setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
    } else {
      setSaveStatus({ loading: false, success: false, error: result.message });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, error: null, success: null });

    const formData = new FormData(e.target);
    const result = await changePassword(clinician.clinician_id, formData);

    if (result?.error) {
      setPasswordStatus({ loading: false, error: result.error, success: null });
    } else {
      setPasswordStatus({ loading: false, error: null, success: result?.success || "Password updated" });
      e.target.reset();
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordStatus({ loading: false, error: null, success: null });
      }, 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 bg-transparent transition-colors duration-300 p-4 md:p-8">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 transition-colors duration-300">Manage your clinician account and notification preferences</p>
      </div>

      {/* 1. Account Security */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Lock size={16} className="text-cyan-600 dark:text-cyan-400" /> Account Security
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <Link href={`/clinician/${clinician.clinician_id}/myProfile`} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer group">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-700 dark:text-cyan-400 font-bold border border-cyan-100 dark:border-cyan-800/30">
                  {clinician.full_name?.[0]}
               </div>
               <div>
                 <p className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">Professional Profile</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Update your clinical details</p>
               </div>
             </div>
             <ChevronRight size={18} className="text-slate-400 group-hover:text-cyan-600" />
          </Link>
          
          <div className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <Lock size={18} />
               </div>
               <div>
                 <p className="font-semibold text-slate-900 dark:text-slate-200">Change Password</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Last changed {getTimeAgo(clinician.updatedAt)}</p>
               </div>
             </div>
             <button 
               onClick={() => setIsPasswordModalOpen(true)}
               className="text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
             >
               Update
             </button>
          </div>
        </div>
      </section>

      {/* 2. Notification Preferences */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Bell size={16} className="text-amber-500 dark:text-amber-400" /> Alert & Notification Settings
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-200">Critical Patient Alerts</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Receive immediate dashboard alerts for high risk scores</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={criticalAlerts} onChange={(e) => setCriticalAlerts(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800"></div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-200">Daily Email Summaries</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Get a daily digest of patient compliances and warnings</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>
      </section>

      {/* 3. Display Preferences */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Eye size={16} className="text-purple-500 dark:text-purple-400" /> Display Preferences
          </h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-200">Compact Dashboard View</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Display denser data tables on the main dashboard</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={compactView} onChange={(e) => setCompactView(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
             {saveStatus.success && (
                <div className="p-3 bg-green-50 text-green-700 border border-green-100 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle size={16}/> Preferences saved successfully.
                </div>
             )}
             {saveStatus.error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16}/> {saveStatus.error}
                </div>
             )}
             
             <div className="flex justify-end">
                <button 
                  onClick={handleSavePreferences}
                  disabled={saveStatus.loading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saveStatus.loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                    {saveStatus.loading ? 'Saving...' : 'Save Preferences'}
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white">Change Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              {passwordStatus.error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {passwordStatus.error}
                </div>
              )}
              {passwordStatus.success && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 border border-green-100 text-sm flex items-center gap-2">
                  <CheckCircle size={16} /> {passwordStatus.success}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Current Password</label>
                <input type="password" name="currentPassword" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">New Password</label>
                <input type="password" name="newPassword" required minLength={6} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Confirm New Password</label>
                <input type="password" name="confirmPassword" required minLength={6} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={passwordStatus.loading} className="flex-1 py-2.5 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 flex justify-center items-center gap-2 disabled:opacity-70">
                  {passwordStatus.loading ? <Loader2 size={18} className="animate-spin"/> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}