import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sphere, useHelper, useTexture } from '@react-three/drei';
import { useSatelliteStore } from '../lib/stores/useSatelliteStore';
import Satellite from './Satellite';
import { EARTH_RADIUS } from '../lib/consts';

// Average Earth altitude above sea level in relative units to our Earth radius
// Using a much larger value to ensure the cone is clearly visible outside the Earth
const AVERAGE_EARTH_ALTITUDE = 0.2 * EARTH_RADIUS;

const Earth = () => {
  const earthRef = useRef<THREE.Group>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  
  // Track the current map style and detail level
  const [mapStyle, setMapStyle] = useState<'day' | 'night'>('day');
  const [mapDetail, setMapDetail] = useState<number>(1.0); // Range from 0.5 (low) to 1.5 (high)
  
  // Get satellites and filter states from store
  const { 
    satellites, 
    currentTime, 
    userLocation,
    apertureAngle,
    autoRotateEarth,
    showApertureCone,
    mapDetail: storeMapDetail,
    setMapDetail: storeSetMapDetail
  } = useSatelliteStore();
  
  // Keep local map detail in sync with store
  useEffect(() => {
    if (storeMapDetail !== undefined) {
      setMapDetail(storeMapDetail);
    }
  }, [storeMapDetail]);
  
  // Update store when local detail changes
  useEffect(() => {
    if (storeSetMapDetail) {
      storeSetMapDetail(mapDetail);
    }
  }, [mapDetail, storeSetMapDetail]);
  
  // Load Earth texture maps with error handling
  const earthTextures = useMemo(() => {
    try {
      // Create a basic color texture as fallback
      const fallbackTexture = new THREE.TextureLoader().load('');
      fallbackTexture.image = { width: 1, height: 1 };
      
      // Create a canvas to generate a basic Earth texture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw day texture (blue with green continents)
        ctx.fillStyle = '#1a5276'; // Ocean blue
        ctx.fillRect(0, 0, 256, 256);
        
        // Add some land masses
        ctx.fillStyle = '#27ae60'; // Land green
        ctx.beginPath();
        ctx.ellipse(100, 100, 40, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(180, 150, 30, 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Create textures from canvas
      const dayTexture = new THREE.CanvasTexture(canvas);
      
      // Night texture (darker version)
      const nightCanvas = document.createElement('canvas');
      nightCanvas.width = 256;
      nightCanvas.height = 256;
      const nightCtx = nightCanvas.getContext('2d');
      
      if (nightCtx) {
        nightCtx.fillStyle = '#0a1622'; // Dark ocean
        nightCtx.fillRect(0, 0, 256, 256);
        
        // Add some land masses
        nightCtx.fillStyle = '#1e3a29'; // Dark land
        nightCtx.beginPath();
        nightCtx.ellipse(100, 100, 40, 60, 0, 0, Math.PI * 2);
        nightCtx.fill();
        nightCtx.beginPath();
        nightCtx.ellipse(180, 150, 30, 20, 0, 0, Math.PI * 2);
        nightCtx.fill();
      }
      
      const nightTexture = new THREE.CanvasTexture(nightCanvas);
      
      return {
        day: dayTexture,
        night: nightTexture,
        specular: fallbackTexture,
      };
    } catch (error) {
      console.error('Failed to load Earth textures:', error);
      // Return placeholder textures
      const fallbackTexture = new THREE.TextureLoader().load('');
      return {
        day: fallbackTexture,
        night: fallbackTexture,
        specular: fallbackTexture
      };
    }
  }, []);
  
  // Earth materials with textures
  const earthMaterial = useMemo(() => {
    // Apply map detail level by adjusting material properties
    const material = new THREE.MeshStandardMaterial({
      map: mapStyle === 'day' ? earthTextures.day : earthTextures.night,
      roughnessMap: earthTextures.specular,
      roughness: 0.7 * (2 - mapDetail), // Higher detail = lower roughness
      metalness: 0.2 * mapDetail,       // Higher detail = higher metalness
    });
    
    console.log("Map detail level:", mapDetail);
    
    // Set material properties that affect detail level
    material.wireframe = mapDetail < 0.7;
    material.flatShading = mapDetail < 1.0;
    
    return material;
  }, [earthTextures, mapStyle, mapDetail]);
  
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
      
      {/* Day/Night Toggle Button - positioned prominently in front of Earth */}
      <group position={[0, EARTH_RADIUS * 1.8, EARTH_RADIUS * 1.2]} scale={1.2}>
        <mesh 
          onClick={() => setMapStyle(prev => prev === 'day' ? 'night' : 'day')}
          position={[0, 0, 0]}
        >
          <boxGeometry args={[2, 1, 0.3]} />
          <meshStandardMaterial color={mapStyle === 'day' ? "#ffd700" : "#000080"} />
        </mesh>
        
        {/* Sun/Moon icons instead of text */}
        {mapStyle === 'day' ? (
          // Sun icon (yellow circle)
          <mesh position={[0, 0, 0.2]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
        ) : (
          // Moon icon (white crescent)
          <group position={[0, 0, 0.2]}>
            <mesh>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshBasicMaterial color="#aaaaaa" />
            </mesh>
            <mesh position={[0.15, 0, 0.1]}>
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshBasicMaterial color="#000055" />
            </mesh>
          </group>
        )}
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
            <group 
              position={userPositionData.position.toArray()}
              quaternion={userPositionData.quaternion}
            >
              {/* Create a visible cone that sits clearly on the Earth's surface */}
              <group>
                {/* First, create a yellow marker at the exact position on Earth's surface */}
                <mesh>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshBasicMaterial color="#ffff00" />
                </mesh>
                
                {/* Then add the cone pointing outward from Earth */}
                <mesh 
                  ref={coneRef} 
                  rotation={[Math.PI, 0, 0]} // Rotate to point outward from Earth
                >
                  <coneGeometry 
                    args={[
                      // Base radius depends on aperture angle (in radians)
                      // Use tangent to calculate the radius based on height and angle
                      EARTH_RADIUS * 1.5 * Math.tan((apertureAngle * Math.PI / 180) / 2), 
                      EARTH_RADIUS * 3, // Height
                      32, // Segments
                      1, // Height segments
                      true // Open ended
                    ]} 
                  />
                  <primitive object={apertureMaterial} attach="material" />
                </mesh>
              </group>
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
