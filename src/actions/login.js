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

    // 1. Find User (Clinician or Patient)
    const clinician = await prisma.clinician.findUnique({ where: { email: lookupEmail } });
    
    if (clinician) {
      user = clinician;
      role = 'clinician';
      userId = clinician.clinician_id;
    } else {
      const patient = await prisma.patient.findUnique({ where: { email: lookupEmail } });
      if (patient) {
        user = patient;
        role = 'patient';
        userId = patient.id;
      }
    }

    // 2. Prevent User Enumeration
    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // 3. ENFORCE EMAIL VERIFICATION (Added for OTP System)
    if (user.isVerified === false) {
      return { 
        success: false, 
        error: 'Please verify your email address before logging in. If you lost the code, please register again.' 
      };
    }

    if (role === 'clinician' && user.isApproved === false) {
      return { 
        success: false, 
        error: 'Your account is pending administrator approval. Please wait for an admin to review your credentials.' 
      };
    }

    // 4. Verify Password safely supporting both table schemas
    const hashToCompare = user.password_hash || user.passwordHash;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);
    
    if (!passwordMatch) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // 5. Safely encode JWT Secret
    const secretKey = process.env.JWT_SECRET;
    
    if (!secretKey) {
      console.error("CRITICAL SECURITY ERROR: JWT_SECRET is missing.");
      return { success: false, error: 'Server configuration error. Please contact admin.' };
    }

    const encodedSecret = new TextEncoder().encode(secretKey);

    // 6. Create Secure Session (JWT)
    const expiration = rememberMe ? '30d' : '24h';
    const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

    const token = await new SignJWT({ userId, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(encodedSecret);

    // 7. Set HTTP-Only Cookie (Next.js 15 compatible using await)
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