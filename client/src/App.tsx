import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { KeyboardControls } from '@react-three/drei';
import { useAudio } from './lib/stores/useAudio';
import Earth from './components/Earth';
import Stars from './components/Stars';
import Controls from './components/Controls';
import FilterPanel from './components/UI/FilterPanel';
import InfoPanel from './components/UI/InfoPanel';
import TimeControls from './components/UI/TimeControls';
import { useSatelliteStore } from './lib/stores/useSatelliteStore';
import "@fontsource/inter";
import { Perf } from 'r3f-perf';

// Define control keys for camera navigation
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "zoomIn", keys: ["KeyQ"] },
  { name: "zoomOut", keys: ["KeyE"] },
  { name: "reset", keys: ["KeyR"] },
];

// Main App component
function App() {
  const [showCanvas, setShowCanvas] = useState(false);
  const { loadSatellites, loading, error } = useSatelliteStore();
  const { setHitSound, setSuccessSound, toggleMute } = useAudio();

  // Initialize sounds
  useEffect(() => {
    const hit = new Audio("/sounds/hit.mp3");
    const success = new Audio("/sounds/success.mp3");
    
    setHitSound(hit);
    setSuccessSound(success);
    
    // Auto-mute on start (user needs to interact to enable sound)
    toggleMute();
    
    // Load satellite data
    loadSatellites();
    
    // Show the canvas once everything is ready
    setShowCanvas(true);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading satellite data...</p>
        </div>
      )}
      
      {error && (
        <div className="error-overlay">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={() => loadSatellites()}>Retry</button>
        </div>
      )}
      
      {showCanvas && (
        <>
          <KeyboardControls map={controls}>
            <Canvas
              shadows
              camera={{
                position: [0, 20, 35],
                fov: 45,
                near: 0.1,
                far: 1000
              }}
              gl={{
                antialias: true,
                powerPreference: "default"
              }}
            >
              {process.env.NODE_ENV === 'development' && <Perf position="top-left" />}
              
              {/* Background stars */}
              <Stars />
              
              {/* Lighting */}
              <ambientLight intensity={0.2} />
              <directionalLight 
                position={[50, 30, 50]} 
                intensity={2} 
                castShadow 
                shadow-mapSize-width={2048} 
                shadow-mapSize-height={2048}
              />
              
              <Suspense fallback={null}>
                {/* Earth and satellites */}
                <Earth />
                
                {/* Camera controls */}
                <Controls />
              </Suspense>
            </Canvas>
          </KeyboardControls>
          
          {/* UI Components */}
          <FilterPanel />
          <InfoPanel />
          <TimeControls />
        </>
      )}
    </div>
  );
}

export default App;
