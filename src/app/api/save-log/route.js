import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import nodemailer from 'nodemailer';

async function sendCriticalAlertEmail(patient, riskScore, logData) {
  try {
    // 1. Fetch ONLY the specific clinician assigned to this patient
    const clinician = await prisma.clinician.findUnique({
      where: { 
        clinician_id: patient.clinicianId, 
      }
    });

    // 2. Abort if no clinician is found, or if they haven't verified/enabled alerts
    if (!clinician || !clinician.isVerified || !clinician.emailAlerts || !clinician.email) {
      console.log("Email Alert Aborted: Clinician unverified, missing email, or alerts disabled.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3. Construct the secure email payload
    const mailOptions = {
      from: `"KneuraSense Alert" <${process.env.SMTP_USER}>`,
      to: clinician.email,
      subject: `CRITICAL ALERT: High Risk Score Detected for ${patient.fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 10px; background-color: #fffafb;">
          <h2 style="color: #e11d48; border-bottom: 2px solid #fecdd3; padding-bottom: 10px;">Critical Patient Alert</h2>
          
          <p style="color: #475569; font-size: 16px;">Hello Dr. ${clinician.full_name ? clinician.full_name.split(' ').pop() : 'Clinician'},</p>
          <p style="color: #475569; font-size: 16px;">The KneuraSense system has detected a critical risk score for your patient. Immediate attention may be required.</p>
          
          <div style="background-color: #ffffff; border: 1px solid #fecdd3; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 15px;"><strong>Patient Name:</strong> ${patient.fullName}</p>
            <p style="margin: 5px 0; font-size: 15px;"><strong>Patient ID:</strong> ${patient.id}</p>
            <p style="margin: 5px 0; font-size: 15px; color: #e11d48;"><strong>Risk Score:</strong> ${riskScore} / 100</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 15px 0;" />
            <p style="margin: 5px 0; font-size: 14px; color: #64748b;"><strong>Recorded Angle:</strong> ${logData.angle}°</p>
            <p style="margin: 5px 0; font-size: 14px; color: #64748b;"><strong>Recorded Force:</strong> ${logData.force}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #64748b;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    };

    // 4. Send the email directly to the assigned clinician
    await transporter.sendMail(mailOptions);
    console.log(`Critical alert email successfully sent to ${clinician.email}`);

  } catch (err) {
    console.error("Failed to process alert emails:", err);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const riskScore = (body.risk_score !== undefined) ? parseInt(body.risk_score) : 0;

    const newLog = await prisma.sensorLog.create({
      data: {
        patientId:   body.patientId,
        angle:       (body.angle !== undefined) ? parseFloat(body.angle) : 0,
        force:       (body.fsr !== undefined) ? parseInt(body.fsr) : 0,      
        skinTemp:    (body.skin_temp !== undefined) ? parseFloat(body.skin_temp) : 0, 
        battery:     (body.bat !== undefined) ? parseInt(body.bat) : 0,
        riskScore:   riskScore,
        
        // --- GPS & Weather ---
        lat:         (body.lat !== undefined && body.lat !== null && body.lat !== "0") ? parseFloat(body.lat) : null,
        lng:         (body.lng !== undefined && body.lng !== null && body.lng !== "0") ? parseFloat(body.lng) : null,
        weatherTemp: (body.weatherTemp !== undefined && body.weatherTemp !== null) ? parseFloat(body.weatherTemp) : null,
        
        // --- NEW SENSOR MAPPINGS ---
        bpm:         (body.bpm !== undefined && body.bpm !== null) ? parseInt(body.bpm) : null,
        ambientTemp: (body.ambient_temp !== undefined && body.ambient_temp !== null) ? parseFloat(body.ambient_temp) : null,
        pressure:    (body.pressure !== undefined && body.pressure !== null) ? parseFloat(body.pressure) : null,
      },
    });

    if (riskScore >= 70) {
       console.log(`High risk score (${riskScore}) detected. Attempting to send email...`);
       
       // Ensure clinicianId is selected alongside the patient record
       const patient = await prisma.patient.findUnique({
         where: { id: body.patientId },
         select: { id: true, fullName: true, clinicianId: true }
       });
       
       // Only trigger the email if the patient exists AND has a designated clinician
       if (patient && patient.clinicianId) {
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