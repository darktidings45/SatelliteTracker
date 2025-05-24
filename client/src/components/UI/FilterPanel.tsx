import { useState, useEffect } from 'react';
import { useSatelliteStore } from '../../lib/stores/useSatelliteStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAudio } from '../../lib/stores/useAudio';
import { cn } from '../../lib/utils';

// For azimuth and elevation controls
interface DirectionControls {
  azimuth: number;
  elevation: number;
  setAzimuth: (value: number) => void;
  setElevation: (value: number) => void;
}

const FilterPanel = ({ directionControls }: { directionControls?: DirectionControls }) => {
  const { 
    setSatelliteTypeFilter, 
    satelliteTypeFilter,
    setUserLocation,
    userLocation,
    setApertureAngle,
    apertureAngle,
    satellites
  } = useSatelliteStore();
  
  const { getLocation, locationError } = useGeolocation();
  const { playSuccess, isMuted, toggleMute } = useAudio();
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Available satellite types
  const satelliteTypes = [
    { id: 'ALL', label: 'All Satellites' },
    { id: 'ISS', label: 'Space Stations' },
    { id: 'WEATHER', label: 'Weather' },
    { id: 'COMMUNICATION', label: 'Communication' },
    { id: 'NAVIGATION', label: 'Navigation' },
    { id: 'SCIENCE', label: 'Science' }
  ];
  
  // Handle geolocation request
  const handleGetLocation = async () => {
    const location = await getLocation();
    if (location) {
      setUserLocation(location);
      playSuccess();
    }
  };
  
  // Handle aperture angle change
  const handleApertureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApertureAngle(Number(e.target.value));
  };
  
  // Toggle panel expansion
  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={cn(
      "filter-panel",
      "absolute top-4 left-4 bg-[#0a0f16] text-white p-4 rounded-lg",
      "border border-[#34495e] shadow-lg z-10 w-72 transition-all duration-300",
      isExpanded ? "h-auto" : "h-14 overflow-hidden"
    )}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold font-mono">Satellite Filters</h2>
        <button 
          onClick={togglePanel}
          className="text-[#3498db] hover:text-[#f7d794] transition-colors"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-[#3498db]">Satellite Type</h3>
            <div className="flex flex-wrap gap-2">
              {satelliteTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSatelliteTypeFilter(type.id)}
                  className={cn(
                    "px-2 py-1 text-xs rounded",
                    "transition-colors duration-200",
                    satelliteTypeFilter === type.id 
                      ? "bg-[#30718d] text-white" 
                      : "bg-[#1a2634] text-[#b2bec3] hover:bg-[#233246]"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-[#3498db]">Location Filtering</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGetLocation}
                className="bg-[#30718d] hover:bg-[#3498db] text-white py-2 px-4 rounded text-sm transition-colors"
              >
                {userLocation ? 'Update My Location' : 'Use Browser Location'}
              </button>
              
              {locationError && (
                <p className="text-xs text-[#e74c3c]">{locationError}</p>
              )}
              
              <div className="mt-2">
                <h4 className="text-xs font-semibold mb-1 text-[#b2bec3]">Manual Location Entry</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="latitude" className="text-xs text-[#b2bec3]">Latitude</label>
                    <input
                      id="latitude"
                      type="number"
                      min="-90"
                      max="90"
                      step="0.0001"
                      placeholder="e.g. 40.7128"
                      value={userLocation?.latitude || ''}
                      onChange={(e) => {
                        const lat = parseFloat(e.target.value);
                        if (!isNaN(lat) && lat >= -90 && lat <= 90) {
                          setUserLocation({
                            latitude: lat,
                            longitude: userLocation?.longitude || 0
                          });
                        }
                      }}
                      className="w-full px-2 py-1 bg-[#1a2634] text-white rounded text-xs border border-[#34495e]"
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="text-xs text-[#b2bec3]">Longitude</label>
                    <input
                      id="longitude"
                      type="number"
                      min="-180"
                      max="180"
                      step="0.0001"
                      placeholder="e.g. -74.0060"
                      value={userLocation?.longitude || ''}
                      onChange={(e) => {
                        const lon = parseFloat(e.target.value);
                        if (!isNaN(lon) && lon >= -180 && lon <= 180) {
                          setUserLocation({
                            latitude: userLocation?.latitude || 0,
                            longitude: lon
                          });
                        }
                      }}
                      className="w-full px-2 py-1 bg-[#1a2634] text-white rounded text-xs border border-[#34495e]"
                    />
                  </div>
                </div>
              </div>
              
              {userLocation && (
                <div className="text-xs mt-1 bg-[#1a2634] p-2 rounded">
                  <p>Current Location:</p>
                  <p>Lat: {userLocation.latitude.toFixed(4)}</p>
                  <p>Lon: {userLocation.longitude.toFixed(4)}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-[#3498db]">Aperture Cone (°)</h3>
            <input
              type="range"
              min="10"
              max="180"
              step="5"
              value={apertureAngle}
              onChange={handleApertureChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#b2bec3]">
              <span>10°</span>
              <span>{apertureAngle}°</span>
              <span>180°</span>
            </div>
          </div>
          
          {/* Azimuth and Elevation controls */}
          {directionControls && userLocation && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-[#3498db]">Cone Direction</h3>
              
              <div className="mb-2">
                <label htmlFor="azimuth" className="text-xs text-[#b2bec3] block mb-1">
                  Azimuth: {directionControls.azimuth}° (←→)
                </label>
                <input
                  id="azimuth"
                  type="range"
                  min="0"
                  max="360"
                  step="10"
                  value={directionControls.azimuth}
                  onChange={(e) => directionControls.setAzimuth(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#b2bec3]">
                  <span>0°</span>
                  <span>180°</span>
                  <span>360°</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="elevation" className="text-xs text-[#b2bec3] block mb-1">
                  Elevation: {directionControls.elevation}° (↑↓)
                </label>
                <input
                  id="elevation"
                  type="range"
                  min="-90"
                  max="90"
                  step="10"
                  value={directionControls.elevation}
                  onChange={(e) => directionControls.setElevation(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#b2bec3]">
                  <span>-90°</span>
                  <span>0°</span>
                  <span>90°</span>
                </div>
              </div>
              
              <p className="text-xs text-[#b2bec3] mt-2">
                Use arrow keys or sliders to adjust cone direction
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center text-xs">
            <p className="text-[#b2bec3]">
              Showing: <span className="text-white">{satellites.length}</span> satellites
            </p>
            
            <button 
              onClick={toggleMute} 
              className="text-[#b2bec3] hover:text-white"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterPanel;
