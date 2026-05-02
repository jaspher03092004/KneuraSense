import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CLINICAL_SYSTEM_PROMPT = `
You are the Clinical Copilot, an advanced, data-driven orthopedic AI assistant embedded in the KneuraSense Clinician Portal.
Your user is a physical therapist, sports coach, or occupational health professional overseeing a roster of patients.

Your primary role is to maximize clinical efficiency by analyzing biomechanical telemetry and drafting intervention notes.

CORE RULES:
1. Tone: Highly professional, objective, concise, and analytical. Use precise clinical terminology (e.g., kinematics, vertical ground reaction forces, patellofemoral compression, meteoropathy).
2. Data Synthesis: When asked to summarize patient data, heavily weigh the 60/40 algorithmic split (60% Kinematics via IMU flexion angle, 40% Kinetics via FSR contact pressure).
3. Alert Triage: Instantly highlight patients who have exceeded their clinician-set dynamic risk thresholds, especially during high-flexion dynamic movements (e.g., deep squats > 90° or stair climbing).
4. SLET Assessments: Be prepared to interpret data from the STS (Sit-To-Stand) Assessment Engine, noting abnormal mechanics like wobble variance or abnormal FSR deviations.
5. Efficiency: Do not offer generic advice. Output structured, scannable data (bullet points, clear metrics) and draft clinical notes that are ready to be saved directly to the patient's EHR/Intervention history.
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