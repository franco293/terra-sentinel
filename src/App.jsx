import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MONITORED_REGIONS, REGION_HISTORY, SATELLITE_SOURCES, AI_DETECTION_PIPELINE,
  ALERTS_FEED, MONTHLY_DATA, COST_CALCULATOR, AI_STACK,
  DETECTION_INDICES, TRAINING_DATASETS, ROADMAP, REVENUE_PLANS,
} from "./data.js";

/* ═══════════════════════════════════════
   TERRA SENTINEL v1.0
   ═══════════════════════════════════════ */

var T={bgPrimary:"#060d14",bgCard:"#0c1a28",bgHover:"#0f2030",bgInput:"#0a1520",
border:"#12283e",textPri:"#e0e8f0",textSec:"#8aa4be",textDim:"#4a6a8a",
accent:"#00d4aa",accentDim:"#00d4aa22",danger:"#ff2d55",warn:"#ffaa00",info:"#4488ff"};
var M="'JetBrains Mono',monospace",S="'Instrument Serif',Georgia,serif",F="'DM Sans',sans-serif";

function gd(o){var d=new Date();d.setDate(d.getDate()-(o||1));return d.toISOString().slice(0,10);}

/* ═════════════════════════════════════════════════════════
   TILE LAYERS — Every layer verified. Zero black tiles.
   
   KEY FIX: Each layer defines `nz` (maxNativeZoom).
   The MapContainer always allows zoom up to 21.
   Leaflet upscales past nz — you see pixels, never black.
   ═════════════════════════════════════════════════════════ */

var LAYERS=[
  // HI-RES — Crystal clear, max zoom
  {id:"google",n:"Google Satellite",c:"Hi-Res Optical",nz:21,
   u:function(){return"https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";},
   a:"Google",d:"Sub-meter clarity. Zoom in to see individual structures, equipment, and road tracks at mining sites."},
  {id:"google_h",n:"Google Hybrid",c:"Hi-Res Optical",nz:21,
   u:function(){return"https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";},
   a:"Google",d:"Satellite imagery with labels. Use for reports needing geographic context — roads, towns, rivers named."},
  {id:"esri",n:"ESRI World Imagery",c:"Hi-Res Optical",nz:19,
   u:function(){return"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";},
   a:"Esri, Maxar, Earthstar",d:"Different capture dates than Google. Compare both to detect recent terrain changes."},
  {id:"esri_c",n:"ESRI Clarity Beta",c:"Hi-Res Optical",nz:19,
   u:function(){return"https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";},
   a:"Esri Clarity",d:"Enhanced contrast processing. Subtle soil colour differences become more visible for excavation detection."},

  // SENTINEL-2 CLOUDLESS — Real S2 data, cloud-free global mosaics by year
  {id:"s2_2024",n:"Sentinel-2 Cloudless 2024",c:"Sentinel-2 (10m)",nz:14,
   u:function(){return"https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg";},
   a:"Sentinel-2 cloudless \u00a9 EOX CC BY 4.0",d:"Latest annual mosaic from ESA Sentinel-2. 10m resolution. Your primary current-state reference."},
  {id:"s2_2023",n:"Sentinel-2 Cloudless 2023",c:"Sentinel-2 (10m)",nz:14,
   u:function(){return"https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg";},
   a:"Sentinel-2 cloudless \u00a9 EOX CC BY 4.0",d:"One year ago. Compare with 2024 to show 12 months of mining expansion as evidence."},
  {id:"s2_2021",n:"Sentinel-2 Cloudless 2021",c:"Sentinel-2 (10m)",nz:14,
   u:function(){return"https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg";},
   a:"Sentinel-2 cloudless \u00a9 EOX CC BY 4.0",d:"Three-year baseline. Many illegal mining expansions began after 2021."},
  {id:"s2_2019",n:"Sentinel-2 Cloudless 2019",c:"Sentinel-2 (10m)",nz:14,
   u:function(){return"https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2019_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg";},
   a:"Sentinel-2 cloudless \u00a9 EOX CC BY 4.0",d:"Five-year baseline. Pre-pandemic state — compare against 2024 for 5 years of change evidence."},
  {id:"s2_2018",n:"Sentinel-2 Cloudless 2018",c:"Sentinel-2 (10m)",nz:14,
   u:function(){return"https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2018_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg";},
   a:"Sentinel-2 cloudless \u00a9 EOX CC BY 4.0",d:"Six-year baseline. Many sites were untouched forest in 2018. Powerful before/after proof."},

  // DAILY GLOBAL — guaranteed fresh, every day
  {id:"viirs",n:"VIIRS Daily",c:"Daily Global (250m)",nz:9,
   u:function(dt){return"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/"+dt+"/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg";},
   a:"NASA GIBS | VIIRS",d:"Yesterday\u2019s satellite view at 250m. Updated every 24h. Spot rapid overnight clearing activity."},
  {id:"modis_t",n:"MODIS Terra Daily",c:"Daily Global (250m)",nz:9,
   u:function(dt){return"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/"+dt+"/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg";},
   a:"NASA GIBS | Terra",d:"Morning pass (10:30AM local). 250m. Compare with Aqua afternoon for dual daily coverage."},
  {id:"modis_a",n:"MODIS Aqua Daily",c:"Daily Global (250m)",nz:9,
   u:function(dt){return"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/"+dt+"/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg";},
   a:"NASA GIBS | Aqua",d:"Afternoon pass. Different cloud patterns — doubles your chance of a clear daily view."},

  // FALSE COLOR — Mining detection bands
  {id:"bare",n:"Bare Soil / Fire (7-2-1)",c:"Analysis Bands",nz:9,
   u:function(dt){return"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_Bands721/default/"+dt+"/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg";},
   a:"NASA GIBS | MODIS SWIR",d:"Excavated soil = CYAN, vegetation = GREEN, water = BLACK, fire = RED. The #1 false-color layer for mining detection."},
  {id:"veg",n:"Vegetation & Water (3-6-7)",c:"Analysis Bands",nz:9,
   u:function(dt){return"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_Bands367/default/"+dt+"/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg";},
   a:"NASA GIBS | MODIS Blue-SWIR",d:"Healthy vegetation = BRIGHT GREEN, cleared ground = TAN, water = BLUE. Tracks deforestation and water pollution from mining."},

  // REFERENCE
  {id:"osm",n:"OpenStreetMap",c:"Reference",nz:19,
   u:function(){return"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";},
   a:"\u00a9 OpenStreetMap",d:"Roads, rivers, borders, place names. Essential geographic context."},
  {id:"dark",n:"Dark Basemap",c:"Reference",nz:19,
   u:function(){return"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";},
   a:"\u00a9 CartoDB",d:"Minimal dark map. Clean presentation backdrop."},
  {id:"topo",n:"Topographic",c:"Reference",nz:17,
   u:function(){return"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";},
   a:"OpenTopoMap",d:"Elevation contours, terrain shading. Shows valleys, ridges, water drainage around mining sites."},
];

