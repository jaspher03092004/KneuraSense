import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import EditProfileModal from '@/components/EditProfileModal';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Activity, 
  Briefcase, 
  AlertCircle, 
  Edit3,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default async function PatientProfile({ params }) {
  const { id } = await params;

  let patient = null;
  let error = null;

  try {
    patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) error = 'Patient not found';
  } catch (err) {
    console.error('Error fetching patient data:', err);
    error = 'Failed to fetch patient data';
  }

  // --- Error State ---
  if (error || !patient) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 max-w-md w-full text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={32} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Unavailable</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => redirect('/login')} className="text-sm font-medium text-blue-600 hover:underline">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm">Manage your personal information and health settings</p>
        </div>
        <div className="hidden sm:block">
            <EditProfileModal patient={patient} />
        </div>
      </div>

      {/* 2. Main Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Banner*/}
        <div className="h-48 relative w-full bg-slate-200">
           {/* The Image */}
           <Image 
             src="/hospital-banner.jpg" // 1. Put your image in the 'public' folder
             alt="Medical Center Banner"
             fill
             className="object-cover opacity-90" // object-cover makes it fit perfectly
             priority
           />
           
           {/* Gradient Overlay - Makes text easier to read if image is bright */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
        
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-6 relative">
            
            {/* Avatar*/}
            <div className="-mt-16 flex-shrink-0">
              <div className="w-32 h-32 bg-white rounded-2xl p-1.5 shadow-lg">
                <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-4xl font-bold text-[#2D5F8B] border border-slate-100">
                  {getInitials(patient.fullName)}
                </div>
              </div>
            </div>

            {/* Name & Basic Badge*/}
            <div className="pt-4 md:pt-0 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{patient.fullName}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                   <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium text-xs border border-blue-100">
                     <User size={12} /> Patient
                   </span>
                   <span className="flex items-center gap-1.5">
                     <Calendar size={14} /> Joined {new Date(patient.createdAt).toLocaleDateString()}
                   </span>
                </div>
              </div>
              
              {/* Mobile Edit Button (Visible only on small screens) */}
              <div className="sm:hidden w-full mt-4">
                <EditProfileModal patient={patient} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-8"></div>

          {/* 3. Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Personal Information (Consolidated) */}
            <div className="lg:col-span-2 space-y-6">
              
              <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <User size={16} className="text-[#3A9D8C]" /> Personal Information
                </h3>
                
                {/* Unified Card for Details */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                   
                   {/* Item 1 */}
                   <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Email Address</span>
                      <div className="mt-1 flex items-center gap-3 font-medium text-slate-900">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                           <Mail size={14} />
                        </div>
                        <span className="break-all">{patient.email}</span>
                      </div>
                   </div>

                   {/* Item 2 */}
                   <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Phone Number</span>
                      <div className="mt-1 flex items-center gap-3 font-medium text-slate-900">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                           <Phone size={14} />
                        </div>
                        <span>{patient.phoneNumber || 'Not provided'}</span>
                      </div>
                   </div>

                   {/* Item 3 */}
                   <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Occupation</span>
                      <div className="mt-1 flex items-center gap-3 font-medium text-slate-900">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                           <Briefcase size={14} />
                        </div>
                        <span>{patient.occupation || 'Not specified'}</span>
                      </div>
                   </div>

                   {/* Item 4 (Grouped Age/Gender) */}
                   <div className="flex items-center gap-8">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Age</span>
                        <p className="mt-1 font-medium text-slate-900">{patient.age} <span className="text-slate-400 text-sm font-normal">yrs</span></p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Gender</span>
                        <p className="mt-1 font-medium text-slate-900 capitalize">{patient.gender}</p>
                      </div>
                   </div>

                </div>
              </section>

            </div>

            {/* Right Column: Medical Context (Widget Style) */}
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-[#3A9D8C]" /> Medical Profile
                </h3>
                
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Status Header */}
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <span className="text-sm font-medium text-slate-700">Knee Health Status</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                       patient.painSeverity > 5 
                       ? 'bg-amber-50 text-amber-600 border-amber-100' 
                       : 'bg-green-50 text-green-600 border-green-100'
                    }`}>
                      {patient.painSeverity > 5 ? 'Attention Needed' : 'Stable'}
                    </span>
                  </div>

                  <div className="p-5 space-y-6">
                    {/* Pain Severity Bar */}
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Pain Severity</span>
                          <span className="text-lg font-bold text-slate-900">{patient.painSeverity}<span className="text-sm text-slate-400 font-medium">/10</span></span>
                       </div>
                       <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                             className={`h-full rounded-full transition-all duration-500 ${
                                patient.painSeverity > 7 ? 'bg-red-500' : 
                                patient.painSeverity > 4 ? 'bg-amber-400' : 'bg-[#3A9D8C]'
                             }`}
                             style={{ width: `${(patient.painSeverity / 10) * 100}%` }}
                          ></div>
                       </div>
                    </div>

                    {/* Medical Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Affected Knee</p>
                          <p className="font-semibold text-slate-900">{patient.affectedKnee}</p>
                       </div>
                       <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">OA Diagnosis</p>
                          <p className="font-semibold text-slate-900 flex items-center gap-1">
                             {patient.oaDiagnosis ? (
                               <><AlertCircle size={14} className="text-amber-500"/> Yes</>
                             ) : (
                               <><CheckCircle2 size={14} className="text-green-500"/> No</>
                             )}
                          </p>
                       </div>
                    </div>

                    {/* Activity Level Badge */}
                    <div>
                       <p className="text-xs text-slate-500 mb-2">Assigned Activity Level</p>
                       <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E8F4F8] text-[#2D5F8B] rounded-lg text-sm font-medium">
                          <Activity size={14} />
                          {patient.activityLevel}
                       </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}