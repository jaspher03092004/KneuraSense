import { prisma } from "@/lib/prisma"; 
import nodemailer from 'nodemailer';

// Define your cooldown period (e.g., 15 minutes)
const COOLDOWN_PERIOD_MS = 15 * 60 * 1000; 

export async function sendCriticalAlertEmail(patient, riskScore, logData) {
  try {
    // 1. RE-FETCH the patient to get the absolute latest timestamp to prevent split-second race conditions
    const currentPatient = await prisma.patient.findUnique({
      where: { id: patient.id },
      select: { lastCriticalAlertAt: true }
    });

    // 2. Check the cooldown timer using the freshly fetched data
    if (currentPatient?.lastCriticalAlertAt) {
      const timeSinceLastAlert = Date.now() - new Date(currentPatient.lastCriticalAlertAt).getTime();
      
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

    // 3. LOCK IT IN: Update the timestamp immediately before sending to block parallel requests
    await prisma.patient.update({
      where: { id: patient.id },
      data: { lastCriticalAlertAt: new Date() }
    });

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

    // 4. Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Critical alert email successfully sent to ${clinician.email}`);

  } catch (err) {
    console.error("Failed to process alert emails:", err);
    
    // Optional fallback: if the email genuinely fails to send, clear the lock so it can try again
    // await prisma.patient.update({ where: { id: patient.id }, data: { lastCriticalAlertAt: null } });
  }
}

// NEW: PASSWORD RESET EMAIL
export async function sendPasswordResetEmail(email, token) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Fallback to localhost if NEXT_PUBLIC_BASE_URL isn't set in your .env
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"KneuraSense Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `KneuraSense - Password Reset Request`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px;">Password Reset Request</h2>
          
          <p style="color: #475569; font-size: 16px;">Hello,</p>
          <p style="color: #475569; font-size: 16px;">We received a request to reset your KneuraSense password. Click the button below to set up a new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2D5F8B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #2D5F8B; font-size: 12px; word-break: break-all;">${resetLink}</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">If you did not request a password reset, you can safely ignore this email. The link will expire in 24 hours.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email successfully sent to ${email}`);
    
    return { success: true };
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    return { success: false, error: "Failed to send email." };
  }
}

export async function sendActivationEmail(email, token, name) {
  try {
    // 1. Initialize transporter using your working SMTP variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 2. Ensure base URL is set (use NEXT_PUBLIC_APP_URL as per your logic)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const activationUrl = `${baseUrl}/activate-account?token=${token}`;

    const mailOptions = {
      from: `"KneuraSense" <${process.env.SMTP_USER}>`, // Match SMTP_USER
      to: email,
      subject: 'Activate Your KneuraSense Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2D5F8B;">Welcome to KneuraSense, ${name}!</h2>
          <p style="color: #475569; font-size: 16px;">Your healthcare provider has created a profile for you. To begin monitoring your knee health, please activate your account and set your password by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}" style="display: inline-block; padding: 12px 28px; background-color: #2D5F8B; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Activate Account</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
          <p style="color: #2D5F8B; font-size: 12px; word-break: break-all;">${activationUrl}</p>
          
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">This link will expire in 24 hours. If you didn't expect this email, please ignore it.</p>
        </div>
      `
    };

    // 3. Actually SEND the mail
    const info = await transporter.sendMail(mailOptions);
    console.log(`Activation email sent successfully to ${email}: ${info.messageId}`);
    return { success: true };
    
  } catch (err) {
    console.error("Failed to send activation email:", err);
    return { success: false, error: err.message };
  }
}