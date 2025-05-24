import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sphere, useHelper, useTexture } from '@react-three/drei';
import { useSatelliteStore } from '../lib/stores/useSatelliteStore';
import Satellite from './Satellite';
import { EARTH_RADIUS } from '../lib/consts';

// Constants for cone positioning
// No altitude offset needed - we'll use a direct calculation

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
          
          {/* Aperture cone visualization */}
          {showApertureCone && userPositionData && (
            <>
              {/* Yellow marker to show exact location on Earth's surface */}
              <mesh position={userPositionData.position.toArray()}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffff00" />
              </mesh>
              
              {/* Custom cone that starts exactly at Earth's surface */}
              {/* We create a cylindrical cone instead of using the built-in cone geometry */}
              <group 
                position={[0, 0, 0]}
                matrixAutoUpdate={true}
              >
                {/* Use a simpler approach for the cone */}
                <mesh ref={coneRef}>
                  {useMemo(() => {
                    // Use built-in ConeGeometry but position it carefully
                    const height = EARTH_RADIUS * 4;
                    const baseRadius = height * Math.tan((apertureAngle * Math.PI / 180) / 2);
                    
                    // Create cone geometry
                    const geometry = new THREE.ConeGeometry(
                      baseRadius,
                      height,
                      32,
                      1,
                      true
                    );
                    
                    // Move cone so vertex is at origin
                    geometry.translate(0, height / 2, 0);
                    
                    // Rotate to align with direction
                    geometry.rotateX(Math.PI);
                    
                    return <primitive object={geometry} attach="geometry" />;
                  }, [apertureAngle])}
                  <primitive object={apertureMaterial} attach="material" />
                </mesh>
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
