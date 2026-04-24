'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function activatePatientAccount(token, password) {
  try {
    // 1. Find patient with this token who hasn't expired
    const patient = await prisma.patient.findFirst({
      where: {
        activationToken: token,
        activationExpires: { gt: new Date() }
      }
    });

    if (!patient) {
      return { error: "Link has expired or is invalid. Please contact your clinician." };
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Update patient: Set password, verify them, and clear token fields
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        passwordHash: hashedPassword,
        isVerified: true,
        activationToken: null,
        activationExpires: null
      }
    });

    return { success: true };

  } catch (error) {
    console.error("Activation Error:", error);
    return { error: "An error occurred during activation." };
  }
}