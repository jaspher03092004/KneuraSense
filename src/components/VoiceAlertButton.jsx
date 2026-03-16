// src/components/VoiceAlertButton.jsx
"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Move the helper function directly into this file to avoid import issues on the client side
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function VoiceAlertButton({ patientId }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState("idle");

  // Check if the user is already subscribed when the component mounts
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
             setIsEnabled(true);
          }
        }).catch(err => console.error("Error getting subscription:", err));
      }).catch(err => console.error("Service worker not ready:", err));
    }
  }, []);

  const handleToggle = async (e) => {
    const checked = e.target.checked;
    // Optimistically update UI
    setIsEnabled(checked);
    setStatus("loading");

    if (checked) {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          alert("Push notifications are not supported in this browser.");
          setStatus("error");
          setIsEnabled(false);
          return;
        }

        // 1. Register the Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Wait for it to be active
        await navigator.serviceWorker.ready;

        // 2. Request permission and subscribe
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
            console.error("VAPID Public Key is missing from environment variables.");
            throw new Error("Missing VAPID Key");
        }

        const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // 3. Send the subscription object to your database
        const response = await fetch(`/api/patient/${patientId}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        if (response.ok) {
          setStatus("success");
          console.log("Successfully subscribed and saved to DB!");
        } else {
          throw new Error("Failed to save to database");
        }
      } catch (error) {
        console.error("Subscription failed:", error);
        setStatus("error");
        setIsEnabled(false); // Revert toggle if it fails
        alert("Failed to enable voice alerts. Please ensure notifications are allowed in your browser settings.");
      }
    } else {
      // Unsubscribe logic
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          
          // Optionally, ping the DB to clear the subscription
          // This ensures the backend knows to stop trying to push to a dead token
          await fetch(`/api/patient/${patientId}/subscribe`, {
              method: "DELETE", // We'll add a DELETE handler below
          });
        }
        setStatus("idle");
        console.log("Successfully unsubscribed.");
      } catch (error) {
        console.error("Unsubscribe failed:", error);
        setStatus("error");
        setIsEnabled(true); // Revert toggle if it fails
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      {status === "loading" && <Loader2 size={16} className="animate-spin text-[#3A9D8C] dark:text-teal-400" />}
      
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={isEnabled}
          onChange={handleToggle}
          disabled={status === "loading"}
        />
        <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-200 after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors duration-300 ${status === "loading" ? 'bg-slate-200 dark:bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-slate-200 dark:bg-slate-700 peer-checked:bg-[#3A9D8C] dark:peer-checked:bg-teal-500'}`}></div>
      </label>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
         {isEnabled ? "Voice Alerts On" : "Voice Alerts Off"}
      </span>
    </div>
  );
}