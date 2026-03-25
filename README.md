# 🛰️ Terra Sentinel

**Satellite-powered AI platform for detecting and monitoring illegal mining operations worldwide.**

Terra Sentinel combines free satellite imagery (Sentinel-2, Landsat, SAR) with deep learning to automatically detect illegal and artisanal mining activity across remote regions. The platform provides real-time alerts, evidence-grade reports, and a monitoring dashboard for governments, NGOs, and mining companies.

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/terra-sentinel.git
cd terra-sentinel

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

---

## 📊 Dashboard Tabs

| Tab | Description |
|-----|-------------|
| **Mission Control** | Global monitoring map, live stats, trend charts, region detail cards |
| **Satellite Intel** | Complete catalog of 16 satellite sources (8 free, 8 paid) with specs & costs |
| **Satellite Picker** | Interactive satellite bundle selector with live cost calculator |
| **AI Pipeline** | 8-step detection workflow from data ingestion to alert generation |
| **Live Alerts** | Real-time alert feed with confidence scores, NDVI deltas, source satellites |
| **Reports** | Auto-generated evidence reports, live satellite imagery, NASA Worldview/Earthdata links |
| **Surveillance** | Time-lapse date slider, thermal/NDVI escalation log, timeline event detection |
| **Cost Calculator** | 4-tier pricing model with annual cost projections |
| **Build Plan** | Phased product roadmap from MVP to market leadership + revenue model |

---

## 🛰️ Satellite Data Sources

### Free (V1 — $0 data cost)

| Satellite | Provider | Resolution | Revisit | Best For |
|-----------|----------|------------|---------|----------|
| Sentinel-2 | ESA/Copernicus | 10m | 5 days | NDVI, change detection, multispectral |
| Sentinel-1 (SAR) | ESA/Copernicus | 5-20m | 6 days | All-weather, night monitoring |
| Landsat 8/9 | NASA/USGS | 15-30m | 8 days | Historical analysis, 50+ year archive |
| MODIS | NASA | 250m-1km | 1-2 days | Wide-area fire/deforestation alerts |
| VIIRS | NASA/NOAA | 375m | Daily | Night lights, fire detection |
| CBERS-4A | INPE (Brazil) | 2-8m | 26 days | Amazon region monitoring |
| Sentinel-5P | ESA/Copernicus | 7km | Daily | Mercury/pollution plumes |
| ASTER | NASA/METI | 15-90m | 16 days | Mineral mapping, thermal |

### Paid (V2+ — for paying customers)

| Satellite | Provider | Resolution | Cost |
|-----------|----------|------------|------|
| PlanetScope | Planet Labs | 3m | $4,500–$40,000/yr |
| SkySat | Planet Labs | 0.5m | $8-12/km² |
| WorldView Legion | Maxar/Vantor | 0.3m | $15-60/km² |
| Pléiades Neo | Airbus | 0.3m | $10-50/km² |
| SPOT 7 | Airbus | 1.5m | €4-18/km² |
| BlackSky | BlackSky | 1m | Quote-based |
| KOMPSAT-3A | KARI/SIIS | 0.55m | $8-15/km² |
| SuperView Neo | CGSTL (China) | 0.3m | $5-12/km² |

---

## 🧠 AI Detection Pipeline

1. **Ingest** — Pull Sentinel-2 + Landsat tiles via Copernicus/USGS APIs
2. **Preprocess** — Cloud masking, atmospheric correction, compute spectral indices
3. **Change Detection** — Bi-temporal differencing & time-series anomaly detection
4. **AI Segmentation** — U-Net model segments mining-like disturbances per pixel
5. **Classification** — Random Forest / CNN classifies formal vs informal mining
6. **Cross-Reference** — Overlay mining permits, protected areas, water bodies
7. **Alert Generation** — Score confidence, generate alerts with geolocation & evidence
8. **Dashboard** — Push to real-time dashboard with downloadable reports

### Key Spectral Indices

| Index | Formula | Purpose |
|-------|---------|---------|
| NDVI | (NIR - Red) / (NIR + Red) | Vegetation loss = mining clearance |
| NDWI | (Green - NIR) / (Green + NIR) | Water body changes, artificial ponds |
| BSI | (SWIR+Red-NIR-Blue) / sum | Bare soil exposure from excavation |
| dNDVI | NDVI(t2) - NDVI(t1) | Temporal change detection |

### Free ML/AI Stack

- **PyTorch** — Core ML framework
- **U-Net / DeepLabV3+** — Semantic segmentation models
- **Raster Vision** — Geospatial ML pipeline library
- **Google Earth Engine** — Cloud processing at scale
- **GDAL / Rasterio** — Geospatial data I/O
- **scikit-learn** — Random Forest classifiers
- **Label Studio** — Training data annotation
- **MLflow** — Experiment tracking

### Training Datasets

- **MineSegSAT** — Sentinel-2 mining area segmentation
- **SmallMinesDS** — Multimodal artisanal gold mine mapping
- **Global Forest Watch** — Deforestation alerts as proxy labels
- **SpaceNet** — Building/road segmentation for transfer learning
- **OpenStreetMap** — Known mine locations for validation

---

## 💰 Cost Tiers

| Tier | Monthly | Setup | Resolution | Revisit |
|------|---------|-------|------------|---------|
| Free | $0 | $0 | 10-30m | 5-8 days |
| Starter | $500 | $2,000 | 3m daily + 10m | Daily |
| Professional | $3,500 | $8,000 | 0.5-3m + SAR | Multiple/day |
| Enterprise | $15,000 | $25,000 | 0.3m + SAR + thermal | On-demand |

---

## 📋 Build Roadmap

### Phase 1 — MVP (Weeks 1-6)
- Copernicus + USGS API setup
- Python pipeline: Sentinel-2 → cloud mask → NDVI/BSI/NDWI
- Bi-temporal change detection
- Label 200+ mining sites with Label Studio
- Train U-Net model (PyTorch) — target >85% IoU
- React dashboard + FastAPI backend
- Deploy free: Railway/Render + Vercel

### Phase 2 — Enhanced Detection (Weeks 7-12)
- Add Sentinel-1 SAR, VIIRS night lights, Sentinel-5P
- Expand to 1,000+ labeled sites
- Time-series analysis + automated alerting
- PDF evidence pack generation

### Phase 3 — Scale & Monetize (Weeks 13-24)
- PlanetScope + SkySat integration
- Multi-tenant SaaS + API keys
- GIS platform integrations
- Target: South Africa, Brazil, Ghana

### Phase 4 — Market Leadership (Months 6-12)
- Predictive modeling
- Drone verification integration
- Expand to deforestation, ghost ships, illegal fishing
- Target $500K ARR

---

## 🎯 Target Markets

- **South Africa** — Zama zama (illegal underground mining)
- **Brazil** — Garimpeiro (Amazon gold mining)
- **Ghana** — Galamsey (artisanal gold mining)
- **Peru** — Madre de Dios alluvial gold
- **Colombia** — Chocó gold/platinum operations
- **Indonesia** — Kalimantan gold/coal

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend (planned) | FastAPI + Python |
| ML/AI | PyTorch, U-Net, scikit-learn |
| Geospatial | GDAL, Rasterio, Google Earth Engine |
| Data | Sentinel-2, Landsat, VIIRS, SAR |
| Deploy | Vercel (frontend), Railway (backend) |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with 🛰️ from Cape Town, South Africa**
