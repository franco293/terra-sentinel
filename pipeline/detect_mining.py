#!/usr/bin/env python3
"""
Terra Sentinel — Multi-Sensor Fusion Mining Detection Pipeline
==============================================================
Detects illegal mining activity by fusing:
  - Sentinel-1 SAR  (VH polarization — works through clouds/night)
  - Sentinel-2 MSI  (10m NDVI, NDBI — vegetation loss, bare soil)
  - Landsat 8/9 TIRS (Thermal IR — heat anomalies, soil disturbance)

Confidence Levels:
  HIGH   = SAR change + Optical vegetation loss + Thermal anomaly (3/3 sensors)
  MEDIUM = Any 2 sensors agree
  LOW    = Single sensor detection

Output: GeoJSON file committed to repo → consumed by Vercel dashboard
"""

import ee
import json
import os
import sys
from datetime import datetime, timedelta

# ═══════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════

# Monitoring regions — coordinates match dashboard data.js
REGIONS = [
    {"id": 1, "name": "Madre de Dios, Peru", "lat": -12.59, "lng": -69.18, "radius_km": 50, "type": "Gold (Alluvial)"},
    {"id": 2, "name": "Obuasi Region, Ghana", "lat": 6.20, "lng": -1.66, "radius_km": 40, "type": "Gold (Galamsey)"},
    {"id": 3, "name": "Limpopo, South Africa", "lat": -23.40, "lng": 29.40, "radius_km": 45, "type": "Chrome/PGMs"},
    {"id": 4, "name": "Kalimantan, Indonesia", "lat": -1.68, "lng": 116.42, "radius_km": 50, "type": "Gold/Coal"},
    {"id": 5, "name": "Yanomami Territory, Brazil", "lat": 2.83, "lng": -63.91, "radius_km": 80, "type": "Gold (Garimpeiro)"},
    {"id": 6, "name": "Lao Cai, Vietnam", "lat": 22.48, "lng": 103.97, "radius_km": 30, "type": "Iron Ore"},
    {"id": 7, "name": "Chocó, Colombia", "lat": 5.69, "lng": -76.66, "radius_km": 50, "type": "Gold/Platinum"},
    {"id": 8, "name": "Mpumalanga, South Africa", "lat": -25.56, "lng": 30.52, "radius_km": 35, "type": "Coal"},
    {"id": 9, "name": "Geita, Tanzania", "lat": -2.86, "lng": 32.16, "radius_km": 45, "type": "Gold (Open Pit)"},
]

# Detection thresholds (tuned for mining signature)
NDVI_LOSS_THRESHOLD = -0.15       # NDVI drop indicating vegetation clearing
NDBI_INCREASE_THRESHOLD = 0.10    # Built-up/bare soil increase
SAR_CHANGE_DB = 2.0               # dB change in SAR backscatter
THERMAL_ANOMALY_K = 3.0           # Kelvin above local mean = anomaly
MIN_PATCH_PIXELS = 5              # Minimum cluster size (filters noise)
CLOUD_COVER_MAX = 30              # Max cloud % for optical imagery

# Time windows
CURRENT_DAYS = 30                 # Recent window
BASELINE_DAYS_AGO = 365           # Historical baseline (1 year ago)
BASELINE_WINDOW = 60              # Baseline window width


def authenticate_gee():
    """Authenticate with GEE using service account from env vars."""
    key_json = os.environ.get("GEE_SERVICE_ACCOUNT_KEY")
    if not key_json:
        print("ERROR: GEE_SERVICE_ACCOUNT_KEY not set in environment")
        print("See SETUP_GUIDE.md for instructions")
        sys.exit(1)

    try:
        key_data = json.loads(key_json)
        credentials = ee.ServiceAccountCredentials(
            key_data["client_email"],
            key_data=key_json
        )
        ee.Initialize(credentials, project=key_data.get("project_id"))
        print(f"GEE authenticated as: {key_data['client_email']}")
    except Exception as e:
        print(f"GEE authentication failed: {e}")
        sys.exit(1)


def make_aoi(lat, lng, radius_km):
    """Create circular Area of Interest."""
    return ee.Geometry.Point([lng, lat]).buffer(radius_km * 1000)


# ═══════════════════════════════════════════
# SENTINEL-2: NDVI & NDBI (Vegetation + Bare Soil)
# ═══════════════════════════════════════════

