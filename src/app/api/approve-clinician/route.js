import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  // 1. Get the token from the URL parameters (e.g., ?token=abc123def...)
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse("Bad Request: Missing approval token.", { status: 400 });
  }

  try {
    // 2. Find the token in the database
    const approvalRecord = await prisma.adminApprovalToken.findUnique({
      where: { token: token },
      include: { clinician: true }
    });

    if (!approvalRecord) {
      return new NextResponse("Error: Invalid or expired approval link. This token may have already been used.", { status: 400 });
    }

    // 3. Update the clinician's isApproved status to true
    await prisma.clinician.update({
      where: { clinician_id: approvalRecord.clinicianId },
      data: { isApproved: true }
    });

    // 4. Delete the token so it cannot be used again
    await prisma.adminApprovalToken.delete({
      where: { id: approvalRecord.id }
    });

    // 5. Return a styled success page to the Admin who clicked the link
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinician Approved</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; }
            .icon { background: #dcfce7; color: #16a34a; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; }
            h1 { color: #0f172a; margin-bottom: 10px; font-size: 24px; }
            p { color: #475569; line-height: 1.5; }
            .details { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: left; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Account Approved!</h1>
            <p>You have successfully approved the clinician account for <strong>${approvalRecord.clinician.full_name}</strong>.</p>
            <div class="details">
              <strong>Email:</strong> ${approvalRecord.clinician.email}<br/>
              <strong>Status:</strong> Granted Access
            </div>
            <p style="margin-top: 20px; font-size: 14px;">They can now log into the KneuraSense platform.</p>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    console.error("Error approving clinician:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}