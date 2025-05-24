import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, useHelper, useTexture, PerspectiveCamera } from '@react-three/drei';
import { useSatelliteStore } from '../lib/stores/useSatelliteStore';
import Satellite from './Satellite';
import { EARTH_RADIUS } from '../lib/consts';
import { createApertureCone, latLonToCartesian, getNormalAtLatLon } from '../lib/utils';

const Earth = () => {
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
  
  // Simple position calculation directly from lat/lon 
  const userPosition = useMemo(() => {
    if (!userLocation) return null;
    
    const { latitude, longitude } = userLocation;
    
    // Convert to cartesian coordinates
    return latLonToCartesian(latitude, longitude);
  }, [userLocation]);
  
  // Calculate the normalized direction from Earth center to user position
  const userDirection = useMemo(() => {
    if (!userPosition) return null;
    return userPosition.clone().normalize();
  }, [userPosition]);
  
  // Position a very simple cone directly at the user location
  const coneProps = useMemo(() => {
    if (!userPosition || !userDirection) return null;
    
    // Cone dimensions based on aperture angle
    const height = EARTH_RADIUS * 4;
    const baseRadius = height * Math.tan((apertureAngle * Math.PI / 180) / 2);
    
    return {
      position: userPosition.clone(),
      direction: userDirection.clone(),
      height,
      baseRadius
    };
  }, [userPosition, userDirection, apertureAngle]);

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
          
          {/* Simplified aperture cone visualization */}
          {showApertureCone && userPosition && userDirection && coneProps && (
            <>
              {/* Yellow marker to show exact location on Earth's surface */}
              <mesh position={userPosition.toArray()}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffff00" />
              </mesh>
              
              {/* Create a cone that always points directly outward from Earth's center */}
              <group position={userPosition.toArray()}>
                {/* Create a look-at matrix to orient the cone along the direction vector */}
                <group 
                  matrix={new THREE.Matrix4().lookAt(
                    new THREE.Vector3(0, 0, 0),  // Look from origin 
                    userDirection.clone().multiplyScalar(-1), // Look toward direction (inverted)
                    new THREE.Vector3(0, 1, 0)   // Up vector
                  )}
                >
                  {/* Cone geometry with its tip at the user position */}
                  <mesh ref={coneRef} position={[0, coneProps.height/2, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry 
                      args={[
                        coneProps.baseRadius,
                        coneProps.height,
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
        />
      ))}
    </group>
  );
};

export default Earth;
