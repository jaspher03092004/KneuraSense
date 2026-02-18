import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Force Next.js to never cache this route
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // DEBUG STEP 1: Check Database
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    const logs = await prisma.sensorLog.findMany({
      where: { 
        patientId: id,
        timestamp: { gte: twelveHoursAgo }
      },
      select: { riskScore: true, force: true, angle: true }
    });

    if (!logs || logs.length === 0) {
      return NextResponse.json({ summary: "No recent data found. Make sure your sleeve is on!" });
    }

    // DEBUG STEP 2: Check API Key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ summary: "DEBUG ERROR: GEMINI_API_KEY is missing from .env!" }, { status: 500 });
    }

    const currentLog = logs[logs.length - 1];
    const avgRisk = logs.reduce((acc, log) => acc + (log.riskScore || 0), 0) / logs.length;
    const maxForce = Math.max(...logs.map(l => l.force || 0));
    const avgAngle = logs.reduce((acc, log) => acc + (log.angle || 0), 0) / logs.length;

    // DEBUG STEP 3: Connect to Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `You are a helpful medical AI. A patient has a current risk score of ${currentLog.riskScore}, average risk of ${avgRisk}, peak force of ${maxForce}N. Give a 2 sentence supportive summary.`;

    const result = await model.generateContent(prompt);
    const summaryText = result.response.text();

    return NextResponse.json({ summary: summaryText });

  } catch (error) {
    // THIS IS THE MAGIC PART: It sends the exact crash reason to your chat window
    console.error("DEBUG CRASH:", error);
    return NextResponse.json({ 
      summary: `DEBUG ERROR: ${error.message}` 
    }, { status: 500 });
  }
}