'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { useTheme } from 'next-themes';
import { 
  Activity, TrendingUp, ListTodo, BarChart3, ChevronDown, User, Settings,
  HelpCircle, LogOut, Shield, FileText, Menu, X, Moon, Sun
} from 'lucide-react';

const Sidebar = ({ isExpanded, setIsExpanded, user }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false); 
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = async () => {
    console.log('Logging out...');
    router.push('/login'); 
  };

  const handleNavigation = (path) => {
    if (path) router.push(path);
    setIsMobileOpen(false); 
  };

  const isClinic = user?.role === 'CLINICIAN' || user?.role === 'Clinician';

  // Patient menu items
  const patientMainMenuItems = [
    { icon: Activity, label: 'Live Dashboard', href: `/patient/${user?.id}/dashboard` },
    { icon: TrendingUp, label: 'History & Trends', href: `/patient/${user?.id}/history`},          
    { icon: ListTodo, label: 'Activity Recommendations', href: `/patient/${user?.id}/activity`},    
  ];

  const patientManagementItems = [
    { icon: User, label: 'My Profile', href: `/patient/${user?.id}/myProfile` },
    { icon: Settings, label: 'Settings', href: `/patient/${user?.id}/settings` },
    { icon: HelpCircle, label: 'Help & Support', href: `/patient/${user?.id}/help`},
  ];

  // Clinician menu items
  const clinicianMainMenuItems = [
    { icon: Activity, label: 'Patient Dashboard', href: `/clinician/${user?.id}/dashboard` },
    { icon: BarChart3, label: 'Data Analytics', href: `/clinician/${user?.id}/analytics` },          
    { icon: ListTodo, label: 'Interventions', href: `/clinician/${user?.id}/interventions` },    
  ];

  const clinicianManagementItems = [
    { icon: Shield, label: 'System Management', href: `/clinician/${user?.id}/system-management` },
    { icon: FileText, label: 'Reports', href: `/clinician/${user?.id}/reports` },
    { icon: Settings, label: 'Settings', href: `/clinician/${user?.id}/settings` },
  ];

  const mainMenuItems = isClinic ? clinicianMainMenuItems : patientMainMenuItems;
  const managementItems = isClinic ? clinicianManagementItems : patientManagementItems;
  
  const overviewLabel = isClinic ? 'OVERVIEW' : 'MONITORING';
  const administrationLabel = isClinic ? 'ADMINISTRATION' : 'MANAGEMENT';

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* MOBILE HAMBURGER BUTTON */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md text-[#2D5F8B] dark:text-blue-400 border border-gray-100 dark:border-slate-700"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 shadow-[4px_0_15px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_15px_rgba(0,0,0,0.5)] z-50 
          transition-all duration-300 ease-in-out flex flex-col border-r border-transparent dark:border-slate-800
          w-[280px] 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 
          ${isExpanded ? 'md:w-[280px]' : 'md:w-20'}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => {
          setIsExpanded(false);
          setHoveredItem(null);
          setIsDropdownOpen(false); 
        }}
      >
        <div className="flex flex-col h-full px-4 py-8 relative">
          
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LOGO SECTION */}
          <div className={`flex items-center mb-8 h-11 transition-all duration-300 ${isExpanded ? 'justify-start' : 'md:justify-center'}`}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2D5F8B] to-[#3A9D8C] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className={`text-[#2D5F8B] dark:text-white font-semibold text-base whitespace-nowrap overflow-hidden transition-all duration-300 ml-3 ${
              isExpanded ? 'w-auto opacity-100' : 'md:w-0 md:opacity-0 md:ml-0 w-auto opacity-100'
            }`}>
              KneuraSense
            </span>
          </div>

          {/* MAIN MENU */}
          <div className="mb-6">
            <div className={`text-xs font-semibold text-[#2C3E50] dark:text-slate-400 mb-3 uppercase tracking-wider overflow-hidden transition-all duration-300 whitespace-nowrap pl-2 ${
              isExpanded ? 'opacity-60 h-auto' : 'md:opacity-0 md:h-0 md:pl-0 opacity-60 h-auto'
            }`}>
              {overviewLabel}
            </div>
            <nav className="space-y-1">
              {mainMenuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center py-3 px-3 rounded-lg transition-all duration-200 group relative ${
                    isExpanded ? 'justify-start' : 'md:justify-center'
                  } ${
                    hoveredItem === index || isActive(item.href) 
                      ? 'bg-[#E8F4F8] dark:bg-slate-800 text-[#2D5F8B] dark:text-blue-400' 
                      : 'text-[#2C3E50] dark:text-slate-300'
                  }`}
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#2D5F8B] dark:bg-blue-400 transition-all duration-200 ${
                    hoveredItem === index || isActive(item.href) ? 'opacity-100' : 'opacity-0'
                  }`} />
                  <item.icon className="w-5 h-5 flex-shrink-0 transition-colors duration-200" strokeWidth={2} />
                  <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ml-3 ${
                    isExpanded ? 'w-auto opacity-100' : 'md:w-0 md:opacity-0 md:ml-0 w-auto opacity-100'
                  }`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* MANAGEMENT SECTION */}
          <div className="mb-6">
            <div className={`text-xs font-semibold text-[#2C3E50] dark:text-slate-400 mb-3 uppercase tracking-wider overflow-hidden transition-all duration-300 whitespace-nowrap pl-2 ${
              isExpanded ? 'opacity-60 h-auto' : 'md:opacity-0 md:h-0 md:pl-0 opacity-60 h-auto'
            }`}>
              {administrationLabel}
            </div>
            <nav className="space-y-1">
              {managementItems.map((item, index) => {
                const itemIndex = index + mainMenuItems.length;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center py-3 px-3 rounded-lg transition-all duration-200 group relative ${
                      isExpanded ? 'justify-start' : 'md:justify-center'
                    } ${
                      hoveredItem === itemIndex || isActive(item.href) 
                        ? 'bg-[#E8F4F8] dark:bg-slate-800 text-[#2D5F8B] dark:text-blue-400' 
                        : 'text-[#2C3E50] dark:text-slate-300'
                    }`}
                    onMouseEnter={() => setHoveredItem(itemIndex)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#2D5F8B] dark:bg-blue-400 transition-all duration-200 ${
                      hoveredItem === itemIndex || isActive(item.href) ? 'opacity-100' : 'opacity-0'
                    }`} />
                    <item.icon className="w-5 h-5 flex-shrink-0 transition-colors duration-200" strokeWidth={2} />
                    <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ml-3 ${
                      isExpanded ? 'w-auto opacity-100' : 'md:w-0 md:opacity-0 md:ml-0 w-auto opacity-100'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* BOTTOM SECTION: THEME TOGGLE & USER PROFILE */}
          <div className="mt-auto">
            
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-full flex items-center py-3 px-3 mb-4 rounded-lg transition-all duration-200 group ${
                  isExpanded ? 'justify-start' : 'md:justify-center'
                } text-[#2C3E50] dark:text-slate-300 hover:bg-[#E8F4F8] dark:hover:bg-slate-800`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 flex-shrink-0 text-amber-400" strokeWidth={2} />
                ) : (
                  <Moon className="w-5 h-5 flex-shrink-0 text-[#2D5F8B]" strokeWidth={2} />
                )}
                <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ml-3 ${
                  isExpanded ? 'w-auto opacity-100' : 'md:w-0 md:opacity-0 md:ml-0 w-auto opacity-100'
                }`}>
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
            )}

            {/* USER PROFILE SECTION */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 relative">
              
              {/* Dropdown Menu */}
              <div className={`absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-200 origin-bottom z-50 ${
                (isDropdownOpen && isExpanded) || (isDropdownOpen && isMobileOpen) ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
              }`}>
                 <button 
                   onClick={handleLogout}
                   className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-slate-300 transition-colors"
                 >
                   <LogOut className="w-4 h-4" />
                   <span className="text-sm font-medium">Log Out</span>
                 </button>
              </div>

              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center py-2 px-1 rounded-lg transition-all duration-200 relative ${
                   isExpanded ? 'justify-start' : 'md:justify-center'
                } ${
                  hoveredItem === 'profile' || isDropdownOpen ? 'bg-[#E8F4F8] dark:bg-slate-800' : ''
                }`}
                onMouseEnter={() => setHoveredItem('profile')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="w-10 h-10 rounded-full bg-[#E8F4F8] dark:bg-slate-700 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-slate-600">
                  <span className="text-[#2D5F8B] dark:text-blue-400 font-semibold text-sm">
                    {getInitials(user?.fullName)}
                  </span>
                </div>
                
                <div className={`flex flex-col items-start overflow-hidden transition-all duration-300 ml-3 ${
                     isExpanded ? 'w-auto opacity-100' : 'md:w-0 md:opacity-0 md:ml-0 w-auto opacity-100'
                  }`}>
                  <span className="text-sm font-semibold text-[#2C3E50] dark:text-slate-200 whitespace-nowrap">
                    {user?.fullName || 'User'}
                  </span>
                  <span className="text-xs text-[#95A5A6] dark:text-slate-500 whitespace-nowrap">
                    {user?.email || 'No Email'}
                  </span>
                </div>
                
                <ChevronDown className={`w-4 h-4 text-[#2C3E50] dark:text-slate-400 ml-auto flex-shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                } ${
                  isExpanded || isMobileOpen ? 'opacity-100' : 'md:opacity-0 opacity-100'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;