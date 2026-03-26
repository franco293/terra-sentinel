import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MONITORED_REGIONS, REGION_HISTORY, SATELLITE_SOURCES, AI_DETECTION_PIPELINE,
  ALERTS_FEED, MONTHLY_DATA, COST_CALCULATOR, AI_STACK,
  DETECTION_INDICES, TRAINING_DATASETS, ROADMAP, REVENUE_PLANS,
} from "./data.js";
import DetectionsTab from "./DetectionsTab.jsx";

/* ═══════════════════════════════════════════════════════
   TERRA SENTINEL v1.0 — Satellite Mining Intelligence
   ═══════════════════════════════════════════════════════ */

var T = {
  bgPrimary:"#060d14",bgCard:"#0c1a28",bgCardHover:"#0f2030",bgInput:"#0a1520",
  border:"#12283e",borderBright:"#1a3a5a",textPrimary:"#e0e8f0",
  textSecondary:"#8aa4be",textDim:"#4a6a8a",accent:"#00d4aa",accentDim:"#00d4aa33",
  danger:"#ff2d55",warning:"#ffaa00",info:"#4488ff",purple:"#a855f7",
};
var mono="'JetBrains Mono',monospace",serif="'Instrument Serif',Georgia,serif",sans="'DM Sans',sans-serif";

function gDate(off){var d=new Date();d.setDate(d.getDate()-(off||1));return d.toISOString().slice(0,10);}
function gibs(layer,date,fmt,lvl){
  fmt=fmt||"jpg"; lvl=lvl||9;
  return "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/"+layer+"/default/"+date+"/GoogleMapsCompatible_Level"+lvl+"/{z}/{y}/{x}."+fmt;
}

/* ═══════════════════════════════════════════════════════
   SATELLITE IMAGERY LAYERS — 22 sources for mining detection
   Organized by PURPOSE for illegal mining monitoring
   ═══════════════════════════════════════════════════════ */