def mask_s2_clouds(image):
    """Cloud mask for Sentinel-2 using SCL band."""
    scl = image.select("SCL")
    # SCL classes: 3=cloud shadow, 8=cloud med, 9=cloud high, 10=cirrus
    mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))
    return image.updateMask(mask)


def get_s2_indices(aoi, start_date, end_date):
    """Compute median NDVI and NDBI from cloud-free Sentinel-2."""
    s2 = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
          .filterBounds(aoi)
          .filterDate(start_date, end_date)
          .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", CLOUD_COVER_MAX))
          .map(mask_s2_clouds))

    count = s2.size().getInfo()
    if count == 0:
        return None, None, 0

    median = s2.median()

    # NDVI = (NIR - Red) / (NIR + Red) — vegetation health
    ndvi = median.normalizedDifference(["B8", "B4"]).rename("NDVI")

    # NDBI = (SWIR - NIR) / (SWIR + NIR) — bare soil / built-up
    ndbi = median.normalizedDifference(["B11", "B8"]).rename("NDBI")

    return ndvi, ndbi, count


def detect_s2_changes(aoi, current_end, current_days, baseline_start, baseline_end):
    """Detect vegetation loss and bare soil increase from Sentinel-2."""
    current_start = (datetime.strptime(current_end, "%Y-%m-%d") -
                     timedelta(days=current_days)).strftime("%Y-%m-%d")

    ndvi_now, ndbi_now, count_now = get_s2_indices(aoi, current_start, current_end)
    ndvi_base, ndbi_base, count_base = get_s2_indices(aoi, baseline_start, baseline_end)

    if ndvi_now is None or ndvi_base is None:
        return None, None

    # NDVI loss = vegetation cleared (negative = loss)
    ndvi_change = ndvi_now.subtract(ndvi_base).rename("NDVI_change")
    veg_loss = ndvi_change.lt(NDVI_LOSS_THRESHOLD)

    # NDBI increase = new bare soil / excavation
    ndbi_change = ndbi_now.subtract(ndbi_base).rename("NDBI_change")
    soil_increase = ndbi_change.gt(NDBI_INCREASE_THRESHOLD)

    # Combined S2 detection: vegetation loss OR bare soil increase
    s2_detection = veg_loss.Or(soil_increase).selfMask()

    return s2_detection, {
        "images_current": count_now,
        "images_baseline": count_base,
        "ndvi_threshold": NDVI_LOSS_THRESHOLD,
        "ndbi_threshold": NDBI_INCREASE_THRESHOLD,
    }


# ═══════════════════════════════════════════
# SENTINEL-1 SAR: Texture/Moisture Change
# ═══════════════════════════════════════════

def get_s1_composite(aoi, start_date, end_date):
    """Get Sentinel-1 VH backscatter composite."""
    s1 = (ee.ImageCollection("COPERNICUS/S1_GRD")
          .filterBounds(aoi)
          .filterDate(start_date, end_date)
          .filter(ee.Filter.eq("instrumentMode", "IW"))
          .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VH"))
          .select("VH"))

    count = s1.size().getInfo()
    if count == 0:
        return None, 0

    return s1.median(), count


def detect_s1_changes(aoi, current_end, current_days, baseline_start, baseline_end):
    """Detect SAR backscatter changes indicating terrain disturbance."""
    current_start = (datetime.strptime(current_end, "%Y-%m-%d") -
                     timedelta(days=current_days)).strftime("%Y-%m-%d")

    sar_now, count_now = get_s1_composite(aoi, current_start, current_end)
    sar_base, count_base = get_s1_composite(aoi, baseline_start, baseline_end)

    if sar_now is None or sar_base is None:
        return None, None

    # dB change — mining causes increase (exposed soil) or decrease (water ponds)
    sar_change = sar_now.subtract(sar_base).abs().rename("SAR_change")
    s1_detection = sar_change.gt(SAR_CHANGE_DB).selfMask()

    return s1_detection, {
        "images_current": count_now,
        "images_baseline": count_base,
        "change_threshold_db": SAR_CHANGE_DB,
    }


# ═══════════════════════════════════════════
# LANDSAT 8/9: Thermal Anomaly Detection
# ═══════════════════════════════════════════

def mask_landsat_clouds(image):
    """Cloud mask for Landsat using QA_PIXEL band."""
    qa = image.select("QA_PIXEL")
    # Bits 3=cloud shadow, 4=cloud
    cloud_mask = qa.bitwiseAnd(1 << 3).eq(0).And(qa.bitwiseAnd(1 << 4).eq(0))
    return image.updateMask(cloud_mask)


