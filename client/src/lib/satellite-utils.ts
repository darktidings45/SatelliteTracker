import * as satelliteJs from 'satellite.js';
import * as THREE from 'three';
import { EARTH_RADIUS } from './consts';

// Calculate satellite position based on TLE data and time
export function calculateSatellitePosition(
  tleLine: string[], 
  date: Date
): THREE.Vector3 {
  try {
    // Parse TLE data
    const satrec = satelliteJs.twoline2satrec(
      tleLine[1] || tleLine[0], 
      tleLine[2] || tleLine[1]
    );
    
    // Get position
    const positionAndVelocity = satelliteJs.propagate(satrec, date);
    
    // Check if position is valid
    if (!positionAndVelocity || !positionAndVelocity.position) {
      console.warn('No position data for satellite');
      return new THREE.Vector3(0, 0, 0);
    }
    
    const { position } = positionAndVelocity;
    
    // Convert from km to Three.js units
    // Scale down to scene units and convert from z-up to y-up
    const scaleFactor = EARTH_RADIUS / 6371; // Convert from km to scene units
    return new THREE.Vector3(
      position.x * scaleFactor,
      position.z * scaleFactor,
      position.y * scaleFactor
    );
    
  } catch (error) {
    console.error('Error calculating satellite position:', error);
    return new THREE.Vector3(0, 0, 0);
  }
}

// Check if a satellite is visible from a specific Earth location
export function isSatelliteVisibleFromLocation(
  satellitePosition: THREE.Vector3,
  observerLat: number,
  observerLon: number,
  apertureAngleDeg: number = 90
): boolean {
  // Convert observer lat/lon to cartesian coordinates
  const observerCartesian = latLonToCartesian(observerLat, observerLon, EARTH_RADIUS);
  
  // Get normalized direction from Earth center to observer
  const observerDirection = observerCartesian.clone().normalize();
  
  // Get direction from observer to satellite
  const toSatellite = new THREE.Vector3().subVectors(
    satellitePosition, 
    observerCartesian
  ).normalize();
  
  // Calculate angle between observer-up and observer-satellite vectors
  const angle = Math.acos(observerDirection.dot(toSatellite)) * (180 / Math.PI);
  
  // Check if satellite is within the aperture cone
  return angle <= apertureAngleDeg;
}

// Convert latitude and longitude to 3D cartesian coordinates
export function latLonToCartesian(
  lat: number, 
  lon: number, 
  radius: number = EARTH_RADIUS
): THREE.Vector3 {
  // Convert to radians
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);
  
  // Calculate position
  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad);
  
  return new THREE.Vector3(x, y, z);
}

// Calculate distance between two points on Earth's surface (haversine formula)
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = EARTH_RADIUS; // Earth's radius in km
  
  // Convert to radians
  const lat1Rad = lat1 * (Math.PI / 180);
  const lat2Rad = lat2 * (Math.PI / 180);
  const lon1Rad = lon1 * (Math.PI / 180);
  const lon2Rad = lon2 * (Math.PI / 180);
  
  // Haversine formula
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Get ground track (lat/lon points) for a satellite orbit
export function getGroundTrack(
  tleLine: string[],
  date: Date,
  points: number = 90
): [number, number][] {
  try {
    // Parse TLE data
    const satrec = satelliteJs.twoline2satrec(
      tleLine[1] || tleLine[0], 
      tleLine[2] || tleLine[1]
    );
    
    // Calculate orbital period (in minutes)
    const meanMotion = parseFloat(tleLine[2]?.substring(52, 63) || '0');
    const orbitalPeriod = meanMotion ? 1440 / meanMotion : 90; // minutes
    
    // Track points
    const groundTrack: [number, number][] = [];
    const timeStep = orbitalPeriod * 60 / points; // in seconds
    
    for (let i = 0; i < points; i++) {
      const time = new Date(date.getTime() + i * timeStep * 1000);
      
      // Get position at specific time
      const positionAndVelocity = satelliteJs.propagate(satrec, time);
      
      if (positionAndVelocity && positionAndVelocity.position) {
        const { position } = positionAndVelocity;
        
        // Convert to geodetic coordinates
        const gmst = satelliteJs.gstime(time);
        const geodetic = satelliteJs.eciToGeodetic(position, gmst);
        
        // Convert radians to degrees
        const lat = satelliteJs.degreesLat(geodetic.latitude);
        const lon = satelliteJs.degreesLong(geodetic.longitude);
        
        groundTrack.push([lat, lon]);
      }
    }
    
    return groundTrack;
    
  } catch (error) {
    console.error('Error calculating ground track:', error);
    return [];
  }
}
