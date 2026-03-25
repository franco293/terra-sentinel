// ─── MONITORED REGIONS ───
export const MONITORED_REGIONS = [
  { id: 1, name: "Madre de Dios, Peru", lat: -12.59, lng: -69.18, status: "critical", alerts: 23, area: "4,200 km²", lastScan: "2h ago", confidence: 94, change: "+12%", type: "Gold (Alluvial)" },
  { id: 2, name: "Obuasi Region, Ghana", lat: 6.2, lng: -1.66, status: "warning", alerts: 14, area: "1,800 km²", lastScan: "4h ago", confidence: 87, change: "+8%", type: "Gold (Galamsey)" },
  { id: 3, name: "Limpopo, South Africa", lat: -23.4, lng: 29.4, status: "critical", alerts: 31, area: "2,600 km²", lastScan: "1h ago", confidence: 91, change: "+18%", type: "Chrome/PGMs" },
  { id: 4, name: "Kalimantan, Indonesia", lat: -1.68, lng: 116.42, status: "warning", alerts: 9, area: "5,100 km²", lastScan: "6h ago", confidence: 82, change: "+5%", type: "Gold/Coal" },
  { id: 5, name: "Yanomami Territory, Brazil", lat: 2.83, lng: -63.91, status: "critical", alerts: 41, area: "9,600 km²", lastScan: "3h ago", confidence: 96, change: "+22%", type: "Gold (Garimpeiro)" },
  { id: 6, name: "Lao Cai, Vietnam", lat: 22.48, lng: 103.97, status: "monitoring", alerts: 3, area: "800 km²", lastScan: "8h ago", confidence: 76, change: "+2%", type: "Iron Ore" },
  { id: 7, name: "Chocó, Colombia", lat: 5.69, lng: -76.66, status: "warning", alerts: 17, area: "3,200 km²", lastScan: "5h ago", confidence: 89, change: "+11%", type: "Gold/Platinum" },
  { id: 8, name: "Mpumalanga, South Africa", lat: -25.56, lng: 30.52, status: "monitoring", alerts: 6, area: "1,400 km²", lastScan: "7h ago", confidence: 79, change: "+3%", type: "Coal (Zama Zama)", ndviDelta: -0.18, heatAnomaly: 1.2, vegetationLossHa: 62, waterTurbidityRise: 0.14 },
  { id: 9, name: "Geita, Tanzania", lat: -2.86, lng: 32.16, status: "critical", alerts: 28, area: "3,900 km²", lastScan: "1h ago", confidence: 95, change: "+20%", type: "Gold (Open Pit)", ndviDelta: -0.48, heatAnomaly: 2.5, vegetationLossHa: 95, waterTurbidityRise: 0.18 },
];

