import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import { SatelliteData } from '../hooks/useSatellites';
import { useSatelliteStore } from '../lib/stores/useSatelliteStore';
import { calculateSatellitePosition } from '../lib/satellite-utils';
import { EARTH_RADIUS, SATELLITE_SCALE } from '../lib/consts';
import { useAudio } from '../lib/stores/useAudio';

interface SatelliteProps {
  satellite: SatelliteData;
  currentTime: Date;
  userPosition: THREE.Vector3 | null;
  apertureAngle: number;
  coneDirection?: THREE.Vector3; // Direction vector for the aperture cone
}

const Satellite = ({ 
  satellite, 
  currentTime,
  userPosition, 
  apertureAngle,
  coneDirection
}: SatelliteProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { setSelectedSatellite, selectedSatellite } = useSatelliteStore();
  const [hovered, setHovered] = useState(false);
  const { playHit } = useAudio();
  
  // Calculate the satellite's position based on its TLE data and the current time
  const position = useMemo(() => {
    return calculateSatellitePosition(satellite.tle, currentTime);
  }, [satellite.tle, currentTime]);
  
  // Determine if this satellite is within the aperture cone using more accurate detection
  const isInCone = useMemo(() => {
    // If no user position or cone direction, it's not in any cone
    if (!userPosition || !coneDirection) return false;
    
    // Get the vector from user position to satellite
    const toSatellite = new THREE.Vector3(
      position.x - userPosition.x,
      position.y - userPosition.y,
      position.z - userPosition.z
    );
    
    // Project the satellite position onto the cone direction vector
    const projectionLength = toSatellite.dot(coneDirection);
    
    // If projection is negative, satellite is behind the cone origin
    if (projectionLength <= 0) return false;
    
    // Calculate distance from cone axis at the projection point
    const projectionPoint = coneDirection.clone().multiplyScalar(projectionLength);
    const distanceVector = toSatellite.clone().sub(projectionPoint);
    const distanceFromAxis = distanceVector.length();
    
    // Calculate the cone radius at the projection distance
    const halfApertureRad = (apertureAngle / 2) * Math.PI / 180;
    const coneRadiusAtProjection = Math.tan(halfApertureRad) * projectionLength;
    
    // Check if the satellite is within the cone at this distance
    return distanceFromAxis <= coneRadiusAtProjection;
  }, [userPosition, position, apertureAngle, coneDirection]);
  
  // Satellite color based on type/purpose
  const satelliteColor = useMemo(() => {
    // Base color is yellow (accent color)
    let color = '#f7d794';
    
    // Modify color based on satellite type or purpose
    switch(satellite.type) {
      case 'ISS':
        color = '#3498db'; // Blue for ISS
        break;
      case 'WEATHER':
        color = '#2ecc71'; // Green for weather satellites
        break;
      case 'COMMUNICATION':
        color = '#e74c3c'; // Red for communication satellites
        break;
      case 'NAVIGATION':
        color = '#9b59b6'; // Purple for navigation satellites
        break;
      default:
        // Keep default color for other types
        color = '#f7d794'; // Yellow for other satellites
        break;
    }
    
    return color;
  }, [satellite.type]);
  
  // Handle satellite selection
  const handleClick = () => {
    playHit();
    setSelectedSatellite(satellite);
  };
  
  // Check if this satellite is currently selected
  const isSelected = selectedSatellite?.id === satellite.id;
  
  // Pulse effect for selected satellites
  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (isSelected) {
        // Pulsing effect for selected satellites
        const pulse = Math.sin(clock.getElapsedTime() * 5) * 0.1 + 1;
        meshRef.current.scale.set(
          SATELLITE_SCALE * pulse,
          SATELLITE_SCALE * pulse,
          SATELLITE_SCALE * pulse
        );
      } else if (isInCone) {
        // Slightly larger scale for satellites in the cone
        meshRef.current.scale.set(
          SATELLITE_SCALE * 1.2,
          SATELLITE_SCALE * 1.2,
          SATELLITE_SCALE * 1.2
        );
      } else {
        // Normal scale for other satellites
        meshRef.current.scale.set(
          SATELLITE_SCALE,
          SATELLITE_SCALE,
          SATELLITE_SCALE
        );
      }
    }
  });
  
  // Always show all satellites, but highlight those in the cone
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Satellite body */}
      <Sphere
        ref={meshRef}
        args={[0.2, 8, 8]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={SATELLITE_SCALE}
      >
        <meshStandardMaterial 
          color={satelliteColor}
          emissive={satelliteColor}
          emissiveIntensity={
            hovered ? 0.8 : 
            isSelected ? 1 : 
            isInCone ? 1.0 : 0.2
          }
        />
      </Sphere>
      
      {/* Glow effect - red highlight for satellites in the cone */}
      <Sphere args={[0.3, 8, 8]} scale={SATELLITE_SCALE * (isInCone ? 1.5 : 1.2)}>
        <meshBasicMaterial 
          color={isInCone ? "#ff3333" : satelliteColor} 
          transparent={true} 
          opacity={isInCone ? 0.4 : 0.15} 
        />
      </Sphere>
      
      {/* Draw orbit line */}
      {isSelected && (
        <line>
          <bufferGeometry attach="geometry" {...satellite.orbitGeometry} />
          <lineBasicMaterial 
            attach="material" 
            color={satelliteColor} 
            linewidth={2}
            transparent={true}
            opacity={0.7}
          />
        </line>
      )}
      
      {/* Show label when hovered */}
      {(hovered || isSelected) && (
        <Html
          position={[0, 0.8, 0]}
          center
          style={{
            backgroundColor: 'rgba(10, 15, 22, 0.8)',
            padding: '5px 10px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, sans-serif',
            transform: 'scale(1.0)',
            userSelect: 'none'
          }}
        >
          {satellite.name}
        </Html>
      )}
    </group>
  );
};

export default Satellite;
