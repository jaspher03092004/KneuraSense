import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import nodemailer from 'nodemailer';

async function sendCriticalAlertEmail(patient, riskScore, logData) {
  try {
    // 1. Fetch ALL clinicians who have email alerts enabled
    const clinicians = await prisma.clinician.findMany({
      where: { 
        isVerified: true,
        emailAlerts: true 
      }
    });

    if (!clinicians || clinicians.length === 0) {
      console.log("Email Alert Aborted: No clinicians found with emailAlerts enabled.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 2. Map over the array of clinicians to create an array of email promises
    const emailPromises = clinicians.map(clinician => {
      // Skip if this specific clinician lacks an email address
      if (!clinician.email) return Promise.resolve(); 

      const mailOptions = {
        from: `"KneuraSense Alert" <${process.env.SMTP_USER}>`,
        to: clinician.email,
        subject: `CRITICAL ALERT: High Risk Score Detected for ${patient.fullName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 10px; background-color: #fffafb;">
            <h2 style="color: #e11d48; border-bottom: 2px solid #fecdd3; padding-bottom: 10px;">Critical Patient Alert</h2>
            
            <p style="color: #475569; font-size: 16px;">Hello Dr. ${clinician.full_name ? clinician.full_name.split(' ').pop() : 'Clinician'},</p>
            <p style="color: #475569; font-size: 16px;">The KneuraSense system has detected a critical risk score for one of your patients. Immediate attention may be required.</p>
            
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

      // Send the email and log the result
      return transporter.sendMail(mailOptions)
        .then(() => console.log(`Critical alert email successfully sent to ${clinician.email}`))
        .catch(err => console.error(`Failed to send alert email to ${clinician.email}:`, err));
    });

    // 3. Await all the emails to finish sending before closing the function
    await Promise.all(emailPromises);

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
       
       const patient = await prisma.patient.findUnique({
         where: { id: body.patientId },
         select: { id: true, fullName: true }
       });
       
       if (patient) {
         // Added 'await' here to ensure it finishes before the API responds
         await sendCriticalAlertEmail(patient, riskScore, newLog);
       }
    }

    return NextResponse.json({ success: true, data: newLog });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}