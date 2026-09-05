/**
 * GreenPulse - Environmental Monitoring Platform
 * Meghalaya, India
 * 
 * Central Environmental Dataset (Demo / Baseline Data)
 * Structured for future 1:1 drop-in replacement with REST API (/api/environmental-data)
 */

const environmentalData = {
  region: {
    name: "East Khasi Hills & Surrounds",
    state: "Meghalaya",
    country: "India",
    centerCoordinates: [25.5788, 91.8900],
    defaultZoom: 13,
    timezone: "Asia/Kolkata",
    climateZone: "Sub-tropical Highland (Cwb)",
    activeSensorsCount: 56,
    networkStatus: "operational"
  },
  
  // Monitored micro-stations across Meghalaya spanning full 0-100 EMS range
  locations: [
    {
      id: "byrnihat-industrial",
      name: "Byrnihat Industrial Corridor",
      code: "GP-RB-02",
      district: "Ri-Bhoi",
      category: "Heavy Industrial & Smelting Cluster",
      coordinates: [26.0520, 91.8790],
      elevation: "210 m",
      description: "Concentrated industrial export cluster with ferroalloy and smelting plants experiencing severe thermal particulate trapping.",
      current: {
        temperature: 28.6,
        humidity: 55,
        soilMoisture: 24,
        noiseLevel: 82,    // dB (heavy manufacturing and highway transport)
        airQuality: 14,    // low quality
        aqiRaw: 285,       // Severe / Poor
        lightIntensity: 82,
        crowdIndex: 78,
        pm25: 86.4,        // µg/m³ (high hazard)
        pm10: 178.5,       // µg/m³ (critical dust)
        co2: 685,          // ppm
        ems: 12,           // 0-20 Bracket: #DC2626 Critical Variance
        status: "critical",
        statusLabel: "Critical Environmental Strain",
        lastUpdated: "Just now"
      },
      emsHistory24h: [15, 14, 12, 10, 11, 13, 16, 15, 14, 12, 11, 12],
      hourlyLabels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
      insights: [
        "Heavy smelting emissions cause persistent particulate suspension exceeding national standards.",
        "Valley corridor morphology traps low-altitude thermal inversion smog.",
        "Continuous heavy haulage transit generates elevated ambient noise (82 dB)."
      ]
    },
    {
      id: "iewduh-bazar",
      name: "Iewduh (Bara Bazar)",
      code: "GP-EKB-07",
      district: "East Khasi Hills",
      category: "Dense Wholesale Market & Transit Hub",
      coordinates: [25.5744, 91.8765],
      elevation: "1,465 m",
      description: "Historic indigenous trading hub with high pedestrian density, diesel delivery fleets, and narrow canopy alleys.",
      current: {
        temperature: 24.5,
        humidity: 60,
        soilMoisture: 32,
        noiseLevel: 79,    // dB (bustling marketplace)
        airQuality: 26,
        aqiRaw: 185,
        lightIntensity: 75,
        crowdIndex: 94,    // Maximum crowd density
        pm25: 64.2,
        pm10: 122.0,
        co2: 590,
        ems: 28,           // 21-40 Bracket: #F97316 High Stress
        status: "stress",
        statusLabel: "High Anthropogenic Stress",
        lastUpdated: "1 min ago"
      },
      emsHistory24h: [36, 35, 34, 32, 28, 26, 25, 27, 30, 31, 29, 28],
      hourlyLabels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
      insights: [
        "Diesel freight delivery vehicles create particulate spikes in confined access roads.",
        "Acoustic exposure averages 79 dB during peak mercantile daytime operations.",
        "High crowd footprint index (94/100) restricts atmospheric convective ventilation."
      ]
    },
    {
      id: "police-bazar",
      name: "Police Bazar (Khyndailad)",
      code: "GP-EKB-02",
      district: "East Khasi Hills",
      category: "Urban Commercial Core",
      coordinates: [25.5788, 91.8819],
      elevation: "1,480 m",
      description: "Primary commercial and transit nucleus of Shillong with high pedestrian density, shops, and taxi stands.",
      current: {
        temperature: 23.2,
        humidity: 62,
        soilMoisture: 38,
        noiseLevel: 74,    // dB
        airQuality: 38,
        aqiRaw: 135,
        lightIntensity: 84,
        crowdIndex: 86,
        pm25: 48.6,
        pm10: 88.4,
        co2: 512,
        ems: 38,           // 21-40 Bracket: #F97316 High Stress
        status: "stress",
        statusLabel: "High Anthropogenic Stress",
        lastUpdated: "1 min ago"
      },
      emsHistory24h: [44, 42, 45, 43, 38, 35, 34, 36, 39, 40, 39, 38],
      hourlyLabels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
      insights: [
        "Elevated ambient acoustic level due to evening commerce peak.",
        "Micro-urban heat island creates +2.8°C delta relative to NEHU campus.",
        "Particulate levels rise during morning and evening transit rush."
      ]
    },
    {
      id: "laitumkhrah",
      name: "Laitumkhrah Commercial Ridge",
      code: "GP-EKB-04",
      district: "East Khasi Hills",
      category: "Suburban Mixed Commercial & Educational",
      coordinates: [25.5701, 91.8955],
      elevation: "1,510 m",
      description: "Cultural hub with historic educational institutions, hillside cafes, and vehicular thoroughfares.",
      current: {
        temperature: 21.8,
        humidity: 68,
        soilMoisture: 58,
        noiseLevel: 62,
        airQuality: 54,
        aqiRaw: 88,
        lightIntensity: 76,
        crowdIndex: 64,
        pm25: 28.5,
        pm10: 54.2,
        co2: 448,
        ems: 53,           // 41-60 Bracket: #EAB308 Moderate Variance
        status: "moderate",
        statusLabel: "Moderate Microclimate Variance",
        lastUpdated: "2 mins ago"
      },
      emsHistory24h: [58, 57, 56, 58, 54, 52, 51, 52, 54, 55, 54, 53],
      hourlyLabels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
      insights: [
        "Moderate vehicular traffic with prompt atmospheric dispersion along ridge lines.",
        "Intermittent traffic congestion creates localized particulate spikes.",
        "Decent canopy cover mitigates severe urban heat buildup."
      ]
    },
    {
      id: "mawlai",
      name: "Mawlai Nongkwar",
      code: "GP-EKB-05",
      district: "East Khasi Hills",
      category: "Valley Residential & Watershed",
      coordinates: [25.5925, 91.8708],
      elevation: "1,440 m",
      description: "Western township situated along descending valley terraces with active local stream catchments.",
      current: {
        temperature: 21.4,
        humidity: 72,
        soilMoisture: 72,
        noiseLevel: 54,
        airQuality: 68,
        aqiRaw: 52,
        lightIntensity: 70,
        crowdIndex: 46,
        pm25: 20.4,
        pm10: 38.6,
        co2: 428,
        ems: 69,           // 61-80 Bracket: #65A30D Good Equilibrium
        status: "good",
        statusLabel: "Good Ecological Balance",
        lastUpdated: "Just now"
      },
      emsHistory24h: [72, 73, 74, 73, 70, 68, 67, 68, 70, 71, 70, 69],
      hourlyLabels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
      insights: [
        "Valley orientation captures gentle nocturnal breezes.",
        "Active stream buffers soil against compaction.",
        "Particulates disperse rapidly along valley wind gradients."
      ]
    },
    {
      id: "ward-lake",
      name: "Ward's Lake Eco-Park",
      code: "GP-EKB-01",
      district: "East Khasi Hills",
      category: "Public Eco-Park & Water Basin",
      coordinates: [25.5762, 91.8845],
      elevation: "1,496 m",
      description: "Historic horseshoe-shaped artificial lake enveloped by lush botanical gardens, pine groves, and walking trails.",
      current: {
        temperature: 20.4,
        humidity: 78,
        soilMoisture: 84,
        noiseLevel: 46,
        airQuality: 78,
        aqiRaw: 38,
        lightIntensity: 68,
        crowdIndex: 42,
        pm25: 14.8,
        pm10: 28.2,
        co2: 412,
        ems: 78,           // 61-80 Bracket: #65A30D Good Equilibrium
        status: "good",
        statusLabel: "Good Ecological Balance",
        lastUpdated: "Just now"
      },
      emsHistory24h: [76, 78, 79, 80, 78, 76, 75, 76, 78, 79, 78, 78],
      hourlyLabels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
      insights: [
        "High canopy density dampens sound levels by 18 dB compared to downtown.",
        "Water body retains stable night temperature differential of +1.8°C.",
        "High soil moisture from perimeter wetland drainage."
      ]
    },
    {
      id: "umiam-lake",
      name: "Umiam Lake (Barapani)",
      code: "GP-RB-01",
      district: "Ri-Bhoi",
      category: "Lacustrine Hydro-Catchment",
      coordinates: [25.6567, 91.8983],
      elevation: "1,020 m",
      description: "Expansive reservoir basin framed by coniferous hills, regulating regional water retention and recreation.",
      current: {
        temperature: 23.8,
        humidity: 76,
        soilMoisture: 86,
        noiseLevel: 42,
        airQuality: 86,
        aqiRaw: 26,
        lightIntensity: 86,
        crowdIndex: 36,
        pm25: 11.2,
        pm10: 22.0,
        co2: 406,
        ems: 86,           // 81-100 Bracket: #16A34A Optimal Health
        status: "excellent",
        statusLabel: "Optimal Ecosystem",
        lastUpdated: "Just now"
      },
      emsHistory24h: [85, 86, 86, 88, 87, 86, 85, 86, 86, 87, 86, 86],
      hourlyLabels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
      insights: [
        "Unobstructed water surface allows high solar irradiance index.",
        "Surface evaporation supports consistent convective micro-cloud formation.",
        "Low background acoustics preserve lacustrine wildlife habitats."
      ]
    },
    {
      id: "elephant-falls",
      name: "Elephant Falls (Upper Shillong)",
      code: "GP-EKB-06",
      district: "East Khasi Hills",
      category: "Riparian Cascade Reserve",
      coordinates: [25.5358, 91.8236],
      elevation: "1,620 m",
      description: "Three-tiered mountain waterfall surrounded by fern-carpeted ravines and moist subtropical montane forest.",
      current: {
        temperature: 18.2,
        humidity: 89,
        soilMoisture: 94,
        noiseLevel: 52,
        airQuality: 92,
        aqiRaw: 18,
        lightIntensity: 55,
        crowdIndex: 32,
        pm25: 8.2,
        pm10: 15.6,
        co2: 398,
        ems: 92,           // 81-100 Bracket: #16A34A Optimal Health
        status: "excellent",
        statusLabel: "Optimal Pristine Reserve",
        lastUpdated: "3 mins ago"
      },
      emsHistory24h: [90, 91, 92, 93, 93, 92, 91, 91, 92, 92, 93, 92],
      hourlyLabels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
      insights: [
        "Aerosolized water vapor generates highest relative humidity (89%).",
        "Natural aquatic sound profile creates pleasant masking soundscape.",
        "Dense moss layer serves as direct bio-indicator of non-acidic air."
      ]
    },
    {
      id: "cherrapunji-sohra",
      name: "Sohra (Cherrapunji)",
      code: "GP-WKB-01",
      district: "East Khasi Hills",
      category: "Pluviometric Highland Escarpment",
      coordinates: [25.2702, 91.7323],
      elevation: "1,430 m",
      description: "World-renowned high precipitation southern escarpment overlooking Bangladesh plains, rich in limestone gorges and living root bridges.",
      current: {
        temperature: 18.9,
        humidity: 92,
        soilMoisture: 98,
        noiseLevel: 36,
        airQuality: 98,
        aqiRaw: 8,
        lightIntensity: 62,
        crowdIndex: 22,
        pm25: 3.6,
        pm10: 7.8,
        co2: 388,
        ems: 98,           // 81-100 Bracket: #16A34A Optimal Health (near 100)
        status: "excellent",
        statusLabel: "Pristine Atmospheric Benchmark",
        lastUpdated: "1 min ago"
      },
      emsHistory24h: [96, 97, 98, 99, 99, 98, 97, 97, 98, 98, 99, 98],
      hourlyLabels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
      insights: [
        "Cleanest air quality reading (AQI 8, PM2.5 3.6 µg/m³) recorded across the plateau.",
        "Orographic wind currents continuously flush airborne particulate matter.",
        "Topsoil saturation at 98% with active moss carpet filtration."
      ]
    }
  ],

  // 7-day regional historical aggregate for analytics
  regionalTrends: {
    dates: ["Aug 30", "Aug 31", "Sep 01", "Sep 02", "Sep 03", "Sep 04", "Sep 05"],
    averageEMS: [52.4, 56.8, 54.2, 62.0, 59.5, 63.8, 63.8],
    averageTemp: [21.8, 22.2, 21.5, 22.0, 21.9, 22.4, 22.1],
    averageHumidity: [72, 74, 76, 73, 75, 71, 74],
    averageAQI: [58, 52, 54, 48, 49, 46, 45]
  },

  // Derived environmental insights for the analytics view
  environmentalInsights: [
    {
      id: "pure-air",
      title: "Cleanest Atmosphere (EMS 98)",
      location: "Sohra (Cherrapunji)",
      value: "AQI 8 / PM2.5 3.6 µg/m³",
      type: "positive",
      summary: "Southern escarpment orographic wind flushes keep suspended particulates well below WHO target levels."
    },
    {
      id: "critical-air",
      title: "Critical Stress Zone (EMS 12)",
      location: "Byrnihat Industrial Corridor",
      value: "AQI 285 / PM2.5 86.4 µg/m³",
      type: "advisory",
      summary: "Heavy industrial alloy emissions and highway cargo convergence create critical ecological strain."
    },
    {
      id: "highest-noise",
      title: "Anthropogenic Noise Hotspot",
      location: "Byrnihat & Iewduh (Bara Bazar)",
      value: "82 dB / 79 dB Peaks",
      type: "advisory",
      summary: "Exceeds CPCB commercial daytime guidelines due to transit bottlenecks and commercial loading."
    },
    {
      id: "lowest-temp",
      title: "Coolest Microclimate",
      location: "Elephant Falls",
      value: "18.2°C (Δ -10.4°C vs Byrnihat)",
      type: "neutral",
      summary: "Shaded riparian gorge and adiabatic waterfall cooling effect maintain refreshing mountain microclimate."
    },
    {
      id: "top-soil",
      title: "Maximum Soil Hydration",
      location: "Sohra Plateau & Falls",
      value: "98 / 100 Moisture Index",
      type: "positive",
      summary: "Deep root mycorrhizal network maintains water balance despite steep karst limestone runoff."
    },
    {
      id: "highest-crowd",
      title: "Highest Footprint Density",
      location: "Iewduh (Bara Bazar)",
      value: "94 / 100 Crowd Index",
      type: "advisory",
      summary: "Peak merchant footfall correlates with elevated ambient carbon dioxide (590 ppm)."
    }
  ]
};

// Expose on global window object for vanilla script usage
if (typeof window !== "undefined") {
  window.environmentalData = environmentalData;
}
