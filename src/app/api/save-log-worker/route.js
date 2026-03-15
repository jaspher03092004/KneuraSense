import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { sendCriticalAlertEmail } from "@/lib/email"; 

export async function POST(request) {
  try {
    // 1. SECURITY CHECK FIRST
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.WORKER_SECRET_KEY) {
      console.warn("Blocked unauthorized API request!");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const riskScore = (body.risk_score !== undefined) ? parseInt(body.risk_score) : 0;

    // 2. FETCH THE PATIENT USING MAC ADDRESS
    const patient = await prisma.patient.findFirst({
      where: { deviceMac: body.deviceMac },
      select: { id: true, fullName: true, clinicianId: true, riskThreshold: true }
    });

    if (!patient) {
      console.warn(`API Error: No patient found matching MAC Address ${body.deviceMac}`);
      return NextResponse.json({ success: false, error: "Unregistered device" }, { status: 404 });
    }

    // 3. CREATE THE LOG ENTRY
    const newLog = await prisma.sensorLog.create({
      data: {
        patientId:   patient.id, 
        angle:       (body.angle !== undefined) ? parseFloat(body.angle) : 0,
        thighPitch:  (body.thigh_pitch !== undefined) ? parseFloat(body.thigh_pitch) : null,
        shankPitch:  (body.shank_pitch !== undefined) ? parseFloat(body.shank_pitch) : null,
        force:       (body.fsr !== undefined) ? parseInt(body.fsr) : 0,      
        skinTemp:    (body.skin_temp !== undefined) ? parseFloat(body.skin_temp) : 0, 
        battery:     (body.bat !== undefined) ? parseInt(body.bat) : 0,
        riskScore:   riskScore,
        lat:         (body.lat !== undefined && body.lat !== null && body.lat !== "0") ? parseFloat(body.lat) : null,
        lng:         (body.lng !== undefined && body.lng !== null && body.lng !== "0") ? parseFloat(body.lng) : null,
        weatherTemp: (body.weatherTemp !== undefined && body.weatherTemp !== null) ? parseFloat(body.weatherTemp) : null,
        bpm:         (body.bpm !== undefined && body.bpm !== null) ? parseInt(body.bpm) : null,
        ambientTemp: (body.ambient_temp !== undefined && body.ambient_temp !== null) ? parseFloat(body.ambient_temp) : null,
        pressure:    (body.pressure !== undefined && body.pressure !== null) ? parseFloat(body.pressure) : null,
      },
    });

    // 4. CHECK THRESHOLD AND SEND EMAIL
    const threshold = patient?.riskThreshold ?? 75;

    if (riskScore >= threshold) {
       console.log(`High risk score (${riskScore}) detected. Attempting to send email...`);
       
       // Fixed redundant check here!
       if (patient.clinicianId) {
         await sendCriticalAlertEmail(patient, riskScore, newLog); 
       } else {
         console.log("No assigned clinician found for this patient. Alert skipped.");
       }
    }

    return NextResponse.json({ success: true, data: newLog });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}