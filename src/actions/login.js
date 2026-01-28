'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function login(email, password) {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required.',
      };
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password.',
      };
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid email or password.',
      };
    }

    // Password is valid - you can now create a session or JWT token
    // This is a placeholder for your authentication logic
    return {
      success: true,
      userId: user.id,
      message: 'Login successful',
      // You should implement proper session management here
      // e.g., using next-auth, JWT, or server sessions
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An error occurred during login. Please try again.',
    };
  }
}
