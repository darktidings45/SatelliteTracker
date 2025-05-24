import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { OrbitControls, Stats } from '@react-three/drei';
import { useAudio } from './lib/stores/useAudio';
import Earth from './components/Earth';
import Stars from './components/Stars';
import FilterPanel from './components/UI/FilterPanel';
import InfoPanel from './components/UI/InfoPanel';
import TimeControls from './components/UI/TimeControls';
import { useSatelliteStore } from './lib/stores/useSatelliteStore';
import "@fontsource/inter";

// Main App component
function App() {
  const [showCanvas, setShowCanvas] = useState(false);
  const { loadSatellites, loading, error } = useSatelliteStore();
  const { setHitSound, setSuccessSound, toggleMute } = useAudio();

  // Initialize sounds and load data
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
    
    // Cleanup function
    return () => {
      // Clean up any resources if needed
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#0a0f16' }}>
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
            style={{ background: '#0a0f16' }}
          >
            {/* Background stars */}
            <Stars />
            
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[50, 30, 50]} 
              intensity={2} 
              castShadow 
            />
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            
            {/* Earth and satellites */}
            <Suspense fallback={null}>
              <Earth />
            </Suspense>
            
            {/* Camera controls */}
            <OrbitControls 
              enableDamping={true}
              dampingFactor={0.1}
              minDistance={10}
              maxDistance={100}
              enablePan={true}
              enableRotate={true}
              enableZoom={true}
              makeDefault
            />
          </Canvas>
          
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
