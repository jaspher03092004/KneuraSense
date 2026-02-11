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
        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
      >
        <Edit3 size={14} />
        <span className="hidden sm:inline">Edit Profile</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Edit Profile</h3>
                <p className="text-xs text-slate-500">Update your personal and medical details</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all"
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
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[#2D5F8B] uppercase tracking-wide border-b border-slate-100 pb-2">
                    <User size={16} /> Personal Details
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Full Name</label>
                    <input 
                      name="fullName"
                      defaultValue={patient.fullName}
                      required
                      className="w-full p-2.5 border text-black border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2D5F8B] outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Age</label>
                      <input 
                        name="age"
                        type="number"
                        defaultValue={patient.age}
                        className="w-full p-2.5 border text-black border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2D5F8B] outline-none"
                      />
                    </div>
                    
                    {/* CHANGED: Occupation is now a Dropdown */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Occupation</label>
                      <select 
                        name="occupation"
                        defaultValue={patient.occupation || 'Sedentary'}
                        className="w-full p-2.5 border text-black border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2D5F8B] outline-none bg-white"
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
                    <label className="text-xs font-semibold text-slate-600">Phone Number</label>
                    <input 
                      name="phoneNumber"
                      defaultValue={patient.phoneNumber}
                      className="w-full p-2.5 border text-black border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2D5F8B] outline-none"
                    />
                  </div>
                </div>

                {/* --- Section 2: Medical Profile --- */}
                <div className="space-y-4 pt-2">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[#3A9D8C] uppercase tracking-wide border-b border-slate-100 pb-2">
                    <Activity size={16} /> Medical Context
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Affected Knee</label>
                      <select 
                        name="affectedKnee" 
                        defaultValue={patient.affectedKnee}
                        className="w-full p-2.5 border text-black border-slate-200 rounded-lg focus:ring-2 focus:ring-[#3A9D8C] outline-none bg-white"
                      >
                        <option value="Left">Left</option>
                        <option value="Right">Right</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>

                    {/* CHANGED: Updated Activity Level Options */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Activity Level</label>
                      <select 
                        name="activityLevel" 
                        defaultValue={patient.activityLevel}
                        className="w-full p-2.5 border text-black border-slate-200 rounded-lg focus:ring-2 focus:ring-[#3A9D8C] outline-none bg-white"
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
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex gap-3">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-white hover:shadow-sm transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="edit-profile-form"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-[#2D5F8B] text-white rounded-lg font-medium hover:bg-[#234b6e] transition flex justify-center items-center shadow-md shadow-blue-900/10"
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