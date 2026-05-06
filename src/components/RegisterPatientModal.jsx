'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientRegistrationSchema } from '@/lib/validations'; 
import { clinicianRegisterPatient } from '@/actions/clinicianRegisterPatient';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function RegisterPatientModal({ isOpen, onClose, clinicianId, onSuccess }) {
  const [registrationMessage, setRegistrationMessage] = useState({ type: '', text: '' });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: { 
      oaDiagnosis: 'No', gender: '', affectedKnee: 'Both', activityLevel: '', deviceMac: '', dateOfBirth: '', occupation: 'Retired'
    }
  });

  const onRegisterSubmit = async (data) => {
    setRegistrationMessage({ type: '', text: '' });
    try {
      const formDataObj = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) formDataObj.append(key, data[key]);
      });

      formDataObj.append('registeredByClinicianId', clinicianId);
      const result = await clinicianRegisterPatient(formDataObj);

      if (result.success) {
        setRegistrationMessage({ type: 'success', text: 'Patient registered successfully!' });
        setTimeout(() => {
          onClose();
          reset();
          setRegistrationMessage({ type: '', text: '' });
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setRegistrationMessage({ type: 'error', text: `Error: ${result.error || 'Registration failed'}` });
      }
    } catch (error) {
      setRegistrationMessage({ type: 'error', text: 'An error occurred during registration.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => { onClose(); reset(); }}></div>
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-5 md:p-6 max-w-2xl w-full max-h-[90dvh] overflow-y-auto relative border border-slate-100 dark:border-slate-800 no-scrollbar animate-in fade-in zoom-in-95 duration-200">
         <div className="flex justify-between items-start mb-4">
           <div className="min-w-0 text-left">
              <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Register New Patient</h2>
              <p className="text-[11px] md:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Create a secure profile. An activation link will be emailed.</p>
           </div>
           <button onClick={() => { onClose(); reset(); }} className="p-2 -mr-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 shrink-0">
             <X size={18} />
           </button>
         </div>
         
         {registrationMessage.text && (
          <div className={`mb-4 p-3 rounded-md text-[11px] md:text-xs font-bold flex items-center gap-2 ${registrationMessage.type === 'error' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/30' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/30'}`}>
            {registrationMessage.type === 'error' ? <AlertTriangle size={14} className="shrink-0"/> : <CheckCircle size={14} className="shrink-0"/>}
            {registrationMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-3 text-left">
          {/* Row 1: Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Full Name <span className="text-rose-500 dark:text-rose-400">*</span></label>
              <input type="text" {...register("fullName")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#2D5F8B] transition-all text-xs" placeholder="Juan Dela Cruz" />
              {errors.fullName && <p className="text-[9px] text-rose-500 dark:text-rose-400 mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Email Address <span className="text-rose-500 dark:text-rose-400">*</span></label>
              <input type="email" {...register("email")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] dark:focus:border-blue-500 focus:ring-1 transition-all text-xs" placeholder="email@example.com" />
              {errors.email && <p className="text-[9px] text-rose-500 dark:text-rose-400 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {/* Row 2: Phone, DOB, Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Phone <span className="text-rose-500 dark:text-rose-400">*</span></label>
              <input type="tel" {...register("phoneNumber")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs" placeholder="+63 9XXXXXXXXX" />
              {errors.phoneNumber && <p className="text-[9px] text-rose-500 mt-1">{errors.phoneNumber.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Date of Birth <span className="text-rose-500">*</span></label>
                <input type="date" {...register("dateOfBirth")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs" />
                {errors.dateOfBirth && <p className="text-[9px] text-rose-500 mt-1">{errors.dateOfBirth.message}</p>}
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Gender <span className="text-rose-500">*</span></label>
                <select {...register("gender")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Biometrics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Height (cm)</label>
              <input type="number" {...register("heightCm")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs" placeholder="e.g. 170" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Weight (kg)</label>
              <input type="number" step="0.1" {...register("weightKg")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs" placeholder="e.g. 70.5" />
            </div>
          </div>

          {/* Row 4: Emergency Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Emergency Name</label>
              <input type="text" {...register("emergencyContactName")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs" placeholder="Full Name" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Emergency Phone</label>
              <input type="tel" {...register("emergencyContactPhone")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs" placeholder="Phone Number" />
            </div>
          </div>

          {/* Row 5: OA Diagnosis & Activity Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">OA Diagnosis</label>
              <select {...register("oaDiagnosis")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Affected Knee</label>
              <select {...register("affectedKnee")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs">
                <option value="Left">Left Knee</option>
                <option value="Right">Right Knee</option>
                <option value="Both">Both Knees</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Occupation</label>
              <select {...register("occupation")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs">
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
            <div>
              <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Activity Level <span className="text-rose-500">*</span></label>
              <select {...register("activityLevel")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#2D5F8B] transition-all text-xs">
                <option value="">Select</option>
                <option value="Sedentary">Sedentary</option>
                <option value="Light">Light</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Row 6: MAC Address */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[9px] font-black text-[#3A9D8C] dark:text-teal-500 uppercase tracking-widest mb-1">Assign Device ID (Optional)</label>
            <input type="text" {...register("deviceMac")} className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-[#3A9D8C] transition-all text-xs font-mono uppercase tracking-widest" placeholder="e.g. A1B2C3D4E5F6" maxLength={17} />
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col md:flex-row gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => { onClose(); reset(); }} className="w-full md:flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors order-2 md:order-1 text-xs">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="w-full md:flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2D5F8B] dark:bg-blue-600 text-white font-bold rounded-md hover:bg-[#22486b] dark:hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm order-1 md:order-2 text-xs">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm & Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}