var SAT_LAYERS = [
  // ── HIGH-RES OPTICAL (Crystal clear, best for visual inspection) ──
  {id:"esri_world",cat:"optical",name:"ESRI World Imagery",desc:"Highest-res free basemap (~1m). Best for visual identification of mining pits, roads, equipment.",sat:"Maxar/Earthstar",res:"~1m",
    url:function(){return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";},mz:18,attr:"Esri, Maxar, Earthstar Geographics"},
  {id:"google_sat",cat:"optical",name:"Google Satellite",desc:"Google's hi-res satellite mosaic. Excellent clarity for identifying structures and terrain changes.",sat:"Multiple",res:"~0.5m",
    url:function(){return "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";},mz:20,attr:"Google"},

  // ── SENTINEL-2 via HLS (Harmonized Landsat Sentinel — 30m, every 2-3 days) ──
  {id:"hls_s30",cat:"sentinel",name:"Sentinel-2 True Color (HLS)",desc:"Sentinel-2 MSI via NASA HLS. 30m resolution, 2-3 day revisit. PRIMARY for NDVI change detection.",sat:"Sentinel-2A/B/C",res:"30m",
    url:function(d){return gibs("HLS_S30_Nadir_BRDF_Adjusted_Reflectance",d,"png",13);},mz:13,attr:"NASA HLS | Sentinel-2 MSI"},
  {id:"hls_l30",cat:"sentinel",name:"Landsat 8/9 True Color (HLS)",desc:"Landsat OLI via NASA HLS. 30m, 16-day revisit per sat. Best for long-term historical comparison.",sat:"Landsat 8/9 OLI",res:"30m",
    url:function(d){return gibs("HLS_L30_Nadir_BRDF_Adjusted_Reflectance",d,"png",13);},mz:13,attr:"NASA HLS | Landsat 8/9 OLI"},

  // ── DAILY TRUE COLOR (Lower res but DAILY global coverage) ──
  {id:"viirs_true",cat:"daily",name:"VIIRS True Color (Daily)",desc:"Daily global composite from Suomi-NPP VIIRS. 250m. Use for rapid day-to-day change monitoring.",sat:"Suomi-NPP VIIRS",res:"250m",
    url:function(d){return gibs("VIIRS_SNPP_CorrectedReflectance_TrueColor",d);},mz:9,attr:"NASA GIBS | VIIRS"},
  {id:"modis_terra",cat:"daily",name:"MODIS Terra True Color",desc:"Daily Terra satellite. 250m. Morning pass (~10:30 local). Cross-reference with Aqua for same-day comparison.",sat:"Terra MODIS",res:"250m",
    url:function(d){return gibs("MODIS_Terra_CorrectedReflectance_TrueColor",d);},mz:9,attr:"NASA GIBS | MODIS Terra"},
  {id:"modis_aqua",cat:"daily",name:"MODIS Aqua True Color",desc:"Daily Aqua satellite. 250m. Afternoon pass (~1:30 local). Different cloud patterns than Terra.",sat:"Aqua MODIS",res:"250m",
    url:function(d){return gibs("MODIS_Aqua_CorrectedReflectance_TrueColor",d);},mz:9,attr:"NASA GIBS | MODIS Aqua"},
  {id:"noaa20_true",cat:"daily",name:"NOAA-20 VIIRS True Color",desc:"Daily composite from NOAA-20. Crosses 50min before Suomi-NPP, different cloud timing.",sat:"NOAA-20 VIIRS",res:"250m",
    url:function(d){return gibs("NOAA20_VIIRS_CorrectedReflectance_TrueColor",d);},mz:9,attr:"NASA GIBS | NOAA-20 VIIRS"},

  // ── FALSE COLOR / MINING DETECTION (Key bands for bare soil, vegetation loss, water) ──
  {id:"modis_721",cat:"detection",name:"MODIS Bands 7-2-1 (Fire/Bare Soil)",desc:"SWIR-NIR-Red. Bare soil = CYAN, vegetation = GREEN, water = BLACK, fire = RED/ORANGE. Essential for spotting excavation.",sat:"Terra MODIS",res:"250m",
    url:function(d){return gibs("MODIS_Terra_CorrectedReflectance_Bands721",d);},mz:9,attr:"NASA GIBS | MODIS 7-2-1"},
  {id:"modis_367",cat:"detection",name:"MODIS Bands 3-6-7 (Vegetation/Water)",desc:"Blue-SWIR-SWIR. Land = TAN/BROWN, vegetation = BRIGHT GREEN, water = BLUE/BLACK. Tracks deforestation and water turbidity.",sat:"Terra MODIS",res:"250m",
    url:function(d){return gibs("MODIS_Terra_CorrectedReflectance_Bands367",d);},mz:9,attr:"NASA GIBS | MODIS 3-6-7"},
  {id:"viirs_m11i2i1",cat:"detection",name:"VIIRS Bands M11-I2-I1 (Burn/Soil)",desc:"SWIR-NIR-Red. Burns/bare soil = RED/MAGENTA, healthy veg = GREEN, water = DARK. Reveals cleared mining areas.",sat:"Suomi-NPP VIIRS",res:"250m",
    url:function(d){return gibs("VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1",d);},mz:9,attr:"NASA GIBS | VIIRS M11-I2-I1"},
  {id:"viirs_m3i3m11",cat:"detection",name:"VIIRS Bands M3-I3-M11 (Snow/Ice/Water)",desc:"Vis-SWIR-SWIR. Ice/snow = RED, vegetation = GREEN, bare soil = CYAN, water = BLACK. Maps water contamination.",sat:"Suomi-NPP VIIRS",res:"250m",
    url:function(d){return gibs("VIIRS_SNPP_CorrectedReflectance_BandsM3-I3-M11",d);},mz:9,attr:"NASA GIBS | VIIRS M3-I3-M11"},

  // ── NIGHTTIME / LIGHTS (Detect activity in remote areas at night) ──
  {id:"viirs_night",cat:"night",name:"VIIRS Nighttime Imagery (DNB)",desc:"Day/Night Band. Shows city lights, camp fires, gas flares, mining ops lights. KEY indicator of illegal activity in remote areas.",sat:"Suomi-NPP VIIRS",res:"500m",
    url:function(d){return gibs("VIIRS_SNPP_DayNightBand_ENCC",d,"png");},mz:8,attr:"NASA GIBS | VIIRS DNB"},
  {id:"viirs_blackmarble",cat:"night",name:"Black Marble Night Lights",desc:"Anthropogenic lights only (no moonlight/aurora). Shows human settlement patterns. New lights in remote areas = mining camps.",sat:"Suomi-NPP VIIRS",res:"500m",
    url:function(d){return gibs("VIIRS_SNPP_DayNightBand_At_Sensor_Radiance",d,"png");},mz:8,attr:"NASA GIBS | Black Marble"},
  {id:"viirs_night_color",cat:"night",name:"Black Marble Blue/Yellow",desc:"False color: city lights = YELLOW, clouds = BLUE. Easier to distinguish human activity from natural features at night.",sat:"Suomi-NPP VIIRS",res:"500m",
    url:function(d){return gibs("VIIRS_SNPP_DayNightBand_AtSensor_M15",d,"png");},mz:8,attr:"NASA GIBS | VIIRS Night Color"},

  // ── VEGETATION INDEX (Track deforestation/clearing for mining) ──
  {id:"modis_ndvi",cat:"vegetation",name:"MODIS NDVI (8-day)",desc:"Normalized Difference Vegetation Index. GREEN = healthy veg, BROWN/RED = bare soil/cleared. Monitor vegetation loss over time.",sat:"Terra MODIS",res:"250m",
    url:function(){return gibs("MODIS_Terra_NDVI_8Day",gDate(10),"png");},mz:9,attr:"NASA GIBS | MODIS NDVI"},
  {id:"modis_evi",cat:"vegetation",name:"MODIS EVI (8-day)",desc:"Enhanced Vegetation Index. More sensitive than NDVI in high-biomass areas (tropical forests where illegal mining occurs).",sat:"Terra MODIS",res:"250m",
    url:function(){return gibs("MODIS_Terra_EVI_8Day",gDate(10),"png");},mz:9,attr:"NASA GIBS | MODIS EVI"},

  // ── THERMAL / TEMPERATURE (Heat signatures from machinery, fires) ──
  {id:"modis_lst_day",cat:"thermal",name:"Land Surface Temp (Day)",desc:"Daytime surface temperature. Hot spots may indicate machinery, processing operations, or burning at mining sites.",sat:"Terra MODIS",res:"1km",
    url:function(){return gibs("MODIS_Terra_Land_Surface_Temp_Day_8Day",gDate(10),"png");},mz:7,attr:"NASA GIBS | MODIS LST Day"},
  {id:"modis_lst_night",cat:"thermal",name:"Land Surface Temp (Night)",desc:"Nighttime surface temperature. Persistent heat at night in remote areas = industrial/mining activity.",sat:"Terra MODIS",res:"1km",
    url:function(){return gibs("MODIS_Terra_Land_Surface_Temp_Night_8Day",gDate(10),"png");},mz:7,attr:"NASA GIBS | MODIS LST Night"},

  // ── REFERENCE BASEMAPS ──
  {id:"osm",cat:"reference",name:"OpenStreetMap",desc:"Reference map showing roads, rivers, boundaries, settlements. Overlay with satellite for context.",sat:"Community",res:"Vector",
    url:function(){return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";},mz:19,attr:"\u00a9 OpenStreetMap"},
  {id:"carto_dark",cat:"reference",name:"Dark Basemap",desc:"Minimal dark map. Best base for overlaying bright satellite layers or night lights data.",sat:"CartoDB",res:"Vector",
    url:function(){return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";},mz:19,attr:"\u00a9 CartoDB"},
];

var LAYER_CATS = [
  {id:"optical",name:"High-Resolution Optical",icon:"\ud83d\uddfa\ufe0f",color:T.accent,desc:"Crystal clear satellite photos for visual inspection"},
  {id:"sentinel",name:"Sentinel-2 / Landsat (HLS)",icon:"\ud83d\udef0\ufe0f",color:"#a855f7",desc:"30m multispectral from ESA Sentinel-2 and NASA Landsat via HLS"},
  {id:"daily",name:"Daily Global Coverage",icon:"\ud83c\udf0d",color:T.info,desc:"250m imagery updated every day from MODIS and VIIRS"},
  {id:"detection",name:"False Color (Mining Detection)",icon:"\ud83d\udd0d",color:T.warning,desc:"Special band combinations that reveal bare soil, cleared land, and water"},
  {id:"night",name:"Nighttime / Lights",icon:"\ud83c\udf19",color:"#c084fc",desc:"Detect human activity at night in remote mining areas"},
  {id:"vegetation",name:"Vegetation Index (NDVI/EVI)",icon:"\ud83c\udf3f",color:"#22c55e",desc:"Track deforestation and land clearing from mining operations"},
  {id:"thermal",name:"Thermal / Heat Signatures",icon:"\ud83d\udd25",color:T.danger,desc:"Surface temperature anomalies from machinery and processing"},
  {id:"reference",name:"Reference Maps",icon:"\ud83d\udccd",color:T.textDim,desc:"Basemaps for geographic context"},
];

/* ─── SHARED COMPONENTS ─── */

function ChangeView({center,zoom}){var map=useMap();useEffect(function(){if(center)map.flyTo(center,zoom||map.getZoom(),{duration:1});},
[center,zoom,map]);return null;}

function createIcon(status){var c=status==="critical"?"#ff2d55":status==="warning"?"#ffaa00":"#00d4aa";
return L.divIcon({className:"",iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-14],
html:'<div style="width:24px;height:24px;border-radius:50%;background:'+c+'22;border:2px solid '+c+';display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px '+c+'66;"><div style="width:8px;height:8px;border-radius:50%;background:'+c+';"></div></div>'});}

function Sparkline({data,color,height}){height=height||32;var mx=Math.max.apply(null,data),mn=Math.min.apply(null,data),rng=mx-mn||1;
var pts=data.map(function(v,i){return((i/(data.length-1))*100)+","+(height-((v-mn)/rng)*(height-4)-2);}).join(" ");
return React.createElement("svg",{viewBox:"0 0 100 "+height,style:{width:"100%",height:height},preserveAspectRatio:"none"},
React.createElement("polyline",{points:pts,fill:"none",stroke:color,strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}));}

function BarChart({data,maxVal}){return(<div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,padding:"0 4px"}}>
{data.map(function(d,i){return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
<span style={{fontSize:10,color:T.textDim,fontFamily:mono}}>{d.value}</span>
<div style={{width:"100%",borderRadius:"3px 3px 0 0",height:(d.value/maxVal)*90+"px",background:d.color||T.accent,transition:"height 0.6s",opacity:0.85}}/>
<span style={{fontSize:9,color:T.textDim,fontFamily:mono}}>{d.label}</span></div>);})}</div>);}

function AnimNum({target}){var s=useState(0),v=s[0],setV=s[1];
useEffect(function(){var c=0,st=target/75;var t=setInterval(function(){c+=st;if(c>=target){setV(target);clearInterval(t);}else setV(Math.floor(c));},16);
return function(){clearInterval(t);};},
[target]);return v.toLocaleString();}

function Badge({status}){var m={critical:["#ff2d55","#ff2d5522","#ff2d5544"],warning:["#ffaa00","#ffaa0022","#ffaa0044"],monitoring:["#00d4aa","#00d4aa22","#00d4aa44"],info:["#4488ff","#4488ff22","#4488ff44"]};
var x=m[status]||m.info;return <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,letterSpacing:"0.05em",background:x[1],color:x[0],border:"1px solid "+x[2],textTransform:"uppercase",fontFamily:mono}}>{status}</span>;}

