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
export function createApertureCone(
  lat: number, 
  lon: number, 
  apertureDegrees: number, 
  length: number = EARTH_RADIUS * 4
): {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  baseRadius: number;
  height: number;
} {
  // Get surface position and normal
  const surfacePosition = latLonToCartesian(lat, lon);
  const surfaceNormal = getNormalAtLatLon(lat, lon);
  
  // Calculate cone dimensions
  const baseRadius = length * Math.tan((apertureDegrees * Math.PI / 180) / 2);
  
  // Create quaternion to rotate the cone so it points outward from the surface
  const quaternion = new THREE.Quaternion();
  // Default cone points along negative Y axis in Three.js
  // We need to rotate it to align with the normal vector pointing outward
  const fromDirection = new THREE.Vector3(0, -1, 0); // Default cone direction
  quaternion.setFromUnitVectors(fromDirection, surfaceNormal);
  
  return {
    position: surfacePosition,
    quaternion,
    baseRadius,
    height: length
  };
}

export { getLocalStorage, setLocalStorage };
