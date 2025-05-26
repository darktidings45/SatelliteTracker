import { useState, useEffect, useMemo } from 'react';
import { useSatelliteStore } from '../../lib/stores/useSatelliteStore';
import { SatelliteData } from '../../hooks/useSatellites';
import { cn } from '../../lib/utils';

const SatelliteSearch = () => {
  const { satellites, selectedSatellite, focusOnSatellite, addSearchFilter } = useSatelliteStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Filter satellites based on search term
  const filteredSatellites = useMemo(() => {
    if (!searchTerm) return satellites.slice(0, 20); // Show first 20 when no search
    
    return satellites
      .filter(satellite => 
        satellite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        satellite.id.includes(searchTerm)
      )
      .slice(0, 50); // Limit to 50 results
  }, [satellites, searchTerm]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isExpanded || filteredSatellites.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSatellites.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSatellites[selectedIndex]) {
          handleSatelliteSelect(filteredSatellites[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsExpanded(false);
        setSearchTerm('');
        break;
    }
  };

  // Handle satellite selection
  const handleSatelliteSelect = (satellite: SatelliteData) => {
    // Add current search term as a filter if there's a search term
    if (searchTerm.trim()) {
      addSearchFilter(searchTerm.trim());
    }
    
    focusOnSatellite(satellite);
    setIsExpanded(false);
    setSearchTerm('');
    setSelectedIndex(-1);
  };

  // Handle search input focus
  const handleFocus = () => {
    setIsExpanded(true);
  };

  // Handle search input blur (with delay to allow clicking on results)
  const handleBlur = () => {
    setTimeout(() => {
      setIsExpanded(false);
    }, 200);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="bg-[#1a2634] border border-[#34495e] rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <svg 
            className="w-4 h-4 text-[#b2bec3]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <input
            type="text"
            placeholder="Search satellites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-[#b2bec3] focus:outline-none text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setIsExpanded(false);
              }}
              className="text-[#b2bec3] hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2634] border border-[#34495e] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {filteredSatellites.length > 0 ? (
            <div className="py-1">
              {filteredSatellites.map((satellite, index) => (
                <div
                  key={satellite.id}
                  onClick={() => handleSatelliteSelect(satellite)}
                  className={cn(
                    "px-3 py-2 cursor-pointer text-sm transition-colors",
                    index === selectedIndex 
                      ? "bg-[#3498db] text-white" 
                      : "text-white hover:bg-[#2c3e50]",
                    selectedSatellite?.id === satellite.id && "bg-[#30718d]"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{satellite.name}</span>
                    <span className="text-xs text-[#b2bec3] ml-2">{satellite.id}</span>
                  </div>
                  {satellite.type && (
                    <div className="text-xs text-[#b2bec3] mt-1">
                      {satellite.type}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="px-3 py-4 text-center text-[#b2bec3] text-sm">
              No satellites found matching "{searchTerm}"
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-[#b2bec3] text-sm">
              Start typing to search satellites...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SatelliteSearch;