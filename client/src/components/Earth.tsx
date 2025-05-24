import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, useHelper, useTexture, PerspectiveCamera, Html } from '@react-three/drei';
import { useSatelliteStore } from '../lib/stores/useSatelliteStore';
import Satellite from './Satellite';
import { EARTH_RADIUS } from '../lib/consts';
import { createApertureCone, latLonToCartesian, getNormalAtLatLon } from '../lib/utils';

interface EarthProps {
  azimuth: number;
  elevation: number;
  setAzimuth: (value: number) => void;
  setElevation: (value: number) => void;
}

const Earth = ({ azimuth, elevation, setAzimuth, setElevation }: EarthProps) => {
  const earthRef = useRef<THREE.Group>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  
  // Track the current map style
  const [mapStyle, setMapStyle] = useState<'day' | 'night'>('day');
  
  // Get satellites and filter states from store
  const { 
    satellites, 
    currentTime, 
    userLocation,
    apertureAngle,
    autoRotateEarth,
    showApertureCone
  } = useSatelliteStore();
  
  // Load Earth texture maps
  const earthTextures = useTexture({
    day: '/textures/earth_daymap.jpg',
    night: '/textures/earth_nightmap.jpg',
  });
  
  // Earth materials with textures
  const earthMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      map: mapStyle === 'day' ? earthTextures.day : earthTextures.night,
      roughness: 0.7,
      metalness: 0.2,
    });
    return material;
  }, [earthTextures, mapStyle]);
  
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
    depthWrite: false, // Prevent z-fighting with the Earth
  }), []);
  
  // Rotate the earth if auto-rotation is enabled
  useFrame(({ clock }) => {
    if (earthRef.current && autoRotateEarth) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  // Access the Three.js camera
  const { camera } = useThree();
  
  // Direction controls now passed as props
  
  // Simple position calculation directly from lat/lon
  const userPosition = useMemo(() => {
    if (!userLocation) return null;
    return latLonToCartesian(userLocation.latitude, userLocation.longitude);
  }, [userLocation]);
  
  // Basic cone data calculation
  const coneHeight = EARTH_RADIUS * 4;
  const coneBaseRadius = useMemo(() => {
    return coneHeight * Math.tan((apertureAngle * Math.PI / 180) / 2);
  }, [apertureAngle]);
  
  // Calculate direction vector based on azimuth and elevation
  const coneDirection = useMemo(() => {
    if (!userPosition) return new THREE.Vector3(0, 1, 0);
    
    // Start with the surface normal (points directly outward from Earth center)
    const normal = userPosition.clone().normalize();
    
    // Convert azimuth and elevation to radians
    const azimuthRad = azimuth * Math.PI / 180;
    const elevationRad = elevation * Math.PI / 180;
    
    // Create a local coordinate system at the surface point
    // 1. Use the normal as "up" vector
    const up = normal;
    
    // 2. Create perpendicular vectors to form a basis
    // Start with any vector that's not parallel to normal
    const temp = Math.abs(normal.y) > 0.99 ? 
      new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    
    // East direction (perpendicular to normal)
    const east = new THREE.Vector3().crossVectors(up, temp).normalize();
    
    // North direction (perpendicular to both east and up)
    const north = new THREE.Vector3().crossVectors(east, up).normalize();
    
    // Create the rotated direction vector
    // Start with the normal direction
    const direction = normal.clone();
    
    // Apply elevation rotation (in the north-up plane)
    if (elevationRad !== 0) {
      // Rotate around east axis by elevation angle
      const q1 = new THREE.Quaternion().setFromAxisAngle(east, -elevationRad);
      direction.applyQuaternion(q1);
    }
    
    // Apply azimuth rotation (around normal axis)
    if (azimuthRad !== 0) {
      // Rotate around normal axis by azimuth angle
      const q2 = new THREE.Quaternion().setFromAxisAngle(normal, azimuthRad);
      direction.applyQuaternion(q2);
    }
    
    // Return the final direction
    return direction;
  }, [userPosition, azimuth, elevation]);
  
  // Set up keyboard controls for the cone direction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        const newAzimuth = (azimuth - 10) % 360;
        setAzimuth(newAzimuth < 0 ? newAzimuth + 360 : newAzimuth);
      }
      if (e.key === 'ArrowRight') {
        setAzimuth((azimuth + 10) % 360);
      }
      if (e.key === 'ArrowUp') {
        setElevation(Math.min(elevation + 10, 90));
      }
      if (e.key === 'ArrowDown') {
        setElevation(Math.max(elevation - 10, -90));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    console.log("Keyboard controls activated");
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [azimuth, elevation, setAzimuth, setElevation]);

  console.log("Earth rendering, satellites:", satellites.length);

  return (
    <group ref={earthRef} position={[0, 0, 0]}>
      {/* Ocean sphere */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <primitive object={earthMaterial} attach="material" />
      </mesh>
      
      {/* Day/Night Toggle Button - positioned above Earth at the top */}
      <group position={[0, EARTH_RADIUS * 1.5, 0]}>
        <mesh 
          onClick={() => setMapStyle(prev => prev === 'day' ? 'night' : 'day')}
        >
          <boxGeometry args={[1, 0.5, 0.2]} />
          <meshStandardMaterial color={mapStyle === 'day' ? "#ffd700" : "#000080"} />
        </mesh>
      </group>
      
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
          
          {/* Simplified aperture cone with azimuth/elevation controls */}
          {showApertureCone && userPosition && (
            <>
              {/* Yellow marker to show exact location on Earth's surface */}
              <mesh position={userPosition.toArray()}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffff00" />
              </mesh>
              
              {/* Create a cone that follows the direction vector */}
              <group position={userPosition.toArray()}>
                {/* Create a group that aligns with the direction vector */}
                <group
                  matrixAutoUpdate={false}
                  matrix={
                    // Create a matrix that orients the cone along the direction vector
                    new THREE.Matrix4().lookAt(
                      new THREE.Vector3(0, 0, 0), // Look from origin
                      coneDirection.clone().multiplyScalar(-1), // Look towards direction (inverted)
                      new THREE.Vector3(0, 1, 0) // Up vector
                    )
                  }
                >
                  {/* The cone with its tip at the origin pointing outward */}
                  <mesh ref={coneRef} position={[0, coneHeight/2, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry 
                      args={[
                        coneBaseRadius,
                        coneHeight,
                        32, // Segments
                        1, // Height segments
                        true // Open ended
                      ]} 
                    />
                    <meshBasicMaterial 
                      color="#f7d794"
                      transparent={true}
                      opacity={0.2}
                      side={THREE.DoubleSide}
                      depthWrite={false}
                    />
                  </mesh>
                </group>
              </group>
              
              {/* Direction controls now integrated into the FilterPanel */}
            </>
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
          coneDirection={coneDirection}
        />
      ))}
    </group>
  );
};

export default Earth;
