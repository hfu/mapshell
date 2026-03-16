/**
 * Mapshell Action Engine
 * Executes parsed commands as MapLibre GL JS map operations.
 */

/**
 * Built-in location registry used by the zoom and focus commands.
 * Keys are lowercase, space-free location names.
 */
const LOCATIONS = {
  world:         { center: [0, 20],          zoom: 2  },
  europe:        { center: [15, 50],          zoom: 4  },
  asia:          { center: [100, 35],         zoom: 3  },
  northamerica:  { center: [-95, 45],         zoom: 3  },
  southamerica:  { center: [-60, -15],        zoom: 3  },
  africa:        { center: [20, 5],           zoom: 3  },
  oceania:       { center: [140, -25],        zoom: 4  },
  japan:         { center: [138, 36],         zoom: 5  },
  sapporo:       { center: [141.354, 43.062], zoom: 11 },
  tokyo:         { center: [139.691, 35.689], zoom: 10 },
  yokohama:      { center: [139.638, 35.444], zoom: 12 },
  osaka:         { center: [135.502, 34.693], zoom: 11 },
  kyoto:         { center: [135.768, 35.012], zoom: 12 },
  nagoya:        { center: [136.906, 35.181], zoom: 12 },
  hiroshima:     { center: [132.459, 34.385], zoom: 12 },
  fukuoka:       { center: [130.401, 33.590], zoom: 12 },
  london:        { center: [-0.118, 51.509],  zoom: 11 },
  paris:         { center: [2.349, 48.857],   zoom: 11 },
  berlin:        { center: [13.405, 52.520],  zoom: 11 },
  amsterdam:     { center: [4.902, 52.374],   zoom: 12 },
  rome:          { center: [12.496, 41.903],  zoom: 12 },
  barcelona:     { center: [2.173, 41.385],   zoom: 12 },
  madrid:        { center: [-3.703, 40.416],  zoom: 11 },
  vienna:        { center: [16.373, 48.208],  zoom: 12 },
  zurich:        { center: [8.541, 47.376],   zoom: 13 },
  newyork:       { center: [-74.006, 40.713], zoom: 11 },
  losangeles:    { center: [-118.243, 34.052],zoom: 11 },
  chicago:       { center: [-87.629, 41.878], zoom: 11 },
  sanfrancisco:  { center: [-122.419, 37.774],zoom: 12 },
  seattle:       { center: [-122.332, 47.606],zoom: 12 },
  sydney:        { center: [151.209, -33.868],zoom: 11 },
  melbourne:     { center: [144.963, -37.814],zoom: 11 },
  beijing:       { center: [116.407, 39.904], zoom: 10 },
  shanghai:      { center: [121.474, 31.230], zoom: 11 },
  singapore:     { center: [103.820, 1.352],  zoom: 11 },
  dubai:         { center: [55.296, 25.276],  zoom: 11 },
  mumbai:        { center: [72.877, 19.076],  zoom: 11 },
  nairobi:       { center: [36.817, -1.286],  zoom: 11 },
  cairo:         { center: [31.235, 30.044],  zoom: 11 },
  saopaulo:      { center: [-46.633, -23.549],zoom: 11 },
  buenosaires:   { center: [-58.381, -34.603],zoom: 11 }
};

const SPATIAL_RESULTS_SOURCE_ID = 'mapshell-spatial-results';
const SPATIAL_RESULTS_LAYER_IDS = {
  fill: 'mapshell-spatial-results-fill',
  line: 'mapshell-spatial-results-line',
  point: 'mapshell-spatial-results-point'
};
const NEAR_DISTANCE_THRESHOLD = 0.05;

export class ActionEngine {
  /**
   * @param {maplibregl.Map} map - MapLibre GL JS map instance
   * @param {Object} datasets - Dataset registry from config/datasets.json
   * @param {Object} styles - Style registry from config/styles.json
   * @param {Object} vocabulary - Vocabulary registry loaded for command terms
   */
  constructor(map, datasets, styles, vocabulary) {
    this.map = map;
    this.datasets = datasets;
    this.styles = styles;
    this.vocabulary = vocabulary;
  }

