'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function acknowledgeIntervention(interventionId, patientId) {
  try {
    await prisma.intervention.update({
      where: { id: interventionId },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
      }
    });

    // Automatically refresh both the Activity and Dashboard pages to show the checkmark
    revalidatePath(`/patient/${patientId}/activity`);
    revalidatePath(`/patient/${patientId}/dashboard`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to acknowledge intervention:", error);
    return { success: false, error: 'Database error' };
  }
}