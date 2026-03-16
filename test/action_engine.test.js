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

  return {
    layoutCalls,
    flyCalls,
    getStyle() {
      return {
        layers: [
          { id: "roads_major" },
          { id: "roads_highway" },
          { id: "building" },
          { id: "water" }
        ]
      };
    },
    setLayoutProperty(id, property, value) {
      layoutCalls.push({ id, property, value });
    },
    flyTo(options) {
      flyCalls.push(options);
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
