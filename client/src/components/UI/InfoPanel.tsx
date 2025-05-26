import { useState, useEffect } from 'react';
import { useSatelliteStore } from '../../lib/stores/useSatelliteStore';
import { cn } from '../../lib/utils';
import { getSatelliteImage, getSatelliteInfo, SatelliteImageSource, SatelliteInfo } from '../../lib/satellite-images';

const InfoPanel = () => {
  const { selectedSatellite, setSelectedSatellite } = useSatelliteStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [satelliteImage, setSatelliteImage] = useState<SatelliteImageSource | null>(null);
  const [satelliteInfo, setSatelliteInfo] = useState<SatelliteInfo | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Toggle panel expansion
  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Close the panel (deselect satellite)
  const closePanel = () => {
    setSelectedSatellite(null);
  };

  // Load satellite image and information when satellite is selected
  useEffect(() => {
    if (selectedSatellite && isExpanded) {
      setImageLoading(true);
      setImageError(false);
      setSatelliteImage(null);
      setSatelliteInfo(null);

      // Load satellite information
      const info = getSatelliteInfo(selectedSatellite.name);
      setSatelliteInfo(info);

      // Load satellite image
      const imageSource = getSatelliteImage(selectedSatellite.name);
      if (imageSource) {
        // Test if image loads successfully
        const img = new Image();
        img.onload = () => {
          setSatelliteImage(imageSource);
          setImageLoading(false);
        };
        img.onerror = () => {
          setImageError(true);
          setImageLoading(false);
        };
        img.src = imageSource.url;
      } else {
        setImageLoading(false);
      }
    }
  }, [selectedSatellite, isExpanded]);

  // Copy TLE data to clipboard
  const copyTLEData = async () => {
    if (selectedSatellite && selectedSatellite.tle) {
      try {
        const tleText = selectedSatellite.tle.join('\n');
        await navigator.clipboard.writeText(tleText);
        console.log('TLE data copied to clipboard');
      } catch (err) {
        console.error('Failed to copy TLE data:', err);
        // Fallback: create a text area and select it
        const textArea = document.createElement('textarea');
        textArea.value = selectedSatellite.tle.join('\n');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  // Copy complete satellite card information to clipboard
  const copyCard = async () => {
    if (selectedSatellite) {
      const cardText = `${selectedSatellite.name}
${'-'.repeat(selectedSatellite.name.length)}

Basic Information:
• NORAD ID: ${selectedSatellite.id}
• Type: ${selectedSatellite.type || 'Unknown'}
• Launch Date: ${selectedSatellite.launchDate || 'Unknown'}

Orbital Parameters:
• Altitude: ${selectedSatellite.altitude ? `${selectedSatellite.altitude.toFixed(2)} km` : 'Calculating...'}
• Velocity: ${selectedSatellite.velocity ? `${selectedSatellite.velocity.toFixed(2)} km/s` : 'Calculating...'}
• Period: ${selectedSatellite.period ? `${selectedSatellite.period.toFixed(2)} min` : 'Calculating...'}
• Inclination: ${selectedSatellite.inclination ? `${selectedSatellite.inclination.toFixed(2)}°` : 'Unknown'}

Two-Line Element (TLE):
${selectedSatellite.tle.join('\n')}`;

      try {
        await navigator.clipboard.writeText(cardText);
        console.log('Satellite card copied to clipboard');
      } catch (err) {
        console.error('Failed to copy satellite card:', err);
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = cardText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
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
        <div className="flex gap-2 items-center">
          {isExpanded && (
            <button
              onClick={copyCard}
              className="bg-[#30718d] hover:bg-[#3498db] text-white px-3 py-1 rounded text-xs transition-colors"
              title="Copy all satellite details to clipboard"
            >
              Copy Card
            </button>
          )}
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
          {/* Satellite Image */}
          {(satelliteImage || imageLoading) && (
            <div className="bg-[#1a2634] p-3 rounded">
              <h3 className="text-sm font-semibold mb-2 text-[#3498db]">Satellite Image</h3>
              {imageLoading ? (
                <div className="flex items-center justify-center h-32 bg-[#0a0f16] rounded">
                  <div className="text-[#b2bec3] text-sm">Loading image...</div>
                </div>
              ) : satelliteImage && !imageError ? (
                <div className="space-y-2">
                  <img
                    src={satelliteImage.url}
                    alt={satelliteImage.name}
                    className="w-full h-32 object-cover rounded border border-[#34495e]"
                    onError={() => setImageError(true)}
                  />
                  <div className="text-xs text-[#b2bec3]">
                    Credit: {satelliteImage.credit}
                  </div>
                </div>
              ) : imageError && (
                <div className="flex items-center justify-center h-32 bg-[#0a0f16] rounded">
                  <div className="text-[#b2bec3] text-sm">Image not available</div>
                </div>
              )}
            </div>
          )}

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
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-[#3498db]">Two-Line Element</h3>
              <button
                onClick={copyTLEData}
                className="bg-[#30718d] hover:bg-[#3498db] text-white px-3 py-1 rounded text-xs transition-colors"
                title="Copy TLE data to clipboard"
              >
                Copy TLE
              </button>
            </div>
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
