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

    // 2. Generate a highly unique MRN (e.g., MRN-84729104)
    let generatedMrn;
    let isUniqueMrn = false;
    
    while (!isUniqueMrn) {
      // Generates an 8-digit random number
      generatedMrn = `MRN-${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      // Double check the database to ensure it hasn't been used
      const existingRecord = await prisma.patient.findUnique({ where: { mrn: generatedMrn } });
      
      if (!existingRecord) {
        isUniqueMrn = true;
      }
    }

    // 3. Hash password (use provided or generate a secure temporary one)
    const passwordToHash = data.password || (Math.random().toString(36).slice(-10) + 'A1!z');
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    // 4. Create the patient directly as verified, inserting the auto-generated MRN
    await prisma.patient.create({
      data: {
        mrn: generatedMrn,
        fullName: data.fullName,
        email: email,
        phoneNumber: phoneNumber,
        passwordHash: passwordHash,
        age: parseInt(data.age),
        gender: data.gender,
        oaDiagnosis: data.oaDiagnosis === 'Yes',
        activityLevel: data.activityLevel,
        isVerified: true,
        deviceMac: data.deviceMac || null, // Handles empty strings smoothly
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