'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// 1. Request Password Reset (Generates Token & Sends Email)
export async function requestPasswordReset(formData) {
  try {
    const email = formData.get('email')?.trim().toLowerCase();
    
    if (!email) {
      return { success: false, error: 'Email is required' };
    }

    // 1. Check if user exists in either the Patient or Clinician table
    const patient = await prisma.patient.findUnique({ where: { email } });
    const clinician = await prisma.clinician.findUnique({ where: { email } });

    // SECURITY: Prevent User Enumeration
    // If the email is not found, we still return "success" so attackers 
    // cannot use this form to guess which emails are registered.
    if (!patient && !clinician) {
      return { 
        success: true, 
        message: 'If an account exists, a reset link has been sent to your email.' 
      };
    }

    // Get the user's name for a personalized email greeting
    const userName = patient ? patient.fullName : clinician.full_name;

    // 2. Generate a secure, random token and set expiration (1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); 

    // 3. Clear any existing reset tokens for this email to prevent spam/clutter
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // 4. Save the new token in the database
    await prisma.passwordResetToken.create({
      data: { email, token, expires }
    });

    // 5. Create the reset link
    // Fallback to localhost for local development if the env var is missing
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    // 6. Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 7. Define Email Content (HTML format)
    const mailOptions = {
      from: `"KneuraSense Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your KneuraSense Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f172a;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 16px;">Hello ${userName},</p>
          <p style="color: #475569; font-size: 16px;">We received a request to reset the password for your KneuraSense account. Click the button below to choose a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #475569; font-size: 14px;">If you did not request this password reset, please ignore this email. This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} KneuraSense Edge AI Monitoring. All rights reserved.
          </p>
        </div>
      `,
    };

    // 8. Send the email
    await transporter.sendMail(mailOptions);

    return { 
      success: true, 
      message: 'If an account exists, a reset link has been sent to your email.' 
    };

  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: 'Failed to send reset email. Please check server configuration.' };
  }
}

// 2. Perform Password Reset (Verifies Token & Updates DB)
export async function resetPassword(formData) {
  try {
    const token = formData.get('token');
    const newPassword = formData.get('password');

    if (!token || !newPassword) {
      return { success: false, error: 'Missing required fields.' };
    }

    // 1. Find the token in the database
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    // 2. Validate token existence and check if it has expired
    if (!resetTokenRecord || resetTokenRecord.expires < new Date()) {
      return { success: false, error: 'Invalid or expired reset token. Please request a new one.' };
    }

    const email = resetTokenRecord.email;
    
    // 3. Hash the new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update the password for the correct user type
    const isPatient = await prisma.patient.findUnique({ where: { email } });
    
    if (isPatient) {
      await prisma.patient.update({
        where: { email },
        data: { passwordHash: hashedPassword }
      });
    } else {
      await prisma.clinician.update({
        where: { email },
        data: { password_hash: hashedPassword }
      });
    }

    // 5. Delete the token immediately so it cannot be used again (Security)
    await prisma.passwordResetToken.delete({
      where: { id: resetTokenRecord.id }
    });

    return { success: true, message: 'Password has been successfully reset.' };

  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Failed to reset password. Please try again.' };
  }
}