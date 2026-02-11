'use client';

import { useState } from 'react';
import Link from 'next/link';
import { changePassword } from '@/actions/changePassword';
import { updateDeviceSettings } from '@/actions/updateDeviceSettings';
import { 
  Bell, Lock, ChevronRight, Smartphone, RotateCcw, Save, X, 
  Loader2, CheckCircle, AlertCircle 
} from 'lucide-react';

export default function SettingsForm({ patient }) {
  // --- STATE: Device Settings (Initialize with DB values or defaults) ---
  const [vibrationEnabled, setVibrationEnabled] = useState(patient.vibrationEnabled ?? true);
  const [intensity, setIntensity] = useState(patient.vibrationIntensity ?? 2);
  const [ledEnabled, setLedEnabled] = useState(patient.ledEnabled ?? true);
  
  // State for Saving Device Settings
  const [saveStatus, setSaveStatus] = useState({ loading: false, success: false, error: null });

  // --- STATE: Password Modal ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: null, success: null });

  // --- HELPER: Intensity Label ---
  const getIntensityLabel = (val) => {
    if (val === 1) return 'Low';
    if (val === 2) return 'Medium';
    if (val === 3) return 'High';
    return 'Medium';
  };

  // --- HELPER: Format Relative Time ---
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

  // --- HANDLER: Reset to Defaults ---
  const handleResetDefaults = () => {
    setVibrationEnabled(true);
    setIntensity(2); // Medium
    setLedEnabled(true);
    setSaveStatus({ loading: false, success: false, error: null });
  };

  // --- HANDLER: Save Device Settings ---
  const handleSaveSettings = async () => {
    setSaveStatus({ loading: true, success: false, error: null });
    
    const settings = {
      vibrationEnabled,
      vibrationIntensity: intensity,
      ledEnabled
    };

    const result = await updateDeviceSettings(patient.id, settings);

    if (result.success) {
      setSaveStatus({ loading: false, success: true, error: null });
      // Hide success message after 3 seconds
      setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
    } else {
      setSaveStatus({ loading: false, success: false, error: result.error });
    }
  };

  // --- HANDLER: Change Password ---
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

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account preferences and device configuration</p>
      </div>

      {/* 1. Account Security Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Lock size={16} className="text-[#3A9D8C]" /> Account Security
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          <Link href={`/patient/${patient.id}/myProfile`} className="flex items-center justify-between p-5 hover:bg-slate-50 transition cursor-pointer group">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center text-[#2D5F8B] font-bold border border-blue-100">
                  {patient.fullName?.[0]}
               </div>
               <div>
                 <p className="font-semibold text-slate-900 group-hover:text-[#2D5F8B] transition">Personal Information</p>
                 <p className="text-sm text-slate-500">Update profile details</p>
               </div>
             </div>
             <ChevronRight size={18} className="text-slate-400 group-hover:text-[#2D5F8B]" />
          </Link>
          
          <div className="flex items-center justify-between p-5 hover:bg-slate-50 transition cursor-pointer">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                  <Lock size={18} />
               </div>
               <div>
                 <p className="font-semibold text-slate-900">Change Password</p>
                 <p className="text-sm text-slate-500">Last changed {getTimeAgo(patient.updatedAt)}</p>
               </div>
             </div>
             <button 
               onClick={() => setIsPasswordModalOpen(true)}
               className="text-sm font-bold text-[#2D5F8B] hover:underline"
             >
               Update
             </button>
          </div>
        </div>
      </section>

      {/* 2. Notification Preferences */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Bell size={16} className="text-[#3A9D8C]" /> Notification Preferences
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Bell size={20} />
               </div>
               <div>
                 <p className="font-semibold text-slate-900">High Stress Alerts</p>
                 <p className="text-sm text-slate-500">Get notified when knee stress exceeds safe limits</p>
               </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A9D8C]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* 3. Device Alert Preferences (FUNCTIONAL) */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Smartphone size={16} className="text-[#3A9D8C]" /> Device Alert Preferences
          </h3>
        </div>
        
        <div className="p-6 space-y-8">
          
          {/* Vibration Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">Vibration Alerts</h4>
              <p className="text-sm text-slate-500">Receive haptic feedback when risk thresholds are exceeded</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A9D8C]"></div>
            </label>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Intensity Slider */}
          <div className="flex items-center justify-between gap-8">
             <div className="space-y-1 max-w-[50%]">
               <h4 className="font-bold text-slate-900">Vibration Intensity</h4>
               <p className="text-sm text-slate-500">Adjust the strength of vibration alerts</p>
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
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${vibrationEnabled ? 'bg-slate-200 accent-[#3A9D8C]' : 'bg-slate-100 accent-slate-300'}`} 
                />
                <span className={`text-sm font-bold min-w-[60px] text-right ${vibrationEnabled ? 'text-[#2D5F8B]' : 'text-slate-300'}`}>
                  {getIntensityLabel(intensity)}
                </span>
             </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* LED Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">LED Visual Alerts</h4>
              <p className="text-sm text-slate-500">Show color-coded status indicators on the device</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={ledEnabled}
                onChange={(e) => setLedEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A9D8C]"></div>
            </label>
          </div>

          {/* Action Buttons & Status */}
          <div className="pt-4 flex flex-col gap-4">
             {/* Success/Error Message */}
             {saveStatus.success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle size={16}/> Settings saved successfully.
                </div>
             )}
             {saveStatus.error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16}/> {saveStatus.error}
                </div>
             )}

             <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleResetDefaults}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-[#2D5F8B] text-[#2D5F8B] font-bold hover:bg-blue-50 transition"
                >
                    <RotateCcw size={18} /> Reset to Defaults
                </button>
                <button 
                  onClick={handleSaveSettings}
                  disabled={saveStatus.loading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#3A9D8C] text-white font-bold hover:bg-[#2c8a7b] shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saveStatus.loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                    {saveStatus.loading ? 'Saving...' : 'Save Alert Settings'}
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* --- CHANGE PASSWORD MODAL --- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Change Password</h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              {passwordStatus.error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {passwordStatus.error}
                </div>
              )}
              {passwordStatus.success && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm flex items-center gap-2">
                  <CheckCircle size={16} /> {passwordStatus.success}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  required
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5F8B] focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">New Password</label>
                <input 
                  type="password" 
                  name="newPassword"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5F8B] focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5F8B] focus:border-transparent"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={passwordStatus.loading}
                  className="flex-1 py-2.5 bg-[#2D5F8B] text-white rounded-lg font-semibold hover:bg-[#244a6d] transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {passwordStatus.loading ? <><Loader2 size={18} className="animate-spin"/> Updating...</> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}