/* Sentinel/Landsat analysis — embedded in iframe */
function eoUrl(mode,lat,lng){
  var t=gd(0),f=gd(60);
  var b="https://apps.sentinel-hub.com/eo-browser/?zoom=13&lat="+lat+"&lng="+lng+"&fromTime="+f+"T00:00:00.000Z&toTime="+t+"T23:59:59.999Z&themeId=DEFAULT-THEME";
  var m={s2:b+"&datasetId=S2L2A&layerId=1_TRUE_COLOR",s2f:b+"&datasetId=S2L2A&layerId=2_FALSE_COLOR",
    ndvi:b+"&datasetId=S2L2A&layerId=3_NDVI",ndwi:b+"&datasetId=S2L2A&layerId=5_NDWI",moist:b+"&datasetId=S2L2A&layerId=4_MOISTURE_INDEX",
    sar:b+"&datasetId=S1GRD&layerId=1_TRUE_COLOR",l8:b+"&datasetId=AWS_LOTL2&layerId=1_TRUE_COLOR",therm:b+"&datasetId=AWS_LOTL2&layerId=4_THERMAL"};
  return m[mode]||b;
}

var SMODES=[
  {id:"s2",nm:"Sentinel-2 True Color",ic:"\ud83d\udef0\ufe0f",col:"#a855f7",sat:"Sentinel-2 MSI",res:"10m",d:"Crystal clear 10m optical. Best free high-res source for identifying mining pits, roads, and equipment."},
  {id:"s2f",nm:"Sentinel-2 False Color",ic:"\ud83d\udd34",col:"#ef4444",sat:"Sentinel-2 MSI",res:"10m",d:"Vegetation = RED, bare soil = GREY/CYAN. Cleared mining areas pop out immediately against red forest."},
  {id:"ndvi",nm:"NDVI Vegetation Health",ic:"\ud83c\udf3f",col:"#22c55e",sat:"Sentinel-2 MSI",res:"10m",d:"Green = healthy vegetation, Brown = stressed/cleared. Quantitative proof of mining-driven deforestation."},
  {id:"ndwi",nm:"NDWI Water Detection",ic:"\ud83d\udca7",col:"#3b82f6",sat:"Sentinel-2 MSI",res:"10m",d:"Water bodies, tailings ponds, turbid rivers. Monitors contamination spreading downstream from mining."},
  {id:"moist",nm:"Moisture Index",ic:"\ud83c\udf0a",col:"#06b6d4",sat:"Sentinel-2 MSI",res:"20m",d:"Detects wet areas from hydraulic mining operations and drainage pattern changes."},
  {id:"sar",nm:"Sentinel-1 SAR Radar",ic:"\ud83d\udce1",col:T.warn,sat:"Sentinel-1 C-SAR",res:"10m",d:"Radar penetrates clouds and works at NIGHT. Sees terrain, equipment, structures through any weather. Essential for tropical regions."},
  {id:"l8",nm:"Landsat 8/9",ic:"\ud83c\udf0d",col:T.info,sat:"Landsat OLI",res:"30m",d:"30m with 50-year archive. Historical baselines going back to the 1970s for long-term change evidence."},
  {id:"therm",nm:"Landsat Thermal",ic:"\ud83d\udd25",col:T.danger,sat:"Landsat TIRS",res:"100m",d:"Heat signatures from machinery, smelting, burning. Visible through vegetation canopy, day and night."},
];

/* ── COMPONENTS ── */

function MapEvents({onMove}){
  useMapEvents({moveend:function(e){var m=e.target;onMove({z:m.getZoom(),lat:m.getCenter().lat.toFixed(4),lng:m.getCenter().lng.toFixed(4)});},
    zoomend:function(e){var m=e.target;onMove({z:m.getZoom(),lat:m.getCenter().lat.toFixed(4),lng:m.getCenter().lng.toFixed(4)});}});
  return null;
}

function FlyTo({center,zoom}){var map=useMap();
  useEffect(function(){if(center)map.flyTo(center,zoom||10,{duration:1.2});},[center,zoom,map]);
  return null;
}

function mkIcon(st){var c=st==="critical"?"#ff2d55":st==="warning"?"#ffaa00":"#00d4aa";
  return L.divIcon({className:"",iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-16],
    html:'<div style="width:28px;height:28px;border-radius:50%;background:'+c+'18;border:2px solid '+c+';display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px '+c+'44,0 0 6px '+c+'"><div style="width:10px;height:10px;border-radius:50%;background:'+c+'"></div></div>'});}

function Spark({data,color,h}){h=h||28;var mx=Math.max.apply(null,data),mn=Math.min.apply(null,data),r=mx-mn||1;
  var p=data.map(function(v,i){return((i/(data.length-1))*100)+","+(h-((v-mn)/r)*(h-4)-2);}).join(" ");
  return React.createElement("svg",{viewBox:"0 0 100 "+h,style:{width:"100%",height:h},preserveAspectRatio:"none"},
    React.createElement("polyline",{points:p,fill:"none",stroke:color,strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}));}

function Bars({data,mx}){return(<div style={{display:"flex",alignItems:"flex-end",gap:6,height:110,padding:"0 4px"}}>
  {data.map(function(d,i){return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
    <span style={{fontSize:10,color:T.textDim,fontFamily:M}}>{d.v}</span>
    <div style={{width:"100%",borderRadius:"3px 3px 0 0",height:Math.max(4,(d.v/mx)*90)+"px",background:d.c||T.accent,opacity:0.85}}/>
    <span style={{fontSize:9,color:T.textDim,fontFamily:M}}>{d.l}</span></div>)})}</div>);}

