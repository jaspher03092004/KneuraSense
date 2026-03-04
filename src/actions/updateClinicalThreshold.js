// src/actions/updateClinicalThreshold.js
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateClinicalThreshold(clinicianId, patientId, newThreshold) {
  try {
    if (newThreshold < 0 || newThreshold > 100) {
      return { success: false, error: 'Clinical threshold must be between 0 and 100.' };
    }

    const patient = await prisma.patient.findFirst({
      where: { 
        id: patientId,
        clinicianId: clinicianId 
      }
    });

    if (!patient) {
      return { success: false, error: 'Unauthorized. Patient not found under your care.' };
    }

    // Capture the updated patient record
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: { riskThreshold: newThreshold },
    });

    revalidatePath(`/patient/${patientId}/myProfile`);
    revalidatePath(`/patient/${patientId}/settings`);
    revalidatePath(`/clinician/${clinicianId}/interventions`);

    revalidatePath(`/clinician/${clinicianId}/patients`);
    revalidatePath(`/clinician/${clinicianId}/dashboard`);
    revalidatePath(`/clinician/${clinicianId}/dashboard/all-patients`);
    
    // Return the updated patient so the MQTT push has the freshest config
    return { success: true, patientData: updatedPatient };
  } catch (error) {
    console.error('Error updating threshold:', error);
    return { success: false, error: 'Failed to update clinical baseline.' };
  }
}