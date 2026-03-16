// src/app/api/patient/[id]/subscribe/route.js
import { prisma } from "@/lib/prisma"; // <-- Add curly braces here
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const patientId = params.id;
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