function Meter({value}){var c=value>=90?"#00d4aa":value>=80?"#ffaa00":"#ff6b35";
return(<div style={{display:"flex",alignItems:"center",gap:6}}><div style={{flex:1,height:4,background:"#1a2a3a",borderRadius:2,overflow:"hidden"}}>
<div style={{width:value+"%",height:"100%",background:c,borderRadius:2,transition:"width 0.8s"}}/></div>
<span style={{fontSize:11,fontFamily:mono,color:c,fontWeight:600}}>{value}%</span></div>);}

function Lbl({children}){return <div style={{fontSize:10,color:T.textDim,fontFamily:mono,textTransform:"uppercase",letterSpacing:"0.08em"}}>{children}</div>;}
function Card({children,style}){return <div style={Object.assign({background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:14},style||{})}>{children}</div>;}

/* ═══════════════════════════════════════════════════
   SATELLITE MAP — Multi-source, supports overlays
   ═══════════════════════════════════════════════════ */

function SatMap({regions,selected,onSelect,height,zoom,showCtrl,layerId,date,overlayId}){
  height=height||440;zoom=zoom||3;layerId=layerId||"esri_world";
  var center=selected?[selected.lat,selected.lng]:[0,10];
  var mapDate=date||gDate(1);
  var base=SAT_LAYERS.find(function(l){return l.id===layerId;})||SAT_LAYERS[0];
  var overlay=overlayId?SAT_LAYERS.find(function(l){return l.id===overlayId;}):null;

  return(
    <MapContainer center={center} zoom={zoom} style={{width:"100%",height:height,borderRadius:8,border:"1px solid "+T.border}} scrollWheelZoom={true} zoomControl={false}>
      <ChangeView center={center} zoom={selected?Math.max(zoom,5):zoom}/>
      {showCtrl?(
        <LayersControl position="topright">
          {SAT_LAYERS.map(function(layer){return(
            <LayersControl.BaseLayer key={layer.id} checked={layer.id===layerId} name={layer.name+" ["+layer.sat+"]"}>
              <TileLayer url={layer.url(mapDate)} attribution={layer.attr} maxZoom={layer.mz}/>
            </LayersControl.BaseLayer>);})}
        </LayersControl>
      ):(
        <TileLayer url={base.url(mapDate)} attribution={base.attr} maxZoom={base.mz}/>
      )}
      {overlay&&<TileLayer url={overlay.url(mapDate)} attribution={overlay.attr} maxZoom={overlay.mz} opacity={0.6}/>}
      {regions&&regions.map(function(r){return(
        <Marker key={r.id} position={[r.lat,r.lng]} icon={createIcon(r.status)} eventHandlers={{click:function(){if(onSelect)onSelect(r);}}}>
          <Popup><div style={{fontFamily:sans,fontSize:12,lineHeight:1.6,minWidth:180}}>
            <strong style={{fontSize:13}}>{r.name}</strong><br/>
            <span style={{color:r.status==="critical"?"#ff2d55":r.status==="warning"?"#cc8800":"#009977",fontWeight:700,textTransform:"uppercase",fontSize:10}}>{r.status}</span><br/>
            Alerts: <strong>{r.alerts}</strong> | Conf: {r.confidence}%<br/>Type: {r.type}
            {r.ndviDelta!=null&&<><br/>NDVI: <strong style={{color:"#cc3333"}}>{r.ndviDelta}</strong> | Heat: {r.heatAnomaly}{"\u00b0C"}</>}
          </div></Popup>
          {r.status==="critical"&&<Circle center={[r.lat,r.lng]} radius={50000} pathOptions={{color:"#ff2d55",fillColor:"#ff2d55",fillOpacity:0.08,weight:1}}/>}
        </Marker>);})}
    </MapContainer>);
}

/* ═══════════════════════════════════════════════════
   TAB: IMAGERY LAB — Full satellite analysis tool
   ═══════════════════════════════════════════════════ */

