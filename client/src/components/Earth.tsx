import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sphere, useHelper } from '@react-three/drei';
import { useSatelliteStore } from '../lib/stores/useSatelliteStore';
import Satellite from './Satellite';
import { EARTH_RADIUS } from '../lib/consts';

const Earth = () => {
  const earthRef = useRef<THREE.Group>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  
  // Get satellites and filter states from store
  const { 
    satellites, 
    currentTime, 
    userLocation,
    apertureAngle,
    autoRotateEarth,
    showApertureCone
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
  
  // Create aperture cone material for visualization
  const apertureMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#f7d794',
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  }), []);
  
  // Rotate the earth if auto-rotation is enabled
  useFrame(({ clock }) => {
    if (earthRef.current && autoRotateEarth) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  // Convert user's latitude/longitude to a 3D position for filtering
  const userPositionData = useMemo(() => {
    if (!userLocation) return null;
    
    const { latitude, longitude } = userLocation;
    
    // Convert to radians
    const latRad = latitude * (Math.PI / 180);
    const lonRad = longitude * (Math.PI / 180);
    
    // Convert to cartesian coordinates on Earth's surface
    const x = EARTH_RADIUS * Math.cos(latRad) * Math.cos(lonRad);
    const y = EARTH_RADIUS * Math.sin(latRad);
    const z = EARTH_RADIUS * Math.cos(latRad) * Math.sin(lonRad);
    
    // Calculate surface normal at this position (points outward from Earth center)
    const position = new THREE.Vector3(x, y, z);
    const normal = position.clone().normalize();
    
    // Create a rotation matrix to orient objects along this normal vector
    const quaternion = new THREE.Quaternion();
    // Default cone points in negative Y direction, we want to align with the normal
    const upVector = new THREE.Vector3(0, 1, 0);
    quaternion.setFromUnitVectors(upVector, normal);
    
    return {
      position,
      normal,
      quaternion
    };
  }, [userLocation]);
  
  // Extract the position vector for use elsewhere
  const userPosition = userPositionData?.position || null;

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
        <>
          <mesh position={userPosition.toArray()}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          
          {/* Aperture cone visualization */}
          {showApertureCone && userPositionData && (
            <group 
              position={userPositionData.position.toArray()}
              quaternion={userPositionData.quaternion}
            >
              <mesh ref={coneRef}>
                <coneGeometry 
                  args={[
                    // Base radius depends on aperture angle (in radians)
                    // Use tangent to calculate the radius based on height and angle
                    EARTH_RADIUS * 2 * Math.tan((apertureAngle * Math.PI / 180) / 2), 
                    EARTH_RADIUS * 4, // Height
                    32, // Segments
                    1, // Height segments
                    true // Open ended
                  ]} 
                />
                <primitive object={apertureMaterial} attach="material" />
              </mesh>
            </group>
          )}
        </>
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
