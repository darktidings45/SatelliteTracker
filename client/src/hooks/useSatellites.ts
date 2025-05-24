import * as satelliteJs from 'satellite.js';
import * as THREE from 'three';
import { EARTH_RADIUS } from '../lib/consts';

export interface SatelliteData {
  id: string;
  name: string;
  tle: string[];
  type?: string;
  launchDate?: string;
  altitude?: number;
  velocity?: number;
  period?: number;
  inclination?: number;
  orbitGeometry: {
    position: THREE.BufferAttribute;
  };
}

// Utility function to calculate current satellite information
export function calculateSatelliteInfo(
  satellite: SatelliteData, 
  currentTime: Date
): Partial<SatelliteData> {
  try {
    // Parse TLE data
    const satRec = satelliteJs.twoline2satrec(
      satellite.tle[1] || satellite.tle[0], 
      satellite.tle[2] || satellite.tle[1]
    );
    
    // Get position and velocity
    const positionAndVelocity = satelliteJs.propagate(satRec, currentTime);
    
    if (positionAndVelocity && positionAndVelocity.position && positionAndVelocity.velocity) {
      const { position, velocity } = positionAndVelocity;
      
      // Calculate altitude (distance from Earth's surface)
      const satPos = new THREE.Vector3(position.x, position.z, position.y);
      const altitude = satPos.length() - EARTH_RADIUS;
      
      // Calculate velocity magnitude in km/s
      const velocityMag = Math.sqrt(
        velocity.x * velocity.x + 
        velocity.y * velocity.y + 
        velocity.z * velocity.z
      );
      
      // Get orbital period from mean motion (revolutions per day)
      const meanMotion = parseFloat(satellite.tle[2]?.substring(52, 63) || '0');
      const period = meanMotion ? 1440 / meanMotion : undefined; // minutes
      
      return {
        altitude: altitude,
        velocity: velocityMag,
        period: period,
      };
    }
  } catch (err) {
    console.error('Error calculating satellite info:', err);
  }
  
  return {};
}
