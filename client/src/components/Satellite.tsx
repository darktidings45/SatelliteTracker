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
  
  // Determine if this satellite is visible from the user's location with directed cone
  const isVisible = useMemo(() => {
    // If no user position is set, show all satellites
    if (!userPosition) return true;
    
    // Calculate the vector from user position to satellite
    const toSatellite = new THREE.Vector3(
      position.x - userPosition.x,
      position.y - userPosition.y,
      position.z - userPosition.z
    ).normalize();
    
    // If no cone direction provided, use the normal from user position (original behavior)
    const direction = coneDirection || userPosition.clone().normalize();
    
    // Calculate the angle between cone direction and satellite direction
    const angle = direction.angleTo(toSatellite);
    
    // Convert aperture angle from degrees to radians
    const halfApertureRad = (apertureAngle / 2) * Math.PI / 180;
    
    // Check if the satellite is within the aperture cone
    return angle <= halfApertureRad;
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
    if (meshRef.current && isSelected) {
      const pulse = Math.sin(clock.getElapsedTime() * 5) * 0.1 + 1;
      meshRef.current.scale.set(
        SATELLITE_SCALE * pulse,
        SATELLITE_SCALE * pulse,
        SATELLITE_SCALE * pulse
      );
    }
  });
  
  // Hide satellites that aren't visible based on user's location/aperture
  if (!isVisible) return null;
  
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
          emissiveIntensity={hovered ? 0.8 : isSelected ? 1 : 0.5}
        />
      </Sphere>
      
      {/* Glow effect */}
      <Sphere args={[0.3, 8, 8]} scale={SATELLITE_SCALE * 1.2}>
        <meshBasicMaterial 
          color={satelliteColor} 
          transparent={true} 
          opacity={0.15} 
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
