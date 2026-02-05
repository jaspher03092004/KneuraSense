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

export default function InterventionsPage() {
  const params = useParams();
  const { id } = params;
  
  // Static patient data
  const patientData = {
    name: "Juan Dela Cruz",
    initials: "JC",
    patientId: "KN-2024-001",
    age: 62,
    status: "Caution",
    lastAlert: "2 hours ago"
  };
  
  // Static template data
  const templates = [
    { id: 1, icon: "🛌", title: "Rest & Recovery", description: "Advise reduced activity", selected: false },
    { id: 2, icon: "🪜", title: "Stair Limitation", description: "Limit stair climbing", selected: false },
    { id: 3, icon: "⚡", title: "Load Management", description: "Reduce carrying loads", selected: false },
    { id: 4, icon: "🌤️", title: "Weather Awareness", description: "Adjust for conditions", selected: true }
  ];
  
  // Static recommendation priority levels
  const priorities = [
    { level: "Low", icon: "ℹ️", description: "General advice", selected: false },
    { level: "Medium", icon: "⚠️", description: "Important notice", selected: true },
    { level: "High", icon: "🚨", description: "Urgent action", selected: false }
  ];
  
  // Static threshold data
  const thresholdData = {
    current: 68,
    base: 50,
    terrain: 8,
    weather: 10,
    terrainSensitivity: "1.6x",
    weatherSensitivity: "2.0x",
    stage: "Stage 2"
  };
  
  // State for form
  const [recommendation, setRecommendation] = useState(`Based on your recent data showing increased stress during afternoon activities, I recommend:

• Limit stair climbing to one flight at a time, using handrails for support
• Avoid carrying loads heavier than 5kg for the next 48 hours
• Take 10-minute seated breaks every hour during extended walking

The current hot & humid weather conditions are increasing your knee stress threshold by 15%. Please adjust your activities accordingly.`);
  
  const [characterCount, setCharacterCount] = useState(458);
  const [baseThreshold, setBaseThreshold] = useState(50);
  const [terrainSensitivity, setTerrainSensitivity] = useState(1.6);
  const [weatherSensitivity, setWeatherSensitivity] = useState(2.0);
  const [kneeStage, setKneeStage] = useState(2);

  // Handle recommendation text change
  const handleRecommendationChange = (e) => {
    const text = e.target.value;
    setRecommendation(text);
    setCharacterCount(text.length);
  };

  // Handle template selection
  const handleTemplateSelect = (id) => {
    console.log(`Template ${id} selected`);
  };

  // Handle priority selection
  const handlePrioritySelect = (level) => {
    console.log(`Priority ${level} selected`);
  };

  // Handle save actions
  const handleSaveDraft = () => {
    console.log("Saving as draft...");
    alert("Recommendation saved as draft!");
  };

  const handleSendRecommendation = () => {
    console.log("Sending recommendation...");
    alert("Recommendation sent to patient!");
  };

  const handleSaveThresholds = () => {
    console.log("Saving thresholds...");
    alert("Threshold configuration saved!");
  };

  const handleResetThresholds = () => {
    setBaseThreshold(50);
    setTerrainSensitivity(1.6);
    setWeatherSensitivity(2.0);
    setKneeStage(2);
    alert("Thresholds reset to defaults!");
  };

  // Calculate slider position percentage
  const calculateSliderPosition = (value, min = 0, max = 100) => {
    return ((value - min) / (max - min)) * 100;
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <Breadcrumb items={['Interventions', 'Patient Interventions']} />
      
      {/* Header Section */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-700">Intervention Editor</h1>
          <p className="text-gray-400 text-sm mt-1">Create personalized recommendations and adjust risk thresholds</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center gap-2 hover:bg-cyan-50 transition-colors">
            <span className="text-cyan-800 text-base">←</span>
            <span className="text-cyan-800 text-sm font-bold">Back to Patient</span>
          </button>
          <button className="px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center gap-2 hover:bg-cyan-50 transition-colors">
            <span className="text-cyan-800 text-base">📊</span>
            <span className="text-cyan-800 text-sm font-bold">View History</span>
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
                <span className="text-slate-700 text-sm font-bold">{patientData.patientId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm font-bold">Age:</span>
                <span className="text-slate-700 text-sm font-bold">{patientData.age}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm font-bold">Status:</span>
                <div className="px-4 py-1.5 bg-orange-400/10 rounded-full">
                  <span className="text-orange-400 text-sm font-bold">{patientData.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm font-bold">Last Alert:</span>
                <span className="text-orange-400 font-bold">{patientData.lastAlert}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Personalized Recommendation */}
        <div className="lg:w-2/3 bg-white rounded-2xl shadow-md border border-indigo-50 p-8">
          {/* Recommendation Header */}
          <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-indigo-50">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-2xl flex items-center justify-center">
              <span className="text-cyan-800 text-2xl">💬</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-700">Personalized Recommendation</h3>
              <p className="text-gray-400 text-sm">Create activity advice tailored to this patient</p>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-base font-bold text-slate-700">Quick Templates</h4>
              <button className="px-3 py-1 bg-white rounded-lg border-2 border-cyan-800 text-cyan-800 text-xs font-bold hover:bg-cyan-50">
                Clear
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-xl border-2 ${template.selected ? 'bg-cyan-800/5 border-cyan-800' : 'bg-white border-indigo-50'} cursor-pointer hover:border-cyan-800 transition-colors`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-800/10 rounded-lg flex items-center justify-center">
                      <span className="text-cyan-800 text-base">{template.icon}</span>
                    </div>
                    <div>
                      <h5 className="text-slate-700 font-bold mb-1">{template.title}</h5>
                      <p className="text-gray-400 text-xs">{template.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation Text Editor */}
          <div className="mb-6">
            <label className="block text-slate-700 text-sm font-bold mb-2">
              Recommendation Text:
            </label>
            
            {/* Toolbar */}
            <div className="bg-gray-50 rounded-t-lg border-t-2 border-l-2 border-r-2 border-indigo-50 p-2.5 flex items-center gap-2">
              <button className="w-9 h-9 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100">
                <span className="text-slate-700 text-sm">B</span>
              </button>
              <button className="w-9 h-9 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100">
                <span className="text-slate-700 text-sm">I</span>
              </button>
              <button className="w-9 h-9 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100">
                <span className="text-slate-700 text-sm">U</span>
              </button>
              <div className="flex-1"></div>
              <button className="w-9 h-9 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100">
                <span className="text-slate-700 text-sm">✓</span>
              </button>
            </div>
            
            {/* Text Area */}
            <textarea
              className="w-full h-48 p-6 bg-white rounded-b-lg border-2 border-indigo-50 focus:outline-none focus:border-cyan-800 transition-colors"
              value={recommendation}
              onChange={handleRecommendationChange}
              placeholder="Enter your recommendation here..."
            />
            
            <div className="text-right mt-2">
              <span className="text-gray-400 text-xs">
                {characterCount} characters (recommended: 100-500)
              </span>
            </div>
          </div>

          {/* Recommendation Priority */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-orange-400 text-lg">⚠️</span>
              <h4 className="text-lg font-bold text-slate-700">Recommendation Priority</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {priorities.map((priority) => (
                <div
                  key={priority.level}
                  className={`p-4 rounded-xl border-2 ${priority.selected ? 'bg-cyan-800/5 border-cyan-800' : 'bg-white border-indigo-50'} cursor-pointer hover:border-cyan-800 transition-colors`}
                  onClick={() => handlePrioritySelect(priority.level)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
                      <span className="text-xl">
                        {priority.level === 'Low' ? 'ℹ️' : priority.level === 'Medium' ? '⚠️' : '🚨'}
                      </span>
                    </div>
                    <h5 className="text-slate-700 font-bold mb-1">{priority.level}</h5>
                    <p className="text-gray-400 text-xs">{priority.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              className="flex-1 px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center justify-center gap-2 hover:bg-cyan-50 transition-colors"
              onClick={handleSaveDraft}
            >
              <span className="text-cyan-800">💾</span>
              <span className="text-cyan-800 text-sm font-bold">Save as Draft</span>
            </button>
            <button
              className="flex-1 px-6 py-3.5 bg-gradient-to-b from-cyan-800 to-teal-600 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              onClick={handleSendRecommendation}
            >
              <span className="text-white">✓</span>
              <span className="text-white text-sm font-bold">Send Recommendation</span>
            </button>
          </div>
        </div>

        {/* Right Column - Threshold Configuration */}
        <div className="lg:w-1/3 bg-white rounded-2xl shadow-md border border-indigo-50 p-8">
          {/* Threshold Header */}
          <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-indigo-50">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-2xl flex items-center justify-center">
              <span className="text-cyan-800 text-2xl">⚙️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-slate-700">Threshold Configuration</h3>
                <span className="px-2.5 py-1 bg-fuchsia-700 text-white text-xs font-bold rounded-full">
                  ADMIN
                </span>
              </div>
              <p className="text-gray-400 text-sm">Adjust risk thresholds</p>
            </div>
          </div>

          {/* Current Risk Threshold */}
          <div className="bg-gradient-to-br from-cyan-800/5 to-teal-600/5 rounded-2xl p-6 mb-8">
            <div className="text-center mb-4">
              <div className="text-cyan-800 text-4xl font-bold">{thresholdData.current}</div>
              <p className="text-gray-400 text-sm font-bold">Current Risk Threshold</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-indigo-50 p-4 text-center">
                <div className="text-slate-700 font-bold text-lg">{thresholdData.base}</div>
                <p className="text-gray-400 text-xs">Base</p>
              </div>
              <div className="bg-white rounded-lg border border-indigo-50 p-4 text-center">
                <div className="text-slate-700 font-bold text-lg">+{thresholdData.terrain}</div>
                <p className="text-gray-400 text-xs">Terrain</p>
              </div>
              <div className="bg-white rounded-lg border border-indigo-50 p-4 text-center">
                <div className="text-slate-700 font-bold text-lg">+{thresholdData.weather}</div>
                <p className="text-gray-400 text-xs">Weather</p>
              </div>
            </div>
          </div>

          {/* Base Risk Threshold Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-slate-700 font-bold">Base Risk Threshold</h4>
              <span className="text-cyan-800 font-bold">{baseThreshold}</span>
            </div>
            
            <div className="relative h-8">
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-50 rounded"></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-b from-cyan-800 to-teal-600 rounded"
                style={{ width: `${calculateSliderPosition(baseThreshold)}%` }}
              ></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-xl shadow-md border-3 border-cyan-800 cursor-pointer"
                style={{ left: `${calculateSliderPosition(baseThreshold)}%`, marginLeft: '-12px' }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-2">
              <span className="text-gray-400 text-xs">Low</span>
              <span className="text-gray-400 text-xs">Medium</span>
              <span className="text-gray-400 text-xs">High</span>
            </div>
          </div>

          {/* Terrain Sensitivity Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-slate-700 font-bold">Terrain Sensitivity</h4>
              <span className="text-cyan-800 font-bold">{terrainSensitivity}x</span>
            </div>
            
            <div className="relative h-8">
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-50 rounded"></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-b from-cyan-800 to-teal-600 rounded"
                style={{ width: `${(terrainSensitivity / 3) * 100}%` }}
              ></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-xl shadow-md border-3 border-cyan-800 cursor-pointer"
                style={{ left: `${(terrainSensitivity / 3) * 100}%`, marginLeft: '-12px' }}
              ></div>
            </div>
          </div>

          {/* Weather Sensitivity Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-slate-700 font-bold">Weather Sensitivity</h4>
              <span className="text-cyan-800 font-bold">{weatherSensitivity}x</span>
            </div>
            
            <div className="relative h-8">
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-50 rounded"></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-b from-cyan-800 to-teal-600 rounded"
                style={{ width: `${(weatherSensitivity / 3) * 100}%` }}
              ></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-xl shadow-md border-3 border-cyan-800 cursor-pointer"
                style={{ left: `${(weatherSensitivity / 3) * 100}%`, marginLeft: '-12px' }}
              ></div>
            </div>
          </div>

          {/* Knee Osteoarthritis Stage Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-slate-700 font-bold">Stages of Knee Osteoarthritis</h4>
              <span className="text-cyan-800 font-bold">Stage {kneeStage}</span>
            </div>
            
            <div className="relative h-8">
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-50 rounded"></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-xl shadow-md border-3 border-cyan-800 cursor-pointer"
                style={{ left: `${(kneeStage / 4) * 100}%`, marginLeft: '-12px' }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-2">
              <span className="text-gray-400 text-xs">Stage 0</span>
              <span className="text-gray-400 text-xs">Stage 1</span>
              <span className="text-gray-400 text-xs">Stage 2</span>
              <span className="text-gray-400 text-xs">Stage 3</span>
              <span className="text-gray-400 text-xs">Stage 4</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              className="flex-1 px-6 py-3 bg-white rounded-xl border-2 border-red-500 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              onClick={handleResetThresholds}
            >
              <span className="text-red-500">↻</span>
              <span className="text-red-500 text-sm font-bold">Reset</span>
            </button>
            <button
              className="flex-1 px-6 py-3.5 bg-gradient-to-b from-cyan-800 to-teal-600 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              onClick={handleSaveThresholds}
            >
              <span className="text-white">💾</span>
              <span className="text-white text-sm font-bold">Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-6 bg-white rounded-2xl shadow-md border border-indigo-50 p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-cyan-800 text-lg">👁️</span>
          <h3 className="text-lg font-bold text-slate-700">Preview: How Patient Will See This</h3>
        </div>
        
        <div className="bg-gradient-to-b from-cyan-800/5 to-teal-600/5 rounded-2xl border border-indigo-50 p-8">
          {/* Preview Header */}
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-indigo-50">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-800 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">{patientData.initials}</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-700">Activity Recommendation</h4>
              <p className="text-gray-400 text-sm">From Dr. Maria Santos • Just now</p>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="mb-6">
            <p className="text-slate-700">
              Based on your recent data showing increased stress during afternoon activities, I recommend:
              <br />• Limit stair climbing to one flight at a time...
            </p>
          </div>
          
          {/* Preview Footer */}
          <div className="pt-6 border-t border-indigo-50 flex justify-between items-center">
            <div>
              <span className="text-gray-400 text-sm">Valid until: </span>
              <span className="text-gray-400 text-sm font-bold">Nov 23, 2024</span>
            </div>
            <div className="px-3 py-1.5 bg-orange-400/10 rounded-full">
              <span className="text-orange-400 text-sm font-bold">Medium Priority</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center text-gray-400 text-sm">
        <p>KneuraSense Intervention Editor - Creating personalized recommendations based on biomechanical data analysis</p>
      </div>
    </div>
  );
}