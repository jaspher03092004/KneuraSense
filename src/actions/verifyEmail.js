'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// PHASE 1: Send OTP (NO USER SAVED YET)
export async function initiateRegistration(formData) {
  try {
    const email = formData.get('email')?.trim().toLowerCase();
    const phoneNumber = formData.get('phoneNumber')?.trim();
    const fullName = formData.get('fullName')?.trim();

    if (!email || !phoneNumber || !fullName) {
      return { success: false, error: 'Missing required fields.' };
    }

    // 1. Duplicate Checks (Ensure email/phone aren't already taken before sending OTP)
    const existingClinician = await prisma.clinician.findUnique({ where: { email } });
    const existingPatient = await prisma.patient.findUnique({ where: { email } });
    if (existingClinician || existingPatient) {
      return { success: false, error: 'This email is already registered.' };
    }

    const existingPatientPhone = await prisma.patient.findUnique({ where: { phoneNumber } });
    const existingClinicianPhone = await prisma.clinician.findUnique({ where: { phone_number: phoneNumber } });
    if (existingPatientPhone || existingClinicianPhone) {
      return { success: false, error: 'This phone number is already registered.' };
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // e.g. "482910"
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    // 3. Clear old tokens and save ONLY the OTP token to Supabase
    await prisma.emailVerificationToken.deleteMany({ where: { email } });
    await prisma.emailVerificationToken.create({ data: { email, token: otp, expires } });

    // 4. Send the Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"KneuraSense" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your KneuraSense Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
          <h2 style="color: #0f172a;">Verify Your Email</h2>
          <p style="color: #475569; font-size: 16px;">Hello ${fullName},</p>
          <p style="color: #475569; font-size: 16px;">Please use the verification code below to complete your registration:</p>
          <div style="margin: 30px 0; padding: 15px; background-color: #f1f5f9; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">
            ${otp}
          </div>
          <p style="color: #475569; font-size: 14px;">This code will expire in 15 minutes.</p>
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
      await prisma.clinician.create({
        data: {
          full_name: data.fullName?.trim(),
          email,
          phone_number: data.phoneNumber?.trim(),
          password_hash: hashed,
          specialization: data.specialization?.trim() || 'General',
          isVerified: true, // Since they just verified the OTP
        },
      });
    } else {
      await prisma.patient.create({
        data: {
          fullName: data.fullName?.trim(),
          age: parseInt(data.age) || null,
          gender: data.gender || null,
          phoneNumber: data.phoneNumber?.trim(),
          email,
          passwordHash: hashed,
          oaDiagnosis: data.oaDiagnosis === 'Yes',
          affectedKnee: data.affectedKnee || null,
          painSeverity: parseInt(data.painSeverity) || null,
          occupation: data.occupation || null,
          activityLevel: data.activityLevel || null,
          isVerified: true, // Since they just verified the OTP
        },
      });
    }

    // 3. Cleanup: Delete the used OTP
    await prisma.emailVerificationToken.delete({ where: { id: verificationRecord.id } });

    return { success: true, message: 'Account successfully created!' };

  } catch (error) {
    console.error('Finalize Registration Error:', error);
    
    if (error.code === 'P2002') {
      return { success: false, error: 'This account was already created during verification.' };
    }
    
    return { success: false, error: 'Failed to save account. Please try again.' };
  }
}