function ImageryLabTab({selectedRegion,setSelectedRegion}){
  var _l=useState("esri_world"),layerId=_l[0],setLayerId=_l[1];
  var _o=useState(""),overlayId=_o[0],setOverlayId=_o[1];
  var _d=useState(1),dateOff=_d[0],setDateOff=_d[1];
  var _c=useState("all"),cat=_c[0],setCat=_c[1];
  var _cmp=useState(false),compare=_cmp[0],setCompare=_cmp[1];
  var _l2=useState("viirs_night"),layerId2=_l2[0],setLayerId2=_l2[1];

  var region=selectedRegion||MONITORED_REGIONS[0];
  var mapDate=gDate(dateOff);
  var activeLayer=SAT_LAYERS.find(function(l){return l.id===layerId;})||SAT_LAYERS[0];
  var filteredLayers=cat==="all"?SAT_LAYERS:SAT_LAYERS.filter(function(l){return l.cat===cat;});

  return(
    <div style={{paddingTop:16}}>
      {/* Region selector */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {MONITORED_REGIONS.map(function(r){return(
          <button key={r.id} onClick={function(){setSelectedRegion(r);}} style={{
            padding:"5px 10px",borderRadius:6,fontFamily:mono,fontSize:9,fontWeight:700,cursor:"pointer",
            background:region.id===r.id?T.accentDim:T.bgCard,
            border:region.id===r.id?"1px solid "+T.accent:"1px solid "+T.border,
            color:region.id===r.id?T.accent:T.textSecondary}}>{r.name.split(",")[0]}</button>);})}
      </div>

      {/* Controls bar */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto auto",gap:10,marginBottom:12,alignItems:"end"}}>
        <div><Lbl>Date ({mapDate})</Lbl>
          <input type="range" min={1} max={60} value={dateOff} onChange={function(e){setDateOff(Number(e.target.value));}}
            style={{width:"100%",marginTop:6,accentColor:T.accent}}/></div>
        <div><Lbl>Overlay Layer (60% opacity)</Lbl>
          <select value={overlayId} onChange={function(e){setOverlayId(e.target.value);}}
            style={{width:"100%",borderRadius:6,background:T.bgInput,color:T.textPrimary,border:"1px solid "+T.border,padding:"7px",marginTop:4}}>
            <option value="">None</option>
            {SAT_LAYERS.map(function(l){return <option key={l.id} value={l.id}>{l.name}</option>;})}</select></div>
        <button onClick={function(){setCompare(!compare);}} style={{
          padding:"8px 14px",borderRadius:6,border:"none",fontFamily:mono,fontSize:11,fontWeight:700,cursor:"pointer",
          background:compare?T.info:T.bgCard,color:compare?"#fff":T.textSecondary,
          borderWidth:1,borderStyle:"solid",borderColor:compare?T.info:T.border}}>
          {compare?"\u25a3 Split View ON":"\u25a1 Split View"}</button>
        <a href={"https://worldview.earthdata.nasa.gov/?v="+(region.lng-3)+","+(region.lat-3)+","+(region.lng+3)+","+(region.lat+3)+"&t="+mapDate}
          target="_blank" rel="noreferrer" style={{padding:"8px 14px",borderRadius:6,background:T.accent,color:"#010c14",fontFamily:mono,fontSize:11,fontWeight:700,textDecoration:"none",textAlign:"center"}}>
          NASA Worldview {"\u2192"}</a>
      </div>

      {/* Map area */}
      {compare?(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <Card style={{padding:8}}>
            <div style={{fontSize:10,fontFamily:mono,color:T.accent,marginBottom:6}}>{activeLayer.name}</div>
            <SatMap key={"cmp1-"+region.id+layerId+dateOff} regions={[region]} selected={region} onSelect={function(){}} height={340} zoom={9} showCtrl={false} layerId={layerId} date={mapDate}/>
          </Card>
          <Card style={{padding:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:10,fontFamily:mono,color:T.info}}>{(SAT_LAYERS.find(function(l){return l.id===layerId2;})||{}).name}</span>
              <select value={layerId2} onChange={function(e){setLayerId2(e.target.value);}}
                style={{borderRadius:4,background:T.bgInput,color:T.textPrimary,border:"1px solid "+T.border,padding:"2px 6px",fontSize:10}}>
                {SAT_LAYERS.map(function(l){return <option key={l.id} value={l.id}>{l.name}</option>;})}</select>
            </div>
            <SatMap key={"cmp2-"+region.id+layerId2+dateOff} regions={[region]} selected={region} onSelect={function(){}} height={340} zoom={9} showCtrl={false} layerId={layerId2} date={mapDate}/>
          </Card>
        </div>
      ):(
        <Card style={{padding:8,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:700}}>{activeLayer.name} <span style={{color:T.textDim,fontWeight:400}}>| {activeLayer.sat} | {activeLayer.res}</span></span>
            <div style={{display:"flex",gap:8}}>
              <a href={"https://apps.sentinel-hub.com/eo-browser/?zoom=10&lat="+region.lat+"&lng="+region.lng+"&themeId=DEFAULT-THEME"} target="_blank" rel="noreferrer"
                style={{fontSize:10,color:T.info,fontFamily:mono}}>EO Browser {"\u2192"}</a>
              <span style={{fontSize:10,color:T.textDim,fontFamily:mono}}>{mapDate}</span>
            </div>
          </div>
          <SatMap key={"main-"+region.id+layerId+dateOff+overlayId} regions={MONITORED_REGIONS} selected={region} onSelect={setSelectedRegion}
            height={420} zoom={8} showCtrl={false} layerId={layerId} date={mapDate} overlayId={overlayId||undefined}/>
        </Card>
      )}

      {/* Layer info card */}
      <Card style={{marginBottom:12,borderLeft:"3px solid "+(LAYER_CATS.find(function(c2){return c2.id===activeLayer.cat;})||{}).color}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>{activeLayer.name}</div>
            <div style={{fontSize:11,color:T.textSecondary,marginTop:4,lineHeight:1.5}}>{activeLayer.desc}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0,marginLeft:16}}>
            <div style={{fontSize:10,color:T.textDim,fontFamily:mono}}>Resolution: <span style={{color:T.accent}}>{activeLayer.res}</span></div>
            <div style={{fontSize:10,color:T.textDim,fontFamily:mono}}>Satellite: <span style={{color:T.info}}>{activeLayer.sat}</span></div>
          </div>
        </div>
      </Card>

      {/* Category filters */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
        <button onClick={function(){setCat("all");}} style={{padding:"4px 10px",borderRadius:5,fontSize:9,fontFamily:mono,fontWeight:700,cursor:"pointer",
          background:cat==="all"?T.accentDim:T.bgInput,border:cat==="all"?"1px solid "+T.accent:"1px solid "+T.border,color:cat==="all"?T.accent:T.textDim}}>
          ALL ({SAT_LAYERS.length})</button>
        {LAYER_CATS.map(function(c2){var count=SAT_LAYERS.filter(function(l){return l.cat===c2.id;}).length;return(
          <button key={c2.id} onClick={function(){setCat(c2.id);}} style={{padding:"4px 10px",borderRadius:5,fontSize:9,fontFamily:mono,fontWeight:700,cursor:"pointer",
            background:cat===c2.id?c2.color+"22":T.bgInput,border:cat===c2.id?"1px solid "+c2.color:"1px solid "+T.border,color:cat===c2.id?c2.color:T.textDim}}>
            {c2.icon} {c2.name} ({count})</button>);})}
      </div>

      {/* Layer grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>
        {filteredLayers.map(function(l){var isActive=l.id===layerId;var catObj=LAYER_CATS.find(function(c2){return c2.id===l.cat;})||{};return(
          <div key={l.id} onClick={function(){setLayerId(l.id);}} style={{
            background:isActive?T.bgCardHover:T.bgCard,border:isActive?"1px solid "+T.accent:"1px solid "+T.border,
            borderRadius:8,padding:12,cursor:"pointer",transition:"all 0.15s",borderLeft:"3px solid "+(isActive?T.accent:catObj.color||T.border)}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:600,color:isActive?T.accent:T.textPrimary}}>{l.name}</span>
              <span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:catObj.color+"18",color:catObj.color,fontFamily:mono,fontWeight:700}}>{l.cat.toUpperCase()}</span>
            </div>
            <div style={{fontSize:10,color:T.textDim,lineHeight:1.4,marginBottom:6}}>{l.desc}</div>
            <div style={{display:"flex",gap:12,fontSize:9,fontFamily:mono,color:T.textDim}}>
              <span>Res: <strong style={{color:T.textSecondary}}>{l.res}</strong></span>
              <span>Sat: <strong style={{color:T.textSecondary}}>{l.sat}</strong></span>
            </div>
          </div>);})}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REMAINING TABS (kept from previous version)
   ═══════════════════════════════════════════════ */

function OverviewTab({selectedRegion,setSelectedRegion}){
  return(<div style={{paddingTop:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:16}}>
      {[{label:"Active Alerts",value:144,color:T.danger,spark:[89,112,98,134,156,171],sfx:""},
        {label:"Area Monitored",value:28700,color:T.info,spark:[18,21,23,25,27,28.7],sfx:" km\u00b2"},
        {label:"Detection Rate",value:94,color:T.accent,spark:[88,89,91,92,93,94],sfx:"%"},
        {label:"Regions Tracked",value:9,color:T.warning,spark:[3,4,5,6,7,9],sfx:""}
      ].map(function(s,i){return(<Card key={i}><Lbl>{s.label}</Lbl>
        <div style={{fontSize:26,fontWeight:700,color:s.color,fontFamily:mono,lineHeight:1,margin:"6px 0 8px"}}><AnimNum target={s.value}/>{s.sfx}</div>
        <Sparkline data={s.spark} color={s.color} height={24}/></Card>);})}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:12,marginBottom:16}}>
      <Card style={{padding:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <Lbl>Global Monitoring Grid</Lbl><span style={{fontSize:10,color:T.accent,fontFamily:mono}}>{"\u25cf"} LIVE</span></div>
        <SatMap regions={MONITORED_REGIONS} selected={selectedRegion} onSelect={setSelectedRegion} height={400} zoom={2} showCtrl={true} layerId="esri_world"/>
        <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
          {[{c:"#ff2d55",l:"Critical"},{c:"#ffaa00",l:"Warning"},{c:"#00d4aa",l:"Monitoring"}].map(function(x){return(
            <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:x.c,boxShadow:"0 0 6px "+x.c+"66"}}/>
              <span style={{fontSize:9,color:T.textDim,fontFamily:mono}}>{x.l}</span></div>);})}
          <span style={{fontSize:9,color:T.textDim,fontFamily:mono,marginLeft:"auto"}}>22 satellite layers available via layer control</span>
        </div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {selectedRegion&&(<Card style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:10}}>
            <div><div style={{fontFamily:serif,fontSize:16}}>{selectedRegion.name}</div>
              <div style={{fontSize:10,color:T.textDim,fontFamily:mono,marginTop:2}}>{selectedRegion.type}</div></div>
            <Badge status={selectedRegion.status}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[{l:"Alerts",v:selectedRegion.alerts},{l:"Area",v:selectedRegion.area},{l:"Last Scan",v:selectedRegion.lastScan},{l:"Change",v:selectedRegion.change}].map(function(x,i){return(
              <div key={i} style={{background:T.bgInput,borderRadius:6,padding:8}}>
                <div style={{fontSize:9,color:T.textDim,fontFamily:mono,textTransform:"uppercase"}}>{x.l}</div>
                <div style={{fontSize:14,fontWeight:600,fontFamily:mono,marginTop:2}}>{x.v}</div></div>);})}
          </div>
          {selectedRegion.ndviDelta!=null&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:10,marginBottom:10}}>
            <span>NDVI: <strong style={{color:T.danger}}>{selectedRegion.ndviDelta}</strong></span>
            <span>Heat: <strong style={{color:T.warning}}>{selectedRegion.heatAnomaly}{"\u00b0C"}</strong></span>
            <span>Veg Loss: <strong style={{color:T.danger}}>{selectedRegion.vegetationLossHa} ha</strong></span>
            <span>Turbidity: <strong style={{color:T.warning}}>{selectedRegion.waterTurbidityRise}</strong></span></div>)}
          <div style={{marginBottom:8}}><div style={{fontSize:10,color:T.textDim,fontFamily:mono,marginBottom:4}}>AI CONFIDENCE</div>
            <Meter value={selectedRegion.confidence}/></div>
          <div style={{fontSize:10,color:T.textDim,fontFamily:mono}}>{selectedRegion.lat}{"\u00b0"}, {selectedRegion.lng}{"\u00b0"}</div>
        </Card>)}
        <Card><Lbl>Latest Detections</Lbl><div style={{marginTop:8}}>
          {ALERTS_FEED.slice(0,4).map(function(a){return(
            <div key={a.id} style={{padding:"6px 0",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:a.severity==="critical"?T.danger:a.severity==="warning"?T.warning:T.info,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.desc}</div>
                <div style={{fontSize:9,color:T.textDim,fontFamily:mono}}>{a.time} {"\u2022"} {a.sat}</div></div></div>);})}</div></Card>
      </div>
    </div>
    <Card><Lbl>6-Month Detection Trend</Lbl><div style={{marginTop:12}}>
      <BarChart data={MONTHLY_DATA.map(function(d){return{label:d.month,value:d.alerts,color:T.accent};})} maxVal={200}/></div>
      <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:12}}>
        {[{l:"Total Alerts",v:"760",c:T.accent},{l:"Confirmed",v:"570",c:T.warning},{l:"Area Disturbed",v:"1,178 ha",c:T.danger}].map(function(s,i){return(
          <div key={i} style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:s.c,fontFamily:mono}}>{s.v}</div>
            <div style={{fontSize:9,color:T.textDim,fontFamily:mono}}>{s.l}</div></div>);})}</div></Card>
  </div>);
}

