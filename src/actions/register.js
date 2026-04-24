'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// PHASE 1: Send OTP 
export async function initiateRegistration(formData) {
  try {
    const email = formData.get('email')?.trim().toLowerCase();
    const phoneNumber = formData.get('phoneNumber')?.trim();
    const fullName = formData.get('fullName')?.trim();

    if (!email || !phoneNumber || !fullName) {
      return { success: false, error: 'Missing required fields.' };
    }

    // 1. MITIGATE ENUMERATION & SPAM: Rate Limiting
    const recentToken = await prisma.emailVerificationToken.findFirst({
      where: { 
        email, 
        createdAt: { gte: new Date(Date.now() - 60 * 1000) } // 1 minute cooldown
      }
    });

    if (recentToken) {
       return { success: false, error: 'Please wait a minute before requesting another code.' };
    }

    // 2. Duplicate Checks
    const existingClinician = await prisma.clinician.findUnique({ where: { email } });
    const existingPatient = await prisma.patient.findUnique({ where: { email } });
    
    // ANTI-ENUMERATION: Pretend it succeeded even if they exist
    if (existingClinician || existingPatient) {
      // Delay response slightly to simulate email sending time
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'If the email is not registered, an OTP was sent.', email };
    }

    const existingPatientPhone = await prisma.patient.findUnique({ where: { phoneNumber } });
    const existingClinicianPhone = await prisma.clinician.findUnique({ where: { phone_number: phoneNumber } });
    if (existingPatientPhone || existingClinicianPhone) {
      // Generic failure for phone enumeration
      return { success: false, error: 'Registration failed due to conflicting details.' }; 
    }

    // 3. GENERATE SECURE 6-DIGIT OTP
    const otp = crypto.randomInt(100000, 1000000).toString(); 
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    // 4. Clear old tokens and save ONLY the OTP token to the database
    await prisma.emailVerificationToken.deleteMany({ where: { email } });
    await prisma.emailVerificationToken.create({ data: { email, token: otp, expires } });

    // Ensure we have a valid base URL for the email images
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const safeBaseUrl = baseUrl.replace(/\/$/, '');

    // 5. Send the Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"KneuraSense" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your KneuraSense Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          
          <img src="${safeBaseUrl}/images/email/Header.png" alt="KneuraSense Header" style="width: 100%; height: auto; display: block; border-bottom: 1px solid #f1f5f9;" />
          
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 24px;">Verify Your Email</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello <strong>${fullName}</strong>,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Please use the verification code below to complete your KneuraSense registration:</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
              ${otp}
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
              This code will securely expire in 15 minutes. If you did not request this code, please ignore this email.
            </p>
          </div>

          <img src="${safeBaseUrl}/images/email/Footer.png" alt="KneuraSense Footer" style="width: 100%; height: auto; display: block; border-top: 1px solid #f1f5f9;" />
          
        </div>
      `,
    });

    return { success: true, message: 'OTP sent to email.', email };

  } catch (error) {
    console.error('Initiate Registration Error:', error);
    return { success: false, error: 'Failed to send verification code. Please try again.' };
  }
}

// PHASE 2: Verify OTP & Save User to DB
export async function finalizeRegistration(formData, otp) {
  try {
    const data = Object.fromEntries(formData);
    const email = data.email?.trim().toLowerCase();
    const role = (data.role || 'Patient').toString();
    const password = data.password?.trim();
    const phoneNumber = data.phoneNumber?.trim();
    const fullName = data.fullName?.trim();

    if (!email || !otp || !password) {
      return { success: false, error: 'Missing required fields for finalization.' };
    }

    // 1. Validate the OTP Token
    const verificationRecord = await prisma.emailVerificationToken.findFirst({
      where: { email, token: otp.toString() }
    });

    if (!verificationRecord) {
      return { success: false, error: 'Invalid verification code.' };
    }

    if (verificationRecord.expires < new Date()) {
      return { success: false, error: 'Verification code has expired. Please refresh and try again.' };
    }

    // 2. OTP is Valid! Now we securely hash the password and save to the Database
    const hashed = await bcrypt.hash(password, 10);

    if (role === 'Clinician') {
      const specialization = data.specialization?.trim() || 'General';
      const licenseNumber = data.licenseNumber?.trim();

      const newClinician = await prisma.clinician.create({
        data: {
          full_name: fullName,
          email,
          phone_number: phoneNumber,
          password_hash: hashed,
          specialization,
          licenseNumber: licenseNumber,
          isVerified: true,
          isApproved: false, // Remains false until admin approves
        },
      });

      // Send a notification email to the Admin
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

      if (!adminEmail) {
        console.error("CRITICAL ERROR: ADMIN_NOTIFICATION_EMAIL is not defined in environment variables.");
        return { 
          success: true, 
          message: 'Account created! Please wait for administrative approval.' 
        };
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { 
          user: process.env.SMTP_USER, 
          pass: process.env.SMTP_PASS 
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const safeBaseUrl = baseUrl.replace(/\/$/, ''); 
      const adminDashboardLink = `${safeBaseUrl}/admin/dashboard`;

      await transporter.sendMail({
        from: `"KneuraSense Security" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: 'ACTION REQUIRED: New Clinician Registration',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <img src="${safeBaseUrl}/images/email/Header.png" alt="KneuraSense Header" style="width: 100%; height: auto; display: block; border-bottom: 1px solid #f1f5f9;" />
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #b91c1c; margin-top: 0; font-size: 24px; text-align: center;">New Clinician Pending Approval</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">A new user has registered as a clinician and successfully verified their email address.</p>
              
              <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; color: #334155; font-size: 15px;"><strong>Name:</strong> ${newClinician.full_name}</p>
                <p style="margin: 0 0 10px 0; color: #334155; font-size: 15px;"><strong>Email:</strong> ${newClinician.email}</p>
                <p style="margin: 0 0 10px 0; color: #334155; font-size: 15px;"><strong>Phone:</strong> ${newClinician.phone_number}</p>
                <p style="margin: 0; color: #334155; font-size: 15px;"><strong>Specialization:</strong> ${newClinician.specialization}</p>
              </div>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">Please log in to the Admin Dashboard to review and approve this account:</p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${adminDashboardLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Go to Admin Dashboard
                </a>
              </div>
            </div>

            <img src="${safeBaseUrl}/images/email/Footer.png" alt="KneuraSense Footer" style="width: 100%; height: auto; display: block; border-top: 1px solid #f1f5f9;" />
            
          </div>
        `
      });
    } else {
      // Generate a unique Medical Record Number (MRN) for the patient
      const generatedMrn = `MRN-${Math.floor(10000000 + Math.random() * 90000000)}`;

      await prisma.patient.create({
        data: {
          mrn: generatedMrn,
          fullName: fullName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender || null,
          heightCm: data.heightCm ? parseFloat(data.heightCm) : null,
          weightKg: data.weightKg ? parseFloat(data.weightKg) : null,
          emergencyContactName: data.emergencyContactName?.trim() || null,
          emergencyContactPhone: data.emergencyContactPhone?.trim() || null,
          phoneNumber: phoneNumber,
          email,
          passwordHash: hashed,
          oaDiagnosis: data.oaDiagnosis === 'Yes',
          affectedKnee: data.affectedKnee || null,
          occupation: data.occupation || null,
          activityLevel: data.activityLevel || null,
          consentGiven: true, 
          consentTimestamp: new Date(),
          isVerified: true, 
        },
      });
    }

    // 3. Cleanup: Delete the used OTP
    await prisma.emailVerificationToken.delete({ where: { id: verificationRecord.id } });

    return { success: true, message: 'Account successfully created!' };

  } catch (error) {
    console.error('Finalize Registration Error:', error);
    
    if (error.code === 'P2002') {
      return { success: false, error: 'This account was already created or the credentials are taken.' };
    }
    
    return { success: false, error: 'Failed to save account. Please try again.' };
  }
}