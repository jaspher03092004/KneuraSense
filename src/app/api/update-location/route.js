import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mqtt from 'mqtt';

export async function POST(request) {
  try {
    const { patientId, lat, lng } = await request.json();
    
    // 1. Fetch weather using your existing .env key name
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

    // 3. CLEAN THE MAC ADDRESS (Remove colons to match ESP32 logic)
    // Your Serial Monitor shows the device uses "1CDBD4762338"
    const cleanMac = patient.deviceMac.replace(/:/g, '');

    // 4. Connect using your EXISTING .env variable names
    const options = {
      username: process.env.NEXT_PUBLIC_MQTT_USER, // Matches .env
      password: process.env.NEXT_PUBLIC_MQTT_PASS, // Matches .env
      protocol: 'mqtts',
      port: Number(process.env.MQTT_SERVER_PORT) || 8883 // Matches .env
    };

    const client = mqtt.connect(process.env.MQTT_BROKER_URL, options);
    
    client.on('connect', () => {
      // Use the cleanMac here so the topic is esp32/1CDBD4762338/command
      const topic = `esp32/${cleanMac}/command`;
      console.log(`[SYNC] Publishing to topic: ${topic}`);
      client.publish(topic, `WEATHER:${currentTemp}`);
      client.end();
    });

    client.on('error', (err) => {
      console.error('[SYNC] MQTT connection error:', err.message);
      client.end();
    });

    return NextResponse.json({ success: true, temp: currentTemp });
  } catch (error) {
    console.error(`[SYNC ERROR] ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}