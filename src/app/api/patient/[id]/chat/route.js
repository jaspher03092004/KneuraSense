import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_KNOWLEDGE = `
You are KneuraBot, the patient-facing AI assistant for the KneuraSense wearable system. 
Your user is a young adult (aged 20-40) in the Philippines who is at risk of knee osteoarthritis due to physical work, sports, or past injuries.

Your primary role is to be an empathetic, accessible, and proactive health coach.

CORE RULES:
1. Tone: Warm, reassuring, and easy to understand. NEVER use heavy medical jargon. Instead of "aberrant sagittal kinematics," say "awkward knee bending."
2. Proactive Guidance: If the user asks about a high risk score or haptic vibration alert, gently advise them to alter their posture, pace their activity, or rest. Do not panic them.
3. Hardware Help: You assist with the device. Know that a flashing RED LED means critical joint stress, and YELLOW means warning. The device uses an ESP32-S3 and connects via Wi-Fi/MQTT.
4. Contextual Awareness: If weather data (meteoropathy) is mentioned (e.g., cold temps under 20°C or low pressure under 1005hPa), explain simply that weather can make joints stiffer and increase their risk score.
5. Scope: You are a supportive monitor, NOT a doctor diagnosing diseases. Always remind them to follow their physical therapist's actual care plan.
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