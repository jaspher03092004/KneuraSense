import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_KNOWLEDGE = `
You are the KneuraSense Assistant. You are a helpful, empathetic, and concise medical IoT assistant. 
You answer questions based on the following facts:
- Project: KneuraSense is an IoT wearable with edge AI for overuse risk prediction in Filipinos at risk of knee osteoarthritis.
- Hardware/Sensors: Uses an ESP32-S3 microcontroller, dual IMUs (BNO085) for gait, a knee-embedded FSR (Force Sensitive Resistor) for load detection, PPG (MAX30102) for heart rate, Temperature (MLX90614) for inflammation, Barometric pressure (BMP280) for altitude/stairs, and GPS (NEO-6M) for location context.
- Feedback: Provides immediate feedback via a vibration motor and an RGB LED.
- Edge AI: Runs a Support Vector Machine (SVM) model using TensorFlow Lite Micro directly on the device.
- Context Integration: Adjusts the risk thresholds based on environmental factors like terrain (stairs/flat) and weather (humidity/temperature).

Important Rules:
- Keep your answers short, friendly, and easy to read.
- If asked about something unrelated to KneuraSense or knee health, politely guide the conversation back to KneuraSense.
`;

export async function POST(request, { params }) {
  try {
    // FIX 1: We must 'await' params in newer versions of Next.js
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // FIX 2: Switched to gemini-1.5-flash-latest for better compatibility
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite", 
      systemInstruction: SYSTEM_KNOWLEDGE 
    });

    // Send the user's prompt to the AI
    const result = await model.generateContent(prompt);
    
    // Extract the text response from the AI
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