export const REGION_HISTORY = {
  9: [
    { date: "2026-03-18", ndviDelta: -0.18, heatAnomaly: 1.1, vegetationLossHa: 12, waterTurbidityRise: 0.04 },
    { date: "2026-03-19", ndviDelta: -0.22, heatAnomaly: 1.3, vegetationLossHa: 19, waterTurbidityRise: 0.06 },
    { date: "2026-03-20", ndviDelta: -0.29, heatAnomaly: 1.8, vegetationLossHa: 27, waterTurbidityRise: 0.09 },
    { date: "2026-03-21", ndviDelta: -0.38, heatAnomaly: 2.0, vegetationLossHa: 45, waterTurbidityRise: 0.13 },
    { date: "2026-03-22", ndviDelta: -0.42, heatAnomaly: 2.2, vegetationLossHa: 61, waterTurbidityRise: 0.16 },
    { date: "2026-03-23", ndviDelta: -0.45, heatAnomaly: 2.4, vegetationLossHa: 78, waterTurbidityRise: 0.17 },
    { date: "2026-03-24", ndviDelta: -0.47, heatAnomaly: 2.5, vegetationLossHa: 90, waterTurbidityRise: 0.18 },
    { date: "2026-03-25", ndviDelta: -0.48, heatAnomaly: 2.5, vegetationLossHa: 95, waterTurbidityRise: 0.18 },
  ],
  5: [
    { date: "2026-03-18", ndviDelta: -0.11, heatAnomaly: 0.4, vegetationLossHa: 22, waterTurbidityRise: 0.08 },
    { date: "2026-03-19", ndviDelta: -0.16, heatAnomaly: 0.9, vegetationLossHa: 30, waterTurbidityRise: 0.10 },
    { date: "2026-03-20", ndviDelta: -0.26, heatAnomaly: 1.3, vegetationLossHa: 45, waterTurbidityRise: 0.12 },
    { date: "2026-03-21", ndviDelta: -0.33, heatAnomaly: 1.6, vegetationLossHa: 54, waterTurbidityRise: 0.13 },
    { date: "2026-03-22", ndviDelta: -0.37, heatAnomaly: 1.8, vegetationLossHa: 62, waterTurbidityRise: 0.14 },
    { date: "2026-03-23", ndviDelta: -0.40, heatAnomaly: 1.9, vegetationLossHa: 68, waterTurbidityRise: 0.15 },
    { date: "2026-03-24", ndviDelta: -0.42, heatAnomaly: 2.0, vegetationLossHa: 73, waterTurbidityRise: 0.15 },
    { date: "2026-03-25", ndviDelta: -0.45, heatAnomaly: 2.0, vegetationLossHa: 77, waterTurbidityRise: 0.16 },
  ],
};

