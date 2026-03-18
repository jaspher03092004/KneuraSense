import { prisma } from "@/lib/prisma"; 
import nodemailer from 'nodemailer';

// Define your cooldown period (e.g., 15 minutes)
const COOLDOWN_PERIOD_MS = 15 * 60 * 1000; 

export async function sendCriticalAlertEmail(patient, riskScore, logData) {
  try {
    // 1. Check the cooldown timer to prevent spamming
    if (patient.lastCriticalAlertAt) {
      const timeSinceLastAlert = Date.now() - new Date(patient.lastCriticalAlertAt).getTime();
      
      if (timeSinceLastAlert < COOLDOWN_PERIOD_MS) {
        console.log(`Email Alert Aborted: Cooldown active for patient ${patient.id}.`);
        return; // Exit early, skipping the email
      }
    }

    const clinician = await prisma.clinician.findUnique({
      where: { 
        clinician_id: patient.clinicianId, 
      }
    });

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

    const mailOptions = {
      from: `"KneuraSense Alert" <${process.env.SMTP_USER}>`,
      to: clinician.email,
      // Subject changed from ALL CAPS to Title Case to lower spam score
      subject: `Critical Alert: High Risk Score Detected for ${patient.fullName}`,
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

    // 2. Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Critical alert email successfully sent to ${clinician.email}`);

    // 3. Update the patient's last alert timestamp in the database to start the cooldown
    await prisma.patient.update({
      where: { id: patient.id },
      data: { lastCriticalAlertAt: new Date() }
    });

  } catch (err) {
    console.error("Failed to process alert emails:", err);
  }
}