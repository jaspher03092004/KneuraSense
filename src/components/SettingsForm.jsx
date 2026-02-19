'use client';

import { useState } from 'react';
import Link from 'next/link';
import { changePassword } from '@/actions/changePassword';
import { updateDeviceSettings } from '@/actions/updateDeviceSettings';
import { deleteAccount } from '@/actions/deleteAccount';
import { 
  Bell, Lock, ChevronRight, Smartphone, RotateCcw, Save, X, 
  Loader2, CheckCircle, AlertCircle, Trash2, AlertTriangle, Shield 
} from 'lucide-react';

export default function SettingsForm({ patient }) {
  // --- STATE: Device Settings ---
  const [highStressAlerts, setHighStressAlerts] = useState(patient.highStressAlerts ?? true);
  const [vibrationEnabled, setVibrationEnabled] = useState(patient.vibrationEnabled ?? true);
  const [intensity, setIntensity] = useState(patient.vibrationIntensity ?? 2);
  const [ledEnabled, setLedEnabled] = useState(patient.ledEnabled ?? true);
  const [saveStatus, setSaveStatus] = useState({ loading: false, success: false, error: null });

  // --- STATE: Modals & Actions ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: null, success: null });
  
  // Account Deletion States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const getIntensityLabel = (val) => {
    if (val === 1) return 'Low';
    if (val === 2) return 'Medium';
    if (val === 3) return 'High';
    return 'Medium';
  };

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

  const handleResetDefaults = () => {
    setHighStressAlerts(true);
    setVibrationEnabled(true);
    setIntensity(2);
    setLedEnabled(true);
    setSaveStatus({ loading: false, success: false, error: null });
  };

  const handleSaveSettings = async () => {
    setSaveStatus({ loading: true, success: false, error: null });
    const result = await updateDeviceSettings(patient.id, {
      highStressAlerts,
      vibrationEnabled,
      vibrationIntensity: intensity,
      ledEnabled
    });
    if (result.success) {
      setSaveStatus({ loading: false, success: true, error: null });
      setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
    } else {
      setSaveStatus({ loading: false, success: false, error: result.error });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, error: null, success: null });
    const formData = new FormData(e.target);
    const result = await changePassword(patient.id, formData);
    if (result.error) {
      setPasswordStatus({ loading: false, error: result.error, success: null });
    } else {
      setPasswordStatus({ loading: false, error: null, success: result.success });
      e.target.reset();
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordStatus({ loading: false, error: null, success: null });
      }, 2000);
    }
  };

  // --- NEW: Handle Deletion with Password ---
  const handleConfirmDeletion = async (e) => {
    e.preventDefault();
    setDeleteError(null);
    setIsDeleting(true);

    const formData = new FormData(e.target);
    const password = formData.get('confirmPassword');

    const result = await deleteAccount(password);

    if (result?.error) {
      setDeleteError(result.error);
      setIsDeleting(false);
    }
    // If successful, the action redirects automatically
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 bg-transparent transition-colors duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 transition-colors duration-300">Manage your account preferences and device configuration</p>
      </div>

      {/* Account Security Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 transition-colors duration-300">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Shield size={16} className="text-[#3A9D8C] dark:text-teal-400" /> Account Security
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors duration-300">
          <Link href={`/patient/${patient.id}/myProfile`} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer group">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-[#E8F4F8] dark:bg-blue-900/20 flex items-center justify-center text-[#2D5F8B] dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800/30 transition-colors duration-300">
                  {patient.fullName?.[0]}
               </div>
               <div>
                 <p className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-[#2D5F8B] dark:group-hover:text-blue-400 transition-colors duration-300">Personal Information</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Update profile details</p>
               </div>
             </div>
             <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-[#2D5F8B] dark:group-hover:text-blue-400 transition-colors duration-300" />
          </Link>
          
          <div className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                  <Lock size={18} />
               </div>
               <div>
                 <p className="font-semibold text-slate-900 dark:text-slate-200 transition-colors duration-300">Change Password</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Last changed {getTimeAgo(patient.updatedAt)}</p>
               </div>
             </div>
             <button 
               onClick={() => setIsPasswordModalOpen(true)}
               className="text-sm font-bold text-[#2D5F8B] dark:text-blue-400 hover:underline transition-colors duration-300"
             >
               Update
             </button>
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 transition-colors duration-300">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Bell size={16} className="text-[#3A9D8C] dark:text-teal-400" /> Notification Preferences
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg transition-colors duration-300">
                  <Bell size={20} />
               </div>
               <div>
                 <p className="font-semibold text-slate-900 dark:text-slate-200 transition-colors duration-300">High Stress Alerts</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Get notified when knee stress exceeds safe limits</p>
               </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={highStressAlerts}
                onChange={(e) => setHighStressAlerts(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-200 after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A9D8C] dark:peer-checked:bg-teal-500 transition-colors duration-300"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Device Alert Preferences */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 transition-colors duration-300">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Smartphone size={16} className="text-[#3A9D8C] dark:text-teal-400" /> Device Alert Preferences
          </h3>
        </div>
        
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-200 transition-colors duration-300">Vibration Alerts</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Receive haptic feedback when risk thresholds are exceeded</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-200 after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A9D8C] dark:peer-checked:bg-teal-500 transition-colors duration-300"></div>
            </label>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 transition-colors duration-300"></div>

          <div className="flex items-center justify-between gap-8">
             <div className="space-y-1 max-w-[50%]">
               <h4 className="font-bold text-slate-900 dark:text-slate-200 transition-colors duration-300">Vibration Intensity</h4>
               <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Adjust the strength of vibration alerts</p>
             </div>
             <div className="flex items-center gap-4 flex-1 justify-end">
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="1"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  disabled={!vibrationEnabled} 
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-colors duration-300 ${vibrationEnabled ? 'bg-slate-200 dark:bg-slate-700 accent-[#3A9D8C] dark:accent-teal-500' : 'bg-slate-100 dark:bg-slate-800 accent-slate-300 dark:accent-slate-600'}`} 
                />
                <span className={`text-sm font-bold min-w-[60px] text-right transition-colors duration-300 ${vibrationEnabled ? 'text-[#2D5F8B] dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>
                  {getIntensityLabel(intensity)}
                </span>
             </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 transition-colors duration-300"></div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-200 transition-colors duration-300">LED Visual Alerts</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Show color-coded status indicators on the device</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={ledEnabled}
                onChange={(e) => setLedEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-200 after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A9D8C] dark:peer-checked:bg-teal-500 transition-colors duration-300"></div>
            </label>
          </div>

          <div className="pt-4 flex flex-col gap-4">
             {saveStatus.success && (
                <div className="p-3 bg-green-50 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400 border border-green-100 dark:border-emerald-500/20 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1 transition-colors duration-300">
                  <CheckCircle size={16}/> Settings saved successfully.
                </div>
             )}
             {saveStatus.error && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-lg text-sm flex items-center gap-2 transition-colors duration-300">
                  <AlertCircle size={16}/> {saveStatus.error}
                </div>
             )}

             <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleResetDefaults}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-[#2D5F8B] dark:border-blue-500 text-[#2D5F8B] dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-300"
                >
                    <RotateCcw size={18} /> Reset to Defaults
                </button>
                <button 
                  onClick={handleSaveSettings}
                  disabled={saveStatus.loading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#3A9D8C] dark:bg-teal-600 text-white font-bold hover:bg-[#2c8a7b] dark:hover:bg-teal-700 shadow-sm transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saveStatus.loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                    {saveStatus.loading ? 'Saving...' : 'Save Alert Settings'}
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Danger Zone Section */}
      <section className="bg-red-50 dark:bg-red-950/20 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/30 transition-colors duration-300">
          <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} /> Danger Zone
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-red-700/70 dark:text-red-400/70">
            Deleting your account will permanently remove all medical records, historical sensor data, and clinical interventions. You will lose access to the KneuraSense platform immediately.
          </p>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-red-600 px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 hover:text-white transition flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={18} />
            Delete Account Permanently
          </button>
        </div>
      </section>

      {/* --- CHANGE PASSWORD MODAL --- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 transition-colors duration-300">
              <h3 className="font-bold text-gray-900 dark:text-white">Change Password</h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors duration-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              {passwordStatus.error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 text-sm flex items-center gap-2 transition-colors duration-300">
                  <AlertCircle size={16} /> {passwordStatus.error}
                </div>
              )}
              {passwordStatus.success && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400 border border-green-100 dark:border-emerald-500/20 text-sm flex items-center gap-2 transition-colors duration-300">
                  <CheckCircle size={16} /> {passwordStatus.success}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 transition-colors duration-300">Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5F8B] dark:focus:ring-blue-500 focus:border-transparent transition-colors duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 transition-colors duration-300">New Password</label>
                <input 
                  type="password" 
                  name="newPassword"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5F8B] dark:focus:ring-blue-500 focus:border-transparent transition-colors duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 transition-colors duration-300">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5F8B] dark:focus:ring-blue-500 focus:border-transparent transition-colors duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-600 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={passwordStatus.loading}
                  className="flex-1 py-2.5 bg-[#2D5F8B] dark:bg-blue-600 text-white rounded-lg font-semibold hover:bg-[#244a6d] dark:hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {passwordStatus.loading ? <><Loader2 size={18} className="animate-spin"/> Updating...</> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE ACCOUNT MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/90 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/30">
            <div className="px-6 py-4 border-b border-red-50 dark:border-red-900/20 flex justify-between items-center bg-red-50/30 dark:bg-red-950/30">
              <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle size={18} /> Confirm Deletion
              </h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmDeletion} className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                To confirm, please enter your account password. This action is <strong>permanent</strong>.
              </p>

              {deleteError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {deleteError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Verify Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                  placeholder="Enter password to confirm"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />}
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}