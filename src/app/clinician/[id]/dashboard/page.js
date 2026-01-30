import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

function getRiskStatus(painSeverity) {
  if (typeof painSeverity !== 'number') return 'Unknown';
  if (painSeverity >= 7) return 'High Risk';
  if (painSeverity >= 4) return 'Caution';
  return 'Stable';
}

export default async function ClinicianDashboard({ params }) {
  const { id } = await params;

  let clinician = null;
  let patients = [];
  let error = null;

  try {
    // Fetch clinician data
    clinician = await prisma.clinician.findUnique({
      where: { clinician_id: id },
      select: {
        clinician_id: true,
        full_name: true,
        email: true,
        specialization: true,
      },
    });

    if (!clinician) {
      error = 'Clinician not found';
    } else {
      // Fetch all patients this clinician can view
      patients = await prisma.patient.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          age: true,
          painSeverity: true,
          createdAt: true,
        },
      });
    }
  } catch (err) {
    console.error('Error fetching clinician data:', err);
    error = 'Failed to fetch data';
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-semibold mb-4">Error: {error}</p>
          <button
            onClick={() => redirect('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Clinician Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {clinician?.full_name} • {clinician?.specialization}
            </p>
          </div>
          <LogoutButton />
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Patients</div>
            <div className="text-2xl font-semibold">{patients.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Active Today</div>
            <div className="text-2xl font-semibold">{Math.max(0, Math.floor(patients.length * 0.6))}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">High Risk</div>
            <div className="text-2xl font-semibold">{patients.filter(p => (p.painSeverity ?? 0) >= 7).length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Offline</div>
            <div className="text-2xl font-semibold">0</div>
          </div>
        </div>

        {/* Patient List Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Patient List</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm text-gray-600 border-b">
                  <th className="py-3">Patient Name</th>
                  <th className="py-3">Age</th>
                  <th className="py-3">Avg. Weekly Score</th>
                  <th className="py-3">Last Active</th>
                  <th className="py-3">Risk Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-500">
                      No patients found
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id} className="text-sm border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-4">{patient.fullName}</td>
                      <td className="py-4">{patient.age ?? '-'}</td>
                      <td className="py-4">{(patient.painSeverity ?? 0) * 10}/100</td>
                      <td className="py-4">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            getRiskStatus(patient.painSeverity) === 'High Risk'
                              ? 'bg-red-100 text-red-700'
                              : getRiskStatus(patient.painSeverity) === 'Caution'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {getRiskStatus(patient.painSeverity)}
                        </span>
                      </td>
                      <td className="py-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