// ─── SATELLITE SOURCES WITH DETAILED COSTS ───
export const SATELLITE_SOURCES = [
  { name: "Sentinel-2", provider: "ESA/Copernicus", resolution: "10m", bands: "13", revisit: "5 days", cost: "Free", tier: "free", api: "Copernicus Data Space", bestFor: "NDVI, change detection, multispectral", annualCost: 0, monthlyCost: 0, setupCost: 0, dataPoints: 500000 },
  { name: "Sentinel-1 (SAR)", provider: "ESA/Copernicus", resolution: "5-20m", bands: "C-band SAR", revisit: "6 days", cost: "Free", tier: "free", api: "Copernicus Data Space", bestFor: "All-weather, night monitoring, terrain", annualCost: 0, monthlyCost: 0, setupCost: 0, dataPoints: 500000 },
  { name: "Landsat 8/9", provider: "NASA/USGS", resolution: "15-30m", bands: "11", revisit: "8 days", cost: "Free", tier: "free", api: "USGS EarthExplorer", bestFor: "Historical analysis, thermal, long archive", annualCost: 0, monthlyCost: 0, setupCost: 0, dataPoints: 400000 },
  { name: "MODIS", provider: "NASA", resolution: "250m-1km", bands: "36", revisit: "1-2 days", cost: "Free", tier: "free", api: "NASA Earthdata", bestFor: "Wide-area fire/deforestation alerts", annualCost: 0, monthlyCost: 0, setupCost: 0, dataPoints: 1000000 },
  { name: "VIIRS", provider: "NASA/NOAA", resolution: "375m", bands: "22", revisit: "Daily", cost: "Free", tier: "free", api: "NASA Earthdata", bestFor: "Night lights, fire detection", annualCost: 0, monthlyCost: 0, setupCost: 0, dataPoints: 800000 },
  { name: "CBERS-4A", provider: "INPE (Brazil)", resolution: "2-8m", bands: "4", revisit: "26 days", cost: "Free", tier: "free", api: "INPE Catalog", bestFor: "Amazon region, deforestation", annualCost: 0, monthlyCost: 0, setupCost: 0, dataPoints: 200000 },
  { name: "Sentinel-5P", provider: "ESA/Copernicus", resolution: "7km", bands: "UV-SWIR", revisit: "Daily", cost: "Free", tier: "free", api: "Copernicus Data Space", bestFor: "Mercury/pollution plumes", annualCost: 0, monthlyCost: 0, setupCost: 0, dataPoints: 300000 },
  { name: "ASTER", provider: "NASA/METI", resolution: "15-90m", bands: "14", revisit: "16 days", cost: "Free", tier: "free", api: "NASA Earthdata", bestFor: "Mineral mapping, thermal", annualCost: 0, monthlyCost: 0, setupCost: 0, dataPoints: 150000 },
  { name: "PlanetScope", provider: "Planet Labs", resolution: "3m", bands: "8", revisit: "Daily", cost: "$4,500–$40,000/yr", tier: "paid", api: "Planet API", bestFor: "Daily monitoring, rapid change detection", annualCost: 22500, monthlyCost: 1875, setupCost: 5000, dataPoints: 2000000 },
  { name: "SkySat", provider: "Planet Labs", resolution: "0.5m", bands: "4", revisit: "4-5x/day", cost: "$8-12/km²", tier: "paid", api: "Planet API", bestFor: "High-res verification of alerts", annualCost: 72000, monthlyCost: 6000, setupCost: 8000, dataPoints: 5000000 },
  { name: "WorldView Legion", provider: "Maxar/Vantor", resolution: "0.3m", bands: "8", revisit: "Multiple/day", cost: "$15-60/km²", tier: "paid", api: "Maxar SecureWatch", bestFor: "Equipment identification, legal evidence", annualCost: 180000, monthlyCost: 15000, setupCost: 25000, dataPoints: 8000000 },
  { name: "Pléiades Neo", provider: "Airbus", resolution: "0.3m", bands: "6", revisit: "Daily", cost: "$10-50/km²", tier: "paid", api: "OneAtlas", bestFor: "Infrastructure detail, evidence collection", annualCost: 120000, monthlyCost: 10000, setupCost: 15000, dataPoints: 6000000 },
  { name: "SPOT 7", provider: "Airbus", resolution: "1.5m", bands: "5", revisit: "1-3 days", cost: "€4-18/km²", tier: "paid", api: "OneAtlas", bestFor: "Medium-scale monitoring", annualCost: 48000, monthlyCost: 4000, setupCost: 7000, dataPoints: 1500000 },
  { name: "BlackSky", provider: "BlackSky", resolution: "1m", bands: "4", revisit: "Up to 15x/day", cost: "Quote-based", tier: "paid", api: "BlackSky API", bestFor: "Frequent revisit, time-sensitive", annualCost: 144000, monthlyCost: 12000, setupCost: 20000, dataPoints: 3000000 },
  { name: "KOMPSAT-3A", provider: "KARI/SIIS", resolution: "0.55m", bands: "5", revisit: "1.4 days", cost: "$8-15/km²", tier: "paid", api: "SIIS Portal", bestFor: "Affordable VHR alternative", annualCost: 90000, monthlyCost: 7500, setupCost: 10000, dataPoints: 3500000 },
  { name: "SuperView Neo", provider: "CGSTL (China)", resolution: "0.3m", bands: "5", revisit: "Daily", cost: "$5-12/km²", tier: "paid", api: "Direct/Reseller", bestFor: "Budget VHR, competitive pricing", annualCost: 60000, monthlyCost: 5000, setupCost: 8000, dataPoints: 4000000 },
];

// ─── AI DETECTION PIPELINE ───
export const AI_DETECTION_PIPELINE = [
  { step: 1, name: "Ingest", desc: "Pull Sentinel-2 + Landsat tiles via Copernicus/USGS APIs", icon: "📡" },
  { step: 2, name: "Preprocess", desc: "Cloud masking, atmospheric correction, NDVI/NDWI/BSI indices", icon: "🔧" },
  { step: 3, name: "Change Detection", desc: "Bi-temporal differencing & time-series anomaly detection", icon: "🔄" },
  { step: 4, name: "AI Segmentation", desc: "U-Net model segments mining-like disturbances per pixel", icon: "🧠" },
  { step: 5, name: "Classification", desc: "Random Forest / CNN classifies formal vs informal mining", icon: "🏷️" },
  { step: 6, name: "Cross-Reference", desc: "Overlay mining permits, protected areas, water bodies", icon: "🗺️" },
  { step: 7, name: "Alert Generation", desc: "Score confidence, generate alerts with geolocation & evidence", icon: "🚨" },
  { step: 8, name: "Dashboard", desc: "Push to real-time dashboard with downloadable reports", icon: "📊" },
];

