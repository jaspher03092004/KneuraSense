'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateClinicianProfile(formData) {
  const clinician_id = formData.get('clinician_id');
  
  // Extract and format values based on the Clinician Prisma schema
  const rawData = {
    full_name: formData.get('full_name'),
    specialization: formData.get('specialization'),
    phone_number: formData.get('phone_number'),
  };

  try {
    await prisma.clinician.update({
      where: { clinician_id },
      data: rawData,
    });

    revalidatePath(`/clinician/${clinician_id}/myProfile`);
    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    console.error('Update failed:', error);
    return { success: false, message: 'Failed to update profile' };
  }
}