import { useState } from 'react';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function useGeolocation() {
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Request user's geolocation
  const getLocation = (): Promise<GeoLocation | null> => {
    return new Promise((resolve) => {
      setLocationError(null);
      
      // Check if geolocation is available
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser");
        resolve(null);
        return;
      }
      
      // Request current position
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          const location: GeoLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          resolve(location);
        },
        // Error callback
        (error) => {
          let errorMessage;
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access was denied by the user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
            default:
              errorMessage = "An unknown error occurred";
              break;
          }
          
          setLocationError(errorMessage);
          resolve(null);
        },
        // Options
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };
  
  return { getLocation, locationError };
}
