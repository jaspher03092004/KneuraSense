'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs'; 
import { revalidatePath } from 'next/cache';

export async function changePassword(patientId, formData) {
  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' };
  }
  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) return { error: 'User not found.' };
    
    // Check if user is OAuth (no password)
    if (!patient.passwordHash) {
      return { error: 'Social login users cannot change passwords.' };
    }

    // Verify Current Password (using passwordHash)
    const match = await bcrypt.compare(currentPassword, patient.passwordHash);
    if (!match) return { error: 'Incorrect current password.' };

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Database (using passwordHash)
    await prisma.patient.update({
      where: { id: patientId },
      data: { passwordHash: hashedPassword },
    });

    revalidatePath(`/patient/${patientId}/settings`);
    return { success: 'Password updated successfully!' };

  } catch (error) {
    console.error('Password error:', error);
    return { error: 'Something went wrong.' };
  }
}