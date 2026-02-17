'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function clinicianRegisterPatient(formData) {
  try {
    const data = Object.fromEntries(formData);
    const email = data.email?.trim().toLowerCase();
    const phoneNumber = data.phoneNumber?.trim();
    
    // 1. Check for duplicates
    const existingEmail = await prisma.patient.findUnique({ where: { email } });
    if (existingEmail) return { success: false, error: 'Email already registered.' };
    
    const existingPhone = await prisma.patient.findUnique({ where: { phoneNumber } });
    if (existingPhone) return { success: false, error: 'Phone number already registered.' };

    // 2. Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 3. Create the patient directly as verified
    await prisma.patient.create({
      data: {
        fullName: data.fullName,
        email: email,
        phoneNumber: phoneNumber,
        passwordHash: passwordHash,
        age: parseInt(data.age),
        gender: data.gender,
        oaDiagnosis: data.oaDiagnosis === 'Yes',
        activityLevel: data.activityLevel,
        isVerified: true // Instantly verified because clinician created it
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Direct Registration Error:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Account credentials already taken.' };
    }
    return { success: false, error: 'Failed to create patient record.' };
  }
}