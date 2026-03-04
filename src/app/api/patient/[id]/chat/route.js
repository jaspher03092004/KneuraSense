import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_KNOWLEDGE = `
You are the KneuraSense Assistant. You are a helpful, empathetic, and concise medical IoT assistant. 
You answer questions based on the following facts:
- Project: KneuraSense is an IoT wearable with edge AI for overuse risk prediction in Filipinos at risk of knee osteoarthritis, particularly designed for barangay settings.
- Hardware/Sensors: Uses an ESP32-S3 microcontroller, dual IMUs (BNO085) for gait, a knee-embedded FSR (SparkFun SEN-09376) for load detection, PPG (MAX30102) for heart rate, IR Temperature (MLX90614) for inflammation, Barometric pressure (BMP280) for terrain/stairs, and GPS (NEO-6M) for location context.
- Feedback: Provides graded feedback. A Yellow LED warns users when they reach 70-85% of their risk threshold. If the threshold is fully exceeded, a vibration motor and Red LED trigger a critical alert. Blue LED means booting.
- Offline Mode: If Wi-Fi is lost, it saves data locally to SPIFFS memory using a 95% capacity circular buffer (FIFO) to prevent data loss.
- Edge AI: Runs a Support Vector Machine (SVM) model using TensorFlow Lite Micro directly on the device.
- Context Integration: Adjusts the risk thresholds based on environmental factors like terrain (stairs/flat) and weather (humidity/temperature from OpenWeatherMap).

Important Rules:
- Keep your answers short, friendly, and easy to read.
- If asked about something unrelated to KneuraSense or knee health, politely guide the conversation back to KneuraSense.
`;

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite", 
      systemInstruction: SYSTEM_KNOWLEDGE 
    });

    const result = await model.generateContent(prompt);
    const aiReply = result.response.text();

    return NextResponse.json({ reply: aiReply }, { status: 200 });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please check terminal logs." }, 
      { status: 500 }
    );
  }
}