def detect_thermal_anomaly(aoi, current_end, current_days):
    """Detect thermal anomalies using Landsat 8/9 TIRS."""
    current_start = (datetime.strptime(current_end, "%Y-%m-%d") -
                     timedelta(days=current_days)).strftime("%Y-%m-%d")

    # Landsat 8 Collection 2, Level 2 (Surface Temperature)
    l8 = (ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
          .filterBounds(aoi)
          .filterDate(current_start, current_end)
          .filter(ee.Filter.lt("CLOUD_COVER", CLOUD_COVER_MAX))
          .map(mask_landsat_clouds))

    # Also try Landsat 9
    l9 = (ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
          .filterBounds(aoi)
          .filterDate(current_start, current_end)
          .filter(ee.Filter.lt("CLOUD_COVER", CLOUD_COVER_MAX))
          .map(mask_landsat_clouds))

    landsat = l8.merge(l9)
    count = landsat.size().getInfo()

    if count == 0:
        return None, None

    # ST_B10 is surface temperature (scale factor 0.00341802, offset 149.0)
    def scale_temp(img):
        return img.select("ST_B10").multiply(0.00341802).add(149.0).rename("LST")

    lst = landsat.map(scale_temp).median()

    # Local mean and stddev
    local_mean = lst.reduceNeighborhood(ee.Reducer.mean(), ee.Kernel.circle(1500, "meters"))
    local_std = lst.reduceNeighborhood(ee.Reducer.stdDev(), ee.Kernel.circle(1500, "meters"))

    # Anomaly = pixels > mean + K * stddev
    threshold = local_mean.add(local_std.multiply(THERMAL_ANOMALY_K))
    thermal_detection = lst.gt(threshold).selfMask()

    return thermal_detection, {
        "images_used": count,
        "anomaly_sigma": THERMAL_ANOMALY_K,
    }


# ═══════════════════════════════════════════
# MULTI-SENSOR FUSION
# ═══════════════════════════════════════════

def fuse_detections(s2_det, s1_det, thermal_det, aoi):
    """
    Fuse detections from all sensors into confidence levels.

    HIGH   = 3/3 sensors agree (SAR + Optical + Thermal)
    MEDIUM = 2/3 sensors agree
    LOW    = 1/3 sensor only
    """
    # Convert to binary (1 where detected, 0 where not)
    layers = []
    if s2_det is not None:
        layers.append(s2_det.unmask(0).gt(0).rename("s2"))
    if s1_det is not None:
        layers.append(s1_det.unmask(0).gt(0).rename("s1"))
    if thermal_det is not None:
        layers.append(thermal_det.unmask(0).gt(0).rename("thermal"))

    if len(layers) == 0:
        return None, None, None

    # Stack and sum — count how many sensors agree per pixel
    stack = ee.Image.cat(layers)
    agreement = stack.reduce(ee.Reducer.sum()).rename("sensor_count")

    # Classify confidence
    high = agreement.gte(3).selfMask().rename("high")
    medium = agreement.eq(2).selfMask().rename("medium")
    low = agreement.eq(1).selfMask().rename("low")

    return high, medium, low


def extract_hotspots(detection_image, aoi, confidence, max_points=50):
    """Convert raster detection to point coordinates."""
    if detection_image is None:
        return []

    try:
        # Reduce to vectors (connected components)
        vectors = detection_image.reduceToVectors(
            geometry=aoi,
            scale=30,
            maxPixels=1e8,
            geometryType="centroid",
            eightConnected=True,
            bestEffort=True,
        )

        # Get as feature collection, limit points
        features = vectors.limit(max_points).getInfo()

        hotspots = []
        for f in features.get("features", []):
            coords = f["geometry"]["coordinates"]
            hotspots.append({
                "lng": round(coords[0], 6),
                "lat": round(coords[1], 6),
                "confidence": confidence,
            })

        return hotspots

    except Exception as e:
        print(f"  Warning: Could not extract {confidence} hotspots: {e}")
        return []


# ═══════════════════════════════════════════
# GEE TILE URLs (for dashboard overlay)
# ═══════════════════════════════════════════

