'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

export async function login(email, password, rememberMe = false) {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const lookupEmail = email.trim().toLowerCase();
    let user = null;
    let role = null;
    let userId = null;
    let authError = null;

    // 1. Fetch all potential accounts
    const admin = await prisma.admin.findUnique({ where: { email: lookupEmail } });
    const clinician = await prisma.clinician.findUnique({ where: { email: lookupEmail } });
    const patient = await prisma.patient.findUnique({ where: { email: lookupEmail } });

    // 2. Validate Admin first
    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
      if (passwordMatch) {
        user = admin;
        role = 'admin';
        userId = admin.id;
      } else {
        authError = 'Invalid email or password.';
      }
    }

    // 3. If not an Admin, validate Clinician
    if (!user && clinician) {
      const passwordMatch = await bcrypt.compare(password, clinician.password_hash);
      if (passwordMatch) {
        if (!clinician.isVerified) {
          authError = 'Please verify your email address before logging in.';
        } else if (!clinician.isApproved) {
          authError = 'Your account is pending administrator approval. Please wait for an admin to review your credentials.';
        } else {
          user = clinician;
          role = 'clinician';
          userId = clinician.clinician_id;
        }
      }
    }

    // 4. If neither Admin nor approved Clinician, validate Patient
    if (!user && patient) {
      const passwordMatch = await bcrypt.compare(password, patient.passwordHash);
      if (passwordMatch) {
        if (!patient.isVerified) {
          // Only overwrite the error if we didn't already have a clinician error
          if (!authError) authError = 'Please verify your email address before logging in.';
        } else {
          // Successful Patient Login
          user = patient;
          role = 'patient';
          userId = patient.id;
          authError = null; // Clear any previous clinician errors
        }
      }
    }

    // 5. Prevent User Enumeration / Handle failed login
    if (!user) {
      return { success: false, error: authError || 'Invalid email or password.' };
    }

    // 6. Safely encode JWT Secret
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      console.error("CRITICAL SECURITY ERROR: JWT_SECRET is missing.");
      return { success: false, error: 'Server configuration error. Please contact admin.' };
    }

    const encodedSecret = new TextEncoder().encode(secretKey);

    // 7. Create Secure Session (JWT)
    const expiration = rememberMe ? '30d' : '24h';
    const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

    const token = await new SignJWT({ userId, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(encodedSecret);

    // 8. Set HTTP-Only Cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: cookieMaxAge,
    });

    return { success: true, userId, role, message: 'Login successful' };
  } catch (error) {
    console.error('Login Error Details:', error);
    
    if (error.message && error.message.includes('jose')) {
      return { success: false, error: 'Server configuration error: Missing dependencies.' };
    }

    return { success: false, error: 'An error occurred during login. Please try again later.' };
  }
}