import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, useHelper, useTexture, PerspectiveCamera, Html } from '@react-three/drei';
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
  
  // Add azimuth and elevation controls
  const [azimuth, setAzimuth] = useState(0);
  const [elevation, setElevation] = useState(0);
  
  // Create controls to adjust azimuth and elevation
  useEffect(() => {
    // Add keyboard controls for azimuth and elevation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys for azimuth
      if (e.key === 'ArrowLeft') setAzimuth(prev => (prev - 5) % 360);
      if (e.key === 'ArrowRight') setAzimuth(prev => (prev + 5) % 360);
      
      // Up/Down for elevation
      if (e.key === 'ArrowUp') setElevation(prev => Math.min(prev + 5, 90));
      if (e.key === 'ArrowDown') setElevation(prev => Math.max(prev - 5, -90));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Use our enhanced cone function with azimuth and elevation
  const coneData = useMemo(() => {
    if (!userLocation) return null;
    
    const { latitude, longitude } = userLocation;
    
    // Get cone data with azimuth and elevation
    return createApertureCone(
      latitude,
      longitude,
      apertureAngle,
      azimuth,
      elevation,
      EARTH_RADIUS * 4
    );
  }, [userLocation, apertureAngle, azimuth, elevation]);
  
  // Use the position for other calculations
  const userPosition = coneData?.position || null;

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
          
          {/* Aperture cone with azimuth and elevation control */}
          {showApertureCone && userPosition && coneData && (
            <>
              {/* Yellow marker to show exact location on Earth's surface */}
              <mesh position={userPosition.toArray()}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffff00" />
              </mesh>
              
              {/* Create a cone oriented using the direction from our enhanced function */}
              <group position={userPosition.toArray()}>
                {/* Orient the cone using lookAt with the calculated direction */}
                <group 
                  matrix={new THREE.Matrix4().lookAt(
                    new THREE.Vector3(0, 0, 0),  // Look from origin 
                    coneData.direction.clone().multiplyScalar(-1), // Direction (inverted)
                    new THREE.Vector3(0, 1, 0)   // Up vector
                  )}
                >
                  {/* Cone geometry with its tip at the user position */}
                  <mesh ref={coneRef} position={[0, coneData.height/2, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry 
                      args={[
                        coneData.baseRadius,
                        coneData.height,
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
              
              {/* Direction indicator and current values */}
              <group position={[0, EARTH_RADIUS * 1.5, 0]}>
                <mesh position={[0, 1, 0]}>
                  <meshBasicMaterial color="white" />
                  <boxGeometry args={[4, 0.5, 0.1]} />
                </mesh>
                <Html position={[0, 1, 0]} center>
                  <div style={{ 
                    color: 'white', 
                    background: 'rgba(0,0,0,0.7)', 
                    padding: '10px',
                    borderRadius: '5px',
                    width: '200px'
                  }}>
                    <div>Azimuth: {azimuth}°</div>
                    <div>Elevation: {elevation}°</div>
                    <div style={{ fontSize: '0.8em', marginTop: '5px' }}>
                      Use arrow keys to adjust:
                      <br />← → for azimuth
                      <br />↑ ↓ for elevation
                    </div>
                  </div>
                </Html>
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
