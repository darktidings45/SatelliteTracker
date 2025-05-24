import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
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
  
  // Earth color
  const earthColor = '#1a5276'; // Deep blue ocean color
  const landColor = '#27ae60'; // Green land color
  
  // Rotate the earth slowly
  useFrame(({ clock }) => {
    if (earthRef.current) {
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

  return (
    <group ref={earthRef}>
      {/* Earth sphere */}
      <Sphere args={[EARTH_RADIUS, 64, 64]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={earthColor}
          roughness={0.7}
          metalness={0.2}
        />
      </Sphere>
      
      {/* Simple land masses for effect */}
      <group>
        {/* Simplified continents */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[EARTH_RADIUS + 0.01, 32, 32]} />
          <meshStandardMaterial 
            color={landColor} 
            transparent={true} 
            opacity={0.6}
            roughness={1}
            metalness={0}
            wireframe={false} 
          />
        </mesh>
      </group>
      
      {/* Atmosphere glow */}
      <Sphere args={[EARTH_RADIUS + 0.2, 30, 30]}>
        <meshStandardMaterial 
          color="#84b7de" 
          transparent={true} 
          opacity={0.1} 
          side={THREE.BackSide}
        />
      </Sphere>
      
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
