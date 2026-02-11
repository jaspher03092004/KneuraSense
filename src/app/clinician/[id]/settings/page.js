'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

const Breadcrumb = ({ items }) => (
  <nav className="flex items-center space-x-2 mb-6">
    {items.map((item, index) => (
      <div key={index} className="flex items-center">
        {index > 0 && <span className="text-gray-400 mx-2">/</span>}
        <span className={index === items.length - 1 ? 'text-gray-700 font-semibold' : 'text-blue-600'}>
          {item}
        </span>
      </div>
    ))}
  </nav>
);

export default function SettingsPage() {
  const params = useParams();
  const { id } = params;
  
  // Static clinician data
  const clinicianData = {
    name: "Dr. Maria Santos",
    email: "maria.santos@hospital.ph",
    specialty: "Orthopedic Surgery",
    hospital: "Philippine General Hospital",
    licenseNumber: "PRC-123456",
    phone: "+63 912 345 6789",
    profileImage: "MS"
  };
  
  // Static notification preferences
  const notifications = [
    { id: 1, label: "Patient Risk Alerts", description: "High risk score notifications", enabled: true },
    { id: 2, label: "Daily Summaries", description: "Patient activity summaries", enabled: true },
    { id: 3, label: "System Updates", description: "Software and firmware updates", enabled: true },
    { id: 4, label: "Email Notifications", description: "Receive email notifications", enabled: false },
    { id: 5, label: "SMS Alerts", description: "Critical alerts via SMS", enabled: true },
    { id: 6, label: "Weekly Reports", description: "Weekly performance reports", enabled: false }
  ];
  
  // Static display preferences
  const displayPreferences = [
    { id: 1, label: "Dark Mode", description: "Use dark theme interface", enabled: false },
    { id: 2, label: "Compact View", description: "Denser data presentation", enabled: true },
    { id: 3, label: "Show Charts", description: "Display interactive charts", enabled: true },
    { id: 4, label: "Animations", description: "Enable UI animations", enabled: false }
  ];
  
  // Static data retention settings
  const dataRetention = [
    { period: "Real-time Data", duration: "24 hours", description: "High-frequency sensor data" },
    { period: "Daily Summaries", duration: "30 days", description: "Daily patient summaries" },
    { period: "Alerts History", duration: "90 days", description: "Risk alert history" },
    { period: "Patient Records", duration: "Permanent", description: "Medical records and interventions" }
  ];
  
  // State management
  const [activeTab, setActiveTab] = useState('account');
  const [clinicianInfo, setClinicianInfo] = useState(clinicianData);
  const [notificationSettings, setNotificationSettings] = useState(notifications);
  const [displaySettings, setDisplaySettings] = useState(displayPreferences);
  const [selectedRetention, setSelectedRetention] = useState(dataRetention[0].period);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Manila');
  
  // Tabs for settings navigation
  const tabs = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'data', label: 'Data & Privacy', icon: '🔒' },
    { id: 'integrations', label: 'Integrations', icon: '🔄' },
    { id: 'advanced', label: 'Advanced', icon: '⚙️' }
  ];
  
  // Languages options
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' }
  ];
  
  // Timezone options
  const timezones = [
    { value: 'Asia/Manila', label: 'Manila (UTC+8)', offset: '+8' },
    { value: 'Asia/Singapore', label: 'Singapore (UTC+8)', offset: '+8' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)', offset: '+9' },
    { value: 'Australia/Sydney', label: 'Sydney (UTC+11)', offset: '+11' }
  ];
  
  // Handle form changes
  const handleClinicianInfoChange = (field, value) => {
    setClinicianInfo(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNotificationToggle = (id) => {
    setNotificationSettings(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
      )
    );
  };
  
  const handleDisplayToggle = (id) => {
    setDisplaySettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };
  
  const handleSaveSettings = () => {
    console.log("Saving settings...");
    alert("Settings saved successfully!");
  };
  
  const handleExportData = () => {
    console.log("Exporting data...");
    alert("Data export initiated! You will receive an email with the download link.");
  };
  
  const handleDeleteAccount = () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmed) {
      console.log("Deleting account...");
      alert("Account deletion requested. You will receive a confirmation email.");
    }
  };
  
  const handleResetSettings = () => {
    const confirmed = window.confirm("Reset all settings to defaults?");
    if (confirmed) {
      setClinicianInfo(clinicianData);
      setNotificationSettings(notifications);
      setDisplaySettings(displayPreferences);
      setSelectedRetention(dataRetention[0].period);
      setTheme('light');
      setLanguage('en');
      setTimezone('Asia/Manila');
      alert("Settings reset to defaults!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 p-6">
      <Breadcrumb items={['Settings', 'Account Settings']} />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Settings</h1>
            <p className="text-gray-600">
              Customize your KneuraSense dashboard experience
              <span className="ml-2 font-mono text-cyan-700 bg-cyan-100 px-2 py-1 rounded">
                Clinician ID: {id}
              </span>
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              className="px-6 py-3 bg-white rounded-xl border-2 border-slate-300 flex items-center gap-2 hover:bg-slate-50 transition-all hover:scale-105"
              onClick={handleResetSettings}
            >
              <span className="text-slate-600">↻</span>
              <span className="text-slate-700 font-semibold">Reset</span>
            </button>
            <button 
              className="px-6 py-3.5 bg-gradient-to-br from-cyan-700 to-teal-600 rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 transition-all hover:scale-105"
              onClick={handleSaveSettings}
            >
              <span className="text-white">💾</span>
              <span className="text-white font-bold">Save Changes</span>
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200">
            <div className="text-slate-500 text-sm font-semibold">Active Patients</div>
            <div className="text-3xl font-bold text-slate-800">24</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200">
            <div className="text-slate-500 text-sm font-semibold">Unread Alerts</div>
            <div className="text-3xl font-bold text-amber-600">3</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200">
            <div className="text-slate-500 text-sm font-semibold">Last Login</div>
            <div className="text-lg font-bold text-slate-800">Today, 08:30</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200">
            <div className="text-slate-500 text-sm font-semibold">Storage Used</div>
            <div className="text-lg font-bold text-slate-800">42% / 50GB</div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '42%' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-cyan-800 to-teal-700 text-white">
              <h2 className="text-xl font-bold mb-2">Settings Navigation</h2>
              <p className="text-cyan-100 text-sm">Customize your experience</p>
            </div>
            <div className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl mb-1 transition-all ${
                    activeTab === tab.id 
                      ? 'bg-cyan-50 text-cyan-700 border-2 border-cyan-200' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-semibold">{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="ml-auto text-cyan-600">→</span>
                  )}
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-slate-200">
              <div className="text-slate-500 text-sm mb-2">Quick Links</div>
              <button className="text-cyan-700 font-semibold text-sm hover:text-cyan-800 transition-colors">
                ↻ System Status
              </button>
              <div className="mt-4">
                <button className="text-cyan-700 font-semibold text-sm hover:text-cyan-800 transition-colors">
                  📚 Help Center
                </button>
              </div>
            </div>
          </div>
          
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-700 to-teal-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{clinicianInfo.profileImage}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{clinicianInfo.name}</h3>
                <p className="text-slate-500 text-sm">{clinicianInfo.specialty}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🏥</span>
                <span>{clinicianInfo.hospital}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">📧</span>
                <span>{clinicianInfo.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">📱</span>
                <span>{clinicianInfo.phone}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Settings Content Area */}
        <div className="lg:w-3/4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <span className="text-cyan-600">👤</span>
                    Account Information
                  </h2>
                  <p className="text-slate-500 mb-6">Manage your personal and professional details</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-2">Full Name</label>
                      <input
                        type="text"
                        value={clinicianInfo.name}
                        onChange={(e) => handleClinicianInfoChange('name', e.target.value)}
                        className="w-full p-3 border-2 text-black border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-2">Email Address</label>
                      <input
                        type="email"
                        value={clinicianInfo.email}
                        onChange={(e) => handleClinicianInfoChange('email', e.target.value)}
                        className="w-full p-3 border-2 text-black border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={clinicianInfo.phone}
                        onChange={(e) => handleClinicianInfoChange('phone', e.target.value)}
                        className="w-full p-3 border-2 text-black border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-2">Hospital / Clinic</label>
                      <input
                        type="text"
                        value={clinicianInfo.hospital}
                        onChange={(e) => handleClinicianInfoChange('hospital', e.target.value)}
                        className="w-full p-3 border-2 text-black border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-2">Specialty</label>
                      <select
                        value={clinicianInfo.specialty}
                        onChange={(e) => handleClinicianInfoChange('specialty', e.target.value)}
                        className="w-full p-3 border-2 text-black border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors"
                      >
                        <option>Orthopedic Surgery</option>
                        <option>Sports Medicine</option>
                        <option>Physical Therapy</option>
                        <option>Rehabilitation Medicine</option>
                        <option>Rheumatology</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-2">License Number</label>
                      <input
                        type="text"
                        value={clinicianInfo.licenseNumber}
                        onChange={(e) => handleClinicianInfoChange('licenseNumber', e.target.value)}
                        className="w-full p-3 border-2 text-black border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl border border-cyan-200">
                    <h3 className="font-bold text-slate-800 mb-2">Account Security</h3>
                    <p className="text-slate-600 text-sm mb-4">Last password change: 30 days ago</p>
                    <button className="px-6 py-3 bg-white rounded-xl border-2 border-cyan-600 text-cyan-700 font-semibold hover:bg-cyan-50 transition-colors">
                      🔐 Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <span className="text-amber-500">🔔</span>
                    Notification Preferences
                  </h2>
                  <p className="text-slate-500 mb-6">Control how and when you receive notifications</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {notificationSettings.map((notif) => (
                      <div key={notif.id} className="p-4 border-2 border-slate-200 rounded-2xl hover:border-cyan-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-slate-800">{notif.label}</h4>
                            <p className="text-slate-500 text-sm">{notif.description}</p>
                          </div>
                          <button
                            onClick={() => handleNotificationToggle(notif.id)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              notif.enabled ? 'bg-cyan-500' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              notif.enabled ? 'transform translate-x-7' : 'transform translate-x-1'
                            }`}></div>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                    <h3 className="font-bold text-slate-800 mb-2">Alert Preferences</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-2">Alert Sound</label>
                        <select className="w-full md:w-64 p-3 border-2 border-slate-200 rounded-xl">
                          <option>Default Tone</option>
                          <option>Gentle Chime</option>
                          <option>Urgent Alert</option>
                          <option>No Sound</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-2">Quiet Hours</label>
                        <div className="flex items-center gap-4">
                          <input type="time" defaultValue="22:00" className="p-3 border-2 border-slate-200 rounded-xl" />
                          <span className="text-slate-500">to</span>
                          <input type="time" defaultValue="07:00" className="p-3 border-2 border-slate-200 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Display Settings */}
            {activeTab === 'display' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <span className="text-purple-500">🎨</span>
                    Display & Theme
                  </h2>
                  <p className="text-slate-500 mb-6">Customize the look and feel of your dashboard</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {displaySettings.map((setting) => (
                      <div key={setting.id} className="p-4 border-2 border-slate-200 rounded-2xl hover:border-purple-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-slate-800">{setting.label}</h4>
                            <p className="text-slate-500 text-sm">{setting.description}</p>
                          </div>
                          <button
                            onClick={() => handleDisplayToggle(setting.id)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              setting.enabled ? 'bg-purple-500' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              setting.enabled ? 'transform translate-x-7' : 'transform translate-x-1'
                            }`}></div>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold text-slate-800 mb-4">Theme Selection</h3>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setTheme('light')}
                          className={`p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-300'}`}
                        >
                          <div className="w-32 h-20 bg-gradient-to-br from-white to-slate-100 rounded-lg mb-2"></div>
                          <span className="font-semibold">Light Mode</span>
                        </button>
                        <button 
                          onClick={() => setTheme('dark')}
                          className={`p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-300'}`}
                        >
                          <div className="w-32 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg mb-2"></div>
                          <span className="font-semibold">Dark Mode</span>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-slate-800 mb-4">Language & Region</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-2">Language</label>
                          <div className="grid grid-cols-2 gap-2">
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => setLanguage(lang.code)}
                                className={`p-3 rounded-xl border-2 transition-all ${language === lang.code ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-300'}`}
                              >
                                <span className="mr-2">{lang.flag}</span>
                                {lang.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-2">Timezone</label>
                          <select 
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full p-3 border-2 border-slate-200 rounded-xl"
                          >
                            {timezones.map((tz) => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Data & Privacy Settings */}
            {activeTab === 'data' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <span className="text-emerald-500">🔒</span>
                    Data Management & Privacy
                  </h2>
                  <p className="text-slate-500 mb-6">Control your data retention and privacy settings</p>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl border border-emerald-200">
                      <h3 className="font-bold text-slate-800 mb-4">Data Retention Policy</h3>
                      <div className="space-y-4">
                        {dataRetention.map((item) => (
                          <div key={item.period} className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <div>
                              <h4 className="font-semibold text-slate-800">{item.period}</h4>
                              <p className="text-slate-500 text-sm">{item.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-semibold">
                                {item.duration}
                              </span>
                              {selectedRetention === item.period && (
                                <span className="text-emerald-600">✓</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button 
                        onClick={handleExportData}
                        className="p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-cyan-300 hover:bg-cyan-50 transition-all group"
                      >
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📥</div>
                        <h4 className="font-bold text-slate-800 mb-2">Export Your Data</h4>
                        <p className="text-slate-500 text-sm">Download all your patient data and settings</p>
                      </button>
                      
                      <button className="p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👁️</div>
                        <h4 className="font-bold text-slate-800 mb-2">Privacy Controls</h4>
                        <p className="text-slate-500 text-sm">Manage data sharing and visibility</p>
                      </button>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-r from-rose-50 to-red-50 rounded-2xl border border-rose-200">
                      <h3 className="font-bold text-slate-800 mb-2">Danger Zone</h3>
                      <p className="text-slate-600 text-sm mb-4">These actions are irreversible</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button className="px-6 py-3 bg-rose-100 text-rose-700 rounded-xl border-2 border-rose-300 font-semibold hover:bg-rose-200 transition-colors">
                          🗑️ Clear All Data
                        </button>
                        <button 
                          onClick={handleDeleteAccount}
                          className="px-6 py-3 bg-white text-rose-600 rounded-xl border-2 border-rose-500 font-semibold hover:bg-rose-50 transition-colors"
                        >
                          ⚠️ Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <span className="text-blue-500">🔄</span>
                    Integrations & API
                  </h2>
                  <p className="text-slate-500 mb-6">Connect KneuraSense with other healthcare systems</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <h3 className="font-bold text-slate-800 mb-4">Available Integrations</h3>
                      <div className="space-y-3">
                        {['Electronic Health Records', 'Laboratory Systems', 'Billing Software', 'Telehealth Platforms'].map((system) => (
                          <div key={system} className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="font-semibold">{system}</span>
                            <button className="px-4 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors">
                              Connect
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4">API Access</h3>
                      <p className="text-slate-600 text-sm mb-4">Manage API keys for developers</p>
                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded-xl">
                          <div className="font-mono text-sm bg-slate-100 p-2 rounded">kns_api_••••••••••••••••</div>
                          <div className="text-slate-500 text-xs mt-2">Created: Nov 15, 2024</div>
                        </div>
                        <button className="w-full px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg font-semibold hover:bg-cyan-200 transition-colors">
                          + Generate New API Key
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Advanced Settings */}
            {activeTab === 'advanced' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <span className="text-slate-600">⚙️</span>
                    Advanced Settings
                  </h2>
                  <p className="text-slate-500 mb-6">Technical configurations for power users</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-bold text-slate-800 mb-4">Performance Settings</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-slate-700 font-semibold mb-2">Data Refresh Rate</label>
                            <select className="w-full p-3 border-2 text-black border-slate-200 rounded-xl">
                              <option>Real-time (1s)</option>
                              <option>Fast (5s)</option>
                              <option>Standard (30s)</option>
                              <option>Conserve (60s)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold mb-2">Chart Quality</label>
                            <select className="w-full p-3 border-2 text-black border-slate-200 rounded-xl">
                              <option>High Quality</option>
                              <option>Balanced</option>
                              <option>Performance</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-slate-800 mb-4">Developer Tools</h3>
                        <div className="space-y-3">
                          <button className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors">
                            🐞 Debug Mode
                          </button>
                          <button className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors">
                            📊 Analytics Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4">System Information</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Dashboard Version</span>
                            <span className="font-semibold">v2.1.4</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">API Version</span>
                            <span className="font-semibold">v1.2.0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Last Updated</span>
                            <span className="font-semibold">Nov 20, 2024</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Database Size</span>
                            <span className="font-semibold">24.7 GB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Active Sessions</span>
                            <span className="font-semibold">3 devices</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="font-bold text-slate-800 mb-4">Cache Management</h3>
                        <div className="flex gap-4">
                          <button className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-semibold hover:bg-amber-200 transition-colors">
                            🧹 Clear Cache
                          </button>
                          <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors">
                            🗃️ Storage Analysis
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Note */}
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>KneuraSense Settings • For assistance, contact support@kneurasense.ph</p>
          </div>
        </div>
      </div>
    </div>
  );
}