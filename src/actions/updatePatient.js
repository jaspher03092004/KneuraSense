'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updatePatientProfile(formData) {
  const id = formData.get('id');
  
  // Extract and Format Values
  const rawData = {
    fullName: formData.get('fullName'),
    phoneNumber: formData.get('phoneNumber'),
    occupation: formData.get('occupation'),
    gender: formData.get('gender'),
    emergencyContactName: formData.get('emergencyContactName'),
    emergencyContactPhone: formData.get('emergencyContactPhone'),
    affectedKnee: formData.get('affectedKnee'),
    activityLevel: formData.get('activityLevel'),
  };

  // Handle Date of Birth mapping
  const dob = formData.get('dateOfBirth');
  if (dob) {
    rawData.dateOfBirth = new Date(dob);
  }

  // Parse Floats for biometrics
  const height = formData.get('heightCm');
  if (height) rawData.heightCm = parseFloat(height);

  const weight = formData.get('weightKg');
  if (weight) rawData.weightKg = parseFloat(weight);

  try {
    await prisma.patient.update({
      where: { id },
      data: rawData,
    });

    revalidatePath(`/patient/${id}/myProfile`);
    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    console.error('Update failed:', error);
    return { success: false, message: 'Failed to update profile' };
  }
}