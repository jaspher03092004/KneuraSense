'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function assignPatientToClinician(clinicianId, patientEmail) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { email: patientEmail.toLowerCase() }
    });

    if (!patient) return { success: false, error: "Patient with this email not found." };
    if (patient.clinicianId) return { success: false, error: "Patient is already assigned to a clinician." };

    await prisma.patient.update({
      where: { id: patient.id },
      data: { clinicianId: clinicianId }
    });

    revalidatePath(`/clinician/${clinicianId}/dashboard`);
    revalidatePath(`/clinician/${clinicianId}/patients`);
    return { success: true };
  } catch (error) {
    console.error("Error assigning patient:", error);
    return { success: false, error: "Failed to assign patient." };
  }
}

export async function unassignPatient(patientId, clinicianId) {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { clinicianId: null }
    });

    revalidatePath(`/clinician/${clinicianId}/dashboard`);
    revalidatePath(`/clinician/${clinicianId}/patients`);
    return { success: true };
  } catch (error) {
    console.error("Error unassigning patient:", error);
    return { success: false, error: "Failed to release patient record." };
  }
}

export async function getAllClinicians(excludeId) {
  try {
    return await prisma.clinician.findMany({
      where: { NOT: { id: excludeId } },
      select: { id: true, fullName: true, clinicName: true }
    });
  } catch (error) {
    console.error("Error fetching clinicians:", error);
    return [];
  }
}

export async function transferPatient(patientId, fromClinicianId, toClinicianId) {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { clinicianId: toClinicianId }
    });

    // Revalidate paths for both clinicians
    revalidatePath(`/clinician/${fromClinicianId}/patients`);
    revalidatePath(`/clinician/${toClinicianId}/patients`);
    
    return { success: true };
  } catch (error) {
    console.error("Transfer error:", error);
    return { success: false, error: "Failed to transfer patient record." };
  }
}