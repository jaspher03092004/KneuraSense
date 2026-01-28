import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Fetch patient data from database
    const patient = await prisma.user.findUnique({
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
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
