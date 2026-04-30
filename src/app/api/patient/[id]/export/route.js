// src/app/api/patient/[id]/export/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // Await params as per Next.js 15+ standards
    const { id } = await params;
    console.log("Fetching logs for Patient ID:", id);

    // Extract date range from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build the where clause with optional date filtering
    const where = { patientId: id };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) {
        // Set end date to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.timestamp.lte = endDateTime;
      }
    }

    // Fetch the massive payload ONLY when this endpoint is hit
    const logs = await prisma.sensorLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10000 // You can safely put 10000 here now
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json({ error: "Failed to fetch export data" }, { status: 500 });
  }
}