'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function registerUser(formData) {
  try {
    // Convert form data to a clean object
    const data = Object.fromEntries(formData);

    // Trim email and validate required fields
    const email = data.email?.trim().toLowerCase();
    const fullName = data.fullName?.trim();
    const password = data.password?.trim();

    if (!fullName || !email || !password) {
      return {
        success: false,
        error: 'Missing required fields.',
      };
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Email already registered. Please log in or use a different email.',
      };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with all fields
    await prisma.user.create({
      data: {
        fullName,
        age: parseInt(data.age) || 0,
        gender: data.gender || 'Male',
        phoneNumber: data.phoneNumber?.trim() || '',
        email,
        password: hashedPassword,
        oaDiagnosis: data.oaDiagnosis === 'Yes',
        affectedKnee: data.affectedKnee || 'Both',
        painSeverity: parseInt(data.painSeverity) || 5,
        occupation: data.occupation || 'Retired',
        activityLevel: data.activityLevel || 'Moderate',
      },
    });

    // Return success instead of redirecting
    return {
      success: true,
      message: 'Account created successfully! Redirecting to login...',
    };
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      // Check which field caused the constraint violation
      const field = error.meta?.target?.[0];
      
      if (field === 'email') {
        return {
          success: false,
          error: 'Email already registered. Please log in or use a different email.',
        };
      } else if (field === 'phoneNumber') {
        return {
          success: false,
          error: 'This phone number is already registered. Please use a different phone number.',
        };
      }
      
      return {
        success: false,
        error: 'This information is already registered. Please use different details.',
      };
    }

    return {
      success: false,
      error: 'An error occurred during registration. Please try again.',
    };
  }
}