// ─── ALERT FEED ───
export const ALERTS_FEED = [
  { id: "ALT-2026-0341", time: "14 min ago", region: "Yanomami, Brazil", severity: "critical", desc: "New 2.4 ha clearing detected — matches alluvial mining signature", confidence: 96, sat: "Sentinel-2", ndvi: -0.42 },
  { id: "ALT-2026-0340", time: "38 min ago", region: "Limpopo, SA", severity: "critical", desc: "Night-time thermal anomaly at known zama zama hotspot", confidence: 91, sat: "VIIRS", ndvi: null },
  { id: "ALT-2026-0339", time: "1h ago", region: "Obuasi, Ghana", severity: "warning", desc: "Turbidity spike in River Offin downstream of galamsey zone", confidence: 87, sat: "Sentinel-2", ndvi: -0.31 },
  { id: "ALT-2026-0338", time: "2h ago", region: "Madre de Dios, Peru", severity: "warning", desc: "Road extension into protected buffer — 1.1 km new track", confidence: 84, sat: "Sentinel-1", ndvi: null },
  { id: "ALT-2026-0337", time: "3h ago", region: "Chocó, Colombia", severity: "critical", desc: "Mercury-indicative spectral anomaly near Atrato tributary", confidence: 89, sat: "Sentinel-5P", ndvi: null },
  { id: "ALT-2026-0336", time: "5h ago", region: "Kalimantan, Indonesia", severity: "warning", desc: "Vegetation loss acceleration — 3.8 ha in 14 days", confidence: 82, sat: "Landsat 9", ndvi: -0.38 },
  { id: "ALT-2026-0335", time: "6h ago", region: "Mpumalanga, SA", severity: "info", desc: "Equipment movement detected at dormant site", confidence: 72, sat: "Sentinel-2", ndvi: -0.12 },
];

// ─── MONTHLY TREND DATA ───
export const MONTHLY_DATA = [
  { month: "Oct", alerts: 89, area: 142, confirmed: 67 },
  { month: "Nov", alerts: 112, area: 178, confirmed: 84 },
  { month: "Dec", alerts: 98, area: 156, confirmed: 72 },
  { month: "Jan", alerts: 134, area: 201, confirmed: 98 },
  { month: "Feb", alerts: 156, area: 234, confirmed: 118 },
  { month: "Mar", alerts: 171, area: 267, confirmed: 131 },
];

// ─── COST TIERS ───
export const COST_CALCULATOR = {
  free: { monthlyCost: 0, setup: 0, compute: "~$50/mo (Google Colab Pro or AWS free tier)", computeNum: 50, resolution: "10-30m", revisit: "5-8 days" },
  starter: { monthlyCost: 500, setup: 2000, compute: "$200/mo (AWS EC2 + S3)", computeNum: 200, resolution: "3m daily + 10m", revisit: "Daily" },
  professional: { monthlyCost: 3500, setup: 8000, compute: "$800/mo (GPU instances)", computeNum: 800, resolution: "0.5-3m + SAR", revisit: "Multiple/day" },
  enterprise: { monthlyCost: 15000, setup: 25000, compute: "$3000/mo (dedicated)", computeNum: 3000, resolution: "0.3m + SAR + thermal", revisit: "Tasked on-demand" },
};

