'use client';

import { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { 
  Activity, Thermometer, MoveDiagonal, 
  Database
} from 'lucide-react';

const SensorCard = ({ icon: Icon, title, subTitle, value, unit, status, trend }) => (
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
        <span className="text-xs text-gray-400">{status || 'Live'}</span>
      </div>
    </div>
  </div>
);

export default function LiveDashboard() {
  const [data, setData] = useState({
    angle: 0, fsr: 0, skin_temp: 0, bat: 0
  });
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    // -----------------------------------------------------------
    // HIVEMQ CONFIGURATION
    // -----------------------------------------------------------
    const MQTT_HOST = 'd74c9cedfa0e44efa6fbbc6a42bef453.s1.eu.hivemq.cloud';
    const MQTT_PORT = 8884; // Secure WebSockets Port
    const MQTT_USER = 'KneuraSense-esp32';
    const MQTT_PASS = 'Kneurasense123';
    const TOPIC = 'esp32/data'; 

    console.log("Connecting to HiveMQ...");

    const client = mqtt.connect(`wss://${MQTT_HOST}:${MQTT_PORT}/mqtt`, {
      clientId: 'web_' + Math.random().toString(16).substr(2, 8),
      username: MQTT_USER,
      password: MQTT_PASS,
      clean: true,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      if (!client.disconnecting) {
        setConnectionStatus("Connected");
        console.log("MQTT Connected");
        client.subscribe(TOPIC, (err) => {
            if (err) {
                console.error("Subscription Error:", err);
            }
        });
      }
    });

    client.on('error', (err) => {
      console.error("Connection error: ", err);
      setConnectionStatus("Error");
    });

    client.on('message', (topic, message) => {
      try {
        const parsedData = JSON.parse(message.toString());
        setData(parsedData);
      } catch (err) {
        console.error("Failed to parse MQTT message", err);
      }
    });

    return () => {
      if (client) {
        console.log("Disconnecting MQTT...");
        client.end();
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">{connectionStatus}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SensorCard icon={MoveDiagonal} title="Knee Flexion" subTitle="Angle" value={data.angle} unit="°" />
        <SensorCard icon={Database} title="Force" subTitle="Load" value={data.fsr} unit="N" />
        <SensorCard icon={Thermometer} title="Temp" subTitle="Skin" value={data.skin_temp} unit="°C" />
        <SensorCard icon={Activity} title="Battery" subTitle="Device" value={data.bat} unit="%" />
      </div>
    </div>
  );
}