function SatellitesTab(){var _s=useState("all"),filter=_s[0],setFilter=_s[1];
  var list=filter==="all"?SATELLITE_SOURCES:SATELLITE_SOURCES.filter(function(s){return s.tier===filter;});
  return(<div style={{paddingTop:16}}>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      {["all","free","paid"].map(function(f){return(<button key={f} onClick={function(){setFilter(f);}} style={{
        background:filter===f?T.accentDim:T.bgCard,border:filter===f?"1px solid "+T.accent:"1px solid "+T.border,
        color:filter===f?T.accent:T.textSecondary,padding:"6px 16px",borderRadius:6,cursor:"pointer",fontFamily:mono,fontSize:11,fontWeight:600,textTransform:"uppercase"}}>
        {f} ({f==="all"?SATELLITE_SOURCES.length:SATELLITE_SOURCES.filter(function(s2){return s2.tier===f;}).length})</button>);})}</div>
    <div style={{display:"grid",gap:8}}>
      {list.map(function(s,i){return(<div key={i} style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <div><div style={{fontWeight:600,fontSize:13,marginBottom:4}}>{s.name}</div>
          <span style={{fontSize:9,padding:"1px 6px",borderRadius:3,display:"inline-block",background:s.tier==="free"?"#00d4aa18":"#ffaa0018",color:s.tier==="free"?"#00d4aa":"#ffaa00",fontFamily:mono,fontWeight:700,textTransform:"uppercase"}}>{s.tier}</span>
          <div style={{fontSize:10,color:T.textSecondary,marginTop:4}}>{s.provider}</div></div>
        <div><div style={{fontSize:9,color:T.textDim,fontFamily:mono,textTransform:"uppercase"}}>Resolution</div>
          <div style={{fontFamily:mono,fontWeight:600,fontSize:13,color:s.resolution.includes("0.")?T.accent:T.textPrimary}}>{s.resolution}</div>
          <div style={{fontSize:9,color:T.textDim,fontFamily:mono,marginTop:6,textTransform:"uppercase"}}>Revisit</div>
          <div style={{fontSize:11,color:T.textSecondary}}>{s.revisit}</div></div>
        <div><div style={{fontSize:9,color:T.textDim,fontFamily:mono,textTransform:"uppercase"}}>Cost</div>
          <div style={{fontFamily:mono,fontWeight:600,fontSize:11,color:s.cost==="Free"?T.accent:T.warning}}>{s.cost}</div>
          <div style={{fontSize:9,color:T.textDim,marginTop:6}}>{s.bestFor}</div></div>
      </div>);})}</div>
  </div>);
}

