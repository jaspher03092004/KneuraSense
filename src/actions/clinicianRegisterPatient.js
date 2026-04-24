'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { sendActivationEmail } from '@/lib/email';

export async function clinicianRegisterPatient(formData) {
  try {
    const email = formData.get('email')?.toLowerCase();
    const phoneNumber = formData.get('phoneNumber');
    const clinicianId = formData.get('registeredByClinicianId');

    // 1. Basic validation: Check if patient already exists
    const existingPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          { email: email },
          { phoneNumber: phoneNumber }
        ]
      }
    });

    if (existingPatient) {
      return { error: 'A patient with this email or phone number already exists.' };
    }

    // 2. Generate a unique MRN (Medical Record Number)
    const generatedMrn = `MRN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 3. Generate Secure Activation Token (instead of a default password)
    // This meets standard medical privacy needs as only the patient will know their password.
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 24 hours

    // 4. Create the patient record
    const newPatient = await prisma.patient.create({
      data: {
        mrn: generatedMrn,
        fullName: formData.get('fullName'),
        email: email,
        phoneNumber: phoneNumber,
        
        // Demographics & Biometrics
        dateOfBirth: new Date(formData.get('dateOfBirth')),
        gender: formData.get('gender'),
        heightCm: formData.get('heightCm') ? parseFloat(formData.get('heightCm')) : null,
        weightKg: formData.get('weightKg') ? parseFloat(formData.get('weightKg')) : null,
        
        // Medical Context
        oaDiagnosis: formData.get('oaDiagnosis') === 'Yes',
        affectedKnee: formData.get('affectedKnee') || 'Both',
        activityLevel: formData.get('activityLevel'),
        occupation: formData.get('occupation') || null,
        
        // Emergency Contact
        emergencyContactName: formData.get('emergencyContactName') || null,
        emergencyContactPhone: formData.get('emergencyContactPhone') || null,

        // Activation & Verification
        activationToken: activationToken,
        activationExpires: activationExpires,
        isVerified: false, // Remains false until they click the email link
        
        // Device & Clinician Link
        deviceMac: formData.get('deviceMac') || null,
        clinicianId: clinicianId,
      }
    });

    // 5. Send the activation email via the email utility
    // Ensure you have implemented sendActivationEmail in src/lib/email.js
    try {
      await sendActivationEmail(newPatient.email, activationToken, newPatient.fullName);
    } catch (emailError) {
      console.error('Email Delivery Failed:', emailError);
      // We don't roll back the patient creation, but we log the error
    }

    revalidatePath(`/clinician/${clinicianId}/patients`);
    return { success: true, patientId: newPatient.id };

  } catch (error) {
    console.error('Direct Registration Error:', error);
    return { error: 'Failed to create patient record. Please check server logs.' };
  }
}