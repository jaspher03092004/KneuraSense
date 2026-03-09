import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to generate standardized, professional HTML templates
const buildHtmlResponse = (title, iconSvg, iconColor, iconBg, heading, contentHtml, safeBaseUrl) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} | KneuraSense</title>
      <style>
        body { 
          font-family: 'Inter', system-ui, -apple-system, sans-serif; 
          background-color: #f1f5f9; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh; 
          margin: 0; 
          padding: 20px;
          color: #0f172a;
        }
        .card { 
          background: white; 
          padding: 48px 40px; 
          border-radius: 16px; 
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); 
          text-align: center; 
          max-width: 440px; 
          width: 100%;
          border: 1px solid #e2e8f0;
          box-sizing: border-box;
        }
        .logo {
          width: auto;
          height: 32px;
          margin-bottom: 32px;
        }
        .icon-container { 
          background: ${iconBg}; 
          color: ${iconColor}; 
          width: 72px; 
          height: 72px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin: 0 auto 24px; 
        }
        .icon-container svg {
          width: 36px;
          height: 36px;
        }
        h1 { 
          margin: 0 0 12px; 
          font-size: 24px; 
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        p { 
          color: #475569; 
          line-height: 1.6; 
          margin: 0 0 24px;
          font-size: 16px;
        }
        .details { 
          background: #f8fafc; 
          padding: 24px; 
          border-radius: 12px; 
          border: 1px solid #e2e8f0;
          text-align: left; 
          font-size: 15px; 
          margin-bottom: 32px;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .details-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        .details-label {
          color: #64748b;
          font-weight: 500;
        }
        .details-value {
          color: #0f172a;
          font-weight: 600;
          text-align: right;
          max-width: 60%;
          word-break: break-all;
        }
        .button {
          display: inline-block;
          background-color: #0f172a;
          color: white;
          padding: 14px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          transition: background-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .button:hover {
          background-color: #1e293b;
        }
        .footer {
          margin-top: 32px;
          color: #94a3b8;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-container">
          ${iconSvg}
        </div>
        <h1>${heading}</h1>
        ${contentHtml}
        <div class="footer">
          &copy; ${new Date().getFullYear()} KneuraSense. All rights reserved.
        </div>
      </div>
    </body>
  </html>
`;

export async function GET(request) {
  // SVG Icons for different states
  const successIcon = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
  const errorIcon = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
  const warningIcon = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;

  // Get base URL for images and buttons
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const safeBaseUrl = appUrl.replace(/\/$/, '');

  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  // Handle Missing Token Error
  if (!token) {
    return new NextResponse(buildHtmlResponse(
      "Invalid Request", 
      errorIcon, "#ef4444", "#fee2e2", 
      "Missing Token", 
      `<p>We could not find an approval token in your link. Please check the email and try clicking the link again.</p>`,
      safeBaseUrl
    ), { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  try {
    const approvalRecord = await prisma.adminApprovalToken.findUnique({
      where: { token: token },
      include: { clinician: true }
    });

    // Handle Invalid/Used Token Error
    if (!approvalRecord) {
      return new NextResponse(buildHtmlResponse(
        "Link Expired", 
        warningIcon, "#eab308", "#fef9c3", 
        "Link Expired or Invalid", 
        `<p>This approval link is invalid or has already been used. If the clinician is already approved, no further action is needed.</p>`,
        safeBaseUrl
      ), { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    // Approve Clinician
    await prisma.clinician.update({
      where: { clinician_id: approvalRecord.clinicianId },
      data: { isApproved: true }
    });

    // Clean up Token
    await prisma.adminApprovalToken.delete({
      where: { id: approvalRecord.id }
    });

    // Handle Success
    const successHtml = `
      <p>You have successfully approved the clinician account for <strong>${approvalRecord.clinician.full_name}</strong>.</p>
      <div class="details">
        <div class="details-row">
          <span class="details-label">Role</span>
          <span class="details-value">Clinician</span>
        </div>
        <div class="details-row">
          <span class="details-label">Email</span>
          <span class="details-value">${approvalRecord.clinician.email}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Status</span>
          <span class="details-value" style="color: #16a34a;">Access Granted</span>
        </div>
      </div>
      <a href="${safeBaseUrl}/login" class="button">Go to Dashboard</a>
    `;

    return new NextResponse(buildHtmlResponse(
      "Clinician Approved", 
      successIcon, "#16a34a", "#dcfce7", 
      "Account Approved!", 
      successHtml,
      safeBaseUrl
    ), { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    console.error("Error approving clinician:", error);
    
    // Handle Server Error
    return new NextResponse(buildHtmlResponse(
      "System Error", 
      errorIcon, "#ef4444", "#fee2e2", 
      "System Error", 
      `<p>An unexpected error occurred while processing this approval. Please try again later or check your server logs.</p>`,
      safeBaseUrl
    ), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}