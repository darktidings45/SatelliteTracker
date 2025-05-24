import { useState } from 'react';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function useGeolocation() {
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Request user's geolocation with improved error handling
  const getLocation = (): Promise<GeoLocation | null> => {
    return new Promise((resolve) => {
      setLocationError(null);
      
      // Check if geolocation is available
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser");
        // Fallback to a default location (New York City)
        const defaultLocation: GeoLocation = {
          latitude: 40.7128,
          longitude: -74.0060
        };
        resolve(defaultLocation);
        return;
      }
      
      // Request current position with better options
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          const location: GeoLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          console.log("Geolocation obtained successfully:", location);
          resolve(location);
        },
        // Error callback
        (error) => {
          let errorMessage;
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access was denied. Please enable location permissions in your browser.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Try using manual coordinates instead.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = "An unknown error occurred while getting your location.";
              break;
          }
          
          console.error("Geolocation error:", errorMessage, error);
          setLocationError(errorMessage);
          
          // When running in a Replit environment, geolocation might not work
          // Fallback to a default location (New York City)
          const defaultLocation: GeoLocation = {
            latitude: 40.7128,
            longitude: -74.0060
          };
          resolve(defaultLocation);
        },
        // Options - increased timeout and better accuracy settings
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // 1 minute
        }
      );
    });
  };
  
  return { getLocation, locationError };
}
