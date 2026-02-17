'use client';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { initiateRegistration, finalizeRegistration } from '@/actions/register';

const registerFormSchema = z.object({
  role: z.enum(['Patient', 'Clinician']),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  age: z.coerce.number().min(1, 'Valid age is required (1-120)').max(120, 'Invalid age'),
  gender: z.string().min(1, 'Please select a gender'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  specialization: z.string().optional(),
  oaDiagnosis: z.enum(['Yes', 'No']).optional(),
  affectedKnee: z.string().optional(),
  painSeverity: z.coerce.number().optional(),
  occupation: z.string().optional(),
  activityLevel: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'Clinician' && (!data.specialization || data.specialization.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Specialization is required for clinicians",
  path: ["specialization"]
});

export default function RegisterPage() {
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP Verification States
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState('');

  const { register, handleSubmit, watch, setValue, trigger, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: 'Patient',
      gender: 'Male',
      oaDiagnosis: 'Yes',
      affectedKnee: 'Both',
      painSeverity: 5,
      occupation: 'Retired',
      activityLevel: 'Moderate',
      specialization: '',
    },
    mode: 'onTouched'
  });

  const role = watch('role');
  const gender = watch('gender');
  const oaDiagnosis = watch('oaDiagnosis');
  const painSeverity = watch('painSeverity');

  const handleNextStep = async () => {
    const fieldsToValidate = ['role', 'fullName', 'age', 'gender', 'phoneNumber', 'email', 'password', 'confirmPassword'];
    if (role === 'Clinician') fieldsToValidate.push('specialization');

    const isStep1Valid = await trigger(fieldsToValidate);
    if (isStep1Valid) {
      if (role === 'Clinician') {
        // Clinicians don't have Step 2, go straight to sending OTP
        handleSubmit(onSubmit)();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentStep(2);
      }
    }
  };

  // PHASE 1: Send OTP (Do not save to Database yet)
  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);

    try {
      const formDataObj = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) formDataObj.append(key, data[key]);
      });

      // Call initiateRegistration instead of registerUser
      const result = await initiateRegistration(formDataObj);

      if (result?.success) {
        setRegisteredEmail(result.email);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentStep(3); // Go to OTP verification step
      } else {
        setServerError(result?.error || 'Failed to initiate registration.');
      }
    } catch (error) {
      setServerError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // PHASE 2: Verify OTP and Finalize Database Save
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setServerError('');
    setLoading(true);

    try {
      // Get all the data the user typed in Step 1 & 2
      const allData = getValues(); 
      const formDataObj = new FormData();
      Object.keys(allData).forEach((key) => {
        if (allData[key] !== undefined && allData[key] !== null) formDataObj.append(key, allData[key]);
      });

      // Send the full form data AND the OTP to be finalized
      const result = await finalizeRegistration(formDataObj, otp);
      
      if (result.success) {
        router.push('/login?verified=true');
      } else {
        setServerError(result.error);
      }
    } catch (error) {
      setServerError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans flex justify-center items-center">
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-200">
        
        {/* Left Side Panel (Image Background) */}
        <div className="hidden lg:flex lg:w-5/12 relative p-12 flex-col justify-between overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{ backgroundImage: "url('/images/auth-bg.svg')" }} 
          />
          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-slate-900/85 z-0"></div>

          <div className="relative z-10">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-3">
                <Image 
                  src="/images/Logo.svg" 
                  alt="KneuraSense Logo" 
                  width={40} 
                  height={40} 
                  className="group-hover:scale-105 transition-transform drop-shadow-md"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">KneuraSense</h1>
                  {/* Only include this paragraph if you are on the Login page */}
                  <p className="text-blue-300 text-xs font-medium tracking-wide uppercase">Knee osteoarthritis Monitoring</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="relative z-10 my-16">
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Join the future of knee health management.</h2>
            <div className="w-12 h-1 bg-blue-500 rounded-full mb-6"></div>
            <ul className="space-y-5 text-slate-300">
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span>Personalized Monitoring</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <span>Real-time Risk Alerts</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <span>Comprehensive Analytics</span>
              </li>
            </ul>
          </div>
          <div className="relative z-10 text-xs text-slate-400">© 2025 KneuraSense IoT System.</div>
        </div>

        {/* Right Side Form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-12">
          
          {/* Header & Back Link */}
          {currentStep !== 3 && (
            <div className="flex items-center justify-between mb-8">
              <Link href="/login" className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 group transition-colors">
                <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to login
              </Link>
              <div className="text-sm font-semibold text-slate-400">
                Step {currentStep} of {role === 'Clinician' ? '1' : '2'}
              </div>
            </div>
          )}

          {currentStep !== 3 && (
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create your account</h2>
              <p className="text-slate-500 mt-2 mb-8 text-sm">Fill in the information below to get started.</p>
            </div>
          )}

          {serverError && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
               <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
               <p className="text-red-700 text-sm font-medium">{serverError}</p>
             </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* --- STEP 1: PERSONAL INFO --- */}
            <div className={currentStep === 1 ? 'block' : 'hidden'}>
              
              {/* Segmented Control for Role */}
              <div className="p-1 bg-slate-100 border border-slate-200 rounded-xl flex mb-8">
                <button
                  type="button"
                  onClick={() => setValue('role', 'Patient', { shouldValidate: true })}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${role === 'Patient' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'Clinician', { shouldValidate: true })}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${role === 'Clinician' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Clinician
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input type="text" {...register('fullName')} placeholder="e.g. Juan Dela Cruz" 
                         className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all ${errors.fullName ? 'border-red-400' : 'border-slate-200'}`} />
                  {errors.fullName && <p className="text-red-600 text-xs mt-1.5">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Age</label>
                  <input type="number" {...register('age')} placeholder="Years" min="1" max="120"
                         className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all ${errors.age ? 'border-red-400' : 'border-slate-200'}`} />
                  {errors.age && <p className="text-red-600 text-xs mt-1.5">{errors.age.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
                  <div className="flex gap-3">
                    {['Male', 'Female'].map(g => (
                      <button key={g} type="button" onClick={() => setValue('gender', g, { shouldValidate: true })}
                              className={`flex-1 py-3 text-sm font-medium rounded-xl border transition-all ${gender === g ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input type="tel" {...register('phoneNumber')} placeholder="e.g. 0917-XXX-XXXX"
                         className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all ${errors.phoneNumber ? 'border-red-400' : 'border-slate-200'}`} />
                  {errors.phoneNumber && <p className="text-red-600 text-xs mt-1.5">{errors.phoneNumber.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <input type="email" {...register('email')} placeholder="name@example.com"
                         className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all ${errors.email ? 'border-red-400' : 'border-slate-200'}`} />
                  {errors.email && <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <input type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="Create a password"
                         className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all pr-10 ${errors.password ? 'border-red-400' : 'border-slate-200'}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] p-1 text-slate-400 hover:text-slate-600 rounded-md">
                     {showPassword ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>}
                  </button>
                  {errors.password && <p className="text-red-600 text-xs mt-1.5">{errors.password.message}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                  <input type={showConfirmPassword ? 'text' : 'password'} {...register('confirmPassword')} placeholder="Repeat password"
                         className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all pr-10 ${errors.confirmPassword ? 'border-red-400' : 'border-slate-200'}`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-[34px] p-1 text-slate-400 hover:text-slate-600 rounded-md">
                     {showConfirmPassword ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>}
                  </button>
                  {errors.confirmPassword && <p className="text-red-600 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
                </div>

                {role === 'Clinician' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Specialization</label>
                    <input type="text" {...register('specialization')} placeholder="e.g. Orthopedics, Physical Therapy"
                           className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all ${errors.specialization ? 'border-red-400' : 'border-slate-200'}`} />
                    {errors.specialization && <p className="text-red-600 text-xs mt-1.5">{errors.specialization.message}</p>}
                  </div>
                )}
              </div>

              {/* Step 1 Submit / Next */}
              <div className="mt-8">
                {role === 'Clinician' ? (
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center">
                    {loading ? 'Sending Code...' : 'Create Clinician Account'}
                  </button>
                ) : (
                  <button type="button" onClick={handleNextStep} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group">
                    Continue to Medical History
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                )}
              </div>
            </div>

            {/* --- STEP 2: KNEE HISTORY (Patient Only) --- */}
            <div className={currentStep === 2 ? 'block' : 'hidden'}>
              <div className="space-y-6 mb-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">OA Diagnosis</label>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(o => (
                        <button key={o} type="button" onClick={() => setValue('oaDiagnosis', o)}
                                className={`flex-1 py-3 text-sm font-medium rounded-xl border transition-all ${oaDiagnosis === o ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Affected Knee</label>
                    <select {...register('affectedKnee')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-medium text-slate-700 cursor-pointer">
                      <option value="Left">Left Knee</option>
                      <option value="Right">Right Knee</option>
                      <option value="Both">Both Knees</option>
                    </select>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-semibold text-slate-700">Average Pain Severity</label>
                    <span className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-lg w-10 h-10 font-bold text-lg text-slate-900">{painSeverity}</span>
                  </div>
                  <input type="range" {...register('painSeverity', { valueAsNumber: true })} min="1" max="10" 
                         className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
                     <span>Mild (1)</span><span>Severe (10)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Occupation</label>
                    <select {...register('occupation')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-medium text-slate-700">
                      <option value="Retired">Retired</option>
                      <option value="Sedentary">Sedentary (Desk Job)</option>
                      <option value="Light Duty">Light Duty</option>
                      <option value="Heavy Duty">Heavy Duty (Physical)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Activity Level</label>
                    <select {...register('activityLevel')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-medium text-slate-700">
                      <option value="Sedentary">Sedentary</option>
                      <option value="Light">Light Exercise</option>
                      <option value="Moderate">Moderate Exercise</option>
                      <option value="Active">Highly Active</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors mb-8 group">
                <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 bg-white rounded mt-0.5 group-hover:border-blue-500 transition-colors">
                  <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="peer sr-only" />
                  <svg className="w-3 h-3 text-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-slate-800 block mb-0.5">I agree to the Terms &amp; Conditions</span>
                  <span className="text-slate-500 leading-relaxed">I understand KneuraSense is a predictive monitoring tool, not a substitute for professional medical diagnosis.</span>
                </div>
              </label>

              {/* Step 2 Buttons */}
              <div className="flex gap-4">
                <button type="button" onClick={() => setCurrentStep(1)} className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Back
                </button>
                <button type="submit" disabled={loading || !agreeToTerms} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? 'Sending Code...' : 'Create Account'}
                  {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                </button>
              </div>
            </div>

            {/* --- STEP 3: OTP VERIFICATION --- */}
            <div className={currentStep === 3 ? 'block animate-fade-in' : 'hidden'}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h3>
                <p className="text-slate-500">We sent a 6-digit code to <span className="font-semibold text-slate-900">{registeredEmail}</span></p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">Verification Code</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Ensure only numbers
                  placeholder="000000"
                  className="w-full text-center text-3xl tracking-[0.5em] px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-bold text-slate-900 transition-all"
                />
              </div>

              <button 
                type="button" 
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </div>

          </form>

          {/* Footer Link (Hidden on Step 3) */}
          {currentStep !== 3 && (
            <div className="mt-10 text-center">
              <p className="text-slate-500 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-all">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}