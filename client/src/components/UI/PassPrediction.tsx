import { useState, useEffect, useMemo } from 'react';
import { useSatelliteStore } from '../../lib/stores/useSatelliteStore';
import { calculateSatellitePasses, formatPassTime, formatDuration, SatellitePass } from '../../lib/satellite-pass-utils';
import { cn } from '../../lib/utils';

const PassPrediction = () => {
  const { 
    filteredSatellites, 
    userLocation, 
    setSelectedSatellite,
    selectedSatellite 
  } = useSatelliteStore();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [passes, setPasses] = useState<SatellitePass[]>([]);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [minElevation, setMinElevation] = useState(10); // degrees

  // Calculate passes when dependencies change
  const calculatePasses = useMemo(() => {
    return async () => {
      if (!userLocation || filteredSatellites.length === 0) {
        setPasses([]);
        return;
      }

      setIsCalculating(true);
      
      try {
        // Run calculation in a setTimeout to prevent blocking the UI
        setTimeout(() => {
          const calculatedPasses = calculateSatellitePasses(
            filteredSatellites,
            userLocation,
            new Date(),
            timeRange,
            minElevation
          );
          
          setPasses(calculatedPasses.slice(0, 20)); // Limit to first 20 passes
          setIsCalculating(false);
        }, 100);
      } catch (error) {
        console.error('Error calculating satellite passes:', error);
        setIsCalculating(false);
      }
    };
  }, [filteredSatellites, userLocation, timeRange, minElevation]);

  // Recalculate when dependencies change
  useEffect(() => {
    if (isExpanded) {
      calculatePasses();
    }
  }, [calculatePasses, isExpanded]);

  // Toggle panel expansion
  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle satellite selection from pass list
  const handleSatelliteSelect = (pass: SatellitePass) => {
    setSelectedSatellite(pass.satellite);
  };

  // Don't render if no location is set
  if (!userLocation) {
    return null;
  }

  return (
    <div className={cn(
      "pass-prediction-panel",
      "absolute bottom-4 left-4 bg-[#0a0f16] text-white p-4 rounded-lg",
      "border border-[#34495e] shadow-lg z-10 w-96 transition-all duration-300",
      isExpanded ? "max-h-[60vh] overflow-y-auto" : "h-14 overflow-hidden"
    )}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold font-mono">Satellite Passes</h2>
        <button 
          onClick={togglePanel}
          className="text-[#3498db] hover:text-[#f7d794] transition-colors"
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="pass-details space-y-4">
          {/* Controls */}
          <div className="bg-[#1a2634] p-3 rounded">
            <h3 className="text-sm font-semibold mb-2 text-[#3498db]">Prediction Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#b2bec3] block mb-1">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-[#0a0f16] text-white rounded text-xs border border-[#34495e]"
                >
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>3 days</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#b2bec3] block mb-1">Min Elevation</label>
                <select
                  value={minElevation}
                  onChange={(e) => setMinElevation(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-[#0a0f16] text-white rounded text-xs border border-[#34495e]"
                >
                  <option value={0}>0°</option>
                  <option value={10}>10°</option>
                  <option value={20}>20°</option>
                  <option value={30}>30°</option>
                </select>
              </div>
            </div>
            <button
              onClick={calculatePasses}
              disabled={isCalculating}
              className="w-full mt-2 bg-[#30718d] hover:bg-[#3498db] text-white py-2 px-4 rounded text-sm transition-colors disabled:opacity-50"
            >
              {isCalculating ? 'Calculating...' : 'Update Predictions'}
            </button>
          </div>

          {/* Pass List */}
          <div className="bg-[#1a2634] p-3 rounded">
            <h3 className="text-sm font-semibold mb-2 text-[#3498db]">
              Upcoming Passes ({passes.length})
            </h3>
            
            {isCalculating ? (
              <div className="text-center py-4 text-[#b2bec3]">
                <div className="animate-pulse">Calculating satellite passes...</div>
              </div>
            ) : passes.length === 0 ? (
              <div className="text-center py-4 text-[#b2bec3]">
                No visible passes found for the current time range and settings.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {passes.map((pass, index) => (
                  <div
                    key={`${pass.satellite.id}-${pass.startTime.getTime()}`}
                    onClick={() => handleSatelliteSelect(pass)}
                    className={cn(
                      "p-2 rounded cursor-pointer transition-colors",
                      "hover:bg-[#233246] border border-transparent",
                      selectedSatellite?.id === pass.satellite.id 
                        ? "bg-[#30718d] border-[#3498db]" 
                        : "bg-[#0a0f16]"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-mono text-sm font-semibold truncate">
                          {pass.satellite.name}
                        </div>
                        <div className="text-xs text-[#b2bec3] mt-1">
                          <div>Start: {formatPassTime(pass.startTime)}</div>
                          <div>Peak: {formatPassTime(pass.peakTime)} ({pass.peakElevation.toFixed(1)}°)</div>
                          <div>Duration: {formatDuration(pass.duration)}</div>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-xs text-[#f7d794] font-semibold">
                          {pass.direction}
                        </div>
                        <div className="text-xs text-[#b2bec3] mt-1">
                          Max: {pass.maxElevation.toFixed(1)}°
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-[#b2bec3]">
            Location: {userLocation.latitude.toFixed(4)}°, {userLocation.longitude.toFixed(4)}°
          </div>
        </div>
      )}
    </div>
  );
};

export default PassPrediction;