import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { sendCriticalAlertEmail } from "@/lib/email"; 

export async function POST(request) {
  try {
    const body = await request.json();
    const riskScore = (body.risk_score !== undefined) ? parseInt(body.risk_score) : 0;

    // 1. FETCH THE PATIENT FIRST to get their custom threshold
    const patient = await prisma.patient.findUnique({
      where: { id: body.patientId },
      select: { id: true, fullName: true, clinicianId: true, riskThreshold: true }
    });

    // 2. THE NEW SAFEGUARD: Exit early if patient doesn't exist
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }

    // 3. CREATE LOG
    const newLog = await prisma.sensorLog.create({
      data: {
        patientId:   body.patientId,
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

    // 4. CHECK THRESHOLD & ALERT
    const threshold = patient.riskThreshold ?? 75; // Removed the ? after patient since we know it exists now

    if (riskScore >= threshold) {
       console.log(`High risk score (${riskScore}) detected. Attempting to send email...`);
       
       if (patient.clinicianId) { // Simplified this check as well!
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