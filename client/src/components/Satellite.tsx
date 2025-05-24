import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
}

const Satellite = ({ 
  satellite, 
  currentTime,
  userPosition, 
  apertureAngle 
}: SatelliteProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { setSelectedSatellite, selectedSatellite } = useSatelliteStore();
  const [hovered, setHovered] = useState(false);
  const { playHit } = useAudio();
  
  // Calculate the satellite's position based on its TLE data and the current time
  const position = useMemo(() => {
    return calculateSatellitePosition(satellite.tle, currentTime);
  }, [satellite.tle, currentTime]);
  
  // Determine if this satellite is visible from the user's location
  const isVisible = useMemo(() => {
    // If no user position is set, show all satellites
    if (!userPosition) return true;
    
    // Calculate the vector from user position to satellite
    const toSatellite = new THREE.Vector3(
      position.x - userPosition.x,
      position.y - userPosition.y,
      position.z - userPosition.z
    );
    
    // Calculate normalized user position (direction from earth center to user)
    const userDirection = userPosition.clone().normalize();
    
    // Calculate the angle between user direction and satellite direction
    const angle = userDirection.angleTo(toSatellite);
    
    // Convert aperture angle from degrees to radians
    const apertureRad = apertureAngle * Math.PI / 180;
    
    // Check if the satellite is within the aperture cone
    return angle <= apertureRad;
  }, [userPosition, position, apertureAngle]);
  
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
  
  // Hide satellites that aren't visible based on user's location/aperture
  if (!isVisible) return null;
  
  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh 
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={SATELLITE_SCALE}
      >
        <boxGeometry args={[0.2, 0.2, 0.5]} />
        <meshStandardMaterial 
          color={satelliteColor} 
          emissive={hovered || isSelected ? satelliteColor : '#000000'}
          emissiveIntensity={hovered ? 0.5 : isSelected ? 1 : 0}
        />
      </mesh>
      
      {/* Draw orbit line */}
      {isSelected && (
        <line>
          <bufferGeometry attach="geometry" {...satellite.orbitGeometry} />
          <lineBasicMaterial attach="material" color={satelliteColor} linewidth={1} />
        </line>
      )}
      
      {/* Show label when hovered */}
      {(hovered || isSelected) && (
        <Html
          position={[0, 0.5, 0]}
          center
          style={{
            backgroundColor: 'rgba(10, 15, 22, 0.7)',
            padding: '5px 10px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {satellite.name}
        </Html>
      )}
    </group>
  );
};

export default Satellite;
