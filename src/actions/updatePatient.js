'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updatePatientProfile(formData) {
  const id = formData.get('id');
  
  // Extract and Format Values
  const rawData = {
    fullName: formData.get('fullName'),
    age: parseInt(formData.get('age')), // Convert text to number
    phoneNumber: formData.get('phoneNumber'),
    occupation: formData.get('occupation'),
    
    // Medical / Lifestyle Fields
    affectedKnee: formData.get('affectedKnee'),
    activityLevel: formData.get('activityLevel'),
    // Note: We usually keep 'oaDiagnosis' read-only for patients
  };

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