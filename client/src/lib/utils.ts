import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as THREE from "three";
import { EARTH_RADIUS } from "./consts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getLocalStorage = (key: string): any =>
  JSON.parse(window.localStorage.getItem(key) || "null");
const setLocalStorage = (key: string, value: any): void =>
  window.localStorage.setItem(key, JSON.stringify(value));

// Convert latitude/longitude to 3D position on a sphere
export function latLonToCartesian(
  lat: number,
  lon: number,
  radius: number = EARTH_RADIUS,
  altitude: number = 0
): THREE.Vector3 {
  // Convert to radians
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);
  
  // Calculate exact position on the sphere with altitude
  const actualRadius = radius + altitude;
  
  // Calculate cartesian coordinates
  const x = actualRadius * Math.cos(latRad) * Math.cos(lonRad);
  const y = actualRadius * Math.sin(latRad);
  const z = actualRadius * Math.cos(latRad) * Math.sin(lonRad);
  
  return new THREE.Vector3(x, y, z);
}

// Get normal vector (unit vector) at a specific lat/lon on the sphere
export function getNormalAtLatLon(lat: number, lon: number): THREE.Vector3 {
  // Convert to radians
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);
  
  // Calculate normal (simply the normalized position vector for a perfect sphere)
  const x = Math.cos(latRad) * Math.cos(lonRad);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.sin(lonRad);
  
  return new THREE.Vector3(x, y, z);
}

// Create a quaternion that orients objects to match the surface normal
export function getOrientationQuaternion(normal: THREE.Vector3): THREE.Quaternion {
  const quaternion = new THREE.Quaternion();
  // Default orientation is along Y axis, rotate to align with normal
  const upVector = new THREE.Vector3(0, 1, 0);
  quaternion.setFromUnitVectors(upVector, normal);
  return quaternion;
}

// Create a custom cone geometry that starts at the surface and extends outward
// with an optional azimuth angle to point in different directions
export function createApertureCone(
  lat: number, 
  lon: number, 
  apertureDegrees: number, 
  azimuthDegrees: number = 0, // 0 = directly outward from surface, other values rotate around the normal
  elevationDegrees: number = 0, // 0 = along surface normal, positive values tilt upward
  length: number = EARTH_RADIUS * 4
): {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  baseRadius: number;
  height: number;
} {
  // Get surface position and normal
  const surfacePosition = latLonToCartesian(lat, lon);
  const surfaceNormal = getNormalAtLatLon(lat, lon);
  
  // Calculate cone dimensions
  const baseRadius = length * Math.tan((apertureDegrees * Math.PI / 180) / 2);
  
  // Calculate final direction with azimuth and elevation
  let finalDirection = surfaceNormal.clone();
  
  if (azimuthDegrees !== 0 || elevationDegrees !== 0) {
    // Create local coordinate system at the surface point
    // Surface normal is the "up" direction
    const up = surfaceNormal.clone();
    
    // Find a perpendicular vector to the normal (this will be our "east" direction)
    // Start with a reference vector (different from normal)
    const reference = new THREE.Vector3(1, 0, 0);
    if (Math.abs(up.dot(reference)) > 0.99) {
      // If normal is too close to reference, use a different reference
      reference.set(0, 1, 0);
    }
    
    // Cross product gives a perpendicular vector (east)
    const east = new THREE.Vector3().crossVectors(up, reference).normalize();
    
    // Another cross product gives the "north" direction
    const north = new THREE.Vector3().crossVectors(east, up).normalize();
    
    // Convert angles to radians
    const azimuthRad = azimuthDegrees * (Math.PI / 180);
    const elevationRad = elevationDegrees * (Math.PI / 180);
    
    // Apply azimuth rotation (around the normal axis)
    const azimuthX = Math.sin(azimuthRad);
    const azimuthZ = Math.cos(azimuthRad);
    
    // Apply elevation (tilt from the normal)
    const elevationY = Math.cos(elevationRad);
    const elevationXZ = Math.sin(elevationRad);
    
    // Combine into final direction
    finalDirection = new THREE.Vector3()
      .addScaledVector(north, azimuthZ * elevationXZ)
      .addScaledVector(east, azimuthX * elevationXZ)
      .addScaledVector(up, elevationY)
      .normalize();
  }
  
  return {
    position: surfacePosition,
    direction: finalDirection,
    baseRadius,
    height: length
  };
}

export { getLocalStorage, setLocalStorage };