  /**
   * Execute a parsed command action.
   *
   * Accepts either the internal action format ({ noun, args }) or the parser
   * output format ({ objects } / { target }).
   *
   * @param {{ verb: string, noun?: string|null, args?: string[], objects?: string[], target?: string|null }
   *        |{ error: string }} action
   * @returns {{ ok: boolean, message: string }}
   */
  execute(action) {
    if (action.error) {
      return { ok: false, message: action.error };
    }

    if (action.spatial?.operator === 'near') {
      const [subject = null] = action.objects ?? [];
      return this._showNear(subject, action.spatial.object, action.verb);
    }

    if (Array.isArray(action.objects) && ['show', 'hide', 'remove'].includes(action.verb)) {
      const handlers = {
        show: this._show,
        hide: this._hide,
        remove: this._hide
      };
      const handler = handlers[action.verb];
      const results = action.objects.map((term) => handler.call(this, term));
      const failures = results.filter(({ ok }) => !ok);
      const messageSources = failures.length > 0 ? failures : results;

      return {
        ok: failures.length === 0,
        message: messageSources.map(({ message }) => message).join('; ')
      };
    }

    const normalizedAction = this._normalizeAction(action);

    switch (normalizedAction.verb) {
      case 'show':    return this._show(normalizedAction.noun);
      case 'hide':    return this._hide(normalizedAction.noun);
      case 'remove':  return this._hide(normalizedAction.noun);
      case 'zoom':    return this._zoom(normalizedAction.noun, normalizedAction.args);
      case 'focus':   return this._zoom(normalizedAction.noun, normalizedAction.args);
      case 'filter':  return this._filter(normalizedAction.noun, normalizedAction.args);
      case 'style':   return this._styleLayer(normalizedAction.noun, normalizedAction.args);
      case 'inspect': return this._inspect(normalizedAction.noun);
      default:
        return { ok: false, message: `Unsupported verb: "${normalizedAction.verb}"` };
    }
  }

  // ── private handlers ──────────────────────────────────────────────────────

  _show(term) {
    if (!term) {
      return { ok: false, message: 'show requires a noun — e.g. "show roads"' };
    }
    const dataset = this._getDataset(term);
    if (!dataset) return { ok: false, message: this._unknownTermMsg(term) };

    const layers = this._findLayers(dataset.layerPatterns);
    if (layers.length === 0) {
      return { ok: false, message: `No matching layers found for "${term}" in the current style` };
    }
    layers.forEach(id => this.map.setLayoutProperty(id, 'visibility', 'visible'));
    return { ok: true, message: `Showing ${term} (${layers.length} layer${layers.length !== 1 ? 's' : ''})` };
  }

  _hide(term) {
    if (!term) {
      return { ok: false, message: 'hide requires a noun — e.g. "hide roads"' };
    }
    const dataset = this._getDataset(term);
    if (!dataset) return { ok: false, message: this._unknownTermMsg(term) };

    const layers = this._findLayers(dataset.layerPatterns);
    if (layers.length === 0) {
      return { ok: false, message: `No matching layers found for "${term}" in the current style` };
    }
    layers.forEach(id => this.map.setLayoutProperty(id, 'visibility', 'none'));
    return { ok: true, message: `Hiding ${term} (${layers.length} layer${layers.length !== 1 ? 's' : ''})` };
  }

  _zoom(noun, args = []) {
    if (!noun) {
      return { ok: false, message: 'zoom requires a location — e.g. "zoom tokyo"' };
    }

    // Support coordinate pairs: "zoom 35.689 139.691" (lat lng) or "zoom 139.691 35.689 12" (lng lat zoom)
    const first = parseFloat(noun);
    const second = parseFloat(args[0]);
    if (!isNaN(first) && !isNaN(second)) {
      const zoom = args[1] ? parseFloat(args[1]) : 12;
      // Interpret as [lat, lng] for natural language; MapLibre expects [lng, lat]
      this.map.flyTo({ center: [second, first], zoom, duration: 1500 });
      return { ok: true, message: `Zoomed to [${first}, ${second}] zoom ${zoom}` };
    }

    // Join noun and remaining args to support multi-word names like "new york"
    const rawName = [noun, ...args].join('');
    const key = rawName.replace(/\s+/g, '').toLowerCase();
    const location = LOCATIONS[key];

    if (!location) {
      const known = Object.keys(LOCATIONS).join(', ');
      return { ok: false, message: `Unknown location: "${noun}${args.length ? ' ' + args.join(' ') : ''}". Known locations: ${known}` };
    }

    const zoom = location.zoom;
    this.map.flyTo({ center: location.center, zoom, duration: 1500 });
    return { ok: true, message: `Zoomed to ${noun}${args.length ? ' ' + args.join(' ') : ''}` };
  }

