'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePatient } from '@/lib/PatientContext';

export default function SidebarNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { patientId } = usePatient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Monitoring links with dynamic routing
  const monitoringLinks = [
    { name: 'Live Dashboard', href: `/patient/${patientId}/dashboard`, icon: '📊' },
    { name: 'History & Trends', href: `/patient/${patientId}/history`, icon: '📈' },
    { name: 'Activity Recommendations', href: `/patient/${patientId}/recommendations`, icon: '💡' },
  ];

  // Management links with dynamic routing
  const managementLinks = [
    { name: 'My Profile', href: `/patient/${patientId}/profile`, icon: '👤' },
    { name: 'Settings', href: `/patient/${patientId}/settings`, icon: '⚙️' },
    { name: 'Help & Support', href: `/patient/${patientId}/support`, icon: '❓' },
  ];

  const handleLogout = () => {
    setShowProfileMenu(false);
    router.push('/login');
  };

  return (
    <div className={`h-screen bg-white border-r border-gray-200 text-gray-900 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-bold mb-1 text-gray-900">Kneurasense</h1>
              <p className="text-gray-500 text-sm">Real-time Monitoring</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-900"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 p-6 space-y-8 overflow-y-auto">
        {/* MONITORING Section */}
        <div>
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">MONITORING</h2>
          )}
          <div className="space-y-2">
            {monitoringLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? link.name : ''}
                >
                  <span className="text-lg mr-3">{link.icon}</span>
                  {!isCollapsed && <span className="font-medium">{link.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* MANAGEMENT Section */}
        <div>
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">MANAGEMENT</h2>
          )}
          <div className="space-y-2">
            {managementLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? link.name : ''}
                >
                  <span className="text-lg mr-3">{link.icon}</span>
                  {!isCollapsed && <span className="font-medium">{link.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-t border-gray-200 relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full hover:bg-gray-100 rounded-lg transition-colors p-2"
        >
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center font-bold text-white">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-gray-900">Juan Dela Cruz</p>
                <p className="text-gray-500 text-sm truncate">Patient ID: {patientId}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center font-bold text-white" title={`Patient ID: ${patientId}`}>
                JD
              </div>
            </div>
          )}
        </button>

        {/* Profile Menu Dropdown */}
        {showProfileMenu && (
          <div className="absolute bottom-24 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>🚪</span>
              <span>Exit / Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
