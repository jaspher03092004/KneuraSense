import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { sendCriticalAlertEmail } from "@/lib/email"; 
import webpush from "web-push"; // <-- 1. Import Web Push

// 2. Configure Web Push
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_NOTIFICATION_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
    // SECURITY CHECK FIRST
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.WORKER_SECRET_KEY) {
      console.warn("Blocked unauthorized API request!");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.deviceMac) {
      console.warn("API Error: Missing deviceMac in request payload");
      return NextResponse.json({ success: false, error: "Missing deviceMac" }, { status: 400 });
    }

    const riskScore = (body.risk_score !== undefined) ? parseInt(body.risk_score) : 0;

    // FETCH THE PATIENT (3. Add pushSubscription to select)
    const patient = await prisma.patient.findFirst({
      where: { deviceMac: body.deviceMac },
      select: { 
        id: true, 
        fullName: true, 
        clinicianId: true, 
        riskThreshold: true,
        pushSubscription: true, // <-- Required for web push
        lastCriticalAlertAt: true
      }
    });

    if (!patient) {
      console.warn(`API Error: No patient found matching MAC Address ${body.deviceMac}`);
      return NextResponse.json({ success: false, error: "Unregistered device" }, { status: 404 });
    }

    // CREATE THE LOG ENTRY
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

    // CHECK THRESHOLD AND SEND ALERTS
    const threshold = patient?.riskThreshold ?? 75;

    if (riskScore >= threshold) {
       console.log(`High risk score (${riskScore}) detected. Triggering alerts...`);
       
       // --- A. Clinician Email Alert ---
       if (patient.clinicianId) {
         await sendCriticalAlertEmail(patient, riskScore, newLog); 
       } else {
         console.log("No assigned clinician found for this patient. Alert skipped.");
       }

       // --- B. Patient Web Push Alert ---
       if (patient.pushSubscription) {
         try {
           const subscriptionObj = JSON.parse(patient.pushSubscription);
           const voiceMessage = `Warning ${patient.fullName.split(' ')[0]}. Your knee risk score is critically high at ${riskScore}. Please stop your current activity and sit down immediately to prevent injury.`;
           
           const payload = JSON.stringify({
             title: "⚠️ Urgent Knee Alert",
             body: "Tap to hear urgent instructions.",
             url: `/patient/${patient.id}/dashboard?voiceAlert=${encodeURIComponent(voiceMessage)}`
           });

           await webpush.sendNotification(subscriptionObj, payload);
           console.log("Successfully fired Push-to-Talk wake-up call to device!");

         } catch (pushErr) {
           console.error("Failed to send web push. Subscription might be invalid or expired:", pushErr);
         }
       }
    }

    return NextResponse.json({ success: true, data: newLog });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}