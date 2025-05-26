import * as satelliteJs from 'satellite.js';
import { SatelliteData } from '../hooks/useSatellites';
import { GeoLocation } from './stores/useSatelliteStore';

export interface SatellitePass {
  satellite: SatelliteData;
  startTime: Date;
  endTime: Date;
  peakTime: Date;
  peakElevation: number;
  duration: number; // in minutes
  direction: string; // e.g., "N to SE"
  maxElevation: number;
  visible: boolean;
}

// Calculate if a satellite is visible from a location at a specific time
export function isSatelliteVisible(
  satellite: SatelliteData,
  location: GeoLocation,
  time: Date
): { visible: boolean; elevation: number; azimuth: number } {
  try {
    // Parse TLE data
    const satrec = satelliteJs.twoline2satrec(
      satellite.tle[1] || satellite.tle[0],
      satellite.tle[2] || satellite.tle[1]
    );

    // Get satellite position
    const positionAndVelocity = satelliteJs.propagate(satrec, time);
    
    if (positionAndVelocity && positionAndVelocity.position) {
      const { position } = positionAndVelocity;
      
      // Convert to geodetic coordinates
      const gmst = satelliteJs.gstime(time);
      
      // Convert observer location to radians
      const observerGd = {
        longitude: location.longitude * Math.PI / 180,
        latitude: location.latitude * Math.PI / 180,
        height: 0.0 // assume sea level
      };
      
      // Convert satellite position to geodetic
      const positionGd = satelliteJs.eciToGeodetic(position, gmst);
      
      // Calculate distance and bearing using basic geometry
      const latDiff = positionGd.latitude - observerGd.latitude;
      const lonDiff = positionGd.longitude - observerGd.longitude;
      
      // Simple elevation calculation based on satellite height and distance
      const earthRadius = 6371; // km
      const satHeight = positionGd.height;
      const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * earthRadius;
      
      // Calculate elevation angle
      const elevation = Math.atan2(satHeight, distance) * 180 / Math.PI;
      
      // Calculate azimuth (bearing from north)
      const azimuth = Math.atan2(lonDiff, latDiff) * 180 / Math.PI;
      const normalizedAzimuth = (azimuth + 360) % 360;
      
      // Satellite is visible if elevation > 0 degrees (above horizon)
      const visible = elevation > 0;
      
      return { visible, elevation, azimuth: normalizedAzimuth };
    }
  } catch (error) {
    console.error('Error calculating satellite visibility:', error);
  }
  
  return { visible: false, elevation: 0, azimuth: 0 };
}

// Calculate upcoming satellite passes for a location
export function calculateSatellitePasses(
  satellites: SatelliteData[],
  location: GeoLocation,
  startTime: Date = new Date(),
  durationHours: number = 24,
  minElevation: number = 10 // minimum elevation for a visible pass
): SatellitePass[] {
  const passes: SatellitePass[] = [];
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
  const timeStepMinutes = 1; // Check every minute
  
  for (const satellite of satellites) {
    try {
      let currentPass: Partial<SatellitePass> | null = null;
      let wasVisible = false;
      let peakElevation = 0;
      let peakTime = startTime;
      
      // Step through time to find passes
      for (let time = new Date(startTime); time <= endTime; time.setMinutes(time.getMinutes() + timeStepMinutes)) {
        const visibility = isSatelliteVisible(satellite, location, time);
        const isVisible = visibility.visible && visibility.elevation >= minElevation;
        
        if (isVisible && !wasVisible) {
          // Start of a new pass
          currentPass = {
            satellite,
            startTime: new Date(time),
            peakElevation: visibility.elevation,
            peakTime: new Date(time),
            maxElevation: visibility.elevation,
            visible: true
          };
          peakElevation = visibility.elevation;
          peakTime = new Date(time);
        } else if (isVisible && currentPass) {
          // Continue current pass, check for peak
          if (visibility.elevation > peakElevation) {
            peakElevation = visibility.elevation;
            peakTime = new Date(time);
            currentPass.peakElevation = peakElevation;
            currentPass.peakTime = peakTime;
            currentPass.maxElevation = peakElevation;
          }
        } else if (!isVisible && wasVisible && currentPass) {
          // End of current pass
          currentPass.endTime = new Date(time);
          currentPass.duration = (currentPass.endTime.getTime() - currentPass.startTime!.getTime()) / (1000 * 60);
          
          // Determine direction based on start and end positions
          const startVis = isSatelliteVisible(satellite, location, currentPass.startTime!);
          const endVis = isSatelliteVisible(satellite, location, currentPass.endTime);
          currentPass.direction = getDirection(startVis.azimuth, endVis.azimuth);
          
          // Only add passes longer than 1 minute
          if (currentPass.duration && currentPass.duration > 1) {
            passes.push(currentPass as SatellitePass);
          }
          
          currentPass = null;
        }
        
        wasVisible = isVisible;
      }
      
      // Handle pass that might still be ongoing at the end of the time window
      if (currentPass && wasVisible) {
        currentPass.endTime = new Date(endTime);
        currentPass.duration = (currentPass.endTime.getTime() - currentPass.startTime!.getTime()) / (1000 * 60);
        
        if (currentPass.duration && currentPass.duration > 1) {
          const startVis = isSatelliteVisible(satellite, location, currentPass.startTime!);
          const endVis = isSatelliteVisible(satellite, location, currentPass.endTime);
          currentPass.direction = getDirection(startVis.azimuth, endVis.azimuth);
          passes.push(currentPass as SatellitePass);
        }
      }
    } catch (error) {
      console.error(`Error calculating passes for satellite ${satellite.name}:`, error);
    }
  }
  
  // Sort passes by start time
  return passes.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

// Convert azimuth angles to compass directions
function getDirection(startAzimuth: number, endAzimuth: number): string {
  const getCompassDirection = (azimuth: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(azimuth / 45) % 8;
    return directions[index];
  };
  
  const startDir = getCompassDirection(startAzimuth);
  const endDir = getCompassDirection(endAzimuth);
  
  return `${startDir} to ${endDir}`;
}

// Format pass time for display
export function formatPassTime(date: Date): string {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

// Format pass duration for display
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }
}