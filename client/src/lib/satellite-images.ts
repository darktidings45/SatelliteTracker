// Satellite image sources from reliable providers
export interface SatelliteImageSource {
  name: string;
  url: string;
  credit: string;
  sourceUrl: string;
}

// Detailed satellite information from reliable sources
export interface SatelliteInfo {
  description: string;
  mission: string;
  agency: string;
  launchYear?: string;
  infoUrl: string;
}

// Known satellite images from reliable sources
const SATELLITE_IMAGE_DATABASE: Record<string, SatelliteImageSource> = {
  // International Space Station
  'ISS (ZARYA)': {
    name: 'International Space Station',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/International_Space_Station_after_undocking_of_STS-132.jpg/512px-International_Space_Station_after_undocking_of_STS-132.jpg',
    credit: 'NASA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:International_Space_Station_after_undocking_of_STS-132.jpg'
  },
  'ISS': {
    name: 'International Space Station',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/International_Space_Station_after_undocking_of_STS-132.jpg/512px-International_Space_Station_after_undocking_of_STS-132.jpg',
    credit: 'NASA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:International_Space_Station_after_undocking_of_STS-132.jpg'
  },
  
  // Hubble Space Telescope
  'HST': {
    name: 'Hubble Space Telescope',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/512px-HST-SM4.jpeg',
    credit: 'NASA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:HST-SM4.jpeg'
  },
  'HUBBLE SPACE TELESCOPE': {
    name: 'Hubble Space Telescope',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/512px-HST-SM4.jpeg',
    credit: 'NASA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:HST-SM4.jpeg'
  },
  
  // GPS satellites (generic GPS satellite image)
  'NAVSTAR': {
    name: 'GPS Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/GPS_Satellite_NASA_art-iif.jpg/512px-GPS_Satellite_NASA_art-iif.jpg',
    credit: 'NASA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:GPS_Satellite_NASA_art-iif.jpg'
  },
  
  // Landsat satellites
  'LANDSAT': {
    name: 'Landsat Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Landsat_8_spacecraft_model.png/512px-Landsat_8_spacecraft_model.png',
    credit: 'NASA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Landsat_8_spacecraft_model.png'
  },
  
  // NOAA weather satellites
  'NOAA': {
    name: 'NOAA Weather Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/NOAA-19_spacecraft_model.jpg/512px-NOAA-19_spacecraft_model.jpg',
    credit: 'NOAA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:NOAA-19_spacecraft_model.jpg'
  },
  
  // Terra satellite
  'TERRA': {
    name: 'Terra Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Terra_satellite.jpg/512px-Terra_satellite.jpg',
    credit: 'NASA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Terra_satellite.jpg'
  },
  
  // Aqua satellite
  'AQUA': {
    name: 'Aqua Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Aqua_satellite.jpg/512px-Aqua_satellite.jpg',
    credit: 'NASA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Aqua_satellite.jpg'
  },
  
  // Generic communication satellite
  'INTELSAT': {
    name: 'Communication Satellite',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Intelsat_VI_deployment_%28STS-49%29.jpg/512px-Intelsat_VI_deployment_%28STS-49%29.jpg',
    credit: 'NASA/Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Intelsat_VI_deployment_(STS-49).jpg'
  }
};