function Num({n}){var s=useState(0),v=s[0],set=s[1];
  useEffect(function(){var c=0,st=n/60;var t=setInterval(function(){c+=st;if(c>=n){set(n);clearInterval(t);}else set(Math.floor(c));},16);return function(){clearInterval(t);};},[n]);return v.toLocaleString();}

function Bdg({s}){var m={critical:["#ff2d55","#ff2d5518","#ff2d5544"],warning:["#ffaa00","#ffaa0018","#ffaa0044"],monitoring:["#00d4aa","#00d4aa18","#00d4aa44"],info:["#4488ff","#4488ff18","#4488ff44"]};
  var x=m[s]||m.info;return <span style={{padding:"3px 10px",borderRadius:4,fontSize:9,fontWeight:700,letterSpacing:"0.06em",background:x[1],color:x[0],border:"1px solid "+x[2],textTransform:"uppercase",fontFamily:M}}>{s}</span>;}

function Mtr({v}){var c=v>=90?"#00d4aa":v>=80?"#ffaa00":"#ff6b35";
  return(<div style={{display:"flex",alignItems:"center",gap:6}}><div style={{flex:1,height:5,background:"#1a2a3a",borderRadius:3,overflow:"hidden"}}>
    <div style={{width:v+"%",height:"100%",background:c,borderRadius:3}}/></div>
    <span style={{fontSize:11,fontFamily:M,color:c,fontWeight:700}}>{v}%</span></div>);}

