import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SatelliteData, calculateSatelliteInfo } from '../../hooks/useSatellites';
import { SAMPLE_TLE_DATA, DEFAULT_APERTURE_ANGLE } from '../consts';
import { calculateSatellitePosition } from '../satellite-utils';
import * as satelliteJs from 'satellite.js';
import * as THREE from 'three';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface SatelliteState {
  // Data
  satellites: SatelliteData[];
  filteredSatellites: SatelliteData[];
  selectedSatellite: SatelliteData | null;
  
  // Filtering
  satelliteTypeFilter: string;
  userLocation: GeoLocation | null;
  apertureAngle: number;
  
  // Time control
  currentTime: Date;
  timeMultiplier: number;
  isPaused: boolean;
  
  // Visualization options
  autoRotateEarth: boolean;
  showApertureCone: boolean;
  mapDetail: number; // Map detail level from 0.5 (low) to 1.5 (high)
  
  // Status
  loading: boolean;
  error: string | null;
  
  // Actions
  loadSatellites: () => Promise<void>;
  setSatelliteTypeFilter: (type: string) => void;
  setUserLocation: (location: GeoLocation | null) => void;
  setApertureAngle: (angle: number) => void;
  setSelectedSatellite: (satellite: SatelliteData | null) => void;
  setCurrentTime: (time: Date) => void;
  setTimeMultiplier: (multiplier: number) => void;
  togglePaused: () => void;
  resetTime: () => void;
  toggleEarthRotation: () => void;
  toggleApertureCone: () => void;
  setMapDetail: (detail: number) => void;
}

// Utility functions moved from useSatellites hook
// Calculate orbit path for visualization
const calculateOrbitPath = (tle: string[]): { position: THREE.BufferAttribute } => {
  try {
    // Initialize satellite record
    const satRec = satelliteJs.twoline2satrec(
      tle[1] || tle[0], 
      tle[2] || tle[1]
    );
    
    // Calculate positions for one full orbit
    const points = [];
    const now = new Date();
    
    // Calculate orbital period (in minutes)
    const meanMotion = parseFloat(tle[2]?.substring(52, 63) || '0');
    const orbitalPeriod = meanMotion ? 1440 / meanMotion : 90; // minutes
    
    // Sample the orbit at regular intervals
    const numSamples = 90;
    const timeStep = orbitalPeriod * 60 / numSamples; // in seconds
    
    for (let i = 0; i < numSamples; i++) {
      const time = new Date(now.getTime() + i * timeStep * 1000);
      
      // Get position at specific time
      const positionAndVelocity = satelliteJs.propagate(satRec, time);
      
      if (positionAndVelocity && positionAndVelocity.position) {
        const { position } = positionAndVelocity;
        
        // Convert from km to Three.js units
        const x = position.x;
        const y = position.z; // Satellite.js uses z-up, we use y-up
        const z = position.y;
        
        points.push(x, y, z);
      }
    }
    
    // Create buffer attributes for the geometry
    const positions = new Float32Array(points);
    
    return {
      position: new THREE.BufferAttribute(positions, 3)
    };
    
  } catch (err) {
    console.error('Error calculating orbit path:', err);
    
    // Return empty geometry on error
    return {
      position: new THREE.BufferAttribute(new Float32Array([]), 3)
    };
  }
};

