import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId, angle, fsr, skin_temp, bat, risk_score } = body;

    const newLog = await prisma.sensorLog.create({
      data: {
        patientId,
        angle: parseFloat(angle),
        force: parseInt(fsr),
        skinTemp: parseFloat(skin_temp),
        battery: parseInt(bat),
        riskScore: parseInt(risk_score),
      },
    });

    return NextResponse.json({ success: true, id: newLog.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 });
  }
}