var Lbl=function({children}){return <div style={{fontSize:10,color:T.textDim,fontFamily:M,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{children}</div>;};
var Crd=function({children,style}){return <div style={Object.assign({background:T.bgCard,border:"1px solid "+T.border,borderRadius:10,padding:16},style||{})}>{children}</div>;};
var Btn=function({children,active,onClick,style}){return <button onClick={onClick} style={Object.assign({padding:"7px 14px",borderRadius:6,fontFamily:M,fontSize:10,fontWeight:700,cursor:"pointer",transition:"all 0.15s",background:active?T.accentDim:"transparent",border:active?"1px solid "+T.accent:"1px solid "+T.border,color:active?T.accent:T.textSec},style||{})}>{children}</button>;};

/* ═══════════════════════════════════════
   SATELLITE MAP — Proper zoom handling
   
   MapContainer: maxZoom=21 (FIXED, never changes)
   TileLayer: maxNativeZoom=nz, maxZoom=21
   Result: Leaflet upscales past nz. Never black.
   ═══════════════════════════════════════ */

function SatMap({regions,sel,onSel,h,z,lid,date,showInfo,onMapMove}){
  h=h||480;z=z||3;lid=lid||"google";
  var cn=sel?[sel.lat,sel.lng]:[0,10];
  var md=date||gd(1);

  return(
    <MapContainer center={cn} zoom={z} maxZoom={21} minZoom={2}
      style={{width:"100%",height:h,borderRadius:10,border:"1px solid "+T.border}}
      scrollWheelZoom={true} zoomControl={true} doubleClickZoom={true} zoomSnap={0.5} zoomDelta={0.5}>
      <FlyTo center={cn} zoom={sel?Math.max(z,8):z}/>
      {onMapMove&&<MapEvents onMove={onMapMove}/>}

      {/* Single active tile layer — maxNativeZoom enables upscaling past native res */}
      <TileLayer key={lid} url={(LAYERS.find(function(ly){return ly.id===lid;})||LAYERS[0]).u(md)}
        attribution={(LAYERS.find(function(ly){return ly.id===lid;})||LAYERS[0]).a}
        maxNativeZoom={(LAYERS.find(function(ly){return ly.id===lid;})||LAYERS[0]).nz}
        maxZoom={21}/>

      {regions&&regions.map(function(r){return(
        <Marker key={r.id} position={[r.lat,r.lng]} icon={mkIcon(r.status)}
          eventHandlers={{click:function(){if(onSel)onSel(r);}}}>
          <Popup maxWidth={280}><div style={{fontFamily:F,fontSize:12,lineHeight:1.7,minWidth:220}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{r.name}</div>
            <span style={{color:r.status==="critical"?"#ff2d55":r.status==="warning"?"#cc8800":"#009977",fontWeight:700,textTransform:"uppercase",fontSize:10,background:r.status==="critical"?"#ff2d5515":"#00d4aa15",padding:"2px 6px",borderRadius:3}}>{r.status}</span>
            <div style={{marginTop:6}}>
              <div>Alerts: <strong>{r.alerts}</strong> | Confidence: <strong>{r.confidence}%</strong></div>
              <div>Type: {r.type}</div>
              <div>Area: {r.area}</div>
              {r.ndviDelta!=null&&<div style={{marginTop:4,borderTop:"1px solid #eee",paddingTop:4}}>
                {"\u0394"}NDVI: <strong style={{color:"#cc3333"}}>{r.ndviDelta}</strong> | Heat: <strong>{r.heatAnomaly}{"\u00b0C"}</strong><br/>
                Veg Loss: <strong>{r.vegetationLossHa}ha</strong> | Turbidity: <strong>{r.waterTurbidityRise}</strong></div>}
            </div>
          </div></Popup>
          {r.status==="critical"&&<Circle center={[r.lat,r.lng]} radius={50000}
            pathOptions={{color:"#ff2d55",fillColor:"#ff2d55",fillOpacity:0.05,weight:1,dashArray:"6 4"}}/>}
        </Marker>);})}
    </MapContainer>);
}

/* ═══════════════════════════
   IMAGERY LAB
   ═══════════════════════════ */

function ImageryLab({sel,setSel}){
  var _l=useState("google"),lid=_l[0],sL=_l[1];
  var _d=useState(1),doff=_d[0],sD=_d[1];
  var _v=useState("map"),vw=_v[0],sV=_v[1];
  var _am=useState(null),am=_am[0],sAM=_am[1];
  var _mi=useState({z:3,lat:"0.0000",lng:"0.0000"}),mi=_mi[0],sMi=_mi[1];
  var rg=sel||MONITORED_REGIONS[0];
  var md=gd(doff);
  var act=LAYERS.find(function(l){return l.id===lid;})||LAYERS[0];
  var cats=[...new Set(LAYERS.map(function(t){return t.c;}))];

  return(<div style={{paddingTop:16}}>
    {/* Region pills */}
    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
      {MONITORED_REGIONS.map(function(r){return(
        <button key={r.id} onClick={function(){setSel(r);}} style={{
          padding:"5px 12px",borderRadius:20,fontFamily:M,fontSize:9,fontWeight:600,cursor:"pointer",
          background:rg.id===r.id?T.accentDim:T.bgInput,
          border:rg.id===r.id?"1px solid "+T.accent:"1px solid "+T.border,
          color:rg.id===r.id?T.accent:T.textDim}}>
          {r.status==="critical"&&<span style={{color:T.danger,marginRight:3}}>{"\u25cf"}</span>}
          {r.name.split(",")[0]}</button>);})}
    </div>

    {/* View mode tabs */}
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      {[{id:"map",lb:"Map Viewer",sub:LAYERS.length+" layers \u2022 Full zoom"},
        {id:"sentinel",lb:"Sentinel Analysis",sub:"S1 SAR \u2022 S2 \u2022 Landsat \u2022 NDVI"},
        {id:"tools",lb:"Intelligence Tools",sub:"GEE \u2022 FIRMS \u2022 Worldview"}
      ].map(function(m){return(
        <button key={m.id} onClick={function(){sV(m.id);sAM(null);}} style={{
          flex:1,padding:"12px 16px",borderRadius:8,textAlign:"left",cursor:"pointer",transition:"all 0.15s",
          background:vw===m.id?"linear-gradient(135deg,"+T.accentDim+","+T.bgCard+")":T.bgCard,
          border:vw===m.id?"1px solid "+T.accent:"1px solid "+T.border,color:vw===m.id?T.accent:T.textSec,fontFamily:M,fontSize:11,fontWeight:700}}>
          <div>{m.lb}</div>
          <div style={{fontSize:9,fontWeight:400,color:T.textDim,marginTop:3}}>{m.sub}</div>
        </button>);})}
    </div>

    {/* ═══ MAP VIEW ═══ */}
    {vw==="map"&&(<div>
      {/* Custom layer switcher */}
      {cats.map(function(cat){
        var items=LAYERS.filter(function(t){return t.c===cat;});
        return(<div key={cat} style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <span style={{fontSize:9,color:T.textDim,fontFamily:M,minWidth:110,fontWeight:600}}>{cat}</span>
          {items.map(function(t){var on=t.id===lid;return(
            <Btn key={t.id} active={on} onClick={function(){sL(t.id);}}>
              {t.n.replace("Sentinel-2 Cloudless ","S2 ").replace("Google ","G/").replace("MODIS ","").replace("VIIRS ","V/").replace("ESRI ","E/")}</Btn>);})}
        </div>);})}

      {/* Date slider for daily/analysis layers */}
      {(act.c.includes("Daily")||act.c.includes("Analysis"))&&(
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"8px 0 10px",background:T.bgInput,borderRadius:8,padding:"8px 14px",border:"1px solid "+T.border}}>
          <Lbl style={{marginBottom:0}}>Date</Lbl>
          <input type="range" min={1} max={30} value={doff} onChange={function(e){sD(Number(e.target.value));}} style={{flex:1,accentColor:T.accent}}/>
          <span style={{fontFamily:M,fontSize:12,color:T.accent,fontWeight:600}}>{md}</span>
        </div>)}

      {/* Map */}
      <Crd style={{padding:8,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,padding:"0 4px"}}>
          <div>
            <span style={{fontSize:14,fontWeight:700}}>{act.n}</span>
            <span style={{fontSize:10,color:T.textDim,marginLeft:10}}>Zoom: <strong style={{color:T.accent}}>{mi.z}</strong></span>
            <span style={{fontSize:10,color:T.textDim,marginLeft:10}}>{mi.lat}{"\u00b0"}, {mi.lng}{"\u00b0"}</span>
          </div>
          <span style={{fontSize:9,fontFamily:M,color:T.info,background:T.info+"15",padding:"3px 10px",borderRadius:4,fontWeight:600}}>
            {act.c} | Native zoom: {act.nz} | Max: 21</span>
        </div>
        <SatMap regions={MONITORED_REGIONS} sel={rg} onSel={setSel}
          h={520} z={10} lid={lid} date={md} showInfo={true} onMapMove={sMi}/>
      </Crd>

      {/* Layer description */}
      <div style={{fontSize:11,color:T.textSec,lineHeight:1.6,padding:"10px 14px",background:T.bgInput,borderRadius:8,border:"1px solid "+T.border}}>
        <strong style={{color:T.accent}}>{act.n}:</strong> {act.d}
        {act.nz<15&&<span style={{color:T.textDim}}> This layer\u2019s native resolution is zoom {act.nz}. Zooming further will upscale (pixelate). Switch to Google or ESRI for max clarity at high zoom.</span>}
      </div>
    </div>)}

    {/* ═══ SENTINEL ANALYSIS ═══ */}
    {vw==="sentinel"&&!am&&(<div>
      <Crd style={{marginBottom:14,background:"linear-gradient(135deg,#0c1a2888,#1a103888)",borderColor:"#a855f744"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:52,height:52,borderRadius:12,background:"linear-gradient(135deg,#a855f7,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{"\ud83d\udef0\ufe0f"}</div>
          <div>
            <div style={{fontFamily:S,fontSize:20}}>Sentinel & Landsat Analysis</div>
            <div style={{fontSize:11,color:T.textSec,marginTop:3}}>Full-resolution Sentinel-1 SAR, Sentinel-2 optical, Landsat thermal — embedded directly below. Each tool loads pre-configured for <strong style={{color:T.accent}}>{rg.name}</strong>.</div>
          </div></div>
      </Crd>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
        {SMODES.map(function(m){return(
          <div key={m.id} onClick={function(){sAM(m.id);}} style={{
            background:T.bgCard,border:"1px solid "+T.border,borderRadius:10,padding:16,cursor:"pointer",
            borderLeft:"4px solid "+m.col,transition:"all 0.15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:22}}>{m.ic}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700}}>{m.nm}</div>
                <div style={{fontSize:9,fontFamily:M,color:m.col}}>{m.sat} {"\u2022"} {m.res}</div></div>
              <div style={{width:36,height:36,borderRadius:8,background:m.col+"12",border:"1px solid "+m.col+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:m.col}}>{"\u2192"}</div>
            </div>
            <div style={{fontSize:11,color:T.textSec,lineHeight:1.5}}>{m.d}</div>
          </div>);})}
      </div>
    </div>)}

    {/* Sentinel embedded viewer */}
    {vw==="sentinel"&&am&&(function(){
      var m=SMODES.find(function(x){return x.id===am;})||SMODES[0];
      var url=eoUrl(am,rg.lat,rg.lng);
      return(<div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={function(){sAM(null);}} style={{padding:"8px 14px",borderRadius:6,background:T.bgInput,border:"1px solid "+T.border,color:T.textSec,cursor:"pointer",fontFamily:M,fontSize:11,fontWeight:600}}>{"\u2190"} Back</button>
          <span style={{fontSize:20}}>{m.ic}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700}}>{m.nm}</div>
            <div style={{fontSize:10,color:m.col,fontFamily:M}}>{m.sat} {"\u2022"} {m.res} {"\u2022"} {rg.name}</div></div>
          <a href={url} target="_blank" rel="noreferrer" style={{padding:"8px 16px",borderRadius:6,background:m.col,color:"#fff",fontFamily:M,fontSize:11,fontWeight:700,textDecoration:"none"}}>Full Screen {"\u2192"}</a>
        </div>
        <div style={{borderRadius:10,overflow:"hidden",border:"2px solid "+m.col+"33",background:"#000"}}>
          <iframe src={url} style={{width:"100%",height:600,border:"none"}} title={m.nm} allow="fullscreen"/>
        </div>
        <div style={{fontSize:11,color:T.textSec,marginTop:10,lineHeight:1.6,padding:"10px 14px",background:T.bgInput,borderRadius:8}}>
          <strong style={{color:m.col}}>Reading this data:</strong> {m.d}
          <br/><span style={{color:T.textDim}}>Use the date picker inside the viewer to select cloud-free dates. The viewer auto-selects the most recent available imagery for this location.</span>
        </div>
      </div>);
    })()}

    {/* ═══ TOOLS ═══ */}
    {vw==="tools"&&(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:10}}>
      {[
        {n:"Google Earth Engine Timelapse",u:"https://earthengine.google.com/timelapse/#center="+rg.lat+","+rg.lng+",11",c:T.warn,ic:"\u23f1\ufe0f",d:"40+ years of mining expansion animated. The single most powerful free tool for demonstrating illegal mining growth to clients and regulators."},
        {n:"NASA Worldview",u:"https://worldview.earthdata.nasa.gov/?v="+(rg.lng-2)+","+(rg.lat-2)+","+(rg.lng+2)+","+(rg.lat+2)+"&t="+gd(1),c:"#22c55e",ic:"\ud83c\udf0d",d:"1000+ NASA imagery layers. Download snapshots, compare dates, overlay fire data. Professional-grade evidence collection."},
        {n:"NASA FIRMS Fire Detection",u:"https://firms.modaps.eosdis.nasa.gov/map/#d:today;@"+rg.lng+","+rg.lat+",10z",c:T.danger,ic:"\ud83d\udd25",d:"Real-time fire and thermal anomaly alerts. Illegal miners burn vegetation for clearing. Shows hotspots from the last 24 hours."},
        {n:"Global Forest Watch",u:"https://www.globalforestwatch.org/map/?menu=eyJkYXRhc2V0Q2F0ZWdvcnkiOiIiLCJtZW51U2VjdGlvbiI6IiJ9",c:"#16a34a",ic:"\ud83c\udf32",d:"Weekly deforestation alerts from Landsat. Shows which areas lost tree cover recently. Mining is a top driver of tropical deforestation."},
        {n:"Copernicus Browser",u:"https://browser.dataspace.copernicus.eu/?zoom=11&lat="+rg.lat+"&lng="+rg.lng,c:"#3b82f6",ic:"\ud83c\udf10",d:"ESA\u2019s official Copernicus data portal. Download full Sentinel-1/2/3 datasets. Custom processing and GeoTIFF export."},
        {n:"Sentinel Hub EO Browser",u:eoUrl("s2",rg.lat,rg.lng),c:"#a855f7",ic:"\ud83d\udef0\ufe0f",d:"The industry-standard satellite viewer. Full Sentinel, Landsat, MODIS. Custom scripting, time-series analysis, and data export."},
      ].map(function(t){return(
        <a key={t.n} href={t.u} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
          <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:10,padding:18,
            borderLeft:"4px solid "+t.c,height:"100%",transition:"border-color 0.2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:26}}>{t.ic}</span>
              <div style={{fontSize:15,fontWeight:700,flex:1}}>{t.n}</div>
              <span style={{fontSize:12,fontFamily:M,color:t.c}}>{"\u2192"}</span></div>
            <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>{t.d}</div>
          </div></a>);})}
    </div>)}
  </div>);
}

/* ═══════════ OVERVIEW ═══════════ */

function Overview({sel,setSel}){
  return(<div style={{paddingTop:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:16}}>
      {[{l:"Active Alerts",n:144,c:T.danger,d:[89,112,98,134,156,171],s:""},
        {l:"Area Monitored",n:28700,c:T.info,d:[18,21,23,25,27,28.7],s:" km\u00b2"},
        {l:"Detection Rate",n:94,c:T.accent,d:[88,89,91,92,93,94],s:"%"},
        {l:"Regions",n:9,c:T.warn,d:[3,4,5,6,7,9],s:""}
      ].map(function(x,i){return(<Crd key={i}><Lbl>{x.l}</Lbl>
        <div style={{fontSize:28,fontWeight:700,color:x.c,fontFamily:M,lineHeight:1,margin:"8px 0"}}><Num n={x.n}/>{x.s}</div>
        <Spark data={x.d} color={x.c}/></Crd>);})}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:12,marginBottom:16}}>
      <Crd style={{padding:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <Lbl>Global Monitoring Grid</Lbl>
          <span style={{fontSize:10,color:T.accent,fontFamily:M}}>{"\u25cf"} LIVE</span></div>
        <SatMap regions={MONITORED_REGIONS} sel={sel} onSel={setSel} h={420} z={2} lid="google"/>
      </Crd>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {sel&&(<Crd style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:10}}>
            <div><div style={{fontFamily:S,fontSize:17}}>{sel.name}</div>
              <div style={{fontSize:10,color:T.textDim,fontFamily:M,marginTop:3}}>{sel.type}</div></div>
            <Bdg s={sel.status}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            {[{l:"Alerts",v:sel.alerts},{l:"Area",v:sel.area},{l:"Scanned",v:sel.lastScan},{l:"Change",v:sel.change}].map(function(x,i){return(
              <div key={i} style={{background:T.bgInput,borderRadius:6,padding:8}}>
                <div style={{fontSize:8,color:T.textDim,fontFamily:M,textTransform:"uppercase"}}>{x.l}</div>
                <div style={{fontSize:14,fontWeight:600,fontFamily:M,marginTop:2}}>{x.v}</div></div>);})}
          </div>
          {sel.ndviDelta!=null&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontSize:10,marginBottom:10}}>
              <span>{"\u0394"}NDVI: <strong style={{color:T.danger}}>{sel.ndviDelta}</strong></span>
              <span>Heat: <strong style={{color:T.warn}}>{sel.heatAnomaly}{"\u00b0C"}</strong></span>
              <span>Veg Loss: <strong style={{color:T.danger}}>{sel.vegetationLossHa}ha</strong></span>
              <span>Turbidity: <strong style={{color:T.warn}}>{sel.waterTurbidityRise}</strong></span></div>)}
          <Lbl>AI Confidence</Lbl><div style={{marginTop:4}}><Mtr v={sel.confidence}/></div>
        </Crd>)}
        <Crd><Lbl>Latest Detections</Lbl><div style={{marginTop:6}}>
          {ALERTS_FEED.slice(0,4).map(function(a){return(
            <div key={a.id} style={{padding:"6px 0",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:a.severity==="critical"?T.danger:a.severity==="warning"?T.warn:T.info,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.desc}</div>
                <div style={{fontSize:9,color:T.textDim,fontFamily:M}}>{a.time} {"\u2022"} {a.sat}</div></div></div>)})}</div></Crd>
      </div>
    </div>

    <Crd><Lbl>6-Month Detection Trend</Lbl><div style={{marginTop:10}}>
      <Bars data={MONTHLY_DATA.map(function(d){return{l:d.month,v:d.alerts,c:T.accent};})} mx={200}/></div>
      <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:12}}>
        {[{l:"Total Alerts",v:"760",c:T.accent},{l:"Confirmed",v:"570",c:T.warn},{l:"Disturbed",v:"1,178 ha",c:T.danger}].map(function(x,i){return(
          <div key={i} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:x.c,fontFamily:M}}>{x.v}</div>
            <div style={{fontSize:9,color:T.textDim,fontFamily:M}}>{x.l}</div></div>)})}</div></Crd>
  </div>);
}

