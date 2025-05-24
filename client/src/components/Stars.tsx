import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Creates a background starfield
const Stars = () => {
  const starsRef = useRef<THREE.Points>(null);
  
  // Create star particles with random positions
  const particles = useMemo(() => {
    const temp = [];
    const count = 5000;
    
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
    const count = 5000;
    
    for (let i = 0; i < count; i++) {
      temp.push(Math.random() * 2 + 0.5); // Size between 0.5 and 2.5
    }
    
    return new Float32Array(temp);
  }, []);
  
  // Create colors with more blue/white stars
  const colors = useMemo(() => {
    const temp = [];
    const count = 5000;
    
    for (let i = 0; i < count; i++) {
      // Create a color between white and blue
      const r = 0.7 + Math.random() * 0.3; // 0.7-1.0
      const g = 0.7 + Math.random() * 0.3; // 0.7-1.0
      const b = 0.9 + Math.random() * 0.1; // 0.9-1.0
      
      temp.push(r, g, b);
    }
    
    return new Float32Array(temp);
  }, []);
  
  // Slowly rotate stars
  useFrame(({ clock }) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = clock.getElapsedTime() * 0.01;
    }
  });
  
  return (
    <points ref={starsRef}>
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
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2.0}
        sizeAttenuation={true}
        vertexColors
        transparent
        opacity={1.0}
        fog={false}
      />
    </points>
  );
};

export default Stars;