function AIPipelineTab(){return(<div style={{paddingTop:16}}>
  <div style={{display:"grid",gap:8,marginBottom:20}}>
    {AI_DETECTION_PIPELINE.map(function(step,i){return(<div key={i} style={{display:"flex",gap:14,alignItems:"center",background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:14}}>
      <div style={{width:44,height:44,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,"+T.accentDim+",transparent)",border:"1px solid "+T.accent,fontSize:20,flexShrink:0}}>{step.icon}</div>
      <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{fontFamily:mono,fontSize:10,color:T.accent,fontWeight:700}}>STEP {step.step}</span>
        <span style={{fontWeight:600,fontSize:14}}>{step.name}</span></div>
        <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>{step.desc}</div></div></div>);})}</div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12}}>
    <Card><div style={{fontFamily:serif,fontSize:16,marginBottom:10}}>Free AI/ML Stack</div>
      {AI_STACK.map(function(t,i){return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid "+T.border}}>
        <span style={{fontFamily:mono,fontSize:11,fontWeight:600,color:T.accent}}>{t.tool}</span>
        <span style={{fontSize:10,color:T.textDim}}>{t.use}</span></div>);})}</Card>
    <Card><div style={{fontFamily:serif,fontSize:16,marginBottom:10}}>Detection Indices</div>
      {DETECTION_INDICES.map(function(t,i){return(<div key={i} style={{padding:"5px 0",borderBottom:"1px solid "+T.border}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:mono,fontSize:11,fontWeight:700,color:T.warning}}>{t.index}</span>
          <span style={{fontSize:9,color:T.textDim,fontFamily:mono}}>{t.formula}</span></div>
        <div style={{fontSize:10,color:T.textSecondary,marginTop:1}}>{t.use}</div></div>);})}</Card>
  </div>
  <Card style={{marginTop:12}}><div style={{fontFamily:serif,fontSize:16,marginBottom:8}}>Free Training Datasets</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
      {TRAINING_DATASETS.map(function(d,i){return(<div key={i} style={{background:T.bgInput,borderRadius:6,padding:10}}>
        <div style={{fontWeight:600,fontSize:11,color:T.accent}}>{d.name}</div>
        <div style={{fontSize:10,color:T.textSecondary,marginTop:2}}>{d.desc}</div>
        <div style={{fontSize:9,color:T.textDim,fontFamily:mono,marginTop:4}}>Source: {d.source}</div></div>);})}</div></Card>
</div>);}

function AlertsTab(){return(<div style={{paddingTop:16}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
    <div style={{fontFamily:serif,fontSize:18}}>Live Alert Feed</div>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:T.danger,animation:"pulse 1.5s infinite"}}/>
      <span style={{fontFamily:mono,fontSize:10,color:T.danger}}>LIVE</span></div></div>
  <div style={{display:"grid",gap:8}}>
    {ALERTS_FEED.map(function(a,i){return(<div key={i} style={{background:T.bgCard,borderRadius:8,padding:14,
      border:"1px solid "+(a.severity==="critical"?"#ff2d5530":a.severity==="warning"?"#ffaa0030":T.border),
      borderLeft:"3px solid "+(a.severity==="critical"?T.danger:a.severity==="warning"?T.warning:T.info)}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontFamily:mono,fontSize:10,color:T.textDim}}>{a.id}</span><Badge status={a.severity}/>
          <span style={{fontSize:10,color:T.textDim,fontFamily:mono}}>{a.region}</span></div>
        <span style={{fontSize:10,color:T.textDim,fontFamily:mono}}>{a.time}</span></div>
      <div style={{fontSize:12,lineHeight:1.4,marginBottom:8}}>{a.desc}</div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        <span style={{fontSize:9,color:T.textDim,fontFamily:mono}}>CONF <strong style={{color:a.confidence>=90?T.accent:T.warning}}>{a.confidence}%</strong></span>
        <span style={{fontSize:9,color:T.textDim,fontFamily:mono}}>SRC <strong style={{color:T.info}}>{a.sat}</strong></span>
        {a.ndvi!=null&&<span style={{fontSize:9,color:T.textDim,fontFamily:mono}}>NDVI <strong style={{color:T.danger}}>{a.ndvi}</strong></span>}</div>
    </div>);})}</div></div>);}

