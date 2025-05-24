import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useSatelliteStore } from '../lib/stores/useSatelliteStore';
import Satellite from './Satellite';
import { EARTH_RADIUS } from '../lib/consts';

const Earth = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
  // Load earth textures
  const [earthMap, earthNormal, cloudMap] = useTexture([
    '/textures/earth_map.svg',
    '/textures/earth_normal.svg',
    '/textures/earth_clouds.svg'
  ]);
  
  // Get satellites and filter states from store
  const { 
    satellites, 
    currentTime, 
    userLocation,
    apertureAngle
  } = useSatelliteStore();
  
  // Create Earth material with textures
  const earthMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: earthMap,
      normalMap: earthNormal,
      metalness: 0.1,
      roughness: 0.8,
    });
  }, [earthMap, earthNormal]);

  // Create clouds material
  const cloudsMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
  }, [cloudMap]);

  // Rotate the earth slowly
  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
    
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.055;
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
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        {earthMaterial && <primitive object={earthMaterial} attach="material" />}
      </mesh>
      
      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[EARTH_RADIUS + 0.1, 64, 64]} />
        {cloudsMaterial && <primitive object={cloudsMaterial} attach="material" />}
      </mesh>
      
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
