'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateClinicianPreferences(clinicianId, preferences) {
  try {
    await prisma.clinician.update({
      where: { clinician_id: clinicianId },
      data: {
        criticalAlerts: preferences.criticalAlerts,
        emailAlerts: preferences.emailAlerts,
        compactView: preferences.compactView,
      },
    });

    revalidatePath(`/clinician/${clinicianId}/settings`);
    return { success: true, message: 'Preferences saved successfully' };
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return { success: false, message: 'Failed to save preferences' };
  }
}