/* ═══════════ DATA TABS ═══════════ */

function SatsTab(){var _f=useState("all"),f=_f[0],sF=_f[1];
  var ls=f==="all"?SATELLITE_SOURCES:SATELLITE_SOURCES.filter(function(s){return s.tier===f;});
  return(<div style={{paddingTop:16}}>
    <div style={{display:"flex",gap:8,marginBottom:16}}>{["all","free","paid"].map(function(v){return(
      <Btn key={v} active={f===v} onClick={function(){sF(v);}}>{v.toUpperCase()} ({v==="all"?SATELLITE_SOURCES.length:SATELLITE_SOURCES.filter(function(s){return s.tier===v;}).length})</Btn>)})}</div>
    <div style={{display:"grid",gap:8}}>{ls.map(function(s,i){return(
      <div key={i} style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:10,padding:16,display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",gap:10}}>
        <div><div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{s.name}</div>
          <span style={{fontSize:9,padding:"2px 8px",borderRadius:4,display:"inline-block",background:s.tier==="free"?"#00d4aa15":"#ffaa0015",color:s.tier==="free"?"#00d4aa":"#ffaa00",fontFamily:M,fontWeight:700,textTransform:"uppercase",border:"1px solid "+(s.tier==="free"?"#00d4aa33":"#ffaa0033")}}>{s.tier}</span>
          <div style={{fontSize:10,color:T.textSec,marginTop:6}}>{s.provider}</div></div>
        <div><Lbl>Resolution</Lbl>
          <div style={{fontFamily:M,fontWeight:700,fontSize:14,color:s.resolution.includes("0.")?T.accent:T.textPri,marginTop:4}}>{s.resolution}</div>
          <Lbl style={{marginTop:8}}>Revisit</Lbl>
          <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{s.revisit}</div></div>
        <div><Lbl>Cost</Lbl>
          <div style={{fontFamily:M,fontWeight:700,fontSize:12,color:s.cost==="Free"?T.accent:T.warn,marginTop:4}}>{s.cost}</div>
          <div style={{fontSize:9,color:T.textDim,marginTop:8,lineHeight:1.4}}>{s.bestFor}</div></div>
      </div>)})}</div></div>);}

