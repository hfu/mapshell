import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ActionEngine } from "../src/action_engine.js";

const datasets = JSON.parse(
  readFileSync(new URL("../config/datasets.json", import.meta.url), "utf8")
);

const createMap = () => {
  const layoutCalls = [];
  const flyCalls = [];
  const sourceCalls = [];
  const layerAdds = [];
  const sources = new Map();
  const addedLayers = new Map();
  const features = [
    {
      id: "school-near-river",
      layer: { id: "poi_labels" },
      properties: { class: "school" },
      geometry: { type: "Point", coordinates: [0.01, 0.01] }
    },
    {
      id: "school-far-river",
      layer: { id: "poi_labels" },
      properties: { class: "school" },
      geometry: { type: "Point", coordinates: [2, 2] }
    },
    {
      id: "hospital-near-coast",
      layer: { id: "poi_labels" },
      properties: { class: "hospital" },
      geometry: { type: "Point", coordinates: [1.01, 1.01] }
    },
    {
      id: "river-a",
      layer: { id: "waterway_main" },
      properties: {},
      geometry: { type: "LineString", coordinates: [[0, 0], [0.03, 0.03]] }
    },
    {
      id: "coast-a",
      layer: { id: "coastline_main" },
      properties: {},
      geometry: { type: "LineString", coordinates: [[1, 1], [1.04, 1.04]] }
    }
  ];

  return {
    layoutCalls,
    flyCalls,
    sourceCalls,
    layerAdds,
    sources,
    getStyle() {
      return {
        layers: [
          { id: "roads_major" },
          { id: "roads_highway" },
          { id: "building" },
          { id: "water" },
          { id: "poi_labels" },
          { id: "waterway_main" },
          { id: "coastline_main" }
        ]
      };
    },
    setLayoutProperty(id, property, value) {
      layoutCalls.push({ id, property, value });
    },
    flyTo(options) {
      flyCalls.push(options);
    },
    queryRenderedFeatures(options = {}) {
      const layers = options.layers;
      return layers ? features.filter((feature) => layers.includes(feature.layer.id)) : features;
    },
    addSource(id, definition) {
      sourceCalls.push({ id, definition });
      sources.set(id, {
        ...definition,
        setData(data) {
          this.data = data;
        }
      });
    },
    getSource(id) {
      return sources.get(id);
    },
    addLayer(definition) {
      layerAdds.push(definition);
      addedLayers.set(definition.id, definition);
    },
    getLayer(id) {
      return addedLayers.get(id) ?? null;
    }
  };
};

test("executes parsed multi-object show commands against matching layers", () => {
  const map = createMap();
  const engine = new ActionEngine(map, datasets, {}, {});

  const result = engine.execute({
    verb: "show",
    objects: ["roads", "buildings"],
    raw: "show roads and buildings"
  });

  assert.deepEqual(map.layoutCalls, [
    { id: "roads_major", property: "visibility", value: "visible" },
    { id: "roads_highway", property: "visibility", value: "visible" },
    { id: "building", property: "visibility", value: "visible" }
  ]);
  assert.deepEqual(result, {
    ok: true,
    message: "Showing roads (2 layers); Showing buildings (1 layer)"
  });
});

test("executes parsed hide commands against matching layers", () => {
  const map = createMap();
  const engine = new ActionEngine(map, datasets, {}, {});

  const result = engine.execute({
    verb: "hide",
    objects: ["buildings"],
    raw: "hide buildings"
  });

  assert.deepEqual(map.layoutCalls, [
    { id: "building", property: "visibility", value: "none" }
  ]);
  assert.deepEqual(result, {
    ok: true,
    message: "Hiding buildings (1 layer)"
  });
});

test("executes parsed zoom target commands", () => {
  const map = createMap();
  const engine = new ActionEngine(map, datasets, {}, {});

  const result = engine.execute({
    verb: "zoom",
    target: "tokyo",
    raw: "zoom to tokyo"
  });

  assert.deepEqual(map.flyCalls, [
    {
      center: [139.691, 35.689],
      zoom: 10,
      duration: 1500
    }
  ]);
  assert.deepEqual(result, {
    ok: true,
    message: "Zoomed to tokyo"
  });
});

test("shows only features that are near the reference dataset", () => {
  const map = createMap();
  const engine = new ActionEngine(map, datasets, {}, {});

  const result = engine.execute({
    verb: "show",
    objects: ["hospitals"],
    spatial: {
      operator: "near",
      object: "coast"
    },
    raw: "show hospitals near coast"
  });

  assert.deepEqual(map.layoutCalls, [
    { id: "poi_labels", property: "visibility", value: "visible" },
    { id: "coastline_main", property: "visibility", value: "visible" }
  ]);
  assert.equal(map.sourceCalls.length, 1);
  assert.equal(map.layerAdds.length, 3);
  assert.deepEqual(map.getSource("mapshell-spatial-results").data.features, [
    {
      type: "Feature",
      id: "hospital-near-coast",
      properties: { class: "hospital" },
      geometry: { type: "Point", coordinates: [1.01, 1.01] }
    }
  ]);
  assert.deepEqual(result, {
    ok: true,
    message: "Showing hospitals near coast (1 feature)"
  });
});
