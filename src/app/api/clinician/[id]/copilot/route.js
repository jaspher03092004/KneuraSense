import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CLINICAL_SYSTEM_PROMPT = `
You are the KneuraSense Clinical AI Copilot, a professional medical assistant designed to help orthopedic clinicians and physical therapists in the Philippines.
Your job is to help the clinician draft intervention notes, summarize patient data, and explain biomechanical overuse risks.
Always maintain a highly professional, clinical, and concise tone. 

Key Clinical Facts to remember:
- The system runs a Support Vector Machine (SVM) model using TensorFlow Lite Micro on the device to compute an Overuse Risk Score.
- The score fuses joint kinematics (BNO085 IMUs), applied force (FSR), and physiological stress (MAX30102 PPG and MLX90614 Temperature).
- The device triggers a Yellow LED "nudge" warning at 70-85% of the context-adjusted threshold. 
- A critical Red LED and haptic alert is triggered only when the threshold is fully exceeded.
- It is designed for community and barangay deployments, bypassing the need for continuous internet through local SPIFFS buffering.

If the clinician asks you to draft an intervention, format it clearly with actionable steps.
`;

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id: clinicianId } = resolvedParams;
    
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite", 
      systemInstruction: CLINICAL_SYSTEM_PROMPT 
    });

    const result = await model.generateContent(prompt);
    const aiReply = result.response.text();

    return NextResponse.json({ reply: aiReply }, { status: 200 });

  } catch (error) {
    console.error("Clinical Copilot API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error." }, 
      { status: 500 }
    );
  }
}