// Detailed satellite mission information from reliable sources
const SATELLITE_INFO_DATABASE: Record<string, SatelliteInfo> = {
  // International Space Station
  'ISS (ZARYA)': {
    description: 'The International Space Station is a modular space station in low Earth orbit. It is a multinational collaborative project involving space agencies from the United States, Russia, Europe, Japan, and Canada.',
    mission: 'The ISS serves as a microgravity and space environment research laboratory in which scientific research is conducted in astrobiology, astronomy, meteorology, physics, and other fields.',
    agency: 'NASA, Roscosmos, ESA, JAXA, CSA',
    launchYear: '1998',
    infoUrl: 'https://www.nasa.gov/international-space-station/'
  },
  'ISS': {
    description: 'The International Space Station is a modular space station in low Earth orbit. It is a multinational collaborative project involving space agencies from the United States, Russia, Europe, Japan, and Canada.',
    mission: 'The ISS serves as a microgravity and space environment research laboratory in which scientific research is conducted in astrobiology, astronomy, meteorology, physics, and other fields.',
    agency: 'NASA, Roscosmos, ESA, JAXA, CSA',
    launchYear: '1998',
    infoUrl: 'https://www.nasa.gov/international-space-station/'
  },

  // Hubble Space Telescope
  'HST': {
    description: 'The Hubble Space Telescope is a space telescope that was launched into low Earth orbit in 1990 and remains in operation. It was not the first space telescope, but it is one of the largest and most versatile.',
    mission: 'Hubble has been responsible for many groundbreaking astronomical discoveries, including determining the rate of expansion of the universe, discovering that most galaxies have supermassive black holes at their centers, and providing detailed images of distant galaxies.',
    agency: 'NASA, ESA',
    launchYear: '1990',
    infoUrl: 'https://www.nasa.gov/mission_pages/hubble/main/index.html'
  },
  'HUBBLE SPACE TELESCOPE': {
    description: 'The Hubble Space Telescope is a space telescope that was launched into low Earth orbit in 1990 and remains in operation. It was not the first space telescope, but it is one of the largest and most versatile.',
    mission: 'Hubble has been responsible for many groundbreaking astronomical discoveries, including determining the rate of expansion of the universe, discovering that most galaxies have supermassive black holes at their centers, and providing detailed images of distant galaxies.',
    agency: 'NASA, ESA',
    launchYear: '1990',
    infoUrl: 'https://www.nasa.gov/mission_pages/hubble/main/index.html'
  },

  // GPS satellites
  'NAVSTAR': {
    description: 'The Global Positioning System (GPS) is a satellite-based radionavigation system owned by the United States government and operated by the United States Space Force.',
    mission: 'GPS provides geolocation and time information to a GPS receiver anywhere on or near the Earth where there is an unobstructed line of sight to four or more GPS satellites.',
    agency: 'U.S. Space Force',
    launchYear: '1978',
    infoUrl: 'https://www.gps.gov/'
  },

  // Landsat satellites
  'LANDSAT': {
    description: 'The Landsat program is the longest-running enterprise for acquisition of satellite imagery of Earth. It is a joint NASA/USGS program.',
    mission: 'Landsat satellites have been collecting images of Earth from space since 1972, providing an unparalleled record of how the Earth\'s surface has changed over time.',
    agency: 'NASA, USGS',
    launchYear: '1972',
    infoUrl: 'https://landsat.gsfc.nasa.gov/'
  },

  // NOAA weather satellites
  'NOAA': {
    description: 'NOAA satellites provide critical weather, climate, and environmental information to forecasters, researchers, and the general public.',
    mission: 'These satellites monitor atmospheric conditions, track severe weather, and provide data for weather prediction models and climate research.',
    agency: 'NOAA',
    launchYear: '1960',
    infoUrl: 'https://www.nesdis.noaa.gov/our-satellites'
  },

  // Terra satellite
  'TERRA': {
    description: 'Terra is a multi-national NASA scientific research satellite that studies Earth\'s atmosphere, land surfaces, oceans, radiant energy, and the interactions among these components.',
    mission: 'Terra carries five instruments that observe Earth\'s systems and their interactions, helping scientists understand how Earth is changing and identify the consequences for life on Earth.',
    agency: 'NASA',
    launchYear: '1999',
    infoUrl: 'https://terra.nasa.gov/'
  },

  // Aqua satellite
  'AQUA': {
    description: 'Aqua is a NASA Earth Science satellite mission that collects information about Earth\'s water cycle, including evaporation from the oceans, water vapor in the atmosphere, clouds, precipitation, soil moisture, sea ice, land ice, and snow cover.',
    mission: 'Aqua data is used to understand how Earth\'s water cycle is changing, how clouds form and affect weather and climate, and how the polar ice caps are changing.',
    agency: 'NASA',
    launchYear: '2002',
    infoUrl: 'https://aqua.nasa.gov/'
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

// Get satellite information based on satellite name
export function getSatelliteInfo(satelliteName: string): SatelliteInfo | null {
  // Direct match first
  if (SATELLITE_INFO_DATABASE[satelliteName]) {
    return SATELLITE_INFO_DATABASE[satelliteName];
  }
  
  // Partial matching for satellite names that contain keywords
  const upperName = satelliteName.toUpperCase();
  
  if (upperName.includes('ISS') || upperName.includes('ZARYA')) {
    return SATELLITE_INFO_DATABASE['ISS'];
  }
  
  if (upperName.includes('HUBBLE') || upperName.includes('HST')) {
    return SATELLITE_INFO_DATABASE['HST'];
  }
  
  if (upperName.includes('GPS') || upperName.includes('NAVSTAR')) {
    return SATELLITE_INFO_DATABASE['NAVSTAR'];
  }
  
  if (upperName.includes('LANDSAT')) {
    return SATELLITE_INFO_DATABASE['LANDSAT'];
  }
  
  if (upperName.includes('NOAA')) {
    return SATELLITE_INFO_DATABASE['NOAA'];
  }
  
  if (upperName.includes('TERRA')) {
    return SATELLITE_INFO_DATABASE['TERRA'];
  }
  
  if (upperName.includes('AQUA')) {
    return SATELLITE_INFO_DATABASE['AQUA'];
  }
  
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