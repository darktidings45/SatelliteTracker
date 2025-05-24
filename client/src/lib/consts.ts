// Earth radius in scene units (scaled down from actual kilometers)
export const EARTH_RADIUS = 10;

// Visual scale factor for satellites (makes them visible)
export const SATELLITE_SCALE = 1.5;

// Default aperture angle for satellite visibility (in degrees)
export const DEFAULT_APERTURE_ANGLE = 90;

// Colors
export const COLORS = {
  // Background colors
  background: '#0a0f16',
  spaceBlue: '#1a2634',
  
  // Earth colors
  earthBlue: '#30718d',
  landGreen: '#2e7d32',
  
  // UI colors
  uiSlate: '#34495e',
  brightBlue: '#3498db',
  
  // Satellite colors
  satelliteYellow: '#f7d794',
  
  // Text colors
  textLight: '#ecf0f1',
  textDark: '#2c3e50',
  textMuted: '#b2bec3'
};

// API endpoint for satellite data
export const SATELLITE_API_ENDPOINT = '/api/satellites';

// Sample TLE data for fallback/development
export const SAMPLE_TLE_DATA = [
  {
    id: "25544",
    name: "ISS (ZARYA)",
    type: "ISS",
    launchDate: "1998-11-20",
    tle: [
      "ISS (ZARYA)",
      "1 25544U 98067A   23146.29527412  .00016085  00000+0  29669-3 0  9993",
      "2 25544  51.6423 174.8198 0005748  68.1933 299.4958 15.50442296 47182"
    ]
  },
  {
    id: "33591",
    name: "NOAA 19",
    type: "WEATHER",
    launchDate: "2009-02-06",
    tle: [
      "NOAA 19",
      "1 33591U 09005A   23146.14023029  .00000191  00000+0  12455-3 0  9993",
      "2 33591  99.1804 204.7988 0013685 199.5357 160.5206 14.12608929731384"
    ]
  },
  {
    id: "48859",
    name: "STARLINK-4373",
    type: "COMMUNICATION",
    launchDate: "2021-11-13",
    tle: [
      "STARLINK-4373",
      "1 48859U 21081BV  23146.24226273  .00012872  00000+0  76124-3 0  9992",
      "2 48859  53.2161 213.9331 0001728  92.0367 268.0841 15.43598811 85459"
    ]
  },
  {
    id: "44876",
    name: "GPS SVN78",
    type: "NAVIGATION",
    launchDate: "2019-08-22",
    tle: [
      "GPS SVN78",
      "1 44876U 19081A   23145.88120177 -.00000047  00000+0  00000+0 0  9993",
      "2 44876  55.0470  38.1741 0009868 312.9436  47.0202  2.00562671 27394"
    ]
  },
  {
    id: "43013",
    name: "TESS",
    type: "SCIENCE",
    launchDate: "2018-04-18",
    tle: [
      "TESS",
      "1 43013U 18038A   23145.01245277  .00000000  00000+0  00000+0 0  9999",
      "2 43013  37.0316 146.8932 9522062 200.2217 116.3770  0.24763872  3968"
    ]
  }
];
