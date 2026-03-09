import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';

export function useMQTT(deviceMac) {
  const [data, setData] = useState({
    angle: 0, fsr: 0, skin_temp: 0, bat: 0, risk_score: 0, lat: "0", lng: "0", 
    bpm: 0, ambient_temp: 0, pressure: 0
  });
  const [deviceStatus, setDeviceStatus] = useState("Offline"); 
  const [lastPacketTime, setLastPacketTime] = useState(0);
  const lastUpdateTime = useRef(0);
  const clientRef = useRef(null); 

  useEffect(() => {
    console.log("[MQTT Setup] Received MAC Address:", deviceMac);

    if (!deviceMac) {
      console.warn("[MQTT Setup] No MAC address provided. Aborting connection.");
      return;
    }

    const MQTT_HOST = 'd74c9cedfa0e44efa6fbbc6a42bef453.s1.eu.hivemq.cloud';
    const MQTT_PORT = 8884;
    const MQTT_USER = 'KneuraSense-esp32';
    const MQTT_PASS = 'Kneurasense123';
    
    const TOPIC = `esp32/${deviceMac}/data`; 
    console.log(`[MQTT Setup] Attempting to connect and subscribe to: ${TOPIC}`);

    const client = mqtt.connect(`wss://${MQTT_HOST}:${MQTT_PORT}/mqtt`, {
      clientId: 'web_' + Math.random().toString(16).substr(2, 8),
      username: MQTT_USER,
      password: MQTT_PASS,
      clean: true,
      reconnectPeriod: 2000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      console.log(`[MQTT Status] Successfully connected to HiveMQ Cloud!`);
      if (!client.disconnecting) {
        client.subscribe(TOPIC, (err) => {
          if (err) console.error("[MQTT Error] Failed to subscribe to topic:", err);
          else console.log(`[MQTT Status] Successfully subscribed to: ${TOPIC}`);
        });
      }
    });

    client.on('error', (err) => {
      console.error("[MQTT Error] Connection error:", err);
    });

    client.on('message', (topic, message) => {
      if (topic === TOPIC) {
        try {
          const payload = JSON.parse(message.toString());
          const now = Date.now();
          
          if (now - lastUpdateTime.current > 500) {
            setData(prev => ({ ...prev, ...payload }));
            setDeviceStatus("Online");
            setLastPacketTime(now);
            lastUpdateTime.current = now;
          }
        } catch (err) {
          console.error("[MQTT Error] Failed to parse JSON payload:", err);
        }
      }
    });

    return () => { 
      if (client) {
        console.log("[MQTT Status] Disconnecting client...");
        client.end(); 
      }
    };
  }, [deviceMac]);

  useEffect(() => {
    const watchdog = setInterval(() => {
      if (Date.now() - lastPacketTime > 8000 && lastPacketTime !== 0) {
        setDeviceStatus("Offline");
      }
    }, 2000); 
    return () => clearInterval(watchdog);
  }, [lastPacketTime]);

  const sendCommand = (commandString) => {
    if (clientRef.current && clientRef.current.connected) {
      const commandTopic = `esp32/${deviceMac}/command`;
      clientRef.current.publish(commandTopic, commandString);
      console.log(`[MQTT Command] Sent "${commandString}" to ${commandTopic}`);
      return true;
    }
    console.warn("[MQTT Command] Cannot send command, client is disconnected.");
    return false;
  };

  return { data, deviceStatus, lastPacketTime, sendCommand };
}