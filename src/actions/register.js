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
          isApproved: false,
        },
      });

      // A. Generate a secure 32-byte hex token
      const approvalToken = crypto.randomBytes(32).toString('hex');

      // B. Save it to the database
      await prisma.adminApprovalToken.create({
        data: {
          clinicianId: newClinician.clinician_id, // Make sure to use newClinician here
          token: approvalToken,
        }
      });

      // C. Build the approval URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      // Using .replace to strip any accidental trailing slashes from the .env variable
      const safeBaseUrl = baseUrl.replace(/\/$/, ''); 
      const approvalLink = `${safeBaseUrl}/api/approve-clinician?token=${approvalToken}`;

      // D. Send email to the Admin
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { 
          user: process.env.SMTP_USER, 
          pass: process.env.SMTP_PASS 
        },
      });

      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

      // Handle the error if the admin email is not defined
      if (!adminEmail) {
        console.error("CRITICAL ERROR: ADMIN_NOTIFICATION_EMAIL is not defined in environment variables.");
        // We return success to the user because their account was created and verified,
        // but we log the error so the developer knows the admin wasn't notified.
        return { 
          success: true, 
          message: 'Account created! Please wait for administrative approval.' 
        };
      }

      await transporter.sendMail({
        from: `"KneuraSense Security" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: 'ACTION REQUIRED: New Clinician Registration',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #b91c1c;">New Clinician Pending Approval</h2>
            <p>A new user has registered as a clinician and successfully verified their email address.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${newClinician.full_name}</p>
              <p><strong>Email:</strong> ${newClinician.email}</p>
              <p><strong>Phone:</strong> ${newClinician.phone_number}</p>
              <p><strong>Specialization:</strong> ${newClinician.specialization}</p>
            </div>
            <p>If you recognize and authorize this user, click the button below to grant them access to the platform:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${approvalLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Approve Clinician Account
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b;">If you do not recognize this user, simply ignore this email. They cannot log in without your approval.</p>
          </div>
        `
      });
    } else {
      await prisma.patient.create({
        data: {
          fullName: fullName,
          age: data.age ? parseInt(data.age) : null,
          gender: data.gender || null,
          phoneNumber: phoneNumber,
          email,
          passwordHash: hashed,
          oaDiagnosis: data.oaDiagnosis === 'Yes',
          affectedKnee: data.affectedKnee || null,
          painSeverity: data.painSeverity ? parseInt(data.painSeverity) : null,
          occupation: data.occupation || null,
          activityLevel: data.activityLevel || null,
          isVerified: true, // Mark as verified immediately
        },
      });
    }

    // 3. Cleanup: Delete the used OTP
    await prisma.emailVerificationToken.delete({ where: { id: verificationRecord.id } });

    return { success: true, message: 'Account successfully created!' };

  } catch (error) {
    console.error('Finalize Registration Error:', error);
    
    // Catch Prisma unique constraint errors
    if (error.code === 'P2002') {
      return { success: false, error: 'This account was already created or the credentials are taken.' };
    }
    
    return { success: false, error: 'Failed to save account. Please try again.' };
  }
}