def get_tile_urls(aoi, current_end, current_days):
    """Generate GEE map tile URLs for dashboard visualization."""
    current_start = (datetime.strptime(current_end, "%Y-%m-%d") -
                     timedelta(days=current_days)).strftime("%Y-%m-%d")

    tiles = {}

    try:
        # Sentinel-2 true color composite
        s2 = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
              .filterBounds(aoi)
              .filterDate(current_start, current_end)
              .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", CLOUD_COVER_MAX))
              .map(mask_s2_clouds)
              .median())

        s2_vis = s2.select(["B4", "B3", "B2"]).visualize(min=0, max=3000)
        s2_map = s2_vis.getMapId()
        tiles["s2_true_color"] = s2_map["tile_fetcher"].url_format

        # NDVI visualization
        ndvi = s2.normalizedDifference(["B8", "B4"])
        ndvi_vis = ndvi.visualize(
            min=-0.2, max=0.8,
            palette=["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60", "#1a9850"]
        )
        ndvi_map = ndvi_vis.getMapId()
        tiles["ndvi"] = ndvi_map["tile_fetcher"].url_format

    except Exception as e:
        print(f"  Warning: S2 tile generation failed: {e}")

    try:
        # Sentinel-1 SAR composite
        s1 = (ee.ImageCollection("COPERNICUS/S1_GRD")
              .filterBounds(aoi)
              .filterDate(current_start, current_end)
              .filter(ee.Filter.eq("instrumentMode", "IW"))
              .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VH"))
              .select("VH")
              .median())

        s1_vis = s1.visualize(min=-25, max=-5)
        s1_map = s1_vis.getMapId()
        tiles["s1_sar"] = s1_map["tile_fetcher"].url_format

    except Exception as e:
        print(f"  Warning: S1 tile generation failed: {e}")

    return tiles


# ═══════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════

