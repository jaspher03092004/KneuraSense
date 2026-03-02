'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function assignPatientToClinician(clinicianId, patientEmail) {
  try {
    // 1. Find the patient by email
    const patient = await prisma.patient.findUnique({
      where: { email: patientEmail.toLowerCase() }
    });

    if (!patient) {
      return { success: false, error: "Patient with this email not found." };
    }

    if (patient.clinicianId) {
      return { success: false, error: "Patient is already assigned to a clinician." };
    }

    // 2. Assign the clinician to the patient
    await prisma.patient.update({
      where: { id: patient.id },
      data: { clinicianId: clinicianId }
    });

    revalidatePath(`/clinician/${clinicianId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error("Error assigning patient:", error);
    return { success: false, error: "Failed to assign patient." };
  }
}