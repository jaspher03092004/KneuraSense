'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addIntervention(formData) {
  const patientId = formData.get('patientId');
  const clinicianId = formData.get('clinicianId');
  const title = formData.get('title');
  const type = formData.get('type');
  const notes = formData.get('notes');

  if (!patientId || !clinicianId || !title || !type) {
    throw new Error('Missing required fields');
  }

  try {
    await prisma.intervention.create({
      data: {
        patientId,
        clinicianId,
        title,
        type,
        notes,
      }
    });

    // Refresh the page data automatically after saving
    revalidatePath(`/clinician/${clinicianId}/interventions`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add intervention:", error);
    return { success: false, error: 'Database error' };
  }
}