// Create a Zustand store for satellite state
export const useSatelliteStore = create<SatelliteState>()(
  subscribeWithSelector((set, get) => {
    // Start a time update interval
    let timeUpdateInterval: NodeJS.Timeout | null = null;
    
    const startTimeUpdate = () => {
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
      
      timeUpdateInterval = setInterval(() => {
        const { currentTime, timeMultiplier, isPaused } = get();
        
        if (!isPaused) {
          const newTime = new Date(currentTime.getTime() + 1000 * timeMultiplier);
          set({ currentTime: newTime });
        }
      }, 1000);
    };
    
    // Start the time update interval
    startTimeUpdate();
    
    return {
      // Initial state
      satellites: [],
      filteredSatellites: [],
      selectedSatellite: null,
      satelliteTypeFilter: 'ALL',
      userLocation: null,
      apertureAngle: DEFAULT_APERTURE_ANGLE,
      currentTime: new Date(),
      timeMultiplier: 1,
      isPaused: false,
      autoRotateEarth: false,
      showApertureCone: true,
      mapDetail: 1.0, // Default map detail level (medium)
      loading: false,
      error: null,
      
      // Load satellite data
      loadSatellites: async () => {
        set({ loading: true, error: null });
        
        try {
          // Fetch satellite data from API
          const response = await fetch('/api/satellites');
          
          if (!response.ok) {
            throw new Error(`Failed to fetch satellite data: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Process the satellite data
          const satellites = data.map((sat: any) => {
            // Create orbital path geometry
            const orbitGeometry = calculateOrbitPath(sat.tle);
            
            return {
              id: sat.id || sat.noradId || Math.random().toString(36).substring(2, 9),
              name: sat.name || 'Unknown Satellite',
              tle: Array.isArray(sat.tle) ? sat.tle : [sat.name, sat.line1, sat.line2],
              type: sat.type,
              launchDate: sat.launchDate,
              inclination: sat.inclination,
              orbitGeometry
            };
          });
          
          set({ 
            satellites, 
            filteredSatellites: satellites,
            loading: false 
          });
          
        } catch (error) {
          console.error('Failed to load satellites:', error);
          
          // If API call fails, use sample data as fallback
          const satellites = SAMPLE_TLE_DATA.map(sat => {
            // Get orbit geometry from dedicated function
            const orbitGeometry = calculateOrbitPath(sat.tle);
            
            // Return satellite with orbit data
            return {
              ...sat,
              orbitGeometry
            };
          });
          
          set({ 
            satellites, 
            filteredSatellites: satellites,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load satellite data'
          });
        }
      },
      
      // Filter satellites by type
      setSatelliteTypeFilter: (type) => {
        set({ satelliteTypeFilter: type });
        
        // Apply the filter
        const { satellites } = get();
        const filtered = type === 'ALL' 
          ? satellites 
          : satellites.filter(sat => sat.type === type);
        
        // Force update filtered satellites
        set({ filteredSatellites: filtered });
        
        console.log(`Satellite type filter applied: ${type}, found ${filtered.length} satellites`);
      },
      
      // Set user location for visibility filtering
      setUserLocation: (location) => {
        set({ userLocation: location });
      },
      
      // Set aperture angle for visibility cone
      setApertureAngle: (angle) => {
        set({ apertureAngle: angle });
      },
      
      // Select a satellite to display details
      setSelectedSatellite: (satellite) => {
        set({ selectedSatellite: satellite });
      },
      
      // Set simulation time
      setCurrentTime: (time) => {
        set({ currentTime: time });
      },
      
      // Set time simulation speed
      setTimeMultiplier: (multiplier) => {
        set({ timeMultiplier: multiplier });
      },
      
      // Toggle paused state
      togglePaused: () => {
        set(state => ({ isPaused: !state.isPaused }));
      },
      
      // Reset to current time
      resetTime: () => {
        set({ currentTime: new Date() });
      },
      
      // Toggle Earth auto-rotation
      toggleEarthRotation: () => {
        set(state => ({ autoRotateEarth: !state.autoRotateEarth }));
      },
      
      // Toggle aperture cone visibility
      toggleApertureCone: () => {
        set(state => ({ showApertureCone: !state.showApertureCone }));
      },
      
      // Set map detail level
      setMapDetail: (detail) => {
        set({ mapDetail: Math.max(0.5, Math.min(1.5, detail)) }); // Clamp between 0.5 and 1.5
      }
    };
  })
);
