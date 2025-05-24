import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sphere, useHelper } from '@react-three/drei';
import { useSatelliteStore } from '../lib/stores/useSatelliteStore';
import Satellite from './Satellite';
import { EARTH_RADIUS } from '../lib/consts';

const Earth = () => {
  const earthRef = useRef<THREE.Group>(null);
  
  // Get satellites and filter states from store
  const { 
    satellites, 
    currentTime, 
    userLocation,
    apertureAngle
  } = useSatelliteStore();
  
  // Earth materials
  const earthMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a5276', // Deep blue ocean color
    roughness: 0.7,
    metalness: 0.2,
  }), []);
  
  const landMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#27ae60', // Green land color
    transparent: true,
    opacity: 0.6,
    roughness: 1,
    metalness: 0,
    wireframe: false,
  }), []);
  
  const atmosphereMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#84b7de', 
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide,
  }), []);
  
  // Get auto-rotation state from store
  const { autoRotateEarth } = useSatelliteStore();
  
  // Rotate the earth if auto-rotation is enabled
  useFrame(({ clock }) => {
    if (earthRef.current && autoRotateEarth) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  // Convert user's latitude/longitude to a 3D position for filtering
  const userPosition = useMemo(() => {
    if (!userLocation) return null;
    
    const { latitude, longitude } = userLocation;
    
    // Convert to radians
    const latRad = latitude * (Math.PI / 180);
    const lonRad = longitude * (Math.PI / 180);
    
    // Convert to cartesian coordinates on Earth's surface
    const x = EARTH_RADIUS * Math.cos(latRad) * Math.cos(lonRad);
    const y = EARTH_RADIUS * Math.sin(latRad);
    const z = EARTH_RADIUS * Math.cos(latRad) * Math.sin(lonRad);
    
    return new THREE.Vector3(x, y, z);
  }, [userLocation]);

  console.log("Earth rendering, satellites:", satellites.length);

  return (
    <group ref={earthRef} position={[0, 0, 0]}>
      {/* Ocean sphere */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <primitive object={earthMaterial} attach="material" />
      </mesh>
      
      {/* Land masses */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.05, 32, 32]} />
        <primitive object={landMaterial} attach="material" />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.3, 30, 30]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>
      
      {/* Location marker if user location is set */}
      {userPosition && (
        <mesh position={userPosition.toArray()}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      )}
      
      {/* Render all satellites */}
      {satellites.map(satellite => (
        <Satellite 
          key={satellite.id}
          satellite={satellite}
          currentTime={currentTime}
          userPosition={userPosition}
          apertureAngle={apertureAngle}
        />
      ))}
    </group>
  );
};

export default Earth;
