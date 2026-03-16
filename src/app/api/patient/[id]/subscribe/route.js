import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    // Next.js 15 requires awaiting params
    const resolvedParams = await params;
    const patientId = resolvedParams.id;
    
    const subscription = await request.json();

    // Store the subscription object as a string in the database
    await prisma.patient.update({
      where: { id: patientId },
      data: { 
        pushSubscription: JSON.stringify(subscription) 
      },
    });

    return NextResponse.json({ message: "Subscription saved successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error saving subscription:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

// Add a DELETE handler to clear the subscription when toggled off
export async function DELETE(request, { params }) {
    try {
        const resolvedParams = await params;
        const patientId = resolvedParams.id;

        await prisma.patient.update({
            where: { id: patientId },
            data: {
                pushSubscription: null // Clear the token
            }
        });

        return NextResponse.json({ message: "Subscription removed successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error removing subscription:", error);
        return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
    }
}