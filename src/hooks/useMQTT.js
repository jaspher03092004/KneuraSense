import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

export function useMQTT() {
  const [data, setData] = useState({
    angle: 0, fsr: 0, skin_temp: 0, bat: 0, risk_score: 0, lat: "0", lng: "0", 
    bpm: 0, ambient_temp: 0, pressure: 0
  });
  const [deviceStatus, setDeviceStatus] = useState("Offline"); 
  const [lastPacketTime, setLastPacketTime] = useState(0);

  // --- MQTT CONNECTION ---
  useEffect(() => {
    const MQTT_HOST = 'd74c9cedfa0e44efa6fbbc6a42bef453.s1.eu.hivemq.cloud';
    const MQTT_PORT = 8884;
    const MQTT_USER = 'KneuraSense-esp32';
    const MQTT_PASS = 'Kneurasense123';
    const TOPIC = 'esp32/data'; 

    const client = mqtt.connect(`wss://${MQTT_HOST}:${MQTT_PORT}/mqtt`, {
      clientId: 'web_' + Math.random().toString(16).substr(2, 8),
      username: MQTT_USER,
      password: MQTT_PASS,
      clean: true,
      reconnectPeriod: 2000,
    });

    client.on('connect', () => {
      if (!client.disconnecting) client.subscribe(TOPIC);
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        setData(prev => ({ ...prev, ...payload }));
        setDeviceStatus("Online");
        setLastPacketTime(Date.now()); 
      } catch (err) {
        console.error("MQTT Parse Error", err);
      }
    });

    return () => { if (client) client.end(); };
  }, []);

  // --- WATCHDOG TIMER ---
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (Date.now() - lastPacketTime > 8000 && lastPacketTime !== 0) {
        setDeviceStatus("Offline");
      }
    }, 2000); 
    return () => clearInterval(watchdog);
  }, [lastPacketTime]);

  return { data, deviceStatus, lastPacketTime };
}