// src/app/api/patient/[id]/export/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // Await params as per Next.js 15+ standards
    const { id } = await params;
    console.log("Fetching logs for Patient ID:", id);

    // Fetch the massive payload ONLY when this endpoint is hit
    const logs = await prisma.sensorLog.findMany({
      where: { patientId: id },
      orderBy: { timestamp: 'desc' },
      take: 10000 // You can safely put 10000 here now
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json({ error: "Failed to fetch export data" }, { status: 500 });
  }
}