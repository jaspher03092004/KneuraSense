'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function login(email, password) {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const lookupEmail = email.trim().toLowerCase();

    // Try clinician first
    const clinician = await prisma.clinician.findUnique({ where: { email: lookupEmail } });
    if (clinician) {
      const ok = await bcrypt.compare(password, clinician.password_hash);
      if (!ok) return { success: false, error: 'Invalid email or password.' };

      return { success: true, userId: clinician.clinician_id, role: 'clinician', message: 'Login successful' };
    }

    // Try patient
    const patient = await prisma.patient.findUnique({ where: { email: lookupEmail } });
    if (patient) {
      const ok = await bcrypt.compare(password, patient.passwordHash);
      if (!ok) return { success: false, error: 'Invalid email or password.' };

      return { success: true, userId: patient.id, role: 'patient', message: 'Login successful' };
    }

    return { success: false, error: 'Invalid email or password.' };
  } catch (error) {
    console.error('Login error:', error);
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'An error occurred during login. Please try again.' };
    }

    return { success: false, error: `Login failed: ${error?.message || String(error)}` };
  }
}
