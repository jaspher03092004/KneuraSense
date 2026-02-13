'use client';

import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { 
  Activity, Thermometer, MoveDiagonal, 
  Battery, Wifi, RefreshCw, Database, 
  Bluetooth, Cloud 
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
         {title === "Device Status" && <span className={`w-2 h-2 rounded-full shrink-0 ${value === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></span>}
         <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
      <p className="text-xs text-gray-400 truncate">{subText}</p>
    </div>
  </div>
);

// --- 2. Main Component ---

export default function SmartDashboard({ patientName, patientId }) {
  // Initialize with "0" strings to match your MQTT payload format
  const [data, setData] = useState({
    angle: 0, fsr: 0, skin_temp: 0, bat: 0, risk_score: 0, lat: "0", lng: "0"
  });

  const [weather, setWeather] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState("Offline"); 
  const [lastPacketTime, setLastPacketTime] = useState(0);

  // Refs act as a bridge for the Interval to see the latest state
  const dataRef = useRef(data); 
  const weatherRef = useRef(weather); // ✨ NEW: Ref for Weather

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // ✨ NEW: Keep weather ref updated
  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  // --- EFFECT 1: WEATHER FETCHING ---
  useEffect(() => {
    // Only fetch weather if we have valid non-zero coordinates
    if (data.lat && data.lng && data.lat !== "0" && data.lng !== "0") {
      const fetchWeather = async () => {
        const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY; 
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${data.lat}&lon=${data.lng}&units=metric&appid=${API_KEY}`;
        
        try {
          const response = await fetch(url);
          const result = await response.json();
          if (result.cod === 200) setWeather(result);
        } catch (error) {
          console.error("Error fetching weather:", error);
        }
      };
      fetchWeather();
    }
  }, [data.lat, data.lng]); 

  // --- EFFECT 2: MQTT CONNECTION ---
  useEffect(() => {
    const MQTT_HOST = 'd74c9cedfa0e44efa6fbbc6a42bef453.s1.eu.hivemq.cloud';
    const MQTT_PORT = 8884;
    const MQTT_USER = 'KneuraSense-esp32';
    const MQTT_PASS = 'Kneurasense123';
    const TOPIC = 'esp32/data'; 

    const client = mqtt.connect(`wss://${MQTT_HOST}:${MQTT_PORT}/mqtt`, {
      clientId: 'smart_web_' + Math.random().toString(16).substr(2, 8),
      username: MQTT_USER,
      password: MQTT_PASS,
      clean: true,
      reconnectPeriod: 2000,
    });

    client.on('connect', () => {
      console.log("MQTT Connected");
      if (!client.disconnecting) {
        client.subscribe(TOPIC);
      }
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        // Merge new data with previous state to prevent flickering
        setData(prev => ({ ...prev, ...payload }));
        
        setDeviceStatus("Online");
        setLastPacketTime(Date.now()); 
      } catch (err) {
        console.error("JSON Parse Error", err);
      }
    });

    return () => { if (client) client.end(); };
  }, []);

  // --- EFFECT 3: WATCHDOG TIMER ---
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (Date.now() - lastPacketTime > 8000 && lastPacketTime !== 0) {
        setDeviceStatus("Offline");
      }
    }, 2000); 
    return () => clearInterval(watchdog);
  }, [lastPacketTime]);

  // --- EFFECT 4: AUTO-SAVE TO SUPABASE ---
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      const currentData = dataRef.current;
      const currentWeather = weatherRef.current; // Get latest weather from ref
      
      // Only save if device is Online and we have a valid Patient ID
      if (deviceStatus === 'Online' && patientId && currentData.bat > 0) {
        try {
           await fetch('/api/save-log', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
               patientId: patientId,
               risk_score: currentData.risk_score,
               bat: currentData.bat,
               angle: currentData.angle,
               skin_temp: currentData.skin_temp,
               fsr: currentData.fsr,
               // Explicitly pass lat/lng so they don't get lost
               lat: currentData.lat, 
               lng: currentData.lng,
               // ✨ NEW: Send weather temperature to API
               weatherTemp: currentWeather ? currentWeather.main.temp : null
             }),
           });
        } catch (err) { 
          console.error("Auto-save failed:", err); 
        }
      }
    }, 10000); 
    
    return () => clearInterval(saveInterval);
  }, [deviceStatus, patientId]);

  const timeString = lastPacketTime ? new Date(lastPacketTime).toLocaleTimeString() : "--:--";

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Knee Stress Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time monitoring for {patientName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
           <div className="flex items-center gap-1">
             <span className={`w-2 h-2 rounded-full ${deviceStatus === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></span> 
             {deviceStatus}
           </div>
           <div className="flex items-center gap-1"><RefreshCw size={12}/> Last Sync: {timeString}</div>
           <div className="flex items-center gap-1"><Battery size={16} className="text-green-600"/> {data.bat}%</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gauge & Risk Score */}
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

        {/* Sensor Grid */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
           <div className="mb-6 flex items-center gap-2">
             <Database size={20} className="text-gray-700"/>
             <h2 className="text-lg font-bold text-gray-800">Real-time Data</h2>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto lg:h-[calc(100%-4rem)]">
              <SensorCard icon={MoveDiagonal} title="Knee Flexion" subTitle="Angle" value={data.angle} unit="°" status={data.angle > 110 ? "High Flexion" : "Normal"} />
              <SensorCard icon={Database} title="Force" subTitle="Load" value={data.fsr} unit="N" status={data.fsr > 1000 ? "High Load" : "Normal"} />
              <SensorCard icon={Thermometer} title="Temp" subTitle="Skin" value={data.skin_temp} unit="°C" />
              <SensorCard 
                 icon={Cloud} title="Weather" unit="°C"
                 subTitle={weather ? weather.name : (data.lat !== "0" ? "Loading..." : "Indoor Mode")} 
                 value={weather ? Math.round(weather.main.temp) : "--"} 
                 status={weather ? weather.weather[0].main : "No GPS"}
              />
           </div>
        </div>
      </div>

      {/* Connection Status Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Connection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <StatusCard icon={Bluetooth} title="Device Status" value={deviceStatus} subText="ESP32-S3 (KneuraSense-001)" statusColor={deviceStatus === 'Online' ? "bg-green-600" : "bg-red-600"} />
           <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-teal-600 rounded-lg text-white"><Battery size={20}/></div>
                 <span className="text-sm font-bold text-gray-700">Battery Level</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div className={`h-4 rounded-full transition-all duration-500 ${data.bat < 20 ? 'bg-red-500' : 'bg-gradient-to-r from-teal-400 to-green-500'}`} style={{ width: `${data.bat}%` }}></div>
              </div>
              <p className="text-xs text-gray-400">{data.bat}% Remaining</p>
           </div>
           <StatusCard icon={Wifi} title="Data Packet" value={timeString} subText="Last received timestamp" />
        </div>
      </div>
    </div>
  );
}