'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs'; 
import { revalidatePath } from 'next/cache';

export async function changePassword(userId, formData) {
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
    // 1. Try to find user as a Patient
    let user = await prisma.patient.findUnique({
      where: { id: userId },
    });
    let isClinician = false;

    // 2. If not a Patient, try to find as a Clinician
    if (!user) {
      user = await prisma.clinician.findUnique({
        where: { clinician_id: userId },
      });
      isClinician = true;
    }

    if (!user) return { error: 'User not found.' };

    // Get the correct password hash field depending on the user role
    const dbPasswordHash = isClinician ? user.password_hash : user.passwordHash;
    
    // Check if user is OAuth (no password)
    if (!dbPasswordHash) {
      return { error: 'Social login users cannot change passwords.' };
    }

    // Verify Current Password
    const match = await bcrypt.compare(currentPassword, dbPasswordHash);
    if (!match) return { error: 'Incorrect current password.' };

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the correct Database table
    if (isClinician) {
      await prisma.clinician.update({
        where: { clinician_id: userId },
        data: { password_hash: hashedPassword },
      });
      revalidatePath(`/clinician/${userId}/settings`);
    } else {
      await prisma.patient.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });
      revalidatePath(`/patient/${userId}/settings`);
    }

    return { success: 'Password updated successfully!' };

  } catch (error) {
    console.error('Password error:', error);
    return { error: 'Something went wrong.' };
  }
}