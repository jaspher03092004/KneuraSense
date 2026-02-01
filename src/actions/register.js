'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function registerUser(formData) {
  try {
    const data = Object.fromEntries(formData);

    const role = (data.role || 'Patient').toString();
    const email = data.email?.trim().toLowerCase();
    const fullName = data.fullName?.trim();
    const password = data.password?.trim();

    if (!fullName || !email || !password) {
      return { success: false, error: 'Missing required fields.' };
    }

    // Check email across both tables to avoid duplicates
    const existingClinician = await prisma.clinician.findUnique({ where: { email } });
    const existingPatient = await prisma.patient.findUnique({ where: { email } });

    if (existingClinician || existingPatient) {
      return { success: false, error: 'Email already registered. Please log in or use a different email.' };
    }

    const hashed = await bcrypt.hash(password, 10);

    if (role === 'Clinician') {
      const specialization = data.specialization?.trim() || 'General';

      await prisma.clinician.create({
        data: {
          full_name: fullName,
          email,
          password_hash: hashed,
          specialization,
        },
      });

      return { success: true, message: 'Clinician account created successfully.' };
    }

    // Default: create Patient
    await prisma.patient.create({
      data: {
        fullName,
        age: data.age ? parseInt(data.age) : null,
        gender: data.gender || null,
        phoneNumber: data.phoneNumber?.trim() || '',
        email,
        passwordHash: hashed,
        oaDiagnosis: data.oaDiagnosis === 'Yes',
        affectedKnee: data.affectedKnee || null,
        painSeverity: data.painSeverity ? parseInt(data.painSeverity) : null,
        occupation: data.occupation || null,
        activityLevel: data.activityLevel || null,
      },
    });

    return { success: true, message: 'Patient account created successfully.' };
  } catch (error) {
    console.error('Registration error:', error);

    if (error?.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return { success: false, error: 'Email already registered. Please log in or use a different email.' };
      }
      if (field === 'phoneNumber') {
        return { success: false, error: 'Phone number already registered.' };
      }
    }

    // Provide more detail in development to help debugging
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'An error occurred during registration. Please try again.' };
    }

    return { success: false, error: `Registration failed: ${error?.message || String(error)}` };
  }
}