// ─── FREE AI/ML STACK ───
export const AI_STACK = [
  { tool: "Python + PyTorch", use: "Core ML framework" },
  { tool: "U-Net / DeepLabV3+", use: "Semantic segmentation model" },
  { tool: "Raster Vision", use: "Geospatial ML pipeline library" },
  { tool: "Google Earth Engine", use: "Cloud processing of satellite data" },
  { tool: "GDAL / Rasterio", use: "Geospatial data I/O" },
  { tool: "scikit-learn", use: "Random Forest classifiers" },
  { tool: "OpenCV", use: "Image preprocessing" },
  { tool: "Label Studio", use: "Annotation tool for training data" },
  { tool: "MLflow", use: "Experiment tracking" },
  { tool: "QGIS", use: "GIS visualization and analysis" },
];

// ─── DETECTION INDICES ───
export const DETECTION_INDICES = [
  { index: "NDVI", formula: "(NIR - Red) / (NIR + Red)", use: "Vegetation loss = mining clearance" },
  { index: "NDWI", formula: "(Green - NIR) / (Green + NIR)", use: "Water body changes, artificial ponds" },
  { index: "BSI", formula: "(SWIR+Red-NIR-Blue) / (SWIR+Red+NIR+Blue)", use: "Bare soil exposure from excavation" },
  { index: "MNDWI", formula: "(Green - SWIR) / (Green + SWIR)", use: "Turbidity in waterways" },
  { index: "dNDVI", formula: "NDVI(t2) - NDVI(t1)", use: "Temporal change detection" },
  { index: "Night Lights", formula: "VIIRS DNB radiance", use: "Activity at night in remote areas" },
  { index: "SAR Backscatter", formula: "Sentinel-1 VV/VH", use: "Terrain change through clouds" },
];

// ─── TRAINING DATASETS ───
export const TRAINING_DATASETS = [
  { name: "MineSegSAT", desc: "Sentinel-2 mining area segmentation dataset", source: "GitHub" },
  { name: "SmallMinesDS", desc: "Multimodal artisanal gold mine mapping dataset", source: "GitHub" },
  { name: "Amazon Mining", desc: "Label mining sites on Sentinel-2 with Label Studio", source: "Self-created" },
  { name: "Global Forest Watch", desc: "Deforestation alerts as proxy labels", source: "WRI" },
  { name: "OpenStreetMap Mining", desc: "Known mine locations for validation", source: "OSM" },
  { name: "SpaceNet", desc: "Building/road segmentation for transfer learning", source: "AWS" },
];

// ─── BUILD ROADMAP ───
export const ROADMAP = [
  {
    phase: "Phase 1 — MVP (Weeks 1-6)", color: "#00d4aa", status: "START HERE",
    items: [
      "Set up Copernicus Data Space account + USGS EarthExplorer access",
      "Build Python pipeline: download Sentinel-2 tiles → cloud mask → compute NDVI/BSI/NDWI",
      "Implement bi-temporal change detection (compare two dates, flag anomalies)",
      "Create labeled dataset: annotate ~200 mining sites using Label Studio on Sentinel-2",
      "Train U-Net segmentation model (PyTorch) — aim for >85% IoU",
      "Build React dashboard connected to a FastAPI backend",
      "Deploy on free tier: Railway / Render (backend) + Vercel (frontend)",
      "Cross-reference results with Mining Permit databases + Protected Areas",
    ]
  },
  {
    phase: "Phase 2 — Enhanced Detection (Weeks 7-12)", color: "#ffaa00", status: "NEXT",
    items: [
      "Add Sentinel-1 SAR for all-weather monitoring (critical for tropical regions)",
      "Integrate VIIRS night lights — detect mining camp activity at night",
      "Add Sentinel-5P for mercury pollution plume detection near gold mines",
      "Expand training data to 1,000+ labeled sites across 3+ countries",
      "Implement time-series analysis: detect rate-of-change acceleration",
      "Add automated email/SMS alerting when new mining activity detected",
      "Build report generation: PDF evidence packs for law enforcement",
      "Set up Google Earth Engine for cloud-based processing at scale",
    ]
  },
  {
    phase: "Phase 3 — Scale & Monetize (Weeks 13-24)", color: "#4488ff", status: "GROWTH",
    items: [
      "Upgrade to PlanetScope (3m daily) for paying customers",
      "Add SkySat or Maxar verification workflow for confirmed alerts",
      "Build multi-tenant SaaS: customer accounts, region subscriptions, API keys",
      "Launch tiered pricing: Government / Mining Corp / NGO plans",
      "Integrate with existing GIS platforms (ArcGIS, QGIS plugins)",
      "Partner with environmental law firms and mining regulators",
      "Submit to AWS / Google Cloud startup programs for credits",
      "Target: South Africa (zama zama), Brazil (garimpeiro), Ghana (galamsey)",
    ]
  },
  {
    phase: "Phase 4 — Market Leadership (Months 6-12)", color: "#ff2d55", status: "DOMINATE",
    items: [
      "Build predictive model: forecast WHERE mining will start next",
      "Add autonomous drone verification integration for ground-truthing",
      "Expand beyond mining: deforestation, ghost ships, illegal fishing",
      "Apply for ESA / NASA / World Bank grants for environmental monitoring",
      "Patent novel detection algorithms and spectral index combinations",
      "White-label platform for government agencies",
      "Target $500K ARR from 10 paying customers + government contracts",
      "Seek seed funding with proven product + revenue traction",
    ]
  },
];

