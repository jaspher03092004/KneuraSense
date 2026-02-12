'use client';

import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { 
  Activity, Thermometer, MoveDiagonal, 
  ArrowDown, ArrowUp, Battery, Wifi, 
  RefreshCw, Database, Bluetooth 
} from 'lucide-react';

// --- 1. Helper Components ---

const SensorCard = ({ icon: Icon, title, subTitle, value, unit, status }) => (
  <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between h-full min-h-[140px]">
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 bg-teal-700 rounded-lg text-white">
        <Icon size={20} />
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-xs text-gray-400">{subTitle}</p>
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-bold text-gray-800">
        {value}<span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>
      </h3>
      <div className="flex items-center mt-2">
        <span className={`text-xs font-bold px-2 py-1 rounded ${
            status === 'High Risk' ? 'bg-red-100 text-red-600' : 'text-gray-400'
        }`}>
          {status || 'Live'}
        </span>
      </div>
    </div>
  </div>
);

const StatusCard = ({ icon: Icon, title, value, subText, statusColor = "bg-teal-600" }) => (
  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
    <div className={`p-3 rounded-lg text-white ${statusColor} shrink-0`}>
      <Icon size={24} />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-bold text-gray-700">{title}</p>
      <div className="flex items-center gap-2">
         {/* Show Green Dot only if 'Online' */}
         {title === "Device Status" && <span className={`w-2 h-2 rounded-full shrink-0 ${value === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></span>}
         <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
      <p className="text-xs text-gray-400 truncate">{subText}</p>
    </div>
  </div>
);

// --- 2. Main Component ---

export default function SmartDashboard({ patientName, patientId }) {
  const [data, setData] = useState({
    angle: 0, fsr: 0, skin_temp: 0, bat: 0, risk_score: 0
  });
  
  // New States for Device Availability
  const [deviceStatus, setDeviceStatus] = useState("Offline"); 
  const [lastPacketTime, setLastPacketTime] = useState(0);

  const dataRef = useRef(data); 

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // --- EFFECT 1: MQTT CONNECTION ---
  useEffect(() => {
    const MQTT_HOST = 'd74c9cedfa0e44efa6fbbc6a42bef453.s1.eu.hivemq.cloud';
    const MQTT_PORT = 8884;
    const MQTT_USER = 'KneuraSense-esp32';
    const MQTT_PASS = 'Kneurasense123';
    const TOPIC = 'esp32/data'; 

    console.log("Initializing MQTT...");

    const client = mqtt.connect(`wss://${MQTT_HOST}:${MQTT_PORT}/mqtt`, {
      clientId: 'smart_web_' + Math.random().toString(16).substr(2, 8),
      username: MQTT_USER,
      password: MQTT_PASS,
      clean: true,
      reconnectPeriod: 2000,
    });

    client.on('connect', () => {
      if (!client.disconnecting) {
        console.log("MQTT Broker Connected");
        client.subscribe(TOPIC);
      }
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        setData(payload);
        
        // ✨ MAGIC FIX: We received data, so device MUST be Online
        setDeviceStatus("Online");
        setLastPacketTime(Date.now()); 
        
      } catch (err) {
        console.error("JSON Parse Error", err);
      }
    });

    return () => { if (client) client.end(); };
  }, []);

  // --- EFFECT 2: WATCHDOG TIMER (Checks if device died) ---
  useEffect(() => {
    const watchdog = setInterval(() => {
      // If no data for > 8 seconds, mark as Offline
      if (Date.now() - lastPacketTime > 8000 && lastPacketTime !== 0) {
        setDeviceStatus("Offline");
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(watchdog);
  }, [lastPacketTime]);


  // --- EFFECT 3: AUTO-SAVE LOG ---
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      const currentData = dataRef.current;
      // Only save if device is actually ONLINE
      if (deviceStatus === 'Online' && patientId && currentData.bat > 0) {
        try {
           await fetch('/api/save-log', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ patientId, ...currentData }),
           });
        } catch (err) { console.error(err); }
      }
    }, 5000); 
    return () => clearInterval(saveInterval);
  }, [deviceStatus, patientId]);


  // Helper for Last Sync Text
  const timeString = lastPacketTime ? new Date(lastPacketTime).toLocaleTimeString() : "--:--";

  return (
    <div className="space-y-6">
      
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Knee Stress Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time monitoring for {patientName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
           {/* Status Indicator */}
           <div className="flex items-center gap-1">
             <span className={`w-2 h-2 rounded-full ${deviceStatus === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></span> 
             {deviceStatus}
           </div>
           <div className="flex items-center gap-1"><RefreshCw size={12}/> Last Sync: {timeString}</div>
           <div className="flex items-center gap-1"><Battery size={16} className="text-green-600"/> {data.bat}%</div>
        </div>
      </div>

      {/* 2. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Gauge & Risk Score */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
           <div className="w-full text-left mb-8">
              <h2 className="text-lg font-bold text-gray-800">Overuse Risk Score</h2>
              <p className="text-xs text-gray-500">Current knee stress level</p>
           </div>

           <div className="relative w-64 h-32 mt-4 mb-4 shrink-0">
              <div className="w-full h-full bg-gray-100 rounded-t-full overflow-hidden relative">
                 <div className="absolute bottom-0 left-[10%] w-[80%] h-[160%] border-[20px] border-orange-100 rounded-full border-t-orange-400 border-r-gray-200 border-l-gray-200 border-b-transparent rotate-45 transform origin-center"></div>
              </div>
              <div 
                className="absolute bottom-0 left-1/2 w-1 h-24 bg-gray-800 origin-bottom rounded-full -translate-x-1/2 z-10 transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-50%) rotate(${(data.risk_score / 100) * 180 - 90}deg)` }}
              ></div>
              <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2 z-20"></div>
           </div>
           
           <div className="mt-4">
              <h1 className="text-6xl font-bold text-orange-400">{data.risk_score}</h1>
              <span className={`inline-block mt-2 px-4 py-1 text-sm font-bold rounded-full border ${
                  data.risk_score > 70 ? 'bg-red-50 text-red-500 border-red-100' : 
                  data.risk_score > 40 ? 'bg-orange-50 text-orange-500 border-orange-100' : 
                  'bg-green-50 text-green-500 border-green-100'
              }`}>
                {data.risk_score > 70 ? 'CRITICAL' : data.risk_score > 40 ? 'MODERATE' : 'SAFE'}
              </span>
           </div>
        </div>

        {/* RIGHT: Sensor Grid */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
           <div className="mb-6 flex items-center gap-2">
             <Database size={20} className="text-gray-700"/>
             <div>
                <h2 className="text-lg font-bold text-gray-800">Real-time Data</h2>
                {/*<p className="text-xs text-gray-500">Live readings via HiveMQ</p>*/}
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto lg:h-[calc(100%-4rem)]">
              <SensorCard 
                 icon={MoveDiagonal} title="Knee Flexion" subTitle="Angle" 
                 value={data.angle} unit="°" 
                 status={data.angle > 110 ? "High Flexion" : "Normal"} 
              />
              <SensorCard 
                 icon={Database} title="Force" subTitle="Load" 
                 value={data.fsr} unit="N" 
                 status={data.fsr > 1000 ? "High Load" : "Normal"}
              />
              <SensorCard 
                 icon={Thermometer} title="Temp" subTitle="Skin" 
                 value={data.skin_temp} unit="°C" 
              />
              <SensorCard 
                 icon={Activity} title="Battery" subTitle="Device" 
                 value={data.bat} unit="%" 
                 status={data.bat < 20 ? "Low Battery" : "Good"}
              />
           </div>
        </div>
      </div>

      {/* 3. Device Status Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Connection Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <StatusCard 
              icon={Bluetooth} title="Device Status" value={deviceStatus} 
              subText="ESP32-S3 (KneuraSense-001)" 
              statusColor={deviceStatus === 'Online' ? "bg-green-600" : "bg-red-600"}
           />
           
           <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-teal-600 rounded-lg text-white"><Battery size={20}/></div>
                 <span className="text-sm font-bold text-gray-700">Battery Level</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div 
                   className={`h-4 rounded-full transition-all duration-500 ${data.bat < 20 ? 'bg-red-500' : 'bg-gradient-to-r from-teal-400 to-green-500'}`} 
                   style={{ width: `${data.bat}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400">{data.bat}% Remaining</p>
           </div>

           <StatusCard icon={Wifi} title="Data Packet" value={timeString} subText="Last received timestamp" />
        </div>
      </div>

    </div>
  );
}