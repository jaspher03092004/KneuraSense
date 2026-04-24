import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import EditProfileModal from '@/components/EditProfileModal';
import { 
  User, Mail, Phone, Calendar, Activity, Briefcase, 
  AlertCircle, MapPin, CheckCircle2, 
  Target, ShieldAlert, HeartPulse, PhoneCall
} from 'lucide-react';

export default async function PatientProfile({ params }) {
  const { id } = await params;

  let patient = null;
  let error = null;

  try {
    patient = await prisma.patient.findUnique({
      where: { id },
      include: { clinician: true } 
    });
    if (!patient) error = 'Patient not found';
  } catch (err) {
    console.error('Error fetching patient data:', err);
    error = 'Failed to fetch patient data';
  }

  if (error || !patient) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-transparent transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 p-8 max-w-md w-full text-center">
          <AlertCircle className="text-red-500 dark:text-red-400 mx-auto mb-4" size={32} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Profile Unavailable</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button onClick={() => redirect('/login')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  // Dynamically calculate age from DOB
  let calculatedAge = 'N/A';
  if (patient.dateOfBirth) {
    const dob = new Date(patient.dateOfBirth);
    const today = new Date();
    calculatedAge = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }
  }

  return (
    <div className="max-w-[1300px] mx-auto space-y-6 bg-transparent transition-colors duration-300">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your personal information and health settings</p>
        </div>
        <div className="hidden sm:block">
            <EditProfileModal patient={patient} />
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        
        {/* Banner*/}
        <div className="h-48 relative w-full bg-slate-200 dark:bg-slate-800">
           <Image 
             src="/banner.svg" 
             alt="Medical Center Banner"
             fill
             className="object-cover opacity-90 dark:opacity-60"
             priority
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/40 dark:from-black/80 to-transparent"></div>
        </div>
        
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-6 relative">
            
            {/* Avatar*/}
            <div className="-mt-16 flex-shrink-0">
              <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-lg">
                <div className="w-full h-full bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-4xl font-bold text-[#2D5F8B] dark:text-blue-400 border border-slate-100 dark:border-slate-700">
                  {getInitials(patient.fullName)}
                </div>
              </div>
            </div>

            {/* Name & Basic Badge*/}
            <div className="pt-4 md:pt-0 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{patient.fullName}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                   <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium text-xs border border-blue-100 dark:border-blue-500/20">
                     <User size={12} /> Patient
                   </span>
                   <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700">
                     MRN: {patient.mrn || 'Pending'}
                   </span>
                </div>
              </div>
              <div className="sm:hidden w-full mt-4">
                <EditProfileModal patient={patient} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 my-8"></div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              
              <section>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <User size={16} className="text-[#3A9D8C]" /> Personal Information
                </h3>
                
                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                   <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Email Address</span>
                      <div className="mt-1 flex items-center gap-3 font-medium text-slate-900 dark:text-slate-200">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                           <Mail size={14} />
                        </div>
                        <span className="break-all">{patient.email}</span>
                      </div>
                   </div>

                   <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Phone Number</span>
                      <div className="mt-1 flex items-center gap-3 font-medium text-slate-900 dark:text-slate-200">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                           <Phone size={14} />
                        </div>
                        <span>{patient.phoneNumber || 'Not provided'}</span>
                      </div>
                   </div>

                   <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Occupation</span>
                      <div className="mt-1 flex items-center gap-3 font-medium text-slate-900 dark:text-slate-200">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                           <Briefcase size={14} />
                        </div>
                        <span>{patient.occupation || 'Not specified'}</span>
                      </div>
                   </div>

                   <div className="flex items-center gap-8">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Age</span>
                        <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">{calculatedAge} <span className="text-slate-400 dark:text-slate-500 text-sm font-normal">yrs</span></p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Gender</span>
                        <p className="mt-1 font-medium text-slate-900 dark:text-slate-200 capitalize">{patient.gender || 'N/A'}</p>
                      </div>
                   </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Biometrics */}
                <section>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                    <HeartPulse size={16} className="text-rose-500" /> Biometrics
                  </h3>
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex gap-8">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Height</span>
                      <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">{patient.heightCm ? `${patient.heightCm} cm` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Weight</span>
                      <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">{patient.weightKg ? `${patient.weightKg} kg` : 'N/A'}</p>
                    </div>
                  </div>
                </section>

                {/* Emergency Contact */}
                <section>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                    <PhoneCall size={16} className="text-amber-500" /> Emergency Contact
                  </h3>
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <p className="font-semibold text-slate-900 dark:text-white">{patient.emergencyContactName || 'None listed'}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{patient.emergencyContactPhone || 'N/A'}</p>
                  </div>
                </section>
              </div>

            </div>

            {/* Right Column: Medical Context & New Widgets */}
            <div className="space-y-8">
              
              {/* Simplified Medical Profile */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-[#3A9D8C]" /> Medical Context
                </h3>
                
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Monitoring</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20">
                      Telemetry Online
                    </span>
                  </div>

                  <div className="p-5 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Affected Knee</p>
                          <p className="font-semibold text-slate-900 dark:text-slate-200">{patient.affectedKnee || 'N/A'}</p>
                       </div>
                       <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">OA Diagnosis</p>
                          <p className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1">
                             {patient.oaDiagnosis ? (
                               <><AlertCircle size={14} className="text-amber-500"/> Yes</>
                             ) : (
                               <><CheckCircle2 size={14} className="text-green-500 dark:text-emerald-400"/> No</>
                             )}
                          </p>
                       </div>
                    </div>

                    <div>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Assigned Activity Level</p>
                       <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E8F4F8] dark:bg-blue-500/10 text-[#2D5F8B] dark:text-blue-400 rounded-lg text-sm font-medium">
                          <Activity size={14} />
                          {patient.activityLevel || 'Not specified'}
                       </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Prescribed Baseline Widget */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Target size={16} className="text-indigo-500 dark:text-indigo-400" /> Prescribed Baseline
                </h3>
                
                <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/30 p-5 shadow-sm relative overflow-hidden">
                  <Target className="absolute -right-4 -bottom-4 text-indigo-100 dark:text-indigo-900/20 w-24 h-24 transform -rotate-12" strokeWidth={1} />
                  
                  <div className="relative z-10">
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter leading-none">
                        {patient.riskThreshold ?? 75}
                      </span>
                      <span className="text-xs font-bold text-indigo-400 dark:text-indigo-500 mb-1.5 uppercase tracking-widest">Target</span>
                    </div>
                    
                    <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-3 font-medium leading-relaxed">
                      Your clinician has set this as your maximum safe load limit.
                    </p>
                  </div>
                </div>
              </section>

              {/* Managing Clinician Card */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-slate-400" /> Managing Clinician
                </h3>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                  {patient.clinician ? (
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Dr. {patient.clinician.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{patient.clinician.specialization || 'Orthopedics'}</p>
                      <a 
                        href={`mailto:${patient.clinician.email}`} 
                        className="mt-4 inline-flex items-center justify-center w-full py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        Contact Clinician
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No clinician currently assigned.</p>
                  )}
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}