function AITab(){return(<div style={{paddingTop:16}}>
  <div style={{display:"grid",gap:8,marginBottom:20}}>{AI_DETECTION_PIPELINE.map(function(s,i){return(
    <div key={i} style={{display:"flex",gap:14,alignItems:"center",background:T.bgCard,border:"1px solid "+T.border,borderRadius:10,padding:16}}>
      <div style={{width:48,height:48,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,"+T.accentDim+",transparent)",border:"1px solid "+T.accent,fontSize:22,flexShrink:0}}>{s.icon}</div>
      <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontFamily:M,fontSize:10,color:T.accent,fontWeight:700}}>STEP {s.step}</span>
        <span style={{fontWeight:700,fontSize:15}}>{s.name}</span></div>
        <div style={{fontSize:12,color:T.textSec,marginTop:3}}>{s.desc}</div></div></div>)})}</div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:12}}>
    <Crd><div style={{fontFamily:S,fontSize:17,marginBottom:12}}>Free AI/ML Stack</div>
      {AI_STACK.map(function(t,i){return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+T.border}}>
        <span style={{fontFamily:M,fontSize:11,fontWeight:600,color:T.accent}}>{t.tool}</span>
        <span style={{fontSize:10,color:T.textDim}}>{t.use}</span></div>)})}</Crd>
    <Crd><div style={{fontFamily:S,fontSize:17,marginBottom:12}}>Detection Indices</div>
      {DETECTION_INDICES.map(function(t,i){return(<div key={i} style={{padding:"6px 0",borderBottom:"1px solid "+T.border}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:M,fontSize:11,fontWeight:700,color:T.warn}}>{t.index}</span>
          <span style={{fontSize:9,color:T.textDim,fontFamily:M}}>{t.formula}</span></div>
        <div style={{fontSize:10,color:T.textSec,marginTop:2}}>{t.use}</div></div>)})}</Crd></div></div>);}

