// src/components/VoiceAlertButton.jsx
"use client";
import { useState, useEffect } from "react";
import { urlBase64ToUint8Array } from "@/lib/webPush";
import { Loader2 } from "lucide-react";

export default function VoiceAlertButton({ patientId }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState("idle");

  // Check if the user is already subscribed when the component mounts
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setIsEnabled(true);
        });
      });
    }
  }, []);

  const handleToggle = async (e) => {
    const checked = e.target.checked;
    setIsEnabled(checked);

    if (checked) {
      setStatus("loading");
      try {
        // 1. Check if Service Workers and Push are supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          alert("Push notifications are not supported in this browser.");
          setStatus("error");
          setIsEnabled(false);
          return;
        }

        // 2. Register the Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');

        // 3. Request permission and subscribe
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // 4. Send the subscription object to your database
        const response = await fetch(`/api/patient/${patientId}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        if (response.ok) {
          setStatus("success");
        } else {
          throw new Error("Failed to save to database");
        }
      } catch (error) {
        console.error("Subscription failed:", error);
        setStatus("error");
        setIsEnabled(false); // Revert toggle if it fails
      }
    } else {
      // Logic for unsubscribing when toggled off
      setStatus("loading");
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          // Optionally ping your DB here to remove the subscription record
          // await fetch(`/api/patient/${patientId}/unsubscribe`, { method: "POST" });
        }
        setStatus("idle");
      } catch (error) {
        console.error("Unsubscribe failed:", error);
        setStatus("error");
        setIsEnabled(true); // Revert toggle if it fails
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Show a tiny loading spinner next to the toggle when making API calls */}
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
    </div>
  );
}