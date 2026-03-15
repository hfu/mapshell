import maplibregl from "maplibre-gl";
import { layers, namedFlavor } from "@protomaps/basemaps";
import { LayerControl } from "maplibre-gl-layer-control";
import { Protocol } from "pmtiles";

export const MAP_TITLE = "Mapshell";

const BASEMAP_SOURCE_ID = "protomaps-basemap";
const BASEMAP_TILEJSON_URL = "https://tunnel.optgeo.org/martin/protomaps-basemap";
const TERRAIN_TILEJSON_URL = "https://tunnel.optgeo.org/martin/mapterhorn";
const DEFAULT_CENTER = [141.0, 43.05];
const DEFAULT_ZOOM = 7;
const DEFAULT_PITCH = 50;
const DEFAULT_BEARING = 18;
const HILLSHADE_LAYER_ID = "terrain-hillshade";
const CONTROLLED_LAYERS = {
  background: "Background",
  landcover: "Landcover",
  water: "Water",
  buildings: "Buildings",
  roads_major: "Major roads",
  roads_minor: "Minor roads",
  roads_rail: "Railways",
  places_locality: "Places",
  [HILLSHADE_LAYER_ID]: "Hillshade"
};

const pmtilesProtocol = new Protocol();
const PMTILES_PROTOCOL_FLAG = "__mapshellPmtilesRegistered";
let protocolRegistered = false;

function ensurePmtilesProtocol() {
  if (protocolRegistered || globalThis[PMTILES_PROTOCOL_FLAG]) {
    protocolRegistered = true;
    return;
  }

  try {
    maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile);
    protocolRegistered = true;
    globalThis[PMTILES_PROTOCOL_FLAG] = true;
  } catch (error) {
    console.error("Failed to register the PMTiles protocol.", error);
    throw error;
  }
}

function createBasemapLayers() {
  return layers(BASEMAP_SOURCE_ID, namedFlavor("dark"), { lang: "en" })
    .filter((layer) => {
      if (layer.type !== "symbol") {
        return true;
      }

      const textField = layer.layout?.["text-field"];
      const iconImage = layer.layout?.["icon-image"];
      return Boolean(textField) || !iconImage;
    })
    .map((layer) => {
      if (layer.type !== "symbol") {
        return layer;
      }

      const layout = { ...(layer.layout ?? {}) };
      delete layout["icon-image"];

      if (layout["text-field"]) {
        layout["text-font"] = ["sans-serif"];
      }

      return {
        ...layer,
        layout
      };
    });
}

export function createStyle() {
  return {
    version: 8,
    sources: {
      [BASEMAP_SOURCE_ID]: {
        type: "vector",
        url: BASEMAP_TILEJSON_URL
      }
    },
    layers: createBasemapLayers()
  };
}

function addTerrain(map) {
  map.addSource("terrain-dem", {
    type: "raster-dem",
    url: TERRAIN_TILEJSON_URL,
    encoding: "terrarium"
  });

  map.addSource(HILLSHADE_LAYER_ID, {
    type: "raster-dem",
    url: TERRAIN_TILEJSON_URL,
    encoding: "terrarium"
  });

  map.setTerrain({
    source: "terrain-dem",
    exaggeration: 1.0
  });

  map.addLayer({
    id: HILLSHADE_LAYER_ID,
    type: "hillshade",
    source: HILLSHADE_LAYER_ID,
    paint: {
      "hillshade-highlight-color": "rgba(255,255,255,0.15)",
      "hillshade-shadow-color": "rgba(0,0,0,0.35)",
      "hillshade-accent-color": "rgba(180,140,100,0.2)",
      "hillshade-illumination-direction": 315,
      "hillshade-exaggeration": 1.0
    }
  });
}

function addControls(map) {
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-left");

  map.addControl(
    new LayerControl({
      collapsed: true,
      layers: Object.keys(CONTROLLED_LAYERS),
      layerStates: Object.fromEntries(
        Object.entries(CONTROLLED_LAYERS).map(([layerId, name]) => [layerId, { name }])
      ),
      showStyleEditor: false,
      showOpacitySlider: true,
      showLayerSymbol: true,
      panelMaxHeight: 420
    }),
    "bottom-left"
  );
}

export function initMap(container, options = {}) {
  ensurePmtilesProtocol();

  const map = new maplibregl.Map({
    container,
    style: options.style ?? createStyle(),
    center: options.center ?? DEFAULT_CENTER,
    zoom: options.zoom ?? DEFAULT_ZOOM,
    pitch: options.pitch ?? DEFAULT_PITCH,
    bearing: options.bearing ?? DEFAULT_BEARING,
    maxZoom: 22,
    hash: "map",
    attributionControl: options.attributionControl !== false,
    localIdeographFontFamily: "sans-serif"
  });

  map.once("load", () => {
    try {
      addTerrain(map);
      addControls(map);
    } catch (error) {
      console.error("Failed to finish configuring the Mapshell runtime.", error);
      throw error;
    }
  });

  map.on("error", (event) => {
    console.error("MapLibre runtime error", event.error ?? event);
  });

  return map;
}