def run_pipeline():
    """Execute the full multi-sensor detection pipeline."""
    print("=" * 60)
    print("TERRA SENTINEL — Multi-Sensor Mining Detection Pipeline")
    print("=" * 60)

    authenticate_gee()

    now = datetime.utcnow()
    current_end = now.strftime("%Y-%m-%d")
    baseline_end = (now - timedelta(days=BASELINE_DAYS_AGO)).strftime("%Y-%m-%d")
    baseline_start = (now - timedelta(days=BASELINE_DAYS_AGO + BASELINE_WINDOW)).strftime("%Y-%m-%d")

    print(f"\nDate range — Current: last {CURRENT_DAYS} days ending {current_end}")
    print(f"Date range — Baseline: {baseline_start} to {baseline_end}")
    print(f"Regions to scan: {len(REGIONS)}\n")

    all_hotspots = []
    all_tiles = {}
    region_summaries = []

    for region in REGIONS:
        print(f"\n{'─' * 50}")
        print(f"Scanning: {region['name']} ({region['type']})")
        print(f"  Center: {region['lat']}, {region['lng']} | Radius: {region['radius_km']}km")

        aoi = make_aoi(region["lat"], region["lng"], region["radius_km"])

        # ── Sentinel-2 (Optical) ──
        print("  [1/3] Sentinel-2 optical analysis...")
        try:
            s2_det, s2_meta = detect_s2_changes(
                aoi, current_end, CURRENT_DAYS, baseline_start, baseline_end
            )
            s2_status = f"OK ({s2_meta['images_current']} current, {s2_meta['images_baseline']} baseline)" if s2_meta else "NO DATA (cloudy)"
        except Exception as e:
            s2_det, s2_meta = None, None
            s2_status = f"FAILED: {e}"
        print(f"        → {s2_status}")

        # ── Sentinel-1 (SAR) ──
        print("  [2/3] Sentinel-1 SAR radar analysis...")
        try:
            s1_det, s1_meta = detect_s1_changes(
                aoi, current_end, CURRENT_DAYS, baseline_start, baseline_end
            )
            s1_status = f"OK ({s1_meta['images_current']} current, {s1_meta['images_baseline']} baseline)" if s1_meta else "NO DATA"
        except Exception as e:
            s1_det, s1_meta = None, None
            s1_status = f"FAILED: {e}"
        print(f"        → {s1_status}")

        # ── Landsat 8/9 (Thermal) ──
        print("  [3/3] Landsat thermal analysis...")
        try:
            therm_det, therm_meta = detect_thermal_anomaly(aoi, current_end, CURRENT_DAYS * 2)
            therm_status = f"OK ({therm_meta['images_used']} images)" if therm_meta else "NO DATA"
        except Exception as e:
            therm_det, therm_meta = None, None
            therm_status = f"FAILED: {e}"
        print(f"        → {therm_status}")

        # ── FUSION ──
        print("  [FUSION] Combining sensor detections...")
        high, medium, low = fuse_detections(s2_det, s1_det, therm_det, aoi)

        high_pts = extract_hotspots(high, aoi, "high", 20)
        medium_pts = extract_hotspots(medium, aoi, "medium", 30)
        low_pts = extract_hotspots(low, aoi, "low", 15)

        region_total = len(high_pts) + len(medium_pts) + len(low_pts)
        print(f"  Results: {len(high_pts)} HIGH | {len(medium_pts)} MEDIUM | {len(low_pts)} LOW")

        # Tag with region info
        for pt in high_pts + medium_pts + low_pts:
            pt["region_id"] = region["id"]
            pt["region_name"] = region["name"]
            pt["mining_type"] = region["type"]
            pt["detected_at"] = current_end

        all_hotspots.extend(high_pts + medium_pts + low_pts)

        # Generate tile URLs for this region
        print("  Generating tile overlay URLs...")
        try:
            tiles = get_tile_urls(aoi, current_end, CURRENT_DAYS)
            for key, url in tiles.items():
                all_tiles[f"{region['id']}_{key}"] = {
                    "url": url,
                    "region_id": region["id"],
                    "region_name": region["name"],
                    "layer": key,
                }
        except Exception as e:
            print(f"  Warning: Tile generation failed: {e}")

        region_summaries.append({
            "id": region["id"],
            "name": region["name"],
            "type": region["type"],
            "detections": {"high": len(high_pts), "medium": len(medium_pts), "low": len(low_pts)},
            "sensors": {
                "sentinel2": s2_status,
                "sentinel1": s1_status,
                "landsat_thermal": therm_status,
            },
        })

    # ═══════════════════════════════════════════
    # OUTPUT FILES
    # ═══════════════════════════════════════════

    output_dir = os.path.join(os.path.dirname(__file__), "..", "public", "detections")
    os.makedirs(output_dir, exist_ok=True)

    # 1. GeoJSON hotspots
    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "generated_at": now.isoformat() + "Z",
            "pipeline_version": "1.0.0",
            "current_window_days": CURRENT_DAYS,
            "baseline_period": f"{baseline_start} to {baseline_end}",
            "total_detections": len(all_hotspots),
            "thresholds": {
                "ndvi_loss": NDVI_LOSS_THRESHOLD,
                "ndbi_increase": NDBI_INCREASE_THRESHOLD,
                "sar_change_db": SAR_CHANGE_DB,
                "thermal_anomaly_sigma": THERMAL_ANOMALY_K,
            },
        },
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [h["lng"], h["lat"]]},
                "properties": {
                    "confidence": h["confidence"],
                    "region_id": h["region_id"],
                    "region_name": h["region_name"],
                    "mining_type": h["mining_type"],
                    "detected_at": h["detected_at"],
                },
            }
            for h in all_hotspots
        ],
    }

    hotspots_path = os.path.join(output_dir, "hotspots.geojson")
    with open(hotspots_path, "w") as f:
        json.dump(geojson, f, indent=2)
    print(f"\nWrote {len(all_hotspots)} hotspots to {hotspots_path}")

    # 2. Tile URLs for dashboard overlay
    tiles_path = os.path.join(output_dir, "tile_urls.json")
    with open(tiles_path, "w") as f:
        json.dump({
            "generated_at": now.isoformat() + "Z",
            "tiles": all_tiles,
        }, f, indent=2)
    print(f"Wrote {len(all_tiles)} tile URLs to {tiles_path}")

    # 3. Region summary report
    report = {
        "generated_at": now.isoformat() + "Z",
        "regions": region_summaries,
        "totals": {
            "high": sum(r["detections"]["high"] for r in region_summaries),
            "medium": sum(r["detections"]["medium"] for r in region_summaries),
            "low": sum(r["detections"]["low"] for r in region_summaries),
        },
    }

    report_path = os.path.join(output_dir, "report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Wrote region report to {report_path}")

    # Print summary
    print(f"\n{'=' * 60}")
    print(f"PIPELINE COMPLETE")
    print(f"{'=' * 60}")
    print(f"Total detections: {len(all_hotspots)}")
    print(f"  HIGH confidence:   {report['totals']['high']}")
    print(f"  MEDIUM confidence: {report['totals']['medium']}")
    print(f"  LOW confidence:    {report['totals']['low']}")
    print(f"Tile overlays generated: {len(all_tiles)}")
    print(f"Output directory: {output_dir}")

    return len(all_hotspots)


if __name__ == "__main__":
    run_pipeline()
