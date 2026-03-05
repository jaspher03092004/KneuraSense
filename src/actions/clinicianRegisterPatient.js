'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function clinicianRegisterPatient(formData) {
  try {
    const data = Object.fromEntries(formData);
    const email = data.email?.trim().toLowerCase();
    const phoneNumber = data.phoneNumber?.trim();
    
    // 1. Check for duplicates ACROSS BOTH TABLES
    const existingPatientEmail = await prisma.patient.findUnique({ where: { email } });
    const existingClinicianEmail = await prisma.clinician.findUnique({ where: { email } });
    
    if (existingPatientEmail || existingClinicianEmail) {
      return { success: false, error: 'This email is already registered in the system.' };
    }
    
    const existingPatientPhone = await prisma.patient.findUnique({ where: { phoneNumber } });
    const existingClinicianPhone = await prisma.clinician.findUnique({ where: { phone_number: phoneNumber } });
    
    if (existingPatientPhone || existingClinicianPhone) {
      return { success: false, error: 'This phone number is already registered in the system.' };
    }

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
        isVerified: true,
        deviceMac: data.deviceMac, // Ensure this matches your form payload
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