function SurveillanceTab({selectedRegion,setSelectedRegion}){
  var _p=useState(false),play=_p[0],setPlay=_p[1];
  var _i=useState(0),dayIndex=_i[0],setDayIndex=_i[1];
  var _a=useState([]),alertLog=_a[0],setAlertLog=_a[1];
  var focusedRegion=selectedRegion||MONITORED_REGIONS.find(function(r){return r.id===9;});
  var history=REGION_HISTORY[focusedRegion?focusedRegion.id:9]||REGION_HISTORY[9]||[];
  var current=history[dayIndex]||{};
  useEffect(function(){if(!play||dayIndex>=history.length-1){setPlay(false);return;}
    var timer=setTimeout(function(){setDayIndex(function(i){return Math.min(i+1,history.length-1);});},1200);
    return function(){clearTimeout(timer);};},
  [play,dayIndex,history.length]);
  useEffect(function(){if(!current.date)return;var events=[];
    if(current.ndviDelta<=-0.35)events.push("Critical vegetation decline");
    if(current.heatAnomaly>=2.0)events.push("Thermal hotspot expanding");
    if(current.waterTurbidityRise>=0.15)events.push("Turbidity plume risk");
    if(events.length>0)setAlertLog(function(prev){return[{region:focusedRegion.name,date:current.date,ndvi:current.ndviDelta,heat:current.heatAnomaly,events:events}].concat(prev).slice(0,10);});},
  [dayIndex]);
  var dateStr=current.date||gDate(1);
  return(<div style={{paddingTop:16}}>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
      {MONITORED_REGIONS.filter(function(r){return REGION_HISTORY[r.id];}).map(function(r){return(
        <button key={r.id} onClick={function(){setSelectedRegion(r);setDayIndex(0);setAlertLog([]);}} style={{
          padding:"6px 12px",borderRadius:6,fontFamily:mono,fontSize:10,fontWeight:700,cursor:"pointer",
          background:focusedRegion&&focusedRegion.id===r.id?T.accentDim:T.bgCard,
          border:focusedRegion&&focusedRegion.id===r.id?"1px solid "+T.accent:"1px solid "+T.border,
          color:focusedRegion&&focusedRegion.id===r.id?T.accent:T.textSecondary}}>{r.name.split(",")[0]}</button>);})}
      <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
        <button onClick={function(){setPlay(!play);}} style={{padding:"8px 14px",borderRadius:6,border:"none",background:play?T.danger:T.accent,color:play?"#fff":"#010c14",fontWeight:700,cursor:"pointer",fontFamily:mono,fontSize:11}}>
          {play?"\u23f8 Pause":"\u25b6 Play"}</button>
        <input type="range" min={0} max={history.length-1} value={dayIndex} onChange={function(e){setDayIndex(Number(e.target.value));}} style={{width:120}}/>
        <span style={{fontFamily:mono,fontSize:11,color:T.accent,minWidth:80}}>{dateStr}</span></div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:12}}>
      <Card style={{padding:12}}>
        <Lbl>Surveillance {"\u2014"} {focusedRegion.name}</Lbl>
        <div style={{marginTop:8}}><SatMap key={"surv-"+focusedRegion.id} regions={[focusedRegion]} selected={focusedRegion} onSelect={function(){}} height={360} zoom={8} showCtrl={true} layerId="modis_terra" date={dateStr}/></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:10}}>
          {[{l:"NDVI",v:current.ndviDelta,c:current.ndviDelta<=-0.35?T.danger:T.textSecondary},
            {l:"Heat",v:current.heatAnomaly!=null?current.heatAnomaly+"\u00b0C":"\u2014",c:current.heatAnomaly>=2.0?T.danger:T.textSecondary},
            {l:"Veg Loss",v:current.vegetationLossHa!=null?current.vegetationLossHa+" ha":"\u2014",c:T.warning},
            {l:"Turbidity",v:current.waterTurbidityRise!=null?String(current.waterTurbidityRise):"\u2014",c:current.waterTurbidityRise>=0.15?T.danger:T.textSecondary}
          ].map(function(x,i){return(<div key={i} style={{background:T.bgInput,borderRadius:6,padding:8,textAlign:"center"}}>
            <div style={{fontSize:8,color:T.textDim,fontFamily:mono,textTransform:"uppercase"}}>{x.l}</div>
            <div style={{fontSize:14,fontWeight:700,fontFamily:mono,color:x.c,marginTop:2}}>{x.v!=null?x.v:"\u2014"}</div></div>);})}
        </div></Card>
      <Card style={{padding:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:12}}>Auto Alert Log</div>
          <button onClick={function(){setAlertLog([]);}} style={{fontSize:10,background:"transparent",color:T.accent,border:"1px solid "+T.border,padding:"3px 8px",borderRadius:4,cursor:"pointer"}}>Clear</button></div>
        <div style={{maxHeight:400,overflowY:"auto",display:"grid",gap:6}}>
          {alertLog.length===0&&<div style={{color:T.textDim,fontSize:11,padding:10}}>Play timelapse to see alerts auto-generate.</div>}
          {alertLog.map(function(item,idx){return(<div key={idx} style={{background:T.bgInput,border:"1px solid "+T.border,borderLeft:"3px solid "+T.danger,borderRadius:6,padding:8}}>
            <div style={{fontSize:10,color:T.textDim,fontFamily:mono}}>{item.date} {"\u2022"} {item.region}</div>
            <div style={{fontSize:11,fontWeight:700,fontFamily:mono,marginTop:2}}>NDVI {item.ndvi} | Heat {item.heat}{"\u00b0C"}</div>
            {item.events.map(function(e,i2){return <div key={i2} style={{fontSize:10,color:T.danger,marginTop:2}}>{"\u26a0"} {e}</div>;})}</div>);})}</div>
        <div style={{marginTop:10,borderTop:"1px solid "+T.border,paddingTop:10}}>
          <button onClick={function(){var blob=new Blob([JSON.stringify({region:focusedRegion,history:history,alerts:alertLog},null,2)],{type:"application/json"});
            var u=URL.createObjectURL(blob);var a=document.createElement("a");a.href=u;a.download="surveillance-"+focusedRegion.name.replace(/\s+/g,"-")+".json";a.click();URL.revokeObjectURL(u);}}
            style={{background:T.accent,color:"#010c14",border:"none",padding:"8px 12px",borderRadius:6,fontWeight:700,cursor:"pointer",fontFamily:mono,fontSize:11,width:"100%"}}>
            Export Bundle</button></div></Card></div></div>);
}

function CostsTab(){var _s=useState(SATELLITE_SOURCES[0].name),sel=_s[0],setSel=_s[1];
  var sat=SATELLITE_SOURCES.find(function(s){return s.name===sel;})||SATELLITE_SOURCES[0];
  var mc=Number(sat.monthlyCost||0),sc=Number(sat.setupCost||0),ac=Number(sat.annualCost||mc*12);
  return(<div style={{paddingTop:16}}>
    <div style={{fontFamily:serif,fontSize:18,marginBottom:12}}>Cost Calculator</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
      <Card style={{padding:12}}><Lbl>Select Satellite</Lbl>
        <select value={sel} onChange={function(e){setSel(e.target.value);}} style={{width:"100%",borderRadius:6,background:T.bgInput,color:T.textPrimary,border:"1px solid "+T.border,padding:"8px",marginTop:6}}>
          {SATELLITE_SOURCES.map(function(s){return <option key={s.name} value={s.name}>{s.name} ({s.tier})</option>;})}</select></Card>
      <Card style={{padding:12}}><Lbl>Selected</Lbl><div style={{fontSize:14,fontWeight:700,marginTop:4}}>{sat.name}</div>
        <div style={{fontSize:10,color:T.textSecondary,marginTop:2}}>{sat.provider} {"\u2022"} {sat.resolution} {"\u2022"} {sat.revisit}</div></Card></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:16}}>
      {[{l:"Monthly",v:"$"+mc.toLocaleString(),c:mc===0?T.accent:T.textPrimary},{l:"Annual",v:"$"+ac.toLocaleString(),c:T.info},{l:"Setup",v:"$"+sc.toLocaleString(),c:T.warning},{l:"Year 1",v:"$"+(ac+sc).toLocaleString(),c:T.accent}].map(function(x,i){return(
        <div key={i} style={{background:T.bgInput,border:"1px solid "+T.border,borderRadius:6,padding:12}}>
          <div style={{fontSize:9,color:T.textDim,fontFamily:mono,textTransform:"uppercase"}}>{x.l}</div>
          <div style={{fontSize:22,fontWeight:700,fontFamily:mono,color:x.c,marginTop:4}}>{x.v}</div></div>);})}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
      {Object.entries(COST_CALCULATOR).map(function(entry){var key=entry[0],val=entry[1];return(
        <Card key={key}><div style={{fontFamily:mono,fontSize:10,color:T.accent,textTransform:"uppercase",fontWeight:700,letterSpacing:"0.08em",marginBottom:8}}>{key} TIER</div>
          <div style={{fontSize:26,fontWeight:700,fontFamily:mono,marginBottom:4}}>${val.monthlyCost.toLocaleString()}<span style={{fontSize:11,color:T.textDim,fontWeight:400}}>/mo</span></div>
          <div style={{fontSize:10,color:T.textSecondary,lineHeight:1.6}}>Setup: ${val.setup.toLocaleString()} {"\u2022"} {val.compute}<br/>Resolution: {val.resolution} {"\u2022"} Revisit: {val.revisit}</div></Card>);})}
    </div></div>);
}

