import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mqtt from 'mqtt';

export async function POST(request) {
  try {
    const { patientId, lat, lng } = await request.json();
    
    // 1. Fetch weather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
    );
    const weatherData = await weatherRes.json();
    
    if (!weatherData.main) {
      throw new Error(`Weather API Error: ${weatherData.message || 'Unknown response'}`);
    }
    
    const currentTemp = weatherData.main.temp;

    // 2. Retrieve patient device info
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { deviceMac: true }
    });

    if (!patient?.deviceMac) {
      throw new Error("Device MAC not found for this patient.");
    }

    const cleanMac = patient.deviceMac.replace(/:/g, '');

    // 4. CONNECT USING WEBSOCKETS INSTEAD OF RAW MQTT
    const options = {
      username: process.env.NEXT_PUBLIC_MQTT_USER, 
      password: process.env.NEXT_PUBLIC_MQTT_PASS, 
      protocol: 'wss',
      port: 8884
    };

    // Use the exact same WebSocket URL structure as your frontend!
    const brokerUrl = `wss://${process.env.NEXT_PUBLIC_MQTT_HOST}:8884/mqtt`;

    await new Promise((resolve, reject) => {
      const client = mqtt.connect(brokerUrl, options);
      
      client.on('connect', () => {
        const topic = `esp32/${cleanMac}/command`;
        console.log(`[SYNC] Publishing to topic: ${topic}`);
        
        client.publish(topic, `WEATHER:${currentTemp}`, (err) => {
          if (err) {
            console.error('[SYNC] Failed to publish', err);
            client.end();
            reject(err);
          } else {
            console.log('[SYNC] Successfully published message via WebSockets');
            client.end();
            resolve(); 
          }
        });
      });

      client.on('error', (err) => {
        console.error('[SYNC] MQTT connection error:', err.message);
        client.end();
        reject(err);
      });
    });

    return NextResponse.json({ success: true, temp: currentTemp });
  } catch (error) {
    console.error(`[SYNC ERROR] ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}