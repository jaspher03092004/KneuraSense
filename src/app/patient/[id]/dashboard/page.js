import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default async function PatientDashboard({ params }) {
  const { id } = await params;

  let patient = null;
  let error = null;

  try {
    // Fetch patient data server-side
    patient = await prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        age: true,
        gender: true,
        email: true,
        phoneNumber: true,
        oaDiagnosis: true,
        affectedKnee: true,
        painSeverity: true,
        occupation: true,
        activityLevel: true,
        createdAt: true,
      },
    });

    if (!patient) {
      error = 'Patient not found';
    }
  } catch (err) {
    console.error('Error fetching patient data:', err);
    error = 'Failed to fetch patient data';
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

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p className="text-gray-600">No patient data found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Knee Stress Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring of your knee health and overuse risk</p>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Full Name</p>
              <p className="text-lg font-semibold text-gray-800">{patient.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Email</p>
              <p className="text-lg font-semibold text-gray-800">{patient.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Age</p>
              <p className="text-lg font-semibold text-gray-800">{patient.age} years</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Gender</p>
              <p className="text-lg font-semibold text-gray-800">{patient.gender}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Phone Number</p>
              <p className="text-lg font-semibold text-gray-800">{patient.phoneNumber}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Affected Knee</p>
              <p className="text-lg font-semibold text-gray-800">{patient.affectedKnee}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pain Severity</p>
              <p className="text-lg font-semibold text-gray-800">{patient.painSeverity}/10</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">OA Diagnosis</p>
              <p className="text-lg font-semibold text-gray-800">{patient.oaDiagnosis ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Occupation</p>
              <p className="text-lg font-semibold text-gray-800">{patient.occupation}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Activity Level</p>
              <p className="text-lg font-semibold text-gray-800">{patient.activityLevel}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Member Since</p>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(patient.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Real-time Sensor Data</h3>
            <p className="text-gray-600">Live readings from your KneuraSense wearable</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Health Analytics</h3>
            <p className="text-gray-600">Comprehensive analysis of your knee health trends</p>
          </div>
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
