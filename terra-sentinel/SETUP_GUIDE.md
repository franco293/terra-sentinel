# Terra Sentinel — Pipeline Setup Guide

## Architecture

```
GitHub Actions (weekly cron)
    │
    ▼
detect_mining.py (runs on GEE free tier)
    │
    ├── Sentinel-1 SAR → terrain change detection
    ├── Sentinel-2 MSI → NDVI/NDBI vegetation + soil
    └── Landsat 8/9 TIRS → thermal anomalies
    │
    ▼
Multi-Sensor Fusion (HIGH/MEDIUM/LOW confidence)
    │
    ▼
git commit → public/detections/hotspots.geojson
    │
    ▼
Vercel auto-deploys → Dashboard fetches static JSON
```

**Total cost: $0.** GEE free tier + GitHub Actions free tier + Vercel hobby tier.

---

## Step 1: Register for Google Earth Engine

1. Go to https://code.earthengine.google.com/register
2. Select **"Unpaid usage"** → **"Non-commercial"**
3. Create a **Cloud Project** (or use an existing one)
4. Wait for approval (usually instant for non-commercial)

## Step 2: Create a Service Account

1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Select your GEE project
3. Click **"+ CREATE SERVICE ACCOUNT"**
4. Name it `terra-sentinel-bot`
5. Grant role: **"Service Account User"**
6. Click **"DONE"**

## Step 3: Create a JSON Key

1. Click on the service account you just created
2. Go to the **"Keys"** tab
3. Click **"ADD KEY"** → **"Create new key"** → **JSON**
4. Download the JSON file — **keep it secret**

## Step 4: Register the Service Account with GEE

1. Go to https://code.earthengine.google.com/
2. Click **Assets** → **Scripts** → open the console
3. Run this in the GEE Code Editor console:
   ```
   // Not needed if using Cloud Project authentication
   ```
   
   OR register via command line:
   ```bash
   pip install earthengine-api
   earthengine authenticate --service-account-file=path/to/key.json
   ```

## Step 5: Add the Key to GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `GEE_SERVICE_ACCOUNT_KEY`
4. Value: **Paste the entire contents of the JSON key file**
5. Click **"Add secret"**

## Step 6: Enable GitHub Actions

1. Go to your repo → **Actions** tab
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. The workflow runs automatically every Monday at 06:00 UTC
4. To run manually: **Actions** → **Terra Sentinel** → **Run workflow**

## Step 7: Test Locally (Optional)

```bash
cd pipeline

# Set the environment variable
export GEE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Install deps
pip install -r requirements.txt

# Run
python detect_mining.py
```

Output will be written to `public/detections/`.

---

## Troubleshooting

**"GEE authentication failed"**
- Check the JSON key is valid and complete
- Make sure the service account is registered with EE
- Verify the Cloud Project has the Earth Engine API enabled

**"No data for region"**
- Some regions have heavy cloud cover — the pipeline falls back to Sentinel-1 SAR
- Increase `CURRENT_DAYS` in the script for a wider search window

**"GitHub Action fails"**
- Check Actions → select the failed run → see logs
- Most common: secret not set correctly (extra whitespace or truncated)

**"Vercel doesn't update"**
- The Action must successfully `git push` for Vercel to redeploy
- Check the Action logs for "No changes to commit" (means no new detections)
