import { useMemo } from 'react';
import * as THREE from 'three';

// Creates a background starfield
const Stars = () => {
  // Create star particles with random positions
  const particles = useMemo(() => {
    const temp = [];
    const count = 2000;
    
    for (let i = 0; i < count; i++) {
      // Create stars in a spherical distribution
      const radius = Math.random() * 500 + 200; // Between 200-700 units from center
      const theta = Math.random() * Math.PI * 2; // Random angle around y-axis
      const phi = Math.random() * Math.PI; // Random angle from top to bottom
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      temp.push(x, y, z);
    }
    
    return new Float32Array(temp);
  }, []);
  
  // Create star sizes with some variation
  const sizes = useMemo(() => {
    const temp = [];
    const count = 2000;
    
    for (let i = 0; i < count; i++) {
      temp.push(Math.random() * 2 + 0.5); // Size between 0.5 and 2.5
    }
    
    return new Float32Array(temp);
  }, []);
  
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        sizeAttenuation={true}
        color={new THREE.Color("#ffffff")}
        transparent
        opacity={0.8}
        fog={false}
      />
    </points>
  );
};

export default Stars;
