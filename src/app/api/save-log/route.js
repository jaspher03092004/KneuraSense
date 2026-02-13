import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export async function POST(request) {
  try {
    const body = await request.json();

    const newLog = await prisma.sensorLog.create({
      data: {
        patientId: body.patientId,
        angle:     (body.angle !== undefined) ? parseFloat(body.angle) : 0,
        force:     (body.fsr !== undefined) ? parseInt(body.fsr) : 0,      
        skinTemp:  (body.skin_temp !== undefined) ? parseFloat(body.skin_temp) : 0, 
        battery:   (body.bat !== undefined) ? parseInt(body.bat) : 0,
        riskScore: (body.risk_score !== undefined) ? parseInt(body.risk_score) : 0,
        lat:       (body.lat !== undefined && body.lat !== null) ? parseFloat(body.lat) : null,
        lng:       (body.lng !== undefined && body.lng !== null) ? parseFloat(body.lng) : null,
        weatherTemp: (body.weatherTemp !== undefined && body.weatherTemp !== null) 
                      ? parseFloat(body.weatherTemp) 
                      : null,
      },
    });

    return NextResponse.json({ success: true, data: newLog });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}