'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateDeviceSettings(patientId, settings) {
  try {
    // Validate intensity range (1=Low, 2=Medium, 3=High)
    if (settings.vibrationIntensity < 1 || settings.vibrationIntensity > 3) {
      return { success: false, error: 'Invalid intensity value.' };
    }

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        highStressAlerts: settings.highStressAlerts,
        vibrationEnabled: settings.vibrationEnabled,
        vibrationIntensity: settings.vibrationIntensity,
        ledEnabled: settings.ledEnabled,
      },
    });

    // Refresh the settings page data to reflect the "Last changed" time
    revalidatePath(`/patient/${patientId}/settings`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating device settings:', error);
    return { success: false, error: 'Failed to update settings.' };
  }
}