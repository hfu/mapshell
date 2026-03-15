import "./styles.css";
import "../docs/vocabulary.js";
import { initMap, MAP_TITLE } from "./map.js";

const statusBar = document.querySelector("#status-bar");
const loadingOverlay = document.querySelector("#loading-overlay");

if (!statusBar || !loadingOverlay) {
  throw new Error("Mapshell runtime UI elements are missing.");
}

statusBar.textContent = MAP_TITLE;

let map;

try {
  map = initMap("map");
} catch (error) {
  console.error("Failed to initialize the Mapshell runtime.", error);
  throw error;
}

let isLoading = false;

const setLoading = (visible) => {
  if (visible === isLoading) {
    return;
  }

  isLoading = visible;
  loadingOverlay.classList.toggle("is-visible", visible);
  loadingOverlay.setAttribute("aria-hidden", String(!visible));
};

const getFeatureLabel = (feature) => {
  if (!feature) {
    return MAP_TITLE;
  }

  const name =
    feature.properties?.name ??
    feature.properties?.name_en ??
    feature.properties?.name_int ??
    feature.properties?.class ??
    feature.properties?.kind ??
    feature.layer?.id;

  return name ? `${MAP_TITLE} · ${name}` : MAP_TITLE;
};

setLoading(true);

map.on("dataloading", () => setLoading(true));
map.on("idle", () => setLoading(false));
map.on("error", () => setLoading(false));
map.getCanvas().addEventListener("mouseleave", () => {
  statusBar.textContent = MAP_TITLE;
});
map.on("mousemove", (event) => {
  const [feature] = map.queryRenderedFeatures(event.point);
  statusBar.textContent = getFeatureLabel(feature);
});
