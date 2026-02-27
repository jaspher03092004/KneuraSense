'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateDeviceSettings(patientId, settings) {
  try {
    if (settings.vibrationIntensity < 1 || settings.vibrationIntensity > 3) {
      return { success: false, error: 'Invalid intensity value.' };
    }

    // Format the MAC address: strip non-alphanumeric chars and uppercase it
    let formattedMac = null;
    if (settings.deviceMac && settings.deviceMac.trim() !== '') {
      formattedMac = settings.deviceMac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
      
      if (formattedMac.length !== 12) {
        return { success: false, error: 'MAC address must be exactly 12 characters.' };
      }
    }

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        highStressAlerts: settings.highStressAlerts,
        vibrationEnabled: settings.vibrationEnabled,
        vibrationIntensity: settings.vibrationIntensity,
        ledEnabled: settings.ledEnabled,
        deviceMac: formattedMac, // Save the MAC address
      },
    });

    revalidatePath(`/patient/${patientId}/settings`);
    return { success: true };
  } catch (error) {
    console.error('Error updating device settings:', error);
    
    // Handle uniqueness constraint violation (e.g., MAC already claimed)
    if (error.code === 'P2002') {
      return { success: false, error: 'This device is already linked to another account.' };
    }
    return { success: false, error: 'Failed to update settings.' };
  }
}