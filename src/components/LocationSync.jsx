'use client';
import { useEffect } from 'react';

export default function LocationSync({ patientId }) {
  useEffect(() => {
    if (!patientId) return;

    const syncLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`[GPS] Lat: ${latitude}, Lng: ${longitude}`);
          
          try {
            await fetch('/api/update-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ patientId, lat: latitude, lng: longitude }),
            });
          } catch (err) {
            console.error("Failed to hit weather API", err);
          }
        },
        (error) => console.warn("GPS Blocked, using default location"),
        { enableHighAccuracy: true }
      );
    };

    syncLocation();
    const interval = setInterval(syncLocation, 300000); // Sync every 5 mins
    return () => clearInterval(interval);
  }, [patientId]);

  return null; // This component stays invisible
}