function AlertsTab(){return(<div style={{paddingTop:16}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
    <div style={{fontFamily:S,fontSize:20}}>Live Alert Feed</div>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:T.danger,animation:"pulse 1.5s infinite"}}/>
      <span style={{fontFamily:M,fontSize:10,color:T.danger,fontWeight:600}}>LIVE</span></div></div>
  <div style={{display:"grid",gap:8}}>{ALERTS_FEED.map(function(a,i){return(
    <Crd key={i} style={{borderLeft:"4px solid "+(a.severity==="critical"?T.danger:a.severity==="warning"?T.warn:T.info),
      borderColor:a.severity==="critical"?"#ff2d5525":a.severity==="warning"?"#ffaa0025":T.border}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontFamily:M,fontSize:10,color:T.textDim}}>{a.id}</span><Bdg s={a.severity}/>
          <span style={{fontSize:10,color:T.textDim,fontFamily:M}}>{a.region}</span></div>
        <span style={{fontSize:10,color:T.textDim,fontFamily:M}}>{a.time}</span></div>
      <div style={{fontSize:12,lineHeight:1.5,marginBottom:8}}>{a.desc}</div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:9,fontFamily:M,color:T.textDim}}>
        <span>CONF <strong style={{color:a.confidence>=90?T.accent:T.warn,fontSize:11}}>{a.confidence}%</strong></span>
        <span>SRC <strong style={{color:T.info,fontSize:11}}>{a.sat}</strong></span>
        {a.ndvi!=null&&<span>{"\u0394"}NDVI <strong style={{color:T.danger,fontSize:11}}>{a.ndvi}</strong></span>}</div></Crd>)})}</div></div>);}

function CostsTab(){var _s=useState(SATELLITE_SOURCES[0].name),sl=_s[0],sS=_s[1];
  var sat=SATELLITE_SOURCES.find(function(s){return s.name===sl;})||SATELLITE_SOURCES[0];
  var mc=Number(sat.monthlyCost||0),sc=Number(sat.setupCost||0),ac=Number(sat.annualCost||mc*12);
  return(<div style={{paddingTop:16}}>
    <div style={{fontFamily:S,fontSize:20,marginBottom:14}}>Cost Calculator</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
      <Crd><Lbl>Select Satellite</Lbl>
        <select value={sl} onChange={function(e){sS(e.target.value);}} style={{width:"100%",borderRadius:6,background:T.bgInput,color:T.textPri,border:"1px solid "+T.border,padding:"10px",marginTop:6,fontFamily:M,fontSize:12}}>
          {SATELLITE_SOURCES.map(function(s){return <option key={s.name} value={s.name}>{s.name} ({s.tier})</option>})}</select></Crd>
      <Crd><Lbl>Selected</Lbl><div style={{fontSize:16,fontWeight:700,marginTop:6}}>{sat.name}</div>
        <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{sat.provider} {"\u2022"} {sat.resolution} {"\u2022"} {sat.revisit}</div></Crd></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:16}}>
      {[{l:"Monthly",v:"$"+mc.toLocaleString(),c:mc===0?T.accent:T.textPri},{l:"Annual",v:"$"+ac.toLocaleString(),c:T.info},{l:"Setup",v:"$"+sc.toLocaleString(),c:T.warn},{l:"Year 1 Total",v:"$"+(ac+sc).toLocaleString(),c:T.accent}].map(function(x,i){return(
        <div key={i} style={{background:T.bgInput,border:"1px solid "+T.border,borderRadius:8,padding:14}}>
          <div style={{fontSize:9,color:T.textDim,fontFamily:M,textTransform:"uppercase"}}>{x.l}</div>
          <div style={{fontSize:24,fontWeight:700,fontFamily:M,color:x.c,marginTop:6}}>{x.v}</div></div>)})}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
      {Object.entries(COST_CALCULATOR).map(function(e){var k=e[0],v=e[1];return(
        <Crd key={k}><div style={{fontFamily:M,fontSize:10,color:T.accent,textTransform:"uppercase",fontWeight:700,letterSpacing:"0.08em",marginBottom:8}}>{k}</div>
          <div style={{fontSize:28,fontWeight:700,fontFamily:M,marginBottom:6}}>${v.monthlyCost.toLocaleString()}<span style={{fontSize:11,color:T.textDim,fontWeight:400}}>/mo</span></div>
          <div style={{fontSize:10,color:T.textSec,lineHeight:1.7}}>Setup: ${v.setup.toLocaleString()} {"\u2022"} Compute: {v.compute}<br/>Res: {v.resolution} {"\u2022"} Revisit: {v.revisit}</div></Crd>)})}</div></div>);}

