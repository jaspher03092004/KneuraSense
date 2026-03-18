import webpush from 'web-push';
import { prisma } from "@/lib/prisma";

// Configure Web Push with your VAPID keys from .env
webpush.setVapidDetails(
  'mailto:admin@kneurasense.com', // Replace with your actual admin/support email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Define the cooldown period (e.g., 5 minutes)
const PUSH_COOLDOWN_MS = 5 * 60 * 1000; 

export async function sendCriticalPushAlert(patientId, riskScore) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    // 1. Verify patient exists and has an active push subscription
    if (!patient || !patient.pushSubscription) {
      return;
    }

    // 2. Check the Cooldown Timer to prevent spamming the push service
    if (patient.lastCriticalAlertAt) {
      const timeSinceLastAlert = Date.now() - new Date(patient.lastCriticalAlertAt).getTime();
      
      if (timeSinceLastAlert < PUSH_COOLDOWN_MS) {
        console.log(`Push Alert Aborted: Cooldown active for patient ${patient.id}.`);
        return; // Exit early, skipping the notification
      }
    }

    // 3. Prepare the Push Payload
    const subscription = JSON.parse(patient.pushSubscription);
    const payload = JSON.stringify({
      title: "KneuraSense: High Risk Alert!",
      body: `Critical: Risk score has reached ${riskScore}. Please adjust your activity immediately.`,
      patientId: patient.id
    });

    // 4. Send the Push Notification
    await webpush.sendNotification(subscription, payload);
    console.log(`Push notification sent successfully to patient ${patient.id}`);

    // 5. Update the Cooldown Timestamp in the database
    await prisma.patient.update({
      where: { id: patient.id },
      data: { lastCriticalAlertAt: new Date() }
    });

  } catch (error) {
    // 6. Handle Expired or Revoked Subscriptions automatically
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log(`Push subscription revoked for patient ${patientId}. Cleaning up database...`);
      
      await prisma.patient.update({
        where: { id: patientId },
        data: { pushSubscription: null }
      });
    } else {
      console.error("Failed to send web push notification:", error);
    }
  }
}