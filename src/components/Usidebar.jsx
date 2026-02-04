'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { 
  // Patient Icons
  Activity,
  TrendingUp,   
  ListTodo,
  
  // Clinician Icons
  LayoutDashboard, 
  BarChart3,    
  MessageSquarePlus,
  Settings, 
  FileText,
  UserCog,
  
  // Common Icons
  ChevronDown,
  LogOut,
  HelpCircle,
  User
} from 'lucide-react';

const Sidebar = ({ isExpanded, setIsExpanded, user, role = 'patient' }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  // Helper for Initials
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
  };

  // --- 1. Define Menus based on Role ---

  // Patient Configuration
  const patientMenuStructure = [
    {
      sectionTitle: "Monitoring",
      items: [
        { icon: Activity, label: 'Live Dashboard', href: `/patient/${user?.id}/dashboard` },
        { icon: TrendingUp, label: 'History & Trends', href: `/patient/${user?.id}/history` },          
        { icon: ListTodo, label: 'Activity Recommendations', href: `/patient/${user?.id}/activity` },    
      ]
    },
    {
      sectionTitle: "Management",
      items: [
        { icon: User, label: 'My Profile', href: `/patient/${user?.id}/myProfile` },
        { icon: Settings, label: 'Settings', href: `/patient/${user?.id}/settings` },
        { icon: HelpCircle, label: 'Help & Support', href: '/help' },
      ]
    }
  ];

  // Clinician Configuration
  const clinicianMenuStructure = [
    {
      sectionTitle: "OVERVIEW",
      items: [
        { icon: LayoutDashboard, label: 'Patient Dashboard', href: `/clinician/${user?.id}/dashboard` },
        { icon: BarChart3, label: 'Data Analytics', href: `/clinician/${user?.id}/analytics` },          
        { icon: MessageSquarePlus, label: 'Interventions', href: `/clinician/${user?.id}/interventions` },    
      ]
    },
    {
      sectionTitle: "ADMINISTRATION",
      items: [
        { icon: Settings, label: 'System Management', href: `/clinician/${user?.id}/system` },
        { icon: FileText, label: 'Reports', href: `/clinician/${user?.id}/reports` },
        { icon: UserCog, label: 'Settings', href: `/clinician/${user?.id}/settings` },
      ]
    }
  ];

  // Select the correct structure
  const menuStructure = role === 'clinician' ? clinicianMenuStructure : patientMenuStructure;
  const isActive = (path) => pathname === path;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white shadow-[4px_0_15px_rgba(0,0,0,0.08)] z-50 transition-all duration-300 ease-in-out flex flex-col ${
        isExpanded ? 'w-[280px]' : 'w-20'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setHoveredItem(null);
        setIsDropdownOpen(false); 
      }}
    >
      <div className="flex flex-col h-full px-4 py-8">
        
        {/* LOGO SECTION */}
        <div className={`flex items-center mb-8 h-11 transition-all duration-300 ${isExpanded ? 'justify-start' : 'justify-center'}`}>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2D5F8B] to-[#3A9D8C] flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <div className={`flex flex-col ml-3 overflow-hidden transition-all duration-300 ${
              isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
            }`}>
            <span className="text-[#2D5F8B] font-bold text-base whitespace-nowrap">
              KneuraSense
            </span>
            {/* Show 'Clinician Portal' subtitle if role is clinician */}
            {role === 'clinician' && (
              <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                Clinician Portal
              </span>
            )}
          </div>
        </div>

        {/* DYNAMIC MENU RENDERING */}
        {menuStructure.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <div className={`text-xs font-bold text-[#94A3B8] mb-3 uppercase tracking-wider overflow-hidden transition-all duration-300 whitespace-nowrap ${
              isExpanded ? 'opacity-100 h-auto pl-2' : 'opacity-0 h-0 pl-0'
            }`}>
              {section.sectionTitle}
            </div>
            <nav className="space-y-1">
              {section.items.map((item, itemIndex) => {
                // Create a unique key for hover state tracking
                const uniqueKey = `${sectionIndex}-${itemIndex}`;
                
                return (
                  <button
                    key={uniqueKey}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center py-3 px-3 rounded-lg transition-all duration-200 group relative ${
                      isExpanded ? 'justify-start' : 'justify-center'
                    } ${
                      hoveredItem === uniqueKey || isActive(item.href) ? 'bg-[#E8F4F8] text-[#2D5F8B]' : 'text-[#64748B]'
                    }`}
                    onMouseEnter={() => setHoveredItem(uniqueKey)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Active/Hover Indicator Line */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#2D5F8B] transition-all duration-200 ${
                       hoveredItem === uniqueKey || isActive(item.href) ? 'opacity-100' : 'opacity-0'
                    }`} />

                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200`} strokeWidth={2} />
                    
                    <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}

        {/* USER PROFILE SECTION (Footer) */}
        <div className="mt-auto pt-6 border-t border-gray-200 relative">
          
          {/* Dropdown Menu */}
          <div className={`absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 origin-bottom z-50 ${
            isDropdownOpen && isExpanded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
          }`}>
             <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 hover:text-red-600 text-gray-600 transition-colors"
             >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Log Out</span>
             </button>
          </div>

          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center py-2 px-1 rounded-lg transition-all duration-200 relative ${
               isExpanded ? 'justify-start' : 'justify-center'
            } ${
              hoveredItem === 'profile' || isDropdownOpen ? 'bg-[#E8F4F8]' : ''
            }`}
            onMouseEnter={() => setHoveredItem('profile')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center flex-shrink-0 border border-gray-100">
              <span className="text-[#2D5F8B] font-semibold text-sm">
                {getInitials(user?.fullName)}
              </span>
            </div>
            
            <div className={`flex flex-col items-start overflow-hidden transition-all duration-300 ${
                 isExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'
              }`}>
              <span className="text-sm font-semibold text-[#2C3E50] whitespace-nowrap">
                {user?.fullName || 'Dr. User'}
              </span>
              <span className="text-xs text-[#95A5A6] whitespace-nowrap">
                {role === 'clinician' ? 'Orthopedic Specialist' : (user?.email || 'No Email')}
              </span>
            </div>
            
            {isExpanded && (
              <ChevronDown className={`w-4 h-4 text-[#2C3E50] ml-auto flex-shrink-0 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`} />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;