function PlanTab(){return(<div style={{paddingTop:16}}>
  <div style={{fontFamily:S,fontSize:20,marginBottom:16}}>Build Roadmap</div>
  {ROADMAP.map(function(p,pi){return(<Crd key={pi} style={{marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div style={{fontFamily:S,fontSize:16,color:p.color}}>{p.phase}</div>
      <span style={{fontFamily:M,fontSize:9,padding:"4px 10px",borderRadius:4,background:p.color+"15",color:p.color,border:"1px solid "+p.color+"44",fontWeight:700}}>{p.status}</span></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:6}}>
      {p.items.map(function(it,ii){return(<div key={ii} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"5px 0"}}>
        <div style={{width:18,height:18,borderRadius:5,border:"1px solid "+p.color+"44",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:7,height:7,borderRadius:2,background:p.color+"44"}}/></div>
        <span style={{fontSize:11,color:T.textSec,lineHeight:1.5}}>{it}</span></div>)})}</div></Crd>)})}
  <Crd style={{border:"1px solid "+T.accent}}>
    <div style={{fontFamily:S,fontSize:17,color:T.accent,marginBottom:12}}>Revenue Model</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
      {REVENUE_PLANS.map(function(p,i){return(<div key={i} style={{background:T.bgInput,borderRadius:8,padding:16}}>
        <div style={{fontFamily:M,fontWeight:700,color:T.accent,fontSize:14}}>{p.plan}</div>
        <div style={{fontSize:24,fontWeight:700,fontFamily:M,margin:"8px 0"}}>{p.price}</div>
        <div style={{fontSize:10,color:T.warn,marginBottom:4}}>{p.target}</div>
        <div style={{fontSize:10,color:T.textDim,lineHeight:1.5}}>{p.features}</div></div>)})}</div></Crd></div>);}

/* ═══════════ MAIN ═══════════ */

export default function App(){
  var _t=useState("overview"),tab=_t[0],sT=_t[1];
  var _r=useState(MONITORED_REGIONS[4]),sel=_r[0],sR=_r[1];
  var _c=useState(new Date()),tm=_c[0],sTm=_c[1];
  useEffect(function(){var t=setInterval(function(){sTm(new Date());},1000);return function(){clearInterval(t);};},[]);

  var tabs=[
    {id:"overview",l:"Mission Control",i:"\u25c9"},
    {id:"imagery",l:"Imagery Lab",i:"\ud83d\udef0\ufe0f"},
    {id:"sats",l:"Satellite Intel",i:"\ud83d\udce1"},
    {id:"ai",l:"AI Pipeline",i:"\ud83e\udde0"},
    {id:"alerts",l:"Alerts",i:"\ud83d\udea8"},
    {id:"costs",l:"Costs",i:"\ud83d\udcb0"},
    {id:"plan",l:"Roadmap",i:"\ud83d\udccb"},
  ];

  return(
    <div style={{fontFamily:F,color:T.textPri,background:T.bgPrimary,minHeight:"100vh",maxWidth:1320,margin:"0 auto",padding:"0 20px"}}>
      <header style={{padding:"22px 0 14px",borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#00d4aa,#0088ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff",boxShadow:"0 4px 20px #00d4aa33"}}>{"\u25c8"}</div>
          <div>
            <h1 style={{fontFamily:S,fontSize:30,margin:0,letterSpacing:"-0.03em",lineHeight:1}}>Terra Sentinel</h1>
            <p style={{margin:"3px 0 0",fontSize:10,color:T.textDim,fontFamily:M,letterSpacing:"0.12em",textTransform:"uppercase"}}>
              Satellite Intelligence Platform</p></div></div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:M,fontSize:14,color:T.accent,fontWeight:600}}>{tm.toLocaleTimeString()} UTC</div>
          <div style={{fontSize:10,color:T.textDim,fontFamily:M}}>{MONITORED_REGIONS.length} Regions {"\u2022"} {LAYERS.length} Imagery Layers {"\u2022"} {SMODES.length} Analysis Modes</div></div>
      </header>

      <nav style={{display:"flex",gap:3,padding:"14px 0",overflowX:"auto",borderBottom:"1px solid "+T.border}}>
        {tabs.map(function(t){return(
          <button key={t.id} onClick={function(){sT(t.id);}} style={{
            background:tab===t.id?T.accentDim:"transparent",
            border:tab===t.id?"1px solid "+T.accent:"1px solid transparent",
            color:tab===t.id?T.accent:T.textSec,
            padding:"8px 18px",borderRadius:8,cursor:"pointer",
            fontFamily:M,fontSize:11,fontWeight:700,
            display:"flex",alignItems:"center",gap:7,transition:"all 0.15s",whiteSpace:"nowrap"}}>
            <span style={{fontSize:14}}>{t.i}</span>{t.l}</button>)})}</nav>

      <div style={{minHeight:"60vh"}}>
        {tab==="overview"&&<Overview sel={sel} setSel={sR}/>}
        {tab==="imagery"&&<ImageryLab sel={sel} setSel={sR}/>}
        {tab==="sats"&&<SatsTab/>}
        {tab==="ai"&&<AITab/>}
        {tab==="alerts"&&<AlertsTab/>}
        {tab==="costs"&&<CostsTab/>}
        {tab==="plan"&&<PlanTab/>}
      </div>

      <footer style={{borderTop:"1px solid "+T.border,padding:"18px 0 28px",marginTop:28,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:10,color:T.textDim,fontFamily:M}}>TERRA SENTINEL v1.0</span>
        <span style={{fontSize:10,color:T.textDim,fontFamily:M}}>Sentinel-2 {"\u2022"} Google {"\u2022"} ESRI {"\u2022"} NASA GIBS {"\u2022"} EOX {"\u2022"} Sentinel Hub</span></footer>

      <style>{"\n@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}\n.leaflet-control-layers{background:#0c1a28 !important;color:#8aa4be !important;border:1px solid #1a3a5a !important;border-radius:8px !important;font-family:'JetBrains Mono',monospace !important;font-size:11px !important;}\n.leaflet-control-layers label{color:#8aa4be !important;}\n.leaflet-control-layers-selector{accent-color:#00d4aa;}\n.leaflet-popup-content-wrapper{background:#0c1a28 !important;color:#e0e8f0 !important;border:1px solid #1a3a5a !important;border-radius:10px !important;box-shadow:0 8px 32px rgba(0,0,0,0.5) !important;}\n.leaflet-popup-tip{background:#0c1a28 !important;}\n.leaflet-popup-close-button{color:#4a6a8a !important;font-size:16px !important;}\n.leaflet-container{background:#060d14 !important;}\n.leaflet-control-zoom a{background:#0c1a28 !important;color:#00d4aa !important;border-color:#1a3a5a !important;font-weight:700;}\n.leaflet-control-zoom a:hover{background:#0f2030 !important;}\ninput[type=range]{accent-color:#00d4aa;height:6px;}\nselect{font-family:'JetBrains Mono',monospace;}\n"}</style>
    </div>);
}
