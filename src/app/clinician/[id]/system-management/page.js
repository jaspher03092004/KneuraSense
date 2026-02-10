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

export default function SystemManagementPage() {
  const params = useParams();
  const { id } = params;
  
  // Static system metrics
  const systemMetrics = [
    { icon: "💻", title: "Connected Devices", value: "24", status: "All Online", statusColor: "green" },
    { icon: "🧠", title: "AI Model Version", value: "v2.1", status: "Active", statusColor: "green" },
    { icon: "📈", title: "System Uptime", value: "99.7%", status: "Stable", statusColor: "green" },
    { icon: "💾", title: "Data Processed", value: "4.2TB", status: "Normal", statusColor: "green" }
  ];
  
  // Static AI Model data
  const aiModelData = {
    version: "kneurasense-model-v2.1",
    framework: "TensorFlow Lite Micro",
    deployed: "Nov 15, 2024",
    size: "1.2 MB",
    accuracy: "94.2%",
    falsePositiveRate: "2.1%"
  };
  
  // Static connected devices
  const connectedDevices = [
    { id: "KN-2024-001", patient: "Juan Dela Cruz", version: "v2.1", status: "Online", lastSeen: "5 min ago" },
    { id: "KN-2024-002", patient: "Maria Santos", version: "v2.1", status: "Online", lastSeen: "2 min ago" },
    { id: "KN-2024-003", patient: "Pedro Cruz", version: "v2.0", status: "Online", lastSeen: "10 min ago" }
  ];
  
  // Static context configuration
  const contextFactors = [
    { 
      factor: "Temperature", 
      description: "Ambient temperature effect", 
      weight: "0.85", 
      unit: "per 5°C", 
      defaultValue: "0.85", 
      impact: "Medium",
      impactColor: "orange"
    },
    { 
      factor: "Humidity", 
      description: "Relative humidity impact", 
      weight: "1.15", 
      unit: "per 20%", 
      defaultValue: "1.15", 
      impact: "High",
      impactColor: "red"
    }
  ];
  
  // State for file upload
  const [isDragging, setIsDragging] = useState(false);
  
  // State for context configuration tabs
  const [activeTab, setActiveTab] = useState('weather');
  
  // State for weight values
  const [tempWeight, setTempWeight] = useState("0.85");
  const [humidityWeight, setHumidityWeight] = useState("1.15");
  
  // Handle file drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };
  
  const handleFileUpload = (file) => {
    console.log("File selected:", file.name);
    alert(`Model file "${file.name}" uploaded successfully!`);
  };
  
  const handleBrowseFiles = () => {
    // Simulate file input click
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.tflite,.bin';
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    };
    fileInput.click();
  };
  
  // Handle button actions
  const handleRefresh = () => {
    console.log("Refreshing system data...");
    alert("System data refreshed!");
  };
  
  const handleRunDiagnostics = () => {
    console.log("Running system diagnostics...");
    alert("Diagnostics complete! All systems are functioning normally.");
  };
  
  const handleViewPerformance = () => {
    console.log("Viewing AI model performance...");
    alert("Opening performance dashboard...");
  };
  
  const handleExportModel = () => {
    console.log("Exporting AI model...");
    alert("AI model exported successfully!");
  };
  
  const handleRollback = () => {
    console.log("Rolling back to v2.0...");
    alert("Rollback initiated! The system will deploy v2.0 to all devices.");
  };
  
  const handleValidateModel = () => {
    console.log("Validating model...");
    alert("Model validation complete! No issues detected.");
  };
  
  const handleDeployToDevices = () => {
    console.log("Deploying to devices...");
    alert("Deployment initiated! The new model will be deployed to all connected devices.");
  };
  
  const handleCheckUpdates = () => {
    console.log("Checking for firmware updates...");
    alert("Checking for updates... You have the latest firmware version.");
  };
  
  const handleUpdateAllDevices = () => {
    console.log("Updating all devices...");
    alert("Firmware update initiated for all connected devices.");
  };
  
  const handleForceRestart = () => {
    console.log("Force restarting devices...");
    alert("Devices will restart. This may take a few moments.");
  };
  
  const handleResetFactor = (factor) => {
    if (factor === "Temperature") {
      setTempWeight("0.85");
    } else if (factor === "Humidity") {
      setHumidityWeight("1.15");
    }
    alert(`${factor} weight reset to default.`);
  };
  
  const handleResetAll = () => {
    setTempWeight("0.85");
    setHumidityWeight("1.15");
    alert("All configuration values reset to defaults.");
  };
  
  const handleSaveConfiguration = () => {
    console.log("Saving configuration...");
    alert("Configuration saved successfully!");
  };
  
  // Tabs for context configuration
  const tabs = [
    { id: 'weather', label: 'Weather Factors' },
    { id: 'terrain', label: 'Terrain Factors' },
    { id: 'physiological', label: 'Physiological Factors' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <Breadcrumb items={['System Management', 'Administration']} />
      
      {/* Header Section */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-700">System Management</h1>
            <span className="px-2 py-1 bg-fuchsia-700 text-white text-xs font-bold rounded-lg">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Manage Edge AI models, firmware updates, and system configuration
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            className="px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center gap-2 hover:bg-cyan-50 transition-colors"
            onClick={handleRefresh}
          >
            <span className="text-cyan-800">🔄</span>
            <span className="text-cyan-800 text-sm font-bold">Refresh</span>
          </button>
          <button 
            className="px-6 py-3.5 bg-gradient-to-b from-cyan-800 to-teal-600 rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
            onClick={handleRunDiagnostics}
          >
            <span className="text-white">📊</span>
            <span className="text-white font-bold">Run Diagnostics</span>
          </button>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {systemMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-md border border-indigo-50 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-cyan-800 text-2xl">{metric.icon}</span>
            </div>
            <div className="text-slate-700 text-3xl font-bold mb-2">{metric.value}</div>
            <p className="text-gray-400 text-sm font-bold mb-3">{metric.title}</p>
            <div className="px-2.5 py-1 bg-green-500/10 rounded-lg inline-flex items-center gap-1">
              <span className="text-green-500 text-sm">●</span>
              <span className="text-green-500 text-sm font-bold">{metric.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edge AI Model Status Section */}
      <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-8 mb-6">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-indigo-50">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-2xl flex items-center justify-center">
            <span className="text-cyan-800 text-2xl">🧠</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-700">Edge AI Model Status</h3>
            <p className="text-gray-400 text-sm">Current model performance and deployment information</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Model Details */}
          <div className="lg:w-2/3 bg-gray-50 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-gray-400 text-sm font-bold mb-1">Model Version</p>
                <p className="text-slate-700 font-bold">{aiModelData.version}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-bold mb-1">Framework</p>
                <p className="text-slate-700 font-bold">{aiModelData.framework}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-bold mb-1">Deployed On</p>
                <p className="text-slate-700 font-bold">{aiModelData.deployed}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-bold mb-1">Model Size</p>
                <p className="text-slate-700 font-bold">{aiModelData.size}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-indigo-50">
                <span className="text-slate-700">Overall Accuracy</span>
                <span className="text-green-500 font-bold">{aiModelData.accuracy}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-700">False Positive Rate</span>
                <span className="text-green-500 font-bold">{aiModelData.falsePositiveRate}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="lg:w-1/3 space-y-4">
            <button 
              className="w-full px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center justify-center gap-2 hover:bg-cyan-50 transition-colors"
              onClick={handleViewPerformance}
            >
              <span className="text-cyan-800">📈</span>
              <span className="text-cyan-800 text-sm font-bold">View Performance</span>
            </button>
            <button 
              className="w-full px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center justify-center gap-2 hover:bg-cyan-50 transition-colors"
              onClick={handleExportModel}
            >
              <span className="text-cyan-800">📥</span>
              <span className="text-cyan-800 text-sm font-bold">Export Model</span>
            </button>
            <button 
              className="w-full px-6 py-3 bg-white rounded-xl border-2 border-red-500 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              onClick={handleRollback}
            >
              <span className="text-red-500">↩️</span>
              <span className="text-red-500 text-sm font-bold">Rollback to v2.0</span>
            </button>
          </div>
        </div>
      </div>

      {/* Model Upload & Deployment Section */}
      <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-8 mb-6">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-indigo-50">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-2xl flex items-center justify-center">
            <span className="text-cyan-800 text-2xl">📤</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-700">Model Upload & Deployment</h3>
            <p className="text-gray-400 text-sm">Upload new compressed model files for deployment</p>
          </div>
        </div>
        
        {/* File Upload Area */}
        <div 
          className={`mb-8 p-12 rounded-2xl border-2 ${isDragging ? 'border-cyan-800 bg-cyan-50' : 'border-indigo-50 bg-gray-50'} transition-colors`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-cyan-800 text-3xl">📁</span>
            </div>
            <h4 className="text-lg font-bold text-slate-700 mb-2">Upload New Model</h4>
            <p className="text-slate-700 text-sm mb-6">
              Drag & drop your .tflite model file here or click to browse
            </p>
            <button 
              className="px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center gap-2 hover:bg-cyan-50 transition-colors"
              onClick={handleBrowseFiles}
            >
              <span className="text-cyan-800">📂</span>
              <span className="text-cyan-800 font-bold">Browse Files</span>
            </button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            className="flex-1 px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center justify-center gap-2 hover:bg-cyan-50 transition-colors"
            onClick={handleValidateModel}
          >
            <span className="text-cyan-800">✓</span>
            <span className="text-cyan-800 text-sm font-bold">Validate Model</span>
          </button>
          <button 
            className="flex-1 px-6 py-3.5 bg-gradient-to-b from-cyan-800 to-teal-600 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            onClick={handleDeployToDevices}
          >
            <span className="text-white">📤</span>
            <span className="text-white text-sm font-bold">Deploy to Devices</span>
          </button>
        </div>
      </div>

      {/* Context Configuration Section */}
      <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-8 mb-6">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-indigo-50">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-2xl flex items-center justify-center">
            <span className="text-cyan-800 text-2xl">⚙️</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-700">Context Configuration</h3>
            <p className="text-gray-400 text-sm">Configure default weighting values for environmental factors</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b-2 border-indigo-50 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-6 py-3 ${activeTab === tab.id ? 'border-b-3 border-cyan-800 text-cyan-800' : 'text-gray-400'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="text-sm font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Configuration Table */}
        <div className="rounded-lg overflow-hidden border border-indigo-50">
          {/* Table Header */}
          <div className="bg-gradient-to-b from-cyan-800/5 to-teal-600/5 grid grid-cols-6">
            <div className="p-4">
              <span className="text-slate-700 text-sm font-bold uppercase">Factor</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 text-sm font-bold uppercase">Description</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 text-sm font-bold uppercase">Weight</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 text-sm font-bold uppercase">Default Value</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 text-sm font-bold uppercase">Impact</span>
            </div>
            <div className="p-4">
              <span className="text-slate-700 text-sm font-bold uppercase">Actions</span>
            </div>
          </div>
          
          {/* Table Rows */}
          {contextFactors.map((factor, index) => (
            <div key={index} className="grid grid-cols-6 border-b border-indigo-50 hover:bg-gray-50">
              <div className="p-4">
                <span className="text-slate-700 text-sm font-bold">{factor.factor}</span>
              </div>
              <div className="p-4">
                <span className="text-slate-700 text-sm">{factor.description}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-20 px-3 py-2 bg-white rounded-lg border border-indigo-50">
                    <span className="text-slate-700">
                      {factor.factor === "Temperature" ? tempWeight : humidityWeight}
                    </span>
                  </div>
                  <span className="text-slate-700 text-sm">{factor.unit}</span>
                </div>
              </div>
              <div className="p-4">
                <span className="text-slate-700 text-sm">{factor.defaultValue}</span>
              </div>
              <div className="p-4">
                <div className={`px-3 py-1.5 ${factor.impactColor === 'red' ? 'bg-red-500/10' : 'bg-orange-400/10'} rounded-full inline-flex`}>
                  <span className={`text-sm font-bold ${factor.impactColor === 'red' ? 'text-red-500' : 'text-orange-400'}`}>
                    {factor.impact}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <button 
                  className="px-3 py-1.5 bg-white rounded-xl border-2 border-cyan-800 flex items-center gap-2 hover:bg-cyan-50 transition-colors"
                  onClick={() => handleResetFactor(factor.factor)}
                >
                  <span className="text-cyan-800 text-sm">↻</span>
                  <span className="text-cyan-800 text-sm font-bold">Reset</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button 
            className="flex-1 px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center justify-center gap-2 hover:bg-cyan-50 transition-colors"
            onClick={handleResetAll}
          >
            <span className="text-cyan-800">↻</span>
            <span className="text-cyan-800 text-sm font-bold">Reset All</span>
          </button>
          <button 
            className="flex-1 px-6 py-3.5 bg-gradient-to-b from-cyan-800 to-teal-600 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            onClick={handleSaveConfiguration}
          >
            <span className="text-white">💾</span>
            <span className="text-white text-sm font-bold">Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Firmware Management Section */}
      <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-8">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-indigo-50">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-800/10 to-teal-600/10 rounded-2xl flex items-center justify-center">
            <span className="text-cyan-800 text-2xl">💻</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-700">Firmware Management</h3>
            <p className="text-gray-400 text-sm">Update ESP32 device firmware</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Connected Devices */}
          <div className="lg:w-1/2 bg-gray-50 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-slate-700 mb-4">Connected Devices (24)</h4>
            <div className="space-y-4">
              {connectedDevices.map((device, index) => (
                <div key={index} className="p-4 bg-white rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-800/10 rounded-lg"></div>
                    <div>
                      <p className="text-slate-700 text-sm font-bold">{device.id}</p>
                      <p className="text-gray-400 text-xs">{device.patient} • {device.version}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="px-2.5 py-1 bg-green-500/10 rounded-lg inline-flex items-center gap-1 mb-1">
                      <span className="text-green-500 text-sm">●</span>
                      <span className="text-green-500 text-sm font-bold">{device.status}</span>
                    </div>
                    <p className="text-gray-400 text-xs">Last seen: {device.lastSeen}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Firmware Actions */}
          <div className="lg:w-1/2 space-y-6">
            <div>
              <p className="text-gray-400 text-sm font-bold mb-1">Current Firmware</p>
              <p className="text-slate-700 font-bold">kneurasense-firmware-v2.1</p>
            </div>
            
            <div className="space-y-4">
              <button 
                className="w-full px-6 py-3 bg-white rounded-xl border-2 border-cyan-800 flex items-center justify-center gap-2 hover:bg-cyan-50 transition-colors"
                onClick={handleCheckUpdates}
              >
                <span className="text-cyan-800">🔄</span>
                <span className="text-cyan-800 text-sm font-bold">Check for Updates</span>
              </button>
              <button 
                className="w-full px-6 py-3 bg-white rounded-xl border-2 border-orange-400 flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
                onClick={handleUpdateAllDevices}
              >
                <span className="text-orange-400">⚡</span>
                <span className="text-orange-400 text-sm font-bold">Update All Devices</span>
              </button>
              <button 
                className="w-full px-6 py-3 bg-white rounded-xl border-2 border-red-500 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                onClick={handleForceRestart}
              >
                <span className="text-red-500">🔌</span>
                <span className="text-red-500 text-sm font-bold">Force Restart Devices</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center text-gray-400 text-sm">
        <p>KneuraSense System Management - Admin access only. System ID: {id}</p>
      </div>
    </div>
  );
}