// ─── REVENUE PLANS ───
export const REVENUE_PLANS = [
  { plan: "Watchdog", price: "$2,000/mo", target: "NGOs / Small orgs", features: "1 region, Sentinel data, weekly reports, email alerts" },
  { plan: "Enforcer", price: "$8,000/mo", target: "Government agencies", features: "5 regions, daily PlanetScope, evidence packs, API access" },
  { plan: "Command", price: "$25,000/mo", target: "Mining corporations", features: "Unlimited regions, VHR tasking, predictive, white-label, SLA" },
];

// ─── MULTI-SATELLITE COST BUNDLES ───
export const SATELLITE_BUNDLES = [
  {
    name: "Free Tier (Best for NGOs)",
    satellites: ["Sentinel-2", "Sentinel-1 (SAR)", "Landsat 8/9", "MODIS", "VIIRS"],
    annualCost: 0,
    monthlyCost: 0,
    setupCost: 0,
    coverage: "Global, 5-8 day revisit",
    resolution: "10-30m",
    dataPoints: 2500000,
  },
  {
    name: "Starter Bundle (Daily Monitoring)",
    satellites: ["Sentinel-2", "Sentinel-1 (SAR)", "PlanetScope"],
    annualCost: 22500 + 500 * 12,
    monthlyCost: 1875 + 500,
    setupCost: 5000 + 2000,
    coverage: "Focused regions, daily revisit",
    resolution: "3-10m",
    dataPoints: 4500000,
  },
  {
    name: "Professional Bundle (VHR + SAR)",
    satellites: ["Sentinel-1 (SAR)", "SkySat", "Pléiades Neo", "SPOT 7"],
    annualCost: 72000 + 120000 + 48000 + 3500 * 12,
    monthlyCost: 6000 + 10000 + 4000 + 3500,
    setupCost: 8000 + 15000 + 7000 + 8000,
    coverage: "High-priority regions, multiple daily",
    resolution: "0.3-1.5m + SAR",
    dataPoints: 13000000,
  },
  {
    name: "Enterprise Bundle (Full Stack)",
    satellites: ["Sentinel-1 (SAR)", "SkySat", "WorldView Legion", "Pléiades Neo", "BlackSky"],
    annualCost: 72000 + 180000 + 120000 + 144000 + 15000 * 12,
    monthlyCost: 6000 + 15000 + 10000 + 12000 + 15000,
    setupCost: 8000 + 25000 + 15000 + 20000 + 25000,
    coverage: "Unlimited regions, tasked on-demand",
    resolution: "0.3m + SAR + thermal",
    dataPoints: 25000000,
  },
];
