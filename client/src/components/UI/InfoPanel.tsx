import { useState } from 'react';
import { useSatelliteStore } from '../../lib/stores/useSatelliteStore';
import { cn } from '../../lib/utils';

const InfoPanel = () => {
  const { selectedSatellite, setSelectedSatellite } = useSatelliteStore();
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Toggle panel expansion
  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Close the panel (deselect satellite)
  const closePanel = () => {
    setSelectedSatellite(null);
  };
  
  // If no satellite is selected, don't render the panel
  if (!selectedSatellite) {
    return null;
  }
  
  return (
    <div className={cn(
      "info-panel",
      "absolute top-4 right-4 bg-[#0a0f16] text-white p-4 rounded-lg",
      "border border-[#34495e] shadow-lg z-10 w-80 transition-all duration-300",
      isExpanded ? "max-h-[80vh] overflow-y-auto" : "h-14 overflow-hidden"
    )}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold font-mono truncate">{selectedSatellite.name}</h2>
        <div className="flex gap-2">
          <button 
            onClick={togglePanel}
            className="text-[#3498db] hover:text-[#f7d794] transition-colors"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button 
            onClick={closePanel}
            className="text-[#e74c3c] hover:text-[#f7d794] transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="satellite-details space-y-4">
          <div className="bg-[#1a2634] p-3 rounded">
            <h3 className="text-sm font-semibold mb-2 text-[#3498db]">Basic Information</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <span className="text-[#b2bec3]">NORAD ID:</span>
              <span>{selectedSatellite.id}</span>
              
              <span className="text-[#b2bec3]">Type:</span>
              <span>{selectedSatellite.type || 'Unknown'}</span>
              
              <span className="text-[#b2bec3]">Launch Date:</span>
              <span>{selectedSatellite.launchDate || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="bg-[#1a2634] p-3 rounded">
            <h3 className="text-sm font-semibold mb-2 text-[#3498db]">Orbital Parameters</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <span className="text-[#b2bec3]">Altitude:</span>
              <span>{selectedSatellite.altitude ? `${selectedSatellite.altitude.toFixed(2)} km` : 'Calculating...'}</span>
              
              <span className="text-[#b2bec3]">Velocity:</span>
              <span>{selectedSatellite.velocity ? `${selectedSatellite.velocity.toFixed(2)} km/s` : 'Calculating...'}</span>
              
              <span className="text-[#b2bec3]">Period:</span>
              <span>{selectedSatellite.period ? `${selectedSatellite.period.toFixed(2)} min` : 'Calculating...'}</span>
              
              <span className="text-[#b2bec3]">Inclination:</span>
              <span>{selectedSatellite.inclination ? `${selectedSatellite.inclination.toFixed(2)}°` : 'Unknown'}</span>
            </div>
          </div>
          
          <div className="bg-[#1a2634] p-3 rounded">
            <h3 className="text-sm font-semibold mb-2 text-[#3498db]">Two-Line Element</h3>
            <div className="font-mono text-xs overflow-x-auto whitespace-pre">
              {selectedSatellite.tle[0]}<br/>
              {selectedSatellite.tle[1]}<br/>
              {selectedSatellite.tle[2]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPanel;
