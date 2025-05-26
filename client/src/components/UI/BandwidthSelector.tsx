import { useState } from 'react';
import { cn } from '../../lib/utils';

export interface BandwidthSettings {
  mode: 'low' | 'high';
  maxSatellites: number;
  loadAllOnFilter: boolean;
}

interface BandwidthSelectorProps {
  onSelect: (settings: BandwidthSettings) => void;
}

const BandwidthSelector = ({ onSelect }: BandwidthSelectorProps) => {
  const [selectedMode, setSelectedMode] = useState<'low' | 'high' | null>(null);
  const [loadAllOnFilter, setLoadAllOnFilter] = useState(false);

  const handleLowBandwidth = () => {
    onSelect({
      mode: 'low',
      maxSatellites: 5000,
      loadAllOnFilter: false
    });
  };

  const handleHighBandwidth = () => {
    onSelect({
      mode: 'high',
      maxSatellites: loadAllOnFilter ? Infinity : 20000,
      loadAllOnFilter
    });
  };

  return (
    <div className="fixed inset-0 bg-[#0a0f16] flex items-center justify-center z-50">
      <div className="bg-[#1a2634] border border-[#34495e] rounded-lg p-8 max-w-2xl mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Satellite Tracker</h1>
          <p className="text-[#b2bec3] text-lg">Choose your bandwidth preference</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Low Bandwidth Option */}
          <div 
            className={cn(
              "border-2 rounded-lg p-6 cursor-pointer transition-all duration-200",
              selectedMode === 'low' 
                ? "border-[#3498db] bg-[#2c3e50]" 
                : "border-[#34495e] hover:border-[#3498db] hover:bg-[#233246]"
            )}
            onClick={() => setSelectedMode('low')}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#27ae60] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Low Bandwidth</h3>
              <p className="text-[#b2bec3] text-sm mb-4">
                Loads up to 5,000 satellites for faster performance on slower connections
              </p>
              <ul className="text-left text-sm text-[#b2bec3] space-y-1">
                <li>• Faster loading times</li>
                <li>• Reduced data usage</li>
                <li>• Better for mobile devices</li>
                <li>• Smooth 3D performance</li>
              </ul>
            </div>
          </div>

          {/* High Bandwidth Option */}
          <div 
            className={cn(
              "border-2 rounded-lg p-6 cursor-pointer transition-all duration-200",
              selectedMode === 'high' 
                ? "border-[#3498db] bg-[#2c3e50]" 
                : "border-[#34495e] hover:border-[#3498db] hover:bg-[#233246]"
            )}
            onClick={() => setSelectedMode('high')}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#e74c3c] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">High Bandwidth</h3>
              <p className="text-[#b2bec3] text-sm mb-4">
                Access to the complete satellite catalog (20,000+ satellites)
              </p>
              <ul className="text-left text-sm text-[#b2bec3] space-y-1">
                <li>• Complete satellite catalog</li>
                <li>• All Starlink constellation</li>
                <li>• All satellite categories</li>
                <li>• Advanced filtering options</li>
              </ul>
            </div>
          </div>
        </div>

        {/* High Bandwidth Additional Options */}
        {selectedMode === 'high' && (
          <div className="mb-6 p-4 bg-[#233246] rounded-lg border border-[#34495e]">
            <h4 className="text-white font-semibold mb-3">High Bandwidth Options</h4>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={loadAllOnFilter}
                onChange={(e) => setLoadAllOnFilter(e.target.checked)}
                className="w-4 h-4 text-[#3498db] bg-[#1a2634] border-[#34495e] rounded focus:ring-[#3498db] focus:ring-2"
              />
              <span className="text-[#b2bec3] text-sm">
                Load all satellites immediately (may cause performance issues on slower devices)
              </span>
            </label>
            {!loadAllOnFilter && (
              <p className="text-xs text-[#b2bec3] mt-2 ml-7">
                Satellites will load on-demand when you use filters or search
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {selectedMode === 'low' && (
            <button
              onClick={handleLowBandwidth}
              className="flex-1 bg-[#27ae60] hover:bg-[#2ecc71] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start with Low Bandwidth
            </button>
          )}
          {selectedMode === 'high' && (
            <button
              onClick={handleHighBandwidth}
              className="flex-1 bg-[#e74c3c] hover:bg-[#c0392b] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start with High Bandwidth
            </button>
          )}
          {!selectedMode && (
            <div className="text-center text-[#b2bec3] py-3">
              Please select a bandwidth option to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BandwidthSelector;