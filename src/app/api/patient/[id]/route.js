import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // 1. AUTHORIZATION CHECK
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // STRICT SECRET LOADING - NO FALLBACKS ALLOWED
    const secretKey = process.env.JWT_SECRET;
    
    if (!secretKey) {
      console.error("CRITICAL SECURITY ERROR: JWT_SECRET is missing.");
      return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
    }

    const encodedSecret = new TextEncoder().encode(secretKey);
    let payload;

    try {
      const verified = await jwtVerify(token, encodedSecret);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. IDOR PROTECTION
    // If the logged-in user is a patient, they can only view their own profile.
    if (payload.role === 'patient' && payload.userId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch patient data from database
    const patient = await prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        age: true,
        gender: true,
        email: true,
        phoneNumber: true,
        oaDiagnosis: true,
        affectedKnee: true,
        painSeverity: true,
        occupation: true,
        activityLevel: true,
        createdAt: true,
        deviceMac: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}