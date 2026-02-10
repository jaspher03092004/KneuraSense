"use client";

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Search,
  Filter,
  Users,
  Activity,
  AlertCircle,
  WifiOff,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Download
} from 'lucide-react';

export default function ClinicianDashboard() {
  const params = useParams();
  const clinicianId = params?.id || 'unknown';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    phoneNumber: '',
    oaDiagnosis: 'No',
    affectedKnee: '',
    painSeverity: '',
    occupation: '',
    activityLevel: ''
  });
  const [registrationMessage, setRegistrationMessage] = useState('');

  // Mocked patients shaped like a future Prisma response, with IoT fields
  const patients = [
    {
      id: 'KN-2024-003',
      name: 'Roberto Garcia',
      initials: 'RG',
      age: 71,
      score: 85,
      status: 'high-risk',
      lastActive: '1 hour ago',
      lastSensorSync: '2026-02-04T10:15:00Z',
      avgStrainScore: 72,
      color: 'red',
      compliance: 92
    },
    {
      id: 'KN-2024-002',
      name: 'Maria Santos',
      initials: 'MS',
      age: 58,
      score: 68,
      status: 'caution',
      lastActive: '15 mins ago',
      lastSensorSync: '2026-02-04T11:05:00Z',
      avgStrainScore: 55,
      color: 'orange',
      compliance: 78
    },
    {
      id: 'KN-2024-005',
      name: 'Antonio Reyes',
      initials: 'AR',
      age: 69,
      score: 55,
      status: 'caution',
      lastActive: '30 mins ago',
      lastSensorSync: '2026-02-04T10:50:00Z',
      avgStrainScore: 48,
      color: 'orange',
      compliance: 65
    },
    {
      id: 'KN-2024-001',
      name: 'Juan Dela Cruz',
      initials: 'JC',
      age: 62,
      score: 42,
      status: 'stable',
      lastActive: '2 hours ago',
      lastSensorSync: '2026-02-03T16:20:00Z',
      avgStrainScore: 28,
      color: 'green',
      compliance: 85
    },
    {
      id: 'KN-2024-004',
      name: 'Lourdes Mendoza',
      initials: 'LM',
      age: 65,
      score: 35,
      status: 'stable',
      lastActive: '1 day ago',
      lastSensorSync: '2026-02-02T09:00:00Z',
      avgStrainScore: 22,
      color: 'green',
      compliance: 72
    }
  ];

  const stats = [
    { 
      label: 'Total Patients', 
      value: '24', 
      icon: <Users className="w-6 h-6" />, 
      bg: 'bg-blue-50', 
      textColor: 'text-blue-600',
      borderColor: 'border-blue-100'
    },
    { 
      label: 'Active Today', 
      value: '18', 
      icon: <Activity className="w-6 h-6" />, 
      bg: 'bg-emerald-50', 
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-100'
    },
    { 
      label: 'High Risk', 
      value: '3', 
      icon: <AlertCircle className="w-6 h-6" />, 
      bg: 'bg-rose-50', 
      textColor: 'text-rose-600',
      borderColor: 'border-rose-100'
    },
    { 
      label: 'Offline', 
      value: '6', 
      icon: <WifiOff className="w-6 h-6" />, 
      bg: 'bg-slate-50', 
      textColor: 'text-slate-600',
      borderColor: 'border-slate-100'
    }
  ];

  const filters = [
    { id: 'all', label: 'All Patients', count: 24 },
    { id: 'high-risk', label: 'High Risk', count: 3 },
    { id: 'caution', label: 'Caution', count: 8 },
    { id: 'stable', label: 'Stable', count: 7 },
    { id: 'offline', label: 'Offline', count: 6 }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      'high-risk': {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        icon: <AlertTriangle className="w-4 h-4" />
      },
      'caution': {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: <Clock className="w-4 h-4" />
      },
      'stable': {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: <CheckCircle className="w-4 h-4" />
      },
      'offline': {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        icon: <WifiOff className="w-4 h-4" />
      }
    };
    return configs[status] || configs.stable;
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-rose-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getComplianceColor = (compliance) => {
    if (compliance >= 90) return 'text-emerald-600';
    if (compliance >= 70) return 'text-amber-600';
    return 'text-rose-600';
  };

  // Memoized filtered list by search and status
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchesFilter = selectedFilter === 'all' || p.status === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [patients, searchQuery, selectedFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, currentPage]);

  // reset page when filters/search change
  if (currentPage > totalPages) setCurrentPage(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setRegistrationMessage('');

    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataObj.append(key, formData[key]);
      });
      formDataObj.append('role', 'Patient');

      const response = await fetch('/api/register', {
        method: 'POST',
        body: formDataObj,
      });

      const result = await response.json();

      if (result.success) {
        setRegistrationMessage('Patient registered successfully!');
        setTimeout(() => {
          setShowModal(false);
          setFormData({
            fullName: '',
            email: '',
            password: '',
            age: '',
            gender: '',
            phoneNumber: '',
            oaDiagnosis: 'No',
            affectedKnee: '',
            painSeverity: '',
            occupation: '',
            activityLevel: ''
          });
          setRegistrationMessage('');
        }, 1500);
      } else {
        setRegistrationMessage(`Error: ${result.error || 'Registration failed'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationMessage('An error occurred during registration.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Patient Dashboard</h1>
              <p className="text-slate-600 text-sm md:text-base">Monitor all patients' knee health status and activity patterns</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 shadow-sm">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Register Patient
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-slate-600 text-sm">{stat.label}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.borderColor} border`}>
                    <span className={stat.textColor}>{stat.icon}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.bg.replace('50', '500')} rounded-full`} 
                      style={{ width: `${(parseInt(stat.value) / 24) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter and Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button 
                    key={filter.id}
                    onClick={() => { setSelectedFilter(filter.id); setCurrentPage(1); }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      selectedFilter === filter.id 
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {filter.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedFilter === filter.id 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search patients by name or ID..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 outline-none transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">Patient List</h2>
                <span className="text-slate-500 text-sm px-2.5 py-1 bg-slate-100 rounded-full">
                  {filteredPatients.length} patients
                </span>
              </div>
              <div className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Patient
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Age
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Weekly Score
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Last Sync
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Strain
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-500">
                        <Search className="w-12 h-12 text-slate-300" />
                        <p className="text-lg font-medium">No patients found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((patient) => {
                    const statusConfig = getStatusConfig(patient.status);
                    return (
                      <tr 
                        key={patient.id} 
                        className="hover:bg-slate-50 transition-colors duration-150"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold">
                              {patient.initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{patient.name}</p>
                              <p className="text-sm text-slate-500">{patient.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-700 font-medium">{patient.age}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className="flex-1">
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${getScoreColor(patient.score)}`} 
                                  style={{ width: `${patient.score}%` }} 
                                />
                              </div>
                            </div>
                            <span className={`text-sm font-semibold ${getScoreColor(patient.score).replace('bg-', 'text-')}`}>
                              {patient.score}/100
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-700">
                              {new Date(patient.lastSensorSync).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-slate-500">
                              {patient.lastActive}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{patient.avgStrainScore}</span>
                            <span className={`text-xs ${getComplianceColor(patient.compliance)}`}>
                              {patient.compliance}% compliance
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                            {statusConfig.icon}
                            {patient.status === 'high-risk' ? 'High Risk' : 
                             patient.status === 'caution' ? 'Caution' : 
                             patient.status === 'stable' ? 'Stable' : 'Offline'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <a 
                              href={`/clinician/${clinicianId}/patient/${patient.id}`}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors duration-200"
                            >
                              View
                            </a>
                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, filteredPatients.length)}</span> of{' '}
                <span className="font-medium">{filteredPatients.length}</span> patients
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === page 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-semibold text-slate-700">Score Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-sm text-slate-600">High Risk (70-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-600">Caution (40-69)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-600">Stable (0-39)</span>
            </div>
          </div>
        </div>

        {/* Register Patient Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Register New Patient</h2>
                  <p className="text-slate-600 text-sm mt-1">Fill in the patient details below</p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRegistrationMessage('');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {registrationMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                  registrationMessage.includes('Error') 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {registrationMessage}
                </div>
              )}

              <form onSubmit={handleRegisterPatient} className="space-y-5">
                {/* Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                {/* Password & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="45"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* OA Diagnosis & Affected Knee */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">OA Diagnosis</label>
                    <select
                      name="oaDiagnosis"
                      value={formData.oaDiagnosis}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Affected Knee</label>
                    <select
                      name="affectedKnee"
                      value={formData.affectedKnee}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                    >
                      <option value="">Select Knee</option>
                      <option value="Left">Left</option>
                      <option value="Right">Right</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                {/* Pain Severity & Occupation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pain Severity (1-10)</label>
                    <input
                      type="number"
                      name="painSeverity"
                      value={formData.painSeverity}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="e.g., Engineer"
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Activity Level</label>
                  <select
                    name="activityLevel"
                    value={formData.activityLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                  >
                    <option value="">Select Activity Level</option>
                    <option value="Sedentary">Sedentary</option>
                    <option value="Light">Light</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-5 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setRegistrationMessage('');
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Register Patient
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}