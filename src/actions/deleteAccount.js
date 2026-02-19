'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

export async function deleteAccount(password) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return { error: 'Unauthorized' };

    // 1. Verify Session JWT
    const secretKey = process.env.JWT_SECRET;
    const encodedSecret = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, encodedSecret);

    const userId = payload.userId;
    const role = payload.role;

    // 2. Fetch User to verify password
    let user;
    if (role === 'clinician') {
      user = await prisma.clinician.findUnique({ where: { clinician_id: userId } });
    } else {
      user = await prisma.patient.findUnique({ where: { id: userId } });
    }

    if (!user) return { error: 'User not found' };

    // 3. Verify Password
    const hashToCompare = user.password_hash || user.passwordHash;
    const isPasswordCorrect = await bcrypt.compare(password, hashToCompare);

    if (!isPasswordCorrect) {
      return { error: 'Incorrect password. Deletion cancelled.' };
    }

    // 4. Perform Cascade Delete (Handled by Prisma/DB)
    if (role === 'clinician') {
      await prisma.clinician.delete({ where: { clinician_id: userId } });
    } else {
      await prisma.patient.delete({ where: { id: userId } });
    }

    // 5. Clear Cookie
    cookieStore.delete('auth_token');
    
  } catch (error) {
    console.error('Account Deletion Error:', error);
    return { error: 'An error occurred during account deletion.' };
  }

  redirect('/login?message=Account permanently deleted');
}