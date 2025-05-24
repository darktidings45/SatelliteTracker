import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SAMPLE_TLE_DATA } from "../client/src/lib/consts";
// @ts-ignore
import fetch from 'node-fetch';

// CelesTrak API endpoints
const CELESTRAK_API_BASE = 'https://celestrak.org/NORAD/elements/gp.php';

// Satellite categories to fetch
const SATELLITE_CATEGORIES = {
  'ISS': 'stations',
  'WEATHER': 'weather',
  'COMMUNICATION': 'active',
  'NAVIGATION': 'gps-ops',
  'SCIENCE': 'science'
};

// Fetch TLE data from CelesTrak
async function fetchTLEData(category: string) {
  try {
    const response = await fetch(`${CELESTRAK_API_BASE}?GROUP=${category}&FORMAT=tle`);
    
    if (!response.ok) {
      throw new Error(`CelesTrak API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.text();
    
    // Parse the TLE data (3 lines per satellite)
    const lines = data.trim().split('\n');
    const satellites = [];
    
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        const name = lines[i].trim();
        const line1 = lines[i + 1].trim();
        const line2 = lines[i + 2].trim();
        
        // Extract satellite type based on the category
        const type = Object.keys(SATELLITE_CATEGORIES).find(
          key => SATELLITE_CATEGORIES[key as keyof typeof SATELLITE_CATEGORIES] === category
        ) || 'UNKNOWN';
        
        // Extract NORAD ID from line 1 (positions 3-7)
        const noradId = line1.substring(2, 7).trim();
        
        // Extract launch date (approximate from international designator)
        // Format is YYNNNX where YY is the last two digits of the launch year
        const launchYearStr = line1.substring(9, 11).trim();
        const launchYear = parseInt(launchYearStr, 10);
        // Convert to four-digit year (assuming 20xx for years < 57, 19xx otherwise)
        const fullLaunchYear = launchYear < 57 ? 2000 + launchYear : 1900 + launchYear;
        const launchDate = `${fullLaunchYear}-01-01`; // Approximate with Jan 1
        
        // Extract inclination from line 2 (positions 9-16)
        const inclination = parseFloat(line2.substring(8, 16).trim());
        
        satellites.push({
          id: noradId,
          name: name,
          type: type,
          launchDate: launchDate,
          inclination: inclination,
          tle: [name, line1, line2]
        });
      }
    }
    
    return satellites;
  } catch (error) {
    console.error(`Error fetching ${category} satellites:`, error);
    return [];
  }
}

// Cache for satellite data to reduce API calls
let satelliteCache: any[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to get satellite data
  app.get('/api/satellites', async (req, res) => {
    try {
      const currentTime = Date.now();
      const typeFilter = req.query.type as string;
      
      // Check if we need to refresh the cache
      if (satelliteCache.length === 0 || currentTime - lastFetchTime > CACHE_DURATION) {
        console.log('Fetching fresh satellite data from CelesTrak API...');
        
        const promises = Object.values(SATELLITE_CATEGORIES).map(category => 
          fetchTLEData(category)
        );
        
        const results = await Promise.all(promises);
        satelliteCache = results.flat();
        lastFetchTime = currentTime;
        
        console.log(`Cached ${satelliteCache.length} satellites from CelesTrak API`);
      }
      
      // Filter satellites by type if requested
      let satellites = satelliteCache;
      
      if (typeFilter && typeFilter !== 'ALL') {
        satellites = satellites.filter(sat => sat.type === typeFilter);
      }
      
      // Limit to 50 satellites per request for performance
      satellites = satellites.slice(0, 50);
      
      // Return the satellite data
      res.json(satellites);
    } catch (error) {
      console.error('Error serving satellite data:', error);
      
      // Fall back to sample data if API fails
      console.log('Falling back to sample satellite data');
      let satellites = SAMPLE_TLE_DATA;
      
      // Filter by type if requested
      const typeFilter = req.query.type as string;
      if (typeFilter && typeFilter !== 'ALL') {
        satellites = satellites.filter(sat => sat.type === typeFilter);
      }
      
      res.json(satellites);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
