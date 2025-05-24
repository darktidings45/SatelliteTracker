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
    specular: '/textures/earth_specular.jpg',
  });
  
  // Earth materials with textures
  const earthMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      map: mapStyle === 'day' ? earthTextures.day : earthTextures.night,
      roughnessMap: earthTextures.specular,
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
                {/* Create cone using custom geometry that starts at the surface */}
                <mesh ref={coneRef}>
                  <primitive attach="geometry">
                    {(() => {
                      // Create a custom cone geometry that starts at user location
                      const geometry = new THREE.BufferGeometry();
                      
                      // Calculate apex position (on Earth's surface)
                      const apex = userPositionData.position.clone();
                      
                      // Calculate base center (in direction of normal)
                      const direction = apex.clone().normalize();
                      const distance = EARTH_RADIUS * 4; // Length of cone
                      const baseCenter = apex.clone().add(direction.multiplyScalar(distance));
                      
                      // Calculate base radius from aperture angle
                      const baseRadius = distance * Math.tan((apertureAngle * Math.PI / 180) / 2);
                      
                      // Create a circle of points for the base
                      const segments = 32;
                      const basePoints = [];
                      
                      // Create vectors perpendicular to the direction vector
                      let perpVector1 = new THREE.Vector3(1, 0, 0);
                      if (Math.abs(direction.dot(perpVector1)) > 0.99) {
                        perpVector1 = new THREE.Vector3(0, 1, 0);
                      }
                      
                      const perpVector2 = new THREE.Vector3().crossVectors(direction, perpVector1).normalize();
                      perpVector1 = new THREE.Vector3().crossVectors(perpVector2, direction).normalize();
                      
                      // Generate points around the circle
                      for (let i = 0; i <= segments; i++) {
                        const angle = (i / segments) * Math.PI * 2;
                        const x = Math.cos(angle) * baseRadius;
                        const y = Math.sin(angle) * baseRadius;
                        
                        // Position on the base circle
                        const point = baseCenter.clone()
                          .add(perpVector1.clone().multiplyScalar(x))
                          .add(perpVector2.clone().multiplyScalar(y));
                          
                        basePoints.push(point);
                      }
                      
                      // Create cone vertices and faces
                      const vertices = [];
                      const indices = [];
                      
                      // Add apex as first vertex
                      vertices.push(apex.x, apex.y, apex.z);
                      
                      // Add base points
                      for (let i = 0; i < basePoints.length; i++) {
                        const point = basePoints[i];
                        vertices.push(point.x, point.y, point.z);
                      }
                      
                      // Create triangles connecting apex to base
                      for (let i = 1; i < basePoints.length; i++) {
                        indices.push(0, i, i + 1);
                      }
                      
                      // Set attributes
                      geometry.setIndex(indices);
                      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                      geometry.computeVertexNormals();
                      
                      return geometry;
                    })()}
                  </primitive>
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
