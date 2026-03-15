/**
 * Mapshell – Demo entry point
 * Self-contained implementation of the command parser and action engine
 * for the GitHub Pages demo at docs/index.html.
 *
 * Architecture mirrors src/command_parser.js, src/action_engine.js,
 * src/dataset_resolver.js, and src/map.js.
 */

// ── Configuration (mirrors config/) ────────────────────────────────────────

const VOCABULARY = {
  roads:       { category: 'transport' },
  railways:    { category: 'transport' },
  airports:    { category: 'transport' },
  buildings:   { category: 'built'     },
  waterways:   { category: 'water'     },
  inlandwater: { category: 'water'     },
  coastline:   { category: 'water'     },
  ocean:       { category: 'water'     },
  elevation:   { category: 'terrain'   },
  contours:    { category: 'terrain'   },
  landuse:     { category: 'land'      },
  pois:        { category: 'places'    }
};

/**
 * Maps vocabulary terms to substring patterns matched against
 * MapLibre layer IDs in the loaded style (mirrors config/datasets.json).
 */
const DATASETS = {
  roads:       { layerPatterns: ['road_', 'road-', 'motorway', 'highway'] },
  railways:    { layerPatterns: ['railway', 'rail_', 'transit'] },
  airports:    { layerPatterns: ['aeroway', 'airport', 'runway', 'taxiway'] },
  buildings:   { layerPatterns: ['building'] },
  waterways:   { layerPatterns: ['waterway'] },
  inlandwater: { layerPatterns: ['water_', 'water-', 'lake', 'reservoir', 'pond'] },
  coastline:   { layerPatterns: ['coast', 'shoreline'] },
  ocean:       { layerPatterns: ['ocean', 'sea_', 'sea-'] },
  elevation:   { layerPatterns: ['hillshade', 'elevation', 'terrain'] },
  contours:    { layerPatterns: ['contour'] },
  landuse:     { layerPatterns: ['landuse', 'landcover', 'land_use', 'land_cover'] },
  pois:        { layerPatterns: ['poi'] }
};

/** Built-in locations for zoom/focus commands (mirrors src/action_engine.js). */
const LOCATIONS = {
  world:        { center: [0, 20],           zoom: 2  },
  europe:       { center: [15, 50],           zoom: 4  },
  asia:         { center: [100, 35],          zoom: 3  },
  northamerica: { center: [-95, 45],          zoom: 3  },
  southamerica: { center: [-60, -15],         zoom: 3  },
  africa:       { center: [20, 5],            zoom: 3  },
  oceania:      { center: [140, -25],         zoom: 4  },
  japan:        { center: [138, 36],          zoom: 5  },
  sapporo:      { center: [141.354, 43.062],  zoom: 11 },
  tokyo:        { center: [139.691, 35.689],  zoom: 10 },
  yokohama:     { center: [139.638, 35.444],  zoom: 12 },
  osaka:        { center: [135.502, 34.693],  zoom: 11 },
  kyoto:        { center: [135.768, 35.012],  zoom: 12 },
  nagoya:       { center: [136.906, 35.181],  zoom: 12 },
  hiroshima:    { center: [132.459, 34.385],  zoom: 12 },
  fukuoka:      { center: [130.401, 33.590],  zoom: 12 },
  london:       { center: [-0.118, 51.509],   zoom: 11 },
  paris:        { center: [2.349, 48.857],    zoom: 11 },
  berlin:       { center: [13.405, 52.520],   zoom: 11 },
  amsterdam:    { center: [4.902, 52.374],    zoom: 12 },
  rome:         { center: [12.496, 41.903],   zoom: 12 },
  barcelona:    { center: [2.173, 41.385],    zoom: 12 },
  madrid:       { center: [-3.703, 40.416],   zoom: 11 },
  vienna:       { center: [16.373, 48.208],   zoom: 12 },
  zurich:       { center: [8.541, 47.376],    zoom: 13 },
  newyork:      { center: [-74.006, 40.713],  zoom: 11 },
  losangeles:   { center: [-118.243, 34.052], zoom: 11 },
  chicago:      { center: [-87.629, 41.878],  zoom: 11 },
  sanfrancisco: { center: [-122.419, 37.774], zoom: 12 },
  seattle:      { center: [-122.332, 47.606], zoom: 12 },
  sydney:       { center: [151.209, -33.868], zoom: 11 },
  melbourne:    { center: [144.963, -37.814], zoom: 11 },
  beijing:      { center: [116.407, 39.904],  zoom: 10 },
  shanghai:     { center: [121.474, 31.230],  zoom: 11 },
  singapore:    { center: [103.820, 1.352],   zoom: 11 },
  dubai:        { center: [55.296, 25.276],   zoom: 11 },
  mumbai:       { center: [72.877, 19.076],   zoom: 11 },
  nairobi:      { center: [36.817, -1.286],   zoom: 11 },
  cairo:        { center: [31.235, 30.044],   zoom: 11 },
  saopaulo:     { center: [-46.633, -23.549], zoom: 11 },
  buenosaires:  { center: [-58.381, -34.603], zoom: 11 }
};

