import "./styles.css";
import { vocabulary } from "./vocabulary.js";
import { parseCommand } from "./command_parser.js";
import { ActionEngine } from "./action_engine.js";
import { initMap, MAP_TITLE } from "./map.js";
import datasets from "../config/datasets.json";

const commandForm = document.querySelector("#command-form");
const commandInput = document.querySelector("#command-input");
const commandLog = document.querySelector("#command-log");
const statusBar = document.querySelector("#status-bar");
const loadingOverlay = document.querySelector("#loading-overlay");

if (!commandForm || !commandInput || !commandLog || !statusBar || !loadingOverlay) {
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

const actionEngine = new ActionEngine(map, datasets, {}, vocabulary);

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

const appendCommandLog = (text, parsedCommand) => {
  const entry = document.createElement("article");
  entry.className = "command-log-entry";

  const command = document.createElement("p");
  command.className = "command-log-command";
  command.textContent = `> ${text}`;

  const output = document.createElement("pre");
  output.className = "command-log-output";
  output.textContent = JSON.stringify(parsedCommand, null, 2);

  entry.append(command, output);
  commandLog.prepend(entry);

  while (commandLog.childElementCount > 6) {
    commandLog.lastElementChild?.remove();
  }
};

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = commandInput.value.trim();

  if (!text) {
    return;
  }

  const parsedCommand = parseCommand(text);
  const execution = actionEngine.execute(parsedCommand);
  console.log("Parsed command:", parsedCommand, "Execution:", execution);
  appendCommandLog(text, { parsed: parsedCommand, execution });
  commandInput.value = "";
});

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
