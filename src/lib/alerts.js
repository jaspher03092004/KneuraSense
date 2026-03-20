import { sendCriticalAlertEmail } from "@/lib/email"; 
import webpush from "web-push";

// Configure Web Push with your VAPID keys from .env
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_NOTIFICATION_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Sends email and web push alerts if risk score exceeds threshold
 * @param {Object} patient - Patient object with id, fullName, clinicianId, pushSubscription
 * @param {number} riskScore - The calculated risk score
 * @param {Object} newLog - The newly created sensor log entry
 * @param {number} threshold - The patient's risk threshold
 */
export async function checkAndSendAlerts(patient, riskScore, newLog, threshold) {
  if (riskScore >= threshold) {
    console.log(`High risk score (${riskScore}) detected. Triggering alerts...`);
    
    // --- A. Clinician Email Alert ---
    if (patient.clinicianId) {
      await sendCriticalAlertEmail(patient, riskScore, newLog); 
    } else {
      console.log("No assigned clinician found for this patient. Alert skipped.");
    }

    // --- B. Patient Web Push Alert ---
    if (patient.pushSubscription) {
      try {
        const subscriptionObj = JSON.parse(patient.pushSubscription);
        const voiceMessage = `Warning ${patient.fullName.split(' ')[0]}. Your knee risk score is critically high at ${riskScore}. Please stop your current activity and sit down immediately to prevent injury.`;
        
        const payload = JSON.stringify({
          title: "⚠️ Urgent Knee Alert",
          body: "Tap to hear urgent instructions.",
          url: `/patient/${patient.id}/dashboard?voiceAlert=${encodeURIComponent(voiceMessage)}`
        });

        await webpush.sendNotification(subscriptionObj, payload);
        console.log("Successfully fired Push-to-Talk wake-up call to device!");

      } catch (pushErr) {
        console.error("Failed to send web push. Subscription might be invalid or expired:", pushErr);
      }
    }
  }
}