const VERBS = ['show', 'hide', 'zoom', 'focus', 'filter', 'style', 'inspect', 'remove'];

// ── Command Parser ──────────────────────────────────────────────────────────

function parseCommand(input) {
  const raw = input;
  const tokens = input.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { error: 'Empty command', raw };

  const verb = tokens[0];
  if (!VERBS.includes(verb)) {
    return {
      error: `Unknown verb: "${verb}". Available verbs: ${VERBS.join(', ')}`,
      raw
    };
  }
  return { verb, noun: tokens[1] || null, args: tokens.slice(2), raw };
}

// ── Dataset Resolver ────────────────────────────────────────────────────────

function resolveDataset(term) {
  return DATASETS[term] || null;
}

function listTerms() {
  return Object.keys(DATASETS);
}

// ── Action Engine ───────────────────────────────────────────────────────────

function findLayers(map, patterns) {
  if (!patterns || patterns.length === 0) return [];
  const style = map.getStyle();
  if (!style || !style.layers) return [];
  return style.layers
    .filter(layer => patterns.some(p => layer.id.toLowerCase().includes(p.toLowerCase())))
    .map(layer => layer.id);
}

function unknownTermMsg(term) {
  return `Unknown term: "${term}". Available: ${listTerms().join(', ')}`;
}

