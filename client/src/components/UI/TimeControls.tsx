import { useState, useEffect } from 'react';
import { useSatelliteStore } from '../../lib/stores/useSatelliteStore';
import { cn } from '../../lib/utils';

const TimeControls = () => {
  const { 
    currentTime, 
    setCurrentTime, 
    timeMultiplier, 
    setTimeMultiplier,
    isPaused,
    togglePaused,
    resetTime
  } = useSatelliteStore();
  
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Format the current time as a string
  const formattedTime = currentTime.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  // Speed options for time simulation
  const speedOptions = [
    { label: '1x', value: 1 },
    { label: '10x', value: 10 },
    { label: '60x', value: 60 },
    { label: '300x', value: 300 },
    { label: '3600x', value: 3600 },
  ];
  
  // Toggle panel expansion
  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Reset to current time
  const handleResetTime = () => {
    resetTime();
  };
  
  return (
    <div className={cn(
      "time-controls",
      "absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0a0f16] text-white p-3 rounded-lg",
      "border border-[#34495e] shadow-lg z-10 transition-all duration-300",
      isExpanded ? "w-96" : "w-48"
    )}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePaused}
            className="w-8 h-8 flex items-center justify-center bg-[#30718d] hover:bg-[#3498db] rounded transition-colors"
          >
            {isPaused ? '▶' : '❚❚'}
          </button>
          
          <button
            onClick={handleResetTime}
            className="w-8 h-8 flex items-center justify-center bg-[#1a2634] hover:bg-[#34495e] rounded transition-colors"
          >
            ↺
          </button>
        </div>
        
        <div className="font-mono text-sm truncate">
          {formattedTime}
        </div>
        
        <button 
          onClick={togglePanel}
          className="text-[#3498db] hover:text-[#f7d794] transition-colors"
        >
          {isExpanded ? '◀' : '▶'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-semibold text-[#3498db]">Simulation Speed</h3>
            <span className="text-xs text-[#b2bec3]">{timeMultiplier}x</span>
          </div>
          
          <div className="flex gap-2">
            {speedOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setTimeMultiplier(option.value)}
                className={cn(
                  "px-2 py-1 text-xs rounded flex-1",
                  "transition-colors duration-200",
                  timeMultiplier === option.value 
                    ? "bg-[#30718d] text-white" 
                    : "bg-[#1a2634] text-[#b2bec3] hover:bg-[#233246]"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <div className="mt-3">
            <input
              type="range"
              min="0"
              max="86400" // 24 hours in seconds
              step="3600" // 1 hour steps
              value={
                (currentTime.getTime() - new Date().setHours(0, 0, 0, 0)) / 1000
              }
              onChange={(e) => {
                const newTime = new Date();
                newTime.setHours(0, 0, 0, 0);
                newTime.setSeconds(parseInt(e.target.value));
                setCurrentTime(newTime);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#b2bec3] mt-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeControls;
