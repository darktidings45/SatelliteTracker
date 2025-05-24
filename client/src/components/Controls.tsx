import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EARTH_RADIUS } from '../lib/consts';

const Controls = () => {
  const controlsRef = useRef<any>();
  const { camera } = useThree();
  
  // Prevent camera from going inside the Earth
  useFrame(() => {
    if (camera) {
      const distance = camera.position.length();
      if (distance < EARTH_RADIUS * 1.5) {
        const direction = camera.position.clone().normalize();
        camera.position.copy(direction.multiplyScalar(EARTH_RADIUS * 1.5));
      }
    }
  });
  
  return (
    <OrbitControls 
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.1}
      minDistance={EARTH_RADIUS * 1.1} // Minimum zoom distance
      maxDistance={100} // Maximum zoom distance
      enablePan={true}
      enableRotate={true}
      enableZoom={true}
      autoRotate={false}
      makeDefault
    />
  );
};

export default Controls;