function executeAction(map, action) {
  if (action.error) return { ok: false, message: action.error };

  const { verb, noun, args } = action;

  // ── show / hide / remove ──────────────────────────────────────────────────
  if (verb === 'show' || verb === 'hide' || verb === 'remove') {
    if (!noun) {
      return { ok: false, message: `${verb} requires a noun — e.g. "${verb} roads"` };
    }
    const dataset = resolveDataset(noun);
    if (!dataset) return { ok: false, message: unknownTermMsg(noun) };

    const layers = findLayers(map, dataset.layerPatterns);
    if (layers.length === 0) {
      return { ok: false, message: `No matching layers found for "${noun}" in the current style` };
    }
    const visibility = (verb === 'show') ? 'visible' : 'none';
    layers.forEach(id => map.setLayoutProperty(id, 'visibility', visibility));
    const action_ = verb === 'show' ? 'Showing' : 'Hiding';
    return { ok: true, message: `${action_} ${noun} (${layers.length} layer${layers.length !== 1 ? 's' : ''})` };
  }

  // ── zoom / focus ──────────────────────────────────────────────────────────
  if (verb === 'zoom' || verb === 'focus') {
    if (!noun) {
      return { ok: false, message: `${verb} requires a location — e.g. "${verb} tokyo"` };
    }

    // Coordinate pair: "zoom 35.689 139.691"
    const first = parseFloat(noun);
    const second = parseFloat(args[0]);
    if (!isNaN(first) && !isNaN(second)) {
      const z = args[1] ? parseFloat(args[1]) : 12;
      map.flyTo({ center: [second, first], zoom: z, duration: 1500 });
      return { ok: true, message: `Zoomed to [${first}, ${second}] zoom ${z}` };
    }

    // Named location (supports multi-word: "new york" → "newyork")
    const key = [noun, ...args].join('').replace(/\s+/g, '').toLowerCase();
    const loc = LOCATIONS[key];
    if (!loc) {
      const known = Object.keys(LOCATIONS).join(', ');
      return { ok: false, message: `Unknown location: "${noun}${args.length ? ' ' + args.join(' ') : ''}". Known locations: ${known}` };
    }
    map.flyTo({ center: loc.center, zoom: loc.zoom, duration: 1500 });
    return { ok: true, message: `Zoomed to ${noun}${args.length ? ' ' + args.join(' ') : ''}` };
  }

  // ── inspect ───────────────────────────────────────────────────────────────
  if (verb === 'inspect') {
    if (!noun) {
      const style = map.getStyle();
      if (!style) return { ok: false, message: 'Map style not yet loaded' };
      const ids = style.layers.map(l => l.id);
      return { ok: true, message: `All style layers (${ids.length}): ${ids.join(', ')}` };
    }
    const dataset = resolveDataset(noun);
    if (!dataset) return { ok: false, message: unknownTermMsg(noun) };

    const layers = findLayers(map, dataset.layerPatterns);
    const detail = layers.length > 0
      ? layers.map(id => {
          const v = map.getLayoutProperty(id, 'visibility');
          return `${id}=${v || 'visible'}`;
        }).join(', ')
      : 'no matching layers in current style';
    return { ok: true, message: `"${noun}": ${detail}` };
  }

  // ── not yet implemented ───────────────────────────────────────────────────
  return { ok: false, message: `"${verb}" command is not yet implemented` };
}

// ── Shell UI ────────────────────────────────────────────────────────────────

const logEl  = document.getElementById('log');
const cmdEl  = document.getElementById('cmd');

/** Append an entry to the command log. */
function logEntry(text, type = 'info') {
  const glyphs = { input: '›', success: '✓', error: '✗', info: '·', hint: '·' };
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = `<span class="glyph">${glyphs[type] || '·'}</span><span>${escapeHtml(text)}</span>`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Command history for ↑/↓ navigation
const history = [];
let historyIndex = -1;

cmdEl.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIndex < history.length - 1) {
      historyIndex++;
      cmdEl.value = history[historyIndex];
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      cmdEl.value = history[historyIndex];
    } else {
      historyIndex = -1;
      cmdEl.value = '';
    }
    return;
  }
  if (e.key !== 'Enter') return;

  const raw = cmdEl.value.trim();
  if (!raw) return;

  history.unshift(raw);
  historyIndex = -1;
  cmdEl.value = '';

  logEntry(raw, 'input');

  const action = parseCommand(raw);
  if (action.error) {
    logEntry(action.error, 'error');
    return;
  }

  // Defer execution until after the map style is loaded
  if (!map.isStyleLoaded()) {
    map.once('styledata', () => {
      const result = executeAction(map, action);
      logEntry(result.message, result.ok ? 'success' : 'error');
    });
  } else {
    const result = executeAction(map, action);
    logEntry(result.message, result.ok ? 'success' : 'error');
  }
});

// ── Map initialisation ──────────────────────────────────────────────────────

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [0, 20],
  zoom: 2
});

map.on('load', () => {
  logEntry('Map loaded. Type a command below.', 'hint');
  logEntry('Examples:  show roads · hide buildings · zoom tokyo · inspect roads', 'hint');
  cmdEl.focus();
});

map.on('error', e => {
  logEntry(`Map error: ${e.error?.message || 'unknown'}`, 'error');
});
