// Satellite image sources from reliable providers
export interface SatelliteImageSource {
  name: string;
  url: string;
  credit: string;
}

// Known satellite images from reliable sources
const SATELLITE_IMAGE_DATABASE: Record<string, SatelliteImageSource> = {
  // International Space Station
  'ISS (ZARYA)': {
    name: 'International Space Station',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/International_Space_Station_after_undocking_of_STS-132.jpg/512px-International_Space_Station_after_undocking_of_STS-132.jpg',
    credit: 'NASA/Wikimedia Commons'
  },
  'ISS': {
    name: 'International Space Station',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/International_Space_Station_after_undocking_of_STS-132.jpg/512px-International_Space_Station_after_undocking_of_STS-132.jpg',
    credit: 'NASA/Wikimedia Commons'
  },
  
  // Hubble Space Telescope
  'HST': {
    name: 'Hubble Space Telescope',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/512px-HST-SM4.jpeg',
    credit: 'NASA/Wikimedia Commons'
  },
  'HUBBLE SPACE TELESCOPE': {
    name: 'Hubble Space Telescope',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/512px-HST-SM4.jpeg',
    credit: 'NASA/Wikimedia Commons'
  },
  
  // GPS satellites (generic GPS satellite image)
  'NAVSTAR': {
    name: 'GPS Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/GPS_Satellite_NASA_art-iif.jpg/512px-GPS_Satellite_NASA_art-iif.jpg',
    credit: 'NASA/Wikimedia Commons'
  },
  
  // Landsat satellites
  'LANDSAT': {
    name: 'Landsat Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Landsat_8_spacecraft_model.png/512px-Landsat_8_spacecraft_model.png',
    credit: 'NASA/Wikimedia Commons'
  },
  
  // NOAA weather satellites
  'NOAA': {
    name: 'NOAA Weather Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/NOAA-19_spacecraft_model.jpg/512px-NOAA-19_spacecraft_model.jpg',
    credit: 'NOAA/Wikimedia Commons'
  },
  
  // Terra satellite
  'TERRA': {
    name: 'Terra Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Terra_satellite.jpg/512px-Terra_satellite.jpg',
    credit: 'NASA/Wikimedia Commons'
  },
  
  // Aqua satellite
  'AQUA': {
    name: 'Aqua Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Aqua_satellite.jpg/512px-Aqua_satellite.jpg',
    credit: 'NASA/Wikimedia Commons'
  },
  
  // Generic communication satellite
  'INTELSAT': {
    name: 'Communication Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Intelsat_VI_deployment_%28STS-49%29.jpg/512px-Intelsat_VI_deployment_%28STS-49%29.jpg',
    credit: 'NASA/Wikimedia Commons'
  }
};

// Get satellite image URL based on satellite name
export function getSatelliteImage(satelliteName: string): SatelliteImageSource | null {
  // Direct match first
  if (SATELLITE_IMAGE_DATABASE[satelliteName]) {
    return SATELLITE_IMAGE_DATABASE[satelliteName];
  }
  
  // Partial matches for common satellite types
  const upperName = satelliteName.toUpperCase();
  
  if (upperName.includes('ISS')) {
    return SATELLITE_IMAGE_DATABASE['ISS'];
  }
  
  if (upperName.includes('HUBBLE') || upperName.includes('HST')) {
    return SATELLITE_IMAGE_DATABASE['HST'];
  }
  
  if (upperName.includes('GPS') || upperName.includes('NAVSTAR')) {
    return SATELLITE_IMAGE_DATABASE['NAVSTAR'];
  }
  
  if (upperName.includes('LANDSAT')) {
    return SATELLITE_IMAGE_DATABASE['LANDSAT'];
  }
  
  if (upperName.includes('NOAA')) {
    return SATELLITE_IMAGE_DATABASE['NOAA'];
  }
  
  if (upperName.includes('TERRA')) {
    return SATELLITE_IMAGE_DATABASE['TERRA'];
  }
  
  if (upperName.includes('AQUA')) {
    return SATELLITE_IMAGE_DATABASE['AQUA'];
  }
  
  if (upperName.includes('INTELSAT') || upperName.includes('COMMUNICATION')) {
    return SATELLITE_IMAGE_DATABASE['INTELSAT'];
  }
  
  // Default fallback - could return null to show no image
  return null;
}

// Check if image URL is accessible
export async function checkImageAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}