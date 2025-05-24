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
  
  // Create detailed Earth texture maps
  const earthTextures = useMemo(() => {
    try {
      // Create a basic color texture
      const fallbackTexture = new THREE.TextureLoader().load('');
      fallbackTexture.image = { width: 1, height: 1 };
      
      // Create a canvas to generate a detailed Earth texture with landmass
      const canvas = document.createElement('canvas');
      canvas.width = 1024; // Higher resolution for more detail
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw day texture with continents
        // Ocean base
        ctx.fillStyle = '#1a5276'; // Ocean blue
        ctx.fillRect(0, 0, 1024, 512);
        
        // Add detailed continents
        
        // North America
        ctx.fillStyle = '#27ae60'; // Land green
        ctx.beginPath();
        ctx.moveTo(150, 100);
        ctx.bezierCurveTo(200, 80, 250, 100, 300, 120);
        ctx.lineTo(280, 220);
        ctx.bezierCurveTo(240, 240, 150, 230, 120, 180);
        ctx.closePath();
        ctx.fill();
        
        // South America
        ctx.beginPath();
        ctx.moveTo(280, 230);
        ctx.bezierCurveTo(300, 260, 310, 300, 280, 350);
        ctx.bezierCurveTo(250, 380, 220, 350, 230, 300);
        ctx.bezierCurveTo(230, 270, 240, 230, 280, 230);
        ctx.closePath();
        ctx.fill();
        
        // Europe/Africa
        ctx.beginPath();
        ctx.moveTo(450, 100);
        ctx.bezierCurveTo(480, 110, 520, 120, 500, 180);
        ctx.bezierCurveTo(510, 220, 500, 300, 460, 350);
        ctx.bezierCurveTo(430, 330, 410, 280, 420, 230);
        ctx.bezierCurveTo(380, 180, 410, 120, 450, 100);
        ctx.closePath();
        ctx.fill();
        
        // Asia/Australia
        ctx.beginPath();
        ctx.moveTo(550, 120);
        ctx.bezierCurveTo(600, 100, 700, 120, 750, 150);
        ctx.bezierCurveTo(780, 200, 750, 250, 700, 230);
        ctx.bezierCurveTo(680, 300, 630, 320, 600, 280);
        ctx.bezierCurveTo(560, 290, 530, 230, 550, 180);
        ctx.lineTo(550, 120);
        ctx.closePath();
        ctx.fill();
        
        // Australia
        ctx.beginPath();
        ctx.ellipse(700, 320, 50, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add grid lines for longitude/latitude
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        
        // Longitude lines
        for (let i = 0; i < 1024; i += 1024/12) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 512);
          ctx.stroke();
        }
        
        // Latitude lines
        for (let i = 0; i < 512; i += 512/6) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(1024, i);
          ctx.stroke();
        }
      }
      
      // Create textures from canvas
      const dayTexture = new THREE.CanvasTexture(canvas);
      
      // Night texture (darker version)
      const nightCanvas = document.createElement('canvas');
      nightCanvas.width = 1024;
      nightCanvas.height = 512;
      const nightCtx = nightCanvas.getContext('2d');
      
      if (nightCtx) {
        // Draw the night version with city lights
        nightCtx.fillStyle = '#0a1622'; // Dark ocean
        nightCtx.fillRect(0, 0, 1024, 512);
        
        // Copy the continents from day texture but darker
        if (ctx) {
          nightCtx.drawImage(canvas, 0, 0);
          
          // Add semi-transparent dark overlay
          nightCtx.fillStyle = 'rgba(0, 0, 30, 0.7)';
          nightCtx.fillRect(0, 0, 1024, 512);
          
          // Add city lights (small dots)
          nightCtx.fillStyle = '#ffff80';
          
          // North America cities
          for (let i = 0; i < 20; i++) {
            const x = 150 + Math.random() * 150;
            const y = 100 + Math.random() * 120;
            const size = 1 + Math.random() * 3;
            nightCtx.beginPath();
            nightCtx.arc(x, y, size, 0, Math.PI * 2);
            nightCtx.fill();
          }
          
          // Europe cities
          for (let i = 0; i < 25; i++) {
            const x = 450 + Math.random() * 100;
            const y = 100 + Math.random() * 80;
            const size = 1 + Math.random() * 3;
            nightCtx.beginPath();
            nightCtx.arc(x, y, size, 0, Math.PI * 2);
            nightCtx.fill();
          }
          
          // Asia cities
          for (let i = 0; i < 30; i++) {
            const x = 600 + Math.random() * 150;
            const y = 150 + Math.random() * 100;
            const size = 1 + Math.random() * 3;
            nightCtx.beginPath();
            nightCtx.arc(x, y, size, 0, Math.PI * 2);
            nightCtx.fill();
          }
        }
      }
      
      const nightTexture = new THREE.CanvasTexture(nightCanvas);
      
      // Create a specular map for water reflections
      const specularCanvas = document.createElement('canvas');
      specularCanvas.width = 1024;
      specularCanvas.height = 512;
      const specularCtx = specularCanvas.getContext('2d');
      
      if (specularCtx) {
        // Water is more reflective (white), land is less (dark)
        specularCtx.fillStyle = '#ffffff'; // Highly reflective ocean
        specularCtx.fillRect(0, 0, 1024, 512);
        
        // Copy the continent shapes from the day map but make them dark (less reflective)
        if (ctx) {
          specularCtx.drawImage(canvas, 0, 0);
          
          // Make land masses dark (low reflection)
          specularCtx.fillStyle = 'rgba(20, 20, 20, 0.8)';
          specularCtx.fillRect(0, 0, 1024, 512);
          
          // Keep oceans reflective
          specularCtx.globalCompositeOperation = 'destination-out';
          specularCtx.drawImage(canvas, 0, 0);
          specularCtx.globalCompositeOperation = 'source-over';
        }
      }
      
      const specularTexture = new THREE.CanvasTexture(specularCanvas);
      
      return {
        day: dayTexture,
        night: nightTexture,
        specular: specularTexture,
      };
    } catch (error) {
      console.error('Failed to load Earth textures:', error);
      
      // Create a simple texture if error
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#1a5276';
        ctx.fillRect(0, 0, 256, 256);
      }
      
      const simpleTexture = new THREE.CanvasTexture(canvas);
      
      return {
        day: simpleTexture,
        night: simpleTexture,
        specular: simpleTexture
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
              {/* Create visible marker and cone */}
              <group>
                {/* Create a larger yellow marker exactly on Earth's surface */}
                <mesh>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <meshBasicMaterial color="#ffff00" />
                </mesh>
                
                {/* Create a thin pole extending outward slightly to show direction */}
                <mesh position={[0, 1, 0]}>
                  <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
                  <meshBasicMaterial color="#ff0000" />
                </mesh>
                
                {/* Position cone precisely at the end of the pole */}
                <group position={[0, 2, 0]}>
                  <mesh 
                    ref={coneRef} 
                    rotation={[0, 0, 0]} 
                  >
                    <coneGeometry 
                      args={[
                        // Base radius depends on aperture angle
                        EARTH_RADIUS * Math.tan((apertureAngle * Math.PI / 180) / 2), 
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
