'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClinician } from '@/lib/ClinicianContext';

export default function ClinicianSidebarNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { clinicianId } = useClinician();
  const [pendingInterventions, setPendingInterventions] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Mock notification badge logic: update count every 8s (simulates live updates)
  useEffect(() => {
    setPendingInterventions(3);
    const id = setInterval(() => {
      const mock = Math.max(0, (clinicianId ? clinicianId.length : 3) % 7);
      setPendingInterventions(mock);
    }, 8000);
    return () => clearInterval(id);
  }, [clinicianId]);

  const links = [
    { name: 'Dashboard', href: `/clinician/${clinicianId}/dashboard`, icon: '🧾' },
    { name: 'Analytics', href: `/clinician/${clinicianId}/analytics`, icon: '📈' },
    { name: 'Interventions', href: `/clinician/${clinicianId}/interventions`, icon: '🩺' },
    { name: 'System Management', href: `/clinician/${clinicianId}/system`, icon: '📋' },
    { name: 'Reports', href: `/clinician/${clinicianId}/reports`, icon: '📊' },
    { name: 'Settings', href: `/clinician/${clinicianId}/settings`, icon: '⚙️' },
  ];

  const handleExit = () => {
    setShowProfileMenu(false);
    router.push('/login');
  };

  return (
    <div className="h-screen w-64 bg-white text-gray-900 flex flex-col border-r border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold mb-1">Kneurasense</h1>
        <p className="text-gray-500 text-sm">Clinician Portal</p>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">OVERVIEW</h2>

          <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 text-sm font-medium">Patient Dashboard</span>
              <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">{pendingInterventions}</span>
            </div>
            <div className="space-y-2 ml-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span className="text-gray-600 text-sm">Data Analytics</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span className="text-gray-600 text-sm">Interventions</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {links.slice(0,3).map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-50 border-l-4 border-blue-400' : 'hover:bg-gray-50 text-gray-700 border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-lg mr-3">{link.icon}</span>
                  <span className="font-medium">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ADMINISTRATION</h2>
          <div className="space-y-1">
            {links.slice(3).map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-50 border-l-4 border-blue-400' : 'hover:bg-gray-50 text-gray-700 border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-lg mr-3">{link.icon}</span>
                  <span className="font-medium">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full hover:bg-gray-50 rounded-lg transition-colors p-2 text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">MS</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <p className="font-bold text-gray-900">Dr. Maria Santos</p>
              <p className="text-gray-500 text-sm">Orthopedic Specialist</p>
            </div>
          </div>
        </button>

        {showProfileMenu && (
          <div className="absolute bottom-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={handleExit}
              className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>🚪</span>
              <span>Exit / Back to Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
