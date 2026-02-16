'use client';

import { useState } from 'react';
import { Edit3, X, Loader2, User, Activity } from 'lucide-react';
import { updatePatientProfile } from '@/actions/updatePatient';

export default function EditProfileModal({ patient }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.target);
    const result = await updatePatientProfile(formData);

    setIsLoading(false);
    if (result.success) {
      setIsOpen(false);
    } else {
      alert(result.message);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
      >
        <Edit3 size={14} />
        <span className="hidden sm:inline">Edit Profile</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/80 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Edit Profile</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your personal and medical details</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Area */}
            <div className="overflow-y-auto p-6">
              <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="id" value={patient.id} />
                
                {/* --- Section 1: Personal Details --- */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[#2D5F8B] dark:text-blue-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2">
                    <User size={16} /> Personal Details
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
                    <input 
                      name="fullName"
                      defaultValue={patient.fullName}
                      required
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#2D5F8B] dark:focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Age</label>
                      <input 
                        name="age"
                        type="number"
                        defaultValue={patient.age}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#2D5F8B] dark:focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Occupation</label>
                      <select 
                        name="occupation"
                        defaultValue={patient.occupation || 'Sedentary'}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#2D5F8B] dark:focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value="Retired">Retired</option>
                        <option value="Sedentary">Sedentary</option>
                        <option value="Light Duty">Light Duty</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Heavy Duty">Heavy Duty</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Phone Number</label>
                    <input 
                      name="phoneNumber"
                      defaultValue={patient.phoneNumber}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#2D5F8B] dark:focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* --- Section 2: Medical Profile --- */}
                <div className="space-y-4 pt-2">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[#3A9D8C] dark:text-teal-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Activity size={16} /> Medical Context
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Affected Knee</label>
                      <select 
                        name="affectedKnee" 
                        defaultValue={patient.affectedKnee}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#3A9D8C] dark:focus:ring-teal-500 outline-none transition-all"
                      >
                        <option value="Left">Left</option>
                        <option value="Right">Right</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Activity Level</label>
                      <select 
                        name="activityLevel" 
                        defaultValue={patient.activityLevel}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#3A9D8C] dark:focus:ring-teal-500 outline-none transition-all"
                      >
                        <option value="Sedentary">Sedentary</option>
                        <option value="Light">Light</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Active">Active</option>
                        <option value="Very Active">Very Active</option>
                      </select>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl flex gap-3">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="edit-profile-form"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-[#2D5F8B] dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-[#234b6e] dark:hover:bg-blue-700 transition flex justify-center items-center shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}