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
    const phoneNumber = data.phoneNumber?.trim();

    // 1. Universal Validation: Phone Number is now REQUIRED for everyone
    if (!fullName || !email || !password || !phoneNumber) {
      return { success: false, error: 'Missing required fields.' };
    }

    // --- PRIORITY CHECK 1: EMAIL ---
    const existingClinician = await prisma.clinician.findUnique({ where: { email } });
    const existingPatient = await prisma.patient.findUnique({ where: { email } });

    if (existingClinician || existingPatient) {
      return { success: false, error: 'Email already registered. Please log in or use a different email.' };
    }

    // --- PRIORITY CHECK 2: PHONE NUMBER ---
    // Check Patient Table
    const existingPatientPhone = await prisma.patient.findUnique({ 
      where: { phoneNumber } 
    });
    
    // Check Clinician Table (Note: field is 'phone_number')
    const existingClinicianPhone = await prisma.clinician.findUnique({ 
      where: { phone_number: phoneNumber } 
    });

    if (existingPatientPhone || existingClinicianPhone) {
      return { success: false, error: 'Phone number already registered.' };
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create Clinician
    if (role === 'Clinician') {
      const specialization = data.specialization?.trim() || 'General';

      await prisma.clinician.create({
        data: {
          full_name: fullName,
          email,
          phone_number: phoneNumber, // <--- Now saving phone number
          password_hash: hashed,
          specialization,
        },
      });

      return { success: true, message: 'Clinician account created successfully.' };
    }

    // Create Patient
    await prisma.patient.create({
      data: {
        fullName,
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
      },
    });

    return { success: true, message: 'Patient account created successfully.' };

  } catch (error) {
    console.error('Registration error:', error);

    const errorMessage = error?.message || String(error);

    // Fallback for race conditions
    if (errorMessage.includes('Unique constraint failed') || error?.code === 'P2002') {
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        return { success: false, error: 'Email already registered.' };
      }
      if (errorMessage.includes('phoneNumber') || errorMessage.includes('phone_number') || errorMessage.includes('Phone')) {
        return { success: false, error: 'Phone number already registered.' };
      }
    }

    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'An error occurred during registration. Please try again.' };
    }

    return { success: false, error: `Registration failed: ${errorMessage}` };
  }
}