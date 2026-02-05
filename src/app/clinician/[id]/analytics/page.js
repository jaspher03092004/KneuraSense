'use client';

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

export default function AnalyticsPage() {
  const params = useParams();
  const { id } = params;

  // Static patient data
  const patientData = {
    name: "Juan Dela Cruz",
    initials: "JC",
    id: "KN-2024-001",
    age: 62,
    diagnosis: "Knee OA (G2)",
    history: "History of mild to moderate pain during stair climbing.",
    status: "Caution Status",
    avgRisk: "68/100"
  };

  // Static analysis period data
  const periods = ["Last 24 Hours", "Last 7 Days", "Last 30 Days"];
  const activePeriod = "Last 24 Hours";

  // Static context log data
  const contextLogs = [
    { time: "14:30", riskScore: "55", maxScore: 100, terrain: "Stairs", weather: "Warm", temp: "33.2°C", alert: "No" },
    { time: "14:15", riskScore: "28", maxScore: 100, terrain: "Flat", weather: "Warm", temp: "32.8°C", alert: "No" },
    { time: "14:00", riskScore: "78", maxScore: 100, terrain: "Incline", weather: "Hot", temp: "33.5°C", alert: "YES" },
  ];

  // Static chart data for visualization
  const generateChartPoints = () => {
    const points = [];
    for (let i = 0; i < 24; i++) {
      points.push({
        hour: i,
        risk: Math.floor(20 + Math.random() * 60),
        angle: Math.floor(30 + Math.random() * 40),
        force: Math.floor(200 + Math.random() * 400)
      });
    }
    return points;
  };

  const chartData = generateChartPoints();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Breadcrumb items={['Analytics', 'Patient Data Analysis']} />
      
      {/* Header Section */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-700">Patient Data Analysis</h1>
          <p className="text-gray-400 text-sm mt-1">Deep dive into patient biomechanics and risk patterns</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center gap-2 hover:bg-cyan-50 transition-colors">
            <span className="text-cyan-800 text-base">←</span>
            <span className="text-cyan-800 font-bold">Back to List</span>
          </button>
          <button className="px-6 py-3.5 bg-gradient-to-b from-cyan-800 to-teal-600 rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="text-white text-base">📊</span>
            <span className="text-white text-sm font-bold">Export Data</span>
          </button>
          <button className="px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center gap-2 hover:bg-cyan-50 transition-colors">
            <span className="text-cyan-800 text-base">💬</span>
            <span className="text-cyan-800 text-sm font-bold">Send Advice</span>
          </button>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-8 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-800 to-teal-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{patientData.initials}</span>
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-700 mb-2">{patientData.name}</h2>
            <div className="flex flex-wrap gap-6 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm font-bold">ID:</span>
                <span className="text-slate-700 text-sm font-bold">{patientData.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm font-bold">Age:</span>
                <span className="text-slate-700 text-sm font-bold">{patientData.age}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm font-bold">Diagnosis:</span>
                <span className="text-slate-700 font-bold">{patientData.diagnosis}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">{patientData.history}</p>
          </div>
          
          <div className="flex flex-col items-start gap-4">
            <div className="px-4 py-1.5 bg-orange-400/10 rounded-full">
              <span className="text-orange-400 text-sm font-bold">{patientData.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm font-bold">Avg. Risk:</span>
              <span className="text-orange-400 text-sm font-bold">{patientData.avgRisk}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Period */}
      <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-700 text-xl">📅</span>
            <h3 className="text-xl font-bold text-slate-700">Analysis Period</h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {periods.map((period) => (
              <button
                key={period}
                className={`px-5 py-2.5 rounded-lg border-2 ${
                  period === activePeriod
                    ? 'bg-gradient-to-b from-cyan-800 to-teal-600 text-white border-cyan-800'
                    : 'bg-white text-gray-400 border-indigo-50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Score Chart */}
      <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-slate-700 text-2xl">📈</span>
          <h3 className="text-2xl font-bold text-slate-700">Risk Score Over Time</h3>
        </div>
        
        <div className="bg-stone-50 rounded-xl border border-indigo-50 h-96 p-4">
          {/* Simple chart visualization */}
          <div className="relative h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-base font-bold mb-2">Risk Score Visualization</div>
                <div className="flex items-end justify-center h-48 gap-1 mt-4">
                  {chartData.map((point, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className={`w-6 rounded-t ${point.risk > 60 ? 'bg-red-400' : point.risk > 30 ? 'bg-orange-400' : 'bg-green-400'}`}
                        style={{ height: `${point.risk * 2}px` }}
                      />
                      <span className="text-xs text-gray-400 mt-1">{point.hour}:00</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span className="text-sm text-gray-600">Low Risk (0-30)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded"></div>
                    <span className="text-sm text-gray-600">Medium Risk (31-60)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded"></div>
                    <span className="text-sm text-gray-600">High Risk (61-100)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Knee Flexion Angle */}
        <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-xl flex items-center justify-center">
              <span className="text-cyan-800 text-xl">📐</span>
            </div>
            <h3 className="text-xl font-bold text-slate-700">Knee Flexion Angle</h3>
          </div>
          
          <div className="bg-stone-50 rounded-xl border border-indigo-50 h-72 p-4">
            <div className="relative h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-base font-bold mb-2">Angle Trend</div>
                  <div className="flex items-end justify-center h-32 gap-2 mt-4">
                    {chartData.slice(0, 12).map((point, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-4 bg-cyan-600 rounded-t"
                          style={{ height: `${point.angle}px` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-sm text-gray-600">
                    Average: <span className="font-bold">45°</span> | Max: <span className="font-bold">72°</span> | Min: <span className="font-bold">32°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compressive Force */}
        <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-xl flex items-center justify-center">
              <span className="text-cyan-800 text-xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-slate-700">Compressive Force</h3>
          </div>
          
          <div className="bg-stone-50 rounded-xl border border-indigo-50 h-72 p-4">
            <div className="relative h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-base font-bold mb-2">Force Distribution</div>
                  <div className="flex items-end justify-center h-32 gap-2 mt-4">
                    {chartData.slice(12, 24).map((point, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-4 bg-teal-600 rounded-t"
                          style={{ height: `${point.force / 20}px` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-sm text-gray-600">
                    Average: <span className="font-bold">350N</span> | Peak: <span className="font-bold">580N</span> | Baseline: <span className="font-bold">210N</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Log */}
      <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-slate-700 text-2xl">📋</span>
          <h3 className="text-2xl font-bold text-slate-700">Context Log</h3>
        </div>
        
        <div className="rounded-xl border border-indigo-50 overflow-hidden">
          <div className="grid grid-cols-6 bg-gradient-to-b from-cyan-800/5 to-teal-600/5 border-b-2 border-indigo-50">
            <div className="p-4">
              <span className="text-slate-700 font-bold">Time</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 font-bold">Risk Score</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 font-bold">Terrain</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 font-bold">Weather</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 font-bold">Temp</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 font-bold">Alert</span>
            </div>
          </div>
          
          {contextLogs.map((log, index) => (
            <div key={index} className="grid grid-cols-6 border-b border-indigo-50 hover:bg-gray-50">
              <div className="p-4">
                <span className="text-slate-700">{log.time}</span>
              </div>
              <div className="p-4">
                <span className={`text-sm font-bold ${parseInt(log.riskScore) > 60 ? 'text-red-500' : 'text-slate-700'}`}>
                  {log.riskScore}
                </span>
                <span className="text-slate-700 text-sm">/{log.maxScore}</span>
              </div>
              <div className="p-4">
                <span className="text-slate-700">{log.terrain}</span>
              </div>
              <div className="p-4">
                <span className="text-slate-700">{log.weather}</span>
              </div>
              <div className="p-4">
                <span className="text-slate-700 text-sm">{log.temp}</span>
              </div>
              <div className="p-4">
                <span className={`text-slate-700 ${log.alert === 'YES' ? 'font-bold text-red-500' : ''}`}>
                  {log.alert}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-6 p-4 bg-cyan-50 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-700 mb-1">Summary</h4>
              <p className="text-sm text-gray-600">
                Higher risk scores observed during incline activities in warmer temperatures.
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-bold">Clinician ID:</span> {id}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center text-gray-400 text-sm">
        <p>Data visualization powered by static mock data. Real-time sensor integration from ESP32 coming soon.</p>
      </div>
    </div>
  );
}