"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

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

        // EXPLICIT PERMISSION CHECK ADDED HERE
        if (Notification.permission === 'denied') {
           alert("Notifications are currently blocked. To enable voice alerts, please click the lock icon in your browser's address bar, allow notifications, and try again.");
           setStatus("error");
           setIsEnabled(false);
           return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error(`Notification permission status: ${permission}`);
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
            throw new Error("Missing VAPID Key in environment variables.");
        }

        const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

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
        // IMPROVED ERROR LOGGING
        console.error("Subscription failed with error:", error);
        setStatus("error");
        setIsEnabled(false); 
        
        // Show a more specific alert if possible
        alert(`Failed to enable voice alerts. Error: ${error.message}`);
      }
    } else {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          
          await fetch(`/api/patient/${patientId}/subscribe`, {
              method: "DELETE", 
          });
        }
        setStatus("idle");
        console.log("Successfully unsubscribed.");
      } catch (error) {
        console.error("Unsubscribe failed:", error);
        setStatus("error");
        setIsEnabled(true); 
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