  _filter(_term, _args) {
    return { ok: false, message: 'filter command is not yet implemented' };
  }

  _styleLayer(_term, _args) {
    return { ok: false, message: 'style command is not yet implemented' };
  }

  _inspect(term) {
    if (!term) {
      const style = this.map.getStyle();
      if (!style) return { ok: false, message: 'Map style not yet loaded' };
      const ids = style.layers.map(l => l.id);
      return { ok: true, message: `All style layers (${ids.length}): ${ids.join(', ')}` };
    }

    const dataset = this._getDataset(term);
    if (!dataset) return { ok: false, message: this._unknownTermMsg(term) };

    const layers = this._findLayers(dataset.layerPatterns);
    const visibility = layers.map(id => {
      const v = this.map.getLayoutProperty(id, 'visibility');
      return `${id}=${v || 'visible'}`;
    });
    const summary = layers.length > 0
      ? visibility.join(', ')
      : 'no matching layers in current style';
    return { ok: true, message: `"${term}": ${summary}` };
  }

  _showNear(term, referenceTerm, verb) {
    if (verb !== 'show') {
      return { ok: false, message: `"${verb}" does not yet support the near operator` };
    }

    if (!term || !referenceTerm) {
      return { ok: false, message: 'show near requires two nouns — e.g. "show schools near rivers"' };
    }

    const dataset = this._getDataset(term);
    if (!dataset) return { ok: false, message: this._unknownTermMsg(term) };

    const referenceDataset = this._getDataset(referenceTerm);
    if (!referenceDataset) return { ok: false, message: this._unknownTermMsg(referenceTerm) };

    const layers = this._findLayers(dataset.layerPatterns);
    if (layers.length === 0) {
      return { ok: false, message: `No matching layers found for "${term}" in the current style` };
    }

    const referenceLayers = this._findLayers(referenceDataset.layerPatterns);
    if (referenceLayers.length === 0) {
      return { ok: false, message: `No matching layers found for "${referenceTerm}" in the current style` };
    }

    layers.forEach(id => this.map.setLayoutProperty(id, 'visibility', 'visible'));
    referenceLayers.forEach(id => this.map.setLayoutProperty(id, 'visibility', 'visible'));

    const features = this._queryFeatures(layers, dataset);
    const referenceFeatures = this._queryFeatures(referenceLayers, referenceDataset);
    const matches = features.filter(feature =>
      referenceFeatures.some(referenceFeature => this._featuresAreNear(feature, referenceFeature))
    );

    this._updateSpatialResults(matches);

    return {
      ok: true,
      message: `Showing ${term} near ${referenceTerm} (${matches.length} feature${matches.length !== 1 ? 's' : ''})`
    };
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  /**
   * Return the dataset config for a term, filtering out internal keys.
   * @param {string} term
   * @returns {Object|null}
   */
  _getDataset(term) {
    if (!term || term.startsWith('_')) return null;
    return this.datasets[term] || null;
  }

  /**
   * Find all style layer IDs whose id contains any of the given patterns.
   * @param {string[]} patterns
   * @returns {string[]}
   */
  _findLayers(patterns) {
    if (!patterns || patterns.length === 0) return [];
    const style = this.map.getStyle();
    if (!style || !style.layers) return [];
    return style.layers
      .filter(layer =>
        patterns.some(p => layer.id.toLowerCase().includes(p.toLowerCase()))
      )
      .map(layer => layer.id);
  }

  _queryFeatures(layers, dataset) {
    if (typeof this.map.queryRenderedFeatures !== 'function') {
      return [];
    }

    return this.map
      .queryRenderedFeatures({ layers })
      .filter(feature => this._matchesFeatureSelector(feature, dataset.featureSelectors));
  }

  _matchesFeatureSelector(feature, selectors) {
    if (!selectors) return true;

    return Object.entries(selectors).some(([property, acceptedValues]) => {
      const featureValue = feature?.properties?.[property];
      const normalizedFeatureValues = Array.isArray(featureValue)
        ? featureValue.map(value => String(value).toLowerCase())
        : featureValue == null
          ? []
          : [String(featureValue).toLowerCase()];

      return acceptedValues.some(value => normalizedFeatureValues.includes(String(value).toLowerCase()));
    });
  }

  _featuresAreNear(feature, referenceFeature) {
    const featureBounds = this._getGeometryBounds(feature?.geometry);
    const referenceBounds = this._getGeometryBounds(referenceFeature?.geometry);

    if (!featureBounds || !referenceBounds) {
      return false;
    }

    const xDistance = Math.max(0, featureBounds[0] - referenceBounds[2], referenceBounds[0] - featureBounds[2]);
    const yDistance = Math.max(0, featureBounds[1] - referenceBounds[3], referenceBounds[1] - featureBounds[3]);

    return Math.hypot(xDistance, yDistance) <= NEAR_DISTANCE_THRESHOLD;
  }

  _getGeometryBounds(geometry) {
    const coordinates = [];
    this._collectCoordinates(geometry, coordinates);

    if (coordinates.length === 0) {
      return null;
    }

    const [firstX, firstY] = coordinates[0];
    return coordinates.reduce(
      ([minX, minY, maxX, maxY], [x, y]) => [
        Math.min(minX, x),
        Math.min(minY, y),
        Math.max(maxX, x),
        Math.max(maxY, y)
      ],
      [firstX, firstY, firstX, firstY]
    );
  }

  _collectCoordinates(geometry, coordinates) {
    if (!geometry) {
      return;
    }

    if (geometry.type === 'GeometryCollection') {
      geometry.geometries?.forEach(item => this._collectCoordinates(item, coordinates));
      return;
    }

    this._walkCoordinates(geometry.coordinates, coordinates);
  }

  _walkCoordinates(value, coordinates) {
    if (!Array.isArray(value) || value.length === 0) {
      return;
    }

    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      coordinates.push([value[0], value[1]]);
      return;
    }

    value.forEach(item => this._walkCoordinates(item, coordinates));
  }

  _updateSpatialResults(features) {
    const source = this.map.getSource?.(SPATIAL_RESULTS_SOURCE_ID);
    const data = {
      type: 'FeatureCollection',
      features: features.map(feature => ({
        type: 'Feature',
        id: feature.id,
        properties: feature.properties ?? {},
        geometry: feature.geometry
      }))
    };

    if (source && typeof source.setData === 'function') {
      source.setData(data);
    } else {
      this.map.addSource?.(SPATIAL_RESULTS_SOURCE_ID, {
        type: 'geojson',
        data
      });
    }

    this._ensureSpatialResultsLayers();
  }

  _ensureSpatialResultsLayers() {
    const definitions = [
      {
        id: SPATIAL_RESULTS_LAYER_IDS.fill,
        type: 'fill',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': '#f6c945',
          'fill-opacity': 0.45,
          'fill-outline-color': '#ffe388'
        }
      },
      {
        id: SPATIAL_RESULTS_LAYER_IDS.line,
        type: 'line',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': '#f6c945',
          'line-width': 4
        }
      },
      {
        id: SPATIAL_RESULTS_LAYER_IDS.point,
        type: 'circle',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-color': '#f6c945',
          'circle-radius': 7,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      }
    ];

    definitions.forEach((definition) => {
      if (this.map.getLayer?.(definition.id)) {
        return;
      }

      this.map.addLayer?.({
        ...definition,
        source: SPATIAL_RESULTS_SOURCE_ID
      });
    });
  }

  /**
   * Build an "unknown term" error message with available terms.
   * @param {string} term
   * @returns {string}
   */
  _unknownTermMsg(term) {
    const available = Object.keys(this.datasets)
      .filter(k => !k.startsWith('_'))
      .join(', ');
    return `Unknown term: "${term}". Available: ${available}`;
  }

  _normalizeAction(action) {
    if (action.target !== undefined) {
      return {
        verb: action.verb,
        noun: action.target,
        args: []
      };
    }

    if (action.noun !== undefined || action.args !== undefined) {
      return {
        verb: action.verb,
        noun: action.noun ?? null,
        args: action.args ?? []
      };
    }

    const [noun = null, ...args] = action.objects ?? [];
    return {
      verb: action.verb,
      noun,
      args
    };
  }
}
