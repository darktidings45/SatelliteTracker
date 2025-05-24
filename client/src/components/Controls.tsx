import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { CameraControls } from '@react-three/drei';
import { EARTH_RADIUS } from '../lib/consts';

// Control types for keyboard input
type ControlKeys = {
  forward: boolean;
  backward: boolean;
  leftward: boolean;
  rightward: boolean;
  zoomIn: boolean;
  zoomOut: boolean;
  reset: boolean;
};

const Controls = () => {
  const controlsRef = useRef<CameraControls>(null);
  const { camera } = useThree();
  
  // Subscribe to keyboard controls
  const [, getKeys] = useKeyboardControls<ControlKeys>();
  
  // Camera movement speed
  const MOVE_SPEED = 0.5;
  const ZOOM_SPEED = 1;
  
  // Handle keyboard controls in the animation frame
  useFrame((state, delta) => {
    const { 
      forward, backward, leftward, rightward, 
      zoomIn, zoomOut, reset 
    } = getKeys();
    
    if (controlsRef.current) {
      // Forward/backward movement
      if (forward) {
        controlsRef.current.forward(MOVE_SPEED * delta * 25, true);
      }
      if (backward) {
        controlsRef.current.forward(-MOVE_SPEED * delta * 25, true);
      }
      
      // Left/right movement
      if (leftward) {
        controlsRef.current.truck(-MOVE_SPEED * delta * 25, 0, true);
      }
      if (rightward) {
        controlsRef.current.truck(MOVE_SPEED * delta * 25, 0, true);
      }
      
      // Zoom in/out
      if (zoomIn) {
        controlsRef.current.dolly(ZOOM_SPEED * delta * 25, true);
      }
      if (zoomOut) {
        controlsRef.current.dolly(-ZOOM_SPEED * delta * 25, true);
      }
      
      // Reset camera position
      if (reset) {
        controlsRef.current.setLookAt(
          0, 20, 35, // Camera position
          0, 0, 0,    // Target position
          true        // Animate
        );
      }
      
      // Prevent camera from going inside the Earth
      const distance = camera.position.length();
      if (distance < EARTH_RADIUS * 1.5) {
        const direction = camera.position.clone().normalize();
        camera.position.copy(direction.multiplyScalar(EARTH_RADIUS * 1.5));
      }
    }
  });
  
  return (
    <CameraControls 
      ref={controlsRef}
      minDistance={EARTH_RADIUS * 1.1} // Minimum zoom distance
      maxDistance={100} // Maximum zoom distance
      dampingFactor={0.05} // Smoothing factor
      rotateSpeed={0.5} // Rotation speed
    />
  );
};

export default Controls;
