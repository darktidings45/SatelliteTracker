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
  
  // Bandwidth settings
  bandwidthMode: 'low' | 'high' | null;
  maxSatellites: number;
  loadAllOnFilter: boolean;
  bandwidthSelected: boolean;
  
  // Filtering
  selectedSatelliteTypes: Set<string>;
  searchFilters: Set<string>;
  userLocation: GeoLocation | null;
  apertureAngle: number;
  
  // Time control
  currentTime: Date;
  timeMultiplier: number;
  isPaused: boolean;
  
  // Visualization options
  autoRotateEarth: boolean;
  showApertureCone: boolean;
  
  // Status
  loading: boolean;
  error: string | null;
  
  // Actions
  loadSatellites: () => Promise<void>;
  toggleSatelliteType: (type: string) => void;
  addSearchFilter: (searchTerm: string) => void;
  removeSearchFilter: (searchTerm: string) => void;
  clearSearchFilters: () => void;
  setUserLocation: (location: GeoLocation | null) => void;
  setApertureAngle: (angle: number) => void;
  setSelectedSatellite: (satellite: SatelliteData | null) => void;
  setCurrentTime: (time: Date) => void;
  setTimeMultiplier: (multiplier: number) => void;
  togglePaused: () => void;
  resetTime: () => void;
  toggleEarthRotation: () => void;
  toggleApertureCone: () => void;
  focusOnSatellite: (satellite: SatelliteData) => void;
  setBandwidthSettings: (mode: 'low' | 'high', maxSatellites: number, loadAllOnFilter: boolean) => void;
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
      selectedSatelliteTypes: new Set(['ALL']),
      searchFilters: new Set(),
      userLocation: null,
      apertureAngle: DEFAULT_APERTURE_ANGLE,
      currentTime: new Date(),
      timeMultiplier: 1,
      isPaused: false,
      autoRotateEarth: false,
      showApertureCone: true,
      loading: false,
      error: null,
      
      // Bandwidth settings
      bandwidthMode: null,
      maxSatellites: 5000,
      loadAllOnFilter: false,
      bandwidthSelected: false,
      
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
          
          // Apply bandwidth limits
          const { maxSatellites } = get();
          const limitedData = maxSatellites > 0 ? data.slice(0, maxSatellites) : data;
          
          // Process the satellite data
          const satellites = limitedData.map((sat: any) => {
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
      
      // Toggle satellite type selection (multi-select)
      toggleSatelliteType: (type: string) => {
        const { selectedSatelliteTypes, satellites } = get();
        const newSelectedTypes = new Set(selectedSatelliteTypes);
        
        if (type === 'ALL') {
          // If "All Satellites" is selected, clear all other selections
          newSelectedTypes.clear();
          newSelectedTypes.add('ALL');
        } else {
          // Remove "ALL" if it's selected and we're selecting a specific type
          if (newSelectedTypes.has('ALL')) {
            newSelectedTypes.delete('ALL');
          }
          
          // Toggle the selected type
          if (newSelectedTypes.has(type)) {
            newSelectedTypes.delete(type);
          } else {
            newSelectedTypes.add(type);
          }
          
          // If no types are selected, default to "ALL"
          if (newSelectedTypes.size === 0) {
            newSelectedTypes.add('ALL');
          }
        }
        
        // Apply the filter
        let filtered: SatelliteData[];
        if (newSelectedTypes.has('ALL')) {
          filtered = satellites;
        } else {
          filtered = satellites.filter(sat => 
            newSelectedTypes.has(sat.type || 'UNKNOWN')
          );
        }
        
        set({ 
          selectedSatelliteTypes: newSelectedTypes,
          filteredSatellites: filtered 
        });
        
        console.log(`Satellite types selected: ${Array.from(newSelectedTypes).join(', ')}, showing ${filtered.length} satellites`);
      },
      
      // Add search filter
      addSearchFilter: (searchTerm: string) => {
        const { searchFilters, satellites, selectedSatelliteTypes } = get();
        const newSearchFilters = new Set(searchFilters);
        newSearchFilters.add(searchTerm.toLowerCase());
        
        // Apply both type and search filters
        let filtered = satellites;
        
        // Apply type filter
        if (!selectedSatelliteTypes.has('ALL')) {
          filtered = filtered.filter(sat => 
            selectedSatelliteTypes.has(sat.type || 'UNKNOWN')
          );
        }
        
        // Apply search filters
        if (newSearchFilters.size > 0) {
          filtered = filtered.filter(sat => {
            const name = sat.name.toLowerCase();
            return Array.from(newSearchFilters).some(term => 
              name.includes(term)
            );
          });
        }
        
        set({ searchFilters: newSearchFilters, filteredSatellites: filtered });
      },
      
      // Remove search filter
      removeSearchFilter: (searchTerm: string) => {
        const { searchFilters, satellites, selectedSatelliteTypes } = get();
        const newSearchFilters = new Set(searchFilters);
        newSearchFilters.delete(searchTerm.toLowerCase());
        
        // Apply both type and search filters
        let filtered = satellites;
        
        // Apply type filter
        if (!selectedSatelliteTypes.has('ALL')) {
          filtered = filtered.filter(sat => 
            selectedSatelliteTypes.has(sat.type || 'UNKNOWN')
          );
        }
        
        // Apply search filters
        if (newSearchFilters.size > 0) {
          filtered = filtered.filter(sat => {
            const name = sat.name.toLowerCase();
            return Array.from(newSearchFilters).some(term => 
              name.includes(term)
            );
          });
        }
        
        set({ searchFilters: newSearchFilters, filteredSatellites: filtered });
      },
      
      // Clear all search filters
      clearSearchFilters: () => {
        const { satellites, selectedSatelliteTypes } = get();
        
        // Apply only type filter
        let filtered = satellites;
        if (!selectedSatelliteTypes.has('ALL')) {
          filtered = filtered.filter(sat => 
            selectedSatelliteTypes.has(sat.type || 'UNKNOWN')
          );
        }
        
        set({ searchFilters: new Set(), filteredSatellites: filtered });
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
      
      // Focus camera on satellite (placeholder for now)
      focusOnSatellite: (satellite: SatelliteData) => {
        set({ selectedSatellite: satellite });
      },
      
      // Set bandwidth settings
      setBandwidthSettings: (mode: 'low' | 'high', maxSatellites: number, loadAllOnFilter: boolean) => {
        set({ 
          bandwidthMode: mode,
          maxSatellites,
          loadAllOnFilter,
          bandwidthSelected: true
        });
      }
    };
  })
);