function BuildPlanTab(){return(<div style={{paddingTop:16}}>
  <div style={{fontFamily:serif,fontSize:18,marginBottom:16}}>Product Build Roadmap</div>
  {ROADMAP.map(function(phase,pi){return(<Card key={pi} style={{marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div style={{fontFamily:serif,fontSize:15,color:phase.color}}>{phase.phase}</div>
      <span style={{fontFamily:mono,fontSize:9,padding:"3px 8px",borderRadius:4,background:phase.color+"18",color:phase.color,border:"1px solid "+phase.color+"44",fontWeight:700}}>{phase.status}</span></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:6}}>
      {phase.items.map(function(item,ii){return(<div key={ii} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"4px 0"}}>
        <div style={{width:16,height:16,borderRadius:4,border:"1px solid "+phase.color+"44",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:6,height:6,borderRadius:2,background:phase.color+"44"}}/></div>
        <span style={{fontSize:11,color:T.textSecondary,lineHeight:1.4}}>{item}</span></div>);})}</div></Card>);})}
  <Card style={{border:"1px solid "+T.accent}}>
    <div style={{fontFamily:serif,fontSize:16,color:T.accent,marginBottom:10}}>Revenue Model</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
      {REVENUE_PLANS.map(function(p,i){return(<div key={i} style={{background:T.bgInput,borderRadius:6,padding:14}}>
        <div style={{fontFamily:mono,fontWeight:700,color:T.accent,fontSize:13}}>{p.plan}</div>
        <div style={{fontSize:22,fontWeight:700,fontFamily:mono,margin:"6px 0"}}>{p.price}</div>
        <div style={{fontSize:10,color:T.warning,marginBottom:4}}>{p.target}</div>
        <div style={{fontSize:10,color:T.textDim,lineHeight:1.4}}>{p.features}</div></div>);})}</div></Card>
</div>);}

/* ═══════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════ */

export default function App(){
  var _t=useState("imagery"),activeTab=_t[0],setActiveTab=_t[1];
  var _r=useState(MONITORED_REGIONS[4]),selectedRegion=_r[0],setSelectedRegion=_r[1];
  var _c=useState(new Date()),time=_c[0],setTime=_c[1];
  useEffect(function(){var t=setInterval(function(){setTime(new Date());},1000);return function(){clearInterval(t);};},
  []);

  var tabs=[
    {id:"overview",label:"Mission Control",icon:"\u25c9"},
    {id:"detections",label:"AI Detections",icon:"\ud83c\udfaf"},
    {id:"imagery",label:"Imagery Lab",icon:"\ud83d\udef0\ufe0f"},
    {id:"satellites",label:"Satellite Intel",icon:"\ud83d\udce1"},
    {id:"ai",label:"AI Pipeline",icon:"\ud83e\udde0"},
    {id:"alerts",label:"Live Alerts",icon:"\ud83d\udea8"},
    {id:"surveillance",label:"Surveillance",icon:"\ud83c\udfaf"},
    {id:"costs",label:"Costs",icon:"\ud83d\udcb0"},
    {id:"plan",label:"Build Plan",icon:"\ud83d\udccb"},
  ];

  return(
    <div style={{fontFamily:sans,color:T.textPrimary,background:T.bgPrimary,minHeight:"100vh",maxWidth:1280,margin:"0 auto",padding:"0 16px"}}>
      <header style={{padding:"20px 0 12px",borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:6,background:"linear-gradient(135deg,#00d4aa,#0088ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#fff"}}>{"\u25c8"}</div>
          <div><h1 style={{fontFamily:serif,fontSize:26,margin:0,letterSpacing:"-0.02em",lineHeight:1}}>Terra Sentinel</h1>
            <p style={{margin:0,fontSize:11,color:T.textDim,fontFamily:mono,letterSpacing:"0.08em",textTransform:"uppercase"}}>
              Satellite Intelligence {"\u2022"} Illegal Mining Detection</p></div></div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:mono,fontSize:13,color:T.accent,fontWeight:600}}>{time.toLocaleTimeString()} UTC</div>
          <div style={{fontSize:10,color:T.textDim,fontFamily:mono}}>{MONITORED_REGIONS.length} REGIONS {"\u2022"} {SAT_LAYERS.length} IMAGERY LAYERS {"\u2022"} {SATELLITE_SOURCES.length} DATA SOURCES</div></div>
      </header>

      <nav style={{display:"flex",gap:2,padding:"12px 0",overflowX:"auto",borderBottom:"1px solid "+T.border}}>
        {tabs.map(function(t2){return(
          <button key={t2.id} onClick={function(){setActiveTab(t2.id);}} style={{
            background:activeTab===t2.id?T.accentDim:"transparent",border:activeTab===t2.id?"1px solid "+T.accent:"1px solid transparent",
            color:activeTab===t2.id?T.accent:T.textSecondary,padding:"6px 14px",borderRadius:6,cursor:"pointer",
            fontFamily:mono,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:6,transition:"all 0.2s",whiteSpace:"nowrap"}}>
            <span>{t2.icon}</span>{t2.label}</button>);})}</nav>

      {activeTab==="overview"&&<OverviewTab selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion}/>}
      {activeTab==="detections"&&<DetectionsTab sel={selectedRegion} setSel={setSelectedRegion}/>}
      {activeTab==="imagery"&&<ImageryLabTab selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion}/>}
      {activeTab==="satellites"&&<SatellitesTab/>}
      {activeTab==="ai"&&<AIPipelineTab/>}
      {activeTab==="alerts"&&<AlertsTab/>}
      {activeTab==="surveillance"&&<SurveillanceTab selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion}/>}
      {activeTab==="costs"&&<CostsTab/>}
      {activeTab==="plan"&&<BuildPlanTab/>}

      <footer style={{borderTop:"1px solid "+T.border,padding:"16px 0 24px",marginTop:24,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:10,color:T.textDim,fontFamily:mono}}>TERRA SENTINEL v1.0</span>
        <span style={{fontSize:10,color:T.textDim,fontFamily:mono}}>Sentinel-2 {"\u2022"} Landsat {"\u2022"} MODIS {"\u2022"} VIIRS {"\u2022"} HLS {"\u2022"} NASA GIBS</span></footer>

      <style>{"\n@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}\n.leaflet-control-layers{background:#0c1a28 !important;color:#8aa4be !important;border:1px solid #12283e !important;border-radius:6px !important;max-height:400px;overflow-y:auto !important;}\n.leaflet-control-layers label{color:#8aa4be !important;font-size:11px !important;}\n.leaflet-control-layers-selector{accent-color:#00d4aa;}\n.leaflet-popup-content-wrapper{background:#0c1a28 !important;color:#e0e8f0 !important;border:1px solid #12283e !important;border-radius:8px !important;}\n.leaflet-popup-tip{background:#0c1a28 !important;}\n.leaflet-popup-close-button{color:#4a6a8a !important;}\n.leaflet-container{background:#060d14 !important;}\ninput[type=range]{accent-color:#00d4aa;}\n"}</style>
    </div>);
}
