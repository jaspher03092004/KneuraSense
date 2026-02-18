import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import EditClinicianProfileModal from '@/components/EditClinicianProfileModal';
import { 
  User, Mail, Phone, Calendar, Briefcase, AlertCircle
} from 'lucide-react';

export default async function ClinicianProfile({ params }) {
  const { id } = await params;

  let clinician = null;
  let error = null;

  try {
    clinician = await prisma.clinician.findUnique({
      where: { clinician_id: id },
    });
    if (!clinician) error = 'Clinician not found';
  } catch (err) {
    console.error('Error fetching clinician data:', err);
    error = 'Failed to fetch clinician data';
  }

  if (error || !clinician) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-transparent transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 p-8 max-w-md w-full text-center">
          <AlertCircle className="text-red-500 dark:text-red-400 mx-auto mb-4" size={32} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Profile Unavailable</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button onClick={() => redirect('/login')} className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 bg-transparent transition-colors duration-300 p-4 md:p-8">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your professional information</p>
        </div>
        <div className="hidden sm:block">
            <EditClinicianProfileModal clinician={clinician} />
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        
        {/* Banner */}
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
            
            {/* Avatar */}
            <div className="-mt-16 flex-shrink-0">
              <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-lg">
                <div className="w-full h-full bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-4xl font-bold text-cyan-700 dark:text-cyan-400 border border-slate-100 dark:border-slate-700">
                  {getInitials(clinician.full_name)}
                </div>
              </div>
            </div>

            {/* Name & Basic Badge */}
            <div className="pt-4 md:pt-0 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{clinician.full_name}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                   <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-medium text-xs border border-cyan-100 dark:border-cyan-500/20">
                     <User size={12} /> Clinician
                   </span>
                   <span className="flex items-center gap-1.5">
                     <Calendar size={14} /> Joined {new Date(clinician.createdAt).toLocaleDateString()}
                   </span>
                </div>
              </div>
              <div className="sm:hidden w-full mt-4">
                <EditClinicianProfileModal clinician={clinician} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 my-8"></div>

          {/* Professional Information Grid */}
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-cyan-600 dark:text-cyan-400" /> Professional Details
              </h3>
              
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
                 <div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Email Address</span>
                    <div className="mt-1 flex items-center gap-3 font-medium text-slate-900 dark:text-slate-200">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                         <Mail size={14} />
                      </div>
                      <span className="break-all">{clinician.email}</span>
                    </div>
                 </div>

                 <div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Phone Number</span>
                    <div className="mt-1 flex items-center gap-3 font-medium text-slate-900 dark:text-slate-200">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                         <Phone size={14} />
                      </div>
                      <span>{clinician.phone_number || 'Not provided'}</span>
                    </div>
                 </div>

                 <div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Specialization</span>
                    <div className="mt-1 flex items-center gap-3 font-medium text-slate-900 dark:text-slate-200">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                         <Briefcase size={14} />
                      </div>
                      <span>{clinician.specialization || 'General Practice'}</span>
                    </div>
                 </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}