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
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Please select a gender'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  specialization: z.string().optional(),
  
  // Clinical Knee Data
  oaDiagnosis: z.enum(['Yes', 'No']).optional(),
  affectedKnee: z.string().optional(),
  occupation: z.string().optional(),
  activityLevel: z.string().optional(),
  
  // Biomechanical & Emergency Data
  heightCm: z.coerce.number().min(50).max(300).optional().or(z.literal('')),
  weightKg: z.coerce.number().min(20).max(400).optional().or(z.literal('')),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
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
      occupation: 'Retired',
      activityLevel: 'Moderate',
      specialization: '',
    },
    mode: 'onTouched'
  });

  const role = watch('role');
  const gender = watch('gender');
  const oaDiagnosis = watch('oaDiagnosis');

  const handleNextStep = async () => {
    // Validating dateOfBirth instead of age
    const fieldsToValidate = ['role', 'fullName', 'dateOfBirth', 'gender', 'phoneNumber', 'email', 'password', 'confirmPassword'];
    if (role === 'Clinician') fieldsToValidate.push('specialization');

    const isStep1Valid = await trigger(fieldsToValidate);
    if (isStep1Valid) {
      if (role === 'Clinician') {
        handleSubmit(onSubmit)();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentStep(2);
      }
    }
  };

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);

    try {
      const formDataObj = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) formDataObj.append(key, data[key]);
      });

      const result = await initiateRegistration(formDataObj);

      if (result?.success) {
        setRegisteredEmail(result.email);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentStep(3);
      } else {
        setServerError(result?.error || 'Failed to initiate registration.');
      }
    } catch (error) {
      setServerError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setServerError('');
    setLoading(true);

    try {
      const allData = getValues(); 
      const formDataObj = new FormData();
      Object.keys(allData).forEach((key) => {
        if (allData[key] !== undefined && allData[key] !== null) formDataObj.append(key, allData[key]);
      });

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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans flex justify-center items-center selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        {/* Left Side Panel (Desktop Only) */}
        <div className="hidden lg:flex lg:w-5/12 relative p-12 flex-col justify-between overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transition-transform duration-1000 hover:scale-105"
            style={{ backgroundImage: "url('/images/auth-bg.svg')" }} 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-slate-800/90 z-0"></div>

          <div className="relative z-10">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-3">
                <Image 
                  src="/images/Logo.svg" 
                  alt="KneuraSense Logo" 
                  width={44} 
                  height={44} 
                  className="group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 drop-shadow-lg"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">KneuraSense</h1>
                  <p className="text-blue-300 text-xs font-medium tracking-wide uppercase">Knee Health Monitoring</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="relative z-10 my-16">
            <h2 className="text-3xl font-extrabold text-white mb-6 leading-[1.2] tracking-tight">
              Join the future of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Knee Health Management.</span>
            </h2>
            <div className="w-12 h-1 bg-blue-500 rounded-full mb-8 shadow-lg shadow-blue-500/50"></div>
            
            <ul className="space-y-6 text-slate-300 font-medium">
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 group-hover:border-blue-400/30 transition-all shadow-lg">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="group-hover:text-white transition-colors">Personalized Monitoring</span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 group-hover:border-teal-400/30 transition-all shadow-lg">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <span className="group-hover:text-white transition-colors">Real-time Risk Alerts</span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 group-hover:border-indigo-400/30 transition-all shadow-lg">
                  <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <span className="group-hover:text-white transition-colors">Comprehensive Analytics</span>
              </li>
            </ul>
          </div>
          <div className="relative z-10 text-xs text-slate-400/80 font-medium tracking-wide">© 2026 KneuraSense. All rights reserved.</div>
        </div>

        {/* Right Side Form */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 lg:p-12 relative">
          
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none z-0"></div>

          <div className="relative z-10">
            {/* Header & Back Link */}
            {currentStep !== 3 && (
              <div className="flex items-center justify-between mb-6 lg:mb-8">
                <Link href="/login" className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 group transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-slate-200 transition-colors">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </div>
                  Back to login
                </Link>
                <div className="text-xs font-bold tracking-widest uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                  Step {currentStep} of {role === 'Clinician' ? '1' : '2'}
                </div>
              </div>
            )}

            {currentStep !== 3 && (
              <div className="mb-8">
                {/* Mobile-only (App-like) */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
                <p className="text-slate-500 mt-2 text-sm font-medium">Fill in the information below to get started.</p>
              </div>
            )}

            {serverError && (
               <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start animate-fade-in">
                 <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                 <p className="text-red-700 text-sm font-medium leading-relaxed">{serverError}</p>
               </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              
              {/* --- STEP 1: PERSONAL INFO --- */}
              <div className={currentStep === 1 ? 'block animate-fade-in' : 'hidden'}>
                
                {/* Modern Segmented Control for Role */}
                <div className="p-1.5 bg-slate-100/80 border border-slate-200/60 rounded-xl flex mb-8 relative">
                  <button
                    type="button"
                    onClick={() => setValue('role', 'Patient', { shouldValidate: true })}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all z-10 ${role === 'Patient' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('role', 'Clinician', { shouldValidate: true })}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all z-10 ${role === 'Clinician' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Clinician
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <input type="text" {...register('fullName')} placeholder="e.g. Juan Dela Cruz" 
                            className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-base sm:text-sm ${errors.fullName ? 'border-red-400' : 'border-slate-200'}`} />
                    </div>
                    {errors.fullName && <p className="text-red-600 text-xs font-medium mt-1.5 pl-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Date of Birth</label>
                    <input type="date" {...register('dateOfBirth')}
                           className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-slate-700 text-base sm:text-sm ${errors.dateOfBirth ? 'border-red-400' : 'border-slate-200'}`} />
                    {errors.dateOfBirth && <p className="text-red-600 text-xs font-medium mt-1.5 pl-1">{errors.dateOfBirth.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Gender</label>
                    <div className="flex gap-3">
                      {['Male', 'Female'].map(g => (
                        <button key={g} type="button" onClick={() => setValue('gender', g, { shouldValidate: true })}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${gender === g ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <input type="tel" {...register('phoneNumber')} placeholder="e.g. 0917-XXX-XXXX"
                             className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-base sm:text-sm ${errors.phoneNumber ? 'border-red-400' : 'border-slate-200'}`} />
                    </div>
                    {errors.phoneNumber && <p className="text-red-600 text-xs font-medium mt-1.5 pl-1">{errors.phoneNumber.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                         <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                      </div>
                      <input type="email" {...register('email')} placeholder="name@example.com"
                             className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-base sm:text-sm ${errors.email ? 'border-red-400' : 'border-slate-200'}`} />
                    </div>
                    {errors.email && <p className="text-red-600 text-xs font-medium mt-1.5 pl-1">{errors.email.message}</p>}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <input type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="Create a password"
                             className={`w-full pl-11 pr-11 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-base sm:text-sm ${errors.password ? 'border-red-400' : 'border-slate-200'}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1.5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                         {showPassword ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-600 text-xs font-medium mt-1.5 pl-1">{errors.password.message}</p>}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <input type={showConfirmPassword ? 'text' : 'password'} {...register('confirmPassword')} placeholder="Repeat password"
                             className={`w-full pl-11 pr-11 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-base sm:text-sm ${errors.confirmPassword ? 'border-red-400' : 'border-slate-200'}`} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1.5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                         {showConfirmPassword ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-600 text-xs font-medium mt-1.5 pl-1">{errors.confirmPassword.message}</p>}
                  </div>

                  {role === 'Clinician' && (
                    <div className="md:col-span-2 animate-fade-in">
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Specialization</label>
                      <input type="text" {...register('specialization')} placeholder="e.g. Orthopedics, Physical Therapy"
                             className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-base sm:text-sm ${errors.specialization ? 'border-red-400' : 'border-slate-200'}`} />
                      {errors.specialization && <p className="text-red-600 text-xs font-medium mt-1.5 pl-1">{errors.specialization.message}</p>}
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  {role === 'Clinician' ? (
                    <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center active:scale-[0.98] shadow-md hover:shadow-slate-900/20">
                      {loading ? 'Sending Code...' : 'Create Clinician Account'}
                    </button>
                  ) : (
                    <button type="button" onClick={handleNextStep} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98] shadow-md hover:shadow-slate-900/20">
                      Continue to Medical History
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* --- STEP 2: KNEE HISTORY (Patient Only) --- */}
              <div className={currentStep === 2 ? 'block animate-fade-in' : 'hidden'}>
                <div className="space-y-6 mb-8">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">KOA Diagnosis</label>
                      <div className="flex gap-3">
                        {['Yes', 'No'].map(o => (
                          <button key={o} type="button" onClick={() => setValue('oaDiagnosis', o)}
                                  className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${oaDiagnosis === o ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Affected Knee</label>
                      <select {...register('affectedKnee')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-slate-700 cursor-pointer text-base sm:text-sm transition-all">
                        <option value="Left">Left Knee</option>
                        <option value="Right">Right Knee</option>
                        <option value="Both">Both Knees</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Occupation</label>
                      <select {...register('occupation')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-slate-700 text-base sm:text-sm transition-all cursor-pointer">
                        <option value="Retired">Retired</option>
                        <option value="Sedentary">Sedentary (Desk Job)</option>
                        <option value="Light Duty">Light Duty</option>
                        <option value="Heavy Duty">Heavy Duty (Physical)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Activity Level</label>
                      <select {...register('activityLevel')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-slate-700 text-base sm:text-sm transition-all cursor-pointer">
                        <option value="Sedentary">Sedentary</option>
                        <option value="Light">Light Exercise</option>
                        <option value="Moderate">Moderate Exercise</option>
                        <option value="Active">Highly Active</option>
                      </select>
                    </div>
                  </div>

                  {/* Biometrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Height (cm)</label>
                      <input type="number" {...register('heightCm')} placeholder="e.g. 170"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-slate-700 text-base sm:text-sm transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Weight (kg)</label>
                      <input type="number" step="0.1" {...register('weightKg')} placeholder="e.g. 75.5"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-slate-700 text-base sm:text-sm transition-all" />
                    </div>
                  </div>

                  {/* Emergency Contact Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Emergency Contact Name</label>
                      <input type="text" {...register('emergencyContactName')} placeholder="Full Name"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-slate-700 text-base sm:text-sm transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Emergency Phone</label>
                      <input type="tel" {...register('emergencyContactPhone')} placeholder="Phone Number"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-slate-700 text-base sm:text-sm transition-all" />
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3.5 p-4 bg-slate-50/50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors mb-8 group">
                  <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 bg-white rounded mt-0.5 group-hover:border-blue-500 transition-colors shrink-0">
                    <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="peer sr-only" />
                    <svg className="w-3.5 h-3.5 text-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-slate-800 block mb-1">I agree to the Terms &amp; Medical Data Processing</span>
                    <span className="text-slate-500 font-medium leading-relaxed">I consent to KneuraSense collecting and analyzing my movement data for predictive monitoring. I understand this is not a substitute for professional medical diagnosis.</span>
                  </div>
                </label>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setCurrentStep(1)} className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]">
                    Back
                  </button>
                  <button type="submit" disabled={loading || !agreeToTerms} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-slate-900/20 active:scale-[0.98]">
                    {loading ? 'Sending...' : 'Create Account'}
                    {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                </div>
              </div>

              {/* --- STEP 3: OTP VERIFICATION --- */}
              <div className={currentStep === 3 ? 'block animate-fade-in' : 'hidden'}>
                {/* Mobile OTP branding */}
                <div className="lg:hidden flex flex-col items-center justify-center mb-10">
                   <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20 mb-3">
                     <Image src="/images/Logo.svg" alt="KneuraSense Logo" width={36} height={36} className="drop-shadow-md" />
                   </div>
                   <span className="text-xl font-extrabold text-slate-900 tracking-tight">KneuraSense</span>
                </div>

                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-blue-50 border-4 border-white shadow-lg rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Check your email</h3>
                  <p className="text-slate-500 font-medium">We sent a 6-digit code to <br/> <span className="font-bold text-slate-900 break-all">{registeredEmail}</span></p>
                </div>

                <div className="mb-10 max-w-xs mx-auto">
                  <label className="block text-sm font-bold text-slate-700 mb-3 text-center">Verification Code</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center text-3xl tracking-[0.3em] px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-extrabold text-slate-900 transition-all text-base sm:text-sm placeholder-slate-300"
                  />
                </div>

                <button 
                  type="button" 
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6} 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] shadow-md hover:shadow-slate-900/20"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>

            </form>

            {currentStep !== 3 && (
              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-all">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}