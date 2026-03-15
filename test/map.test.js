import assert from "node:assert/strict";
import test from "node:test";

import maplibregl from "maplibre-gl";

import { addControls } from "../src/map.js";

test("adds navigation, layer, and geolocation controls without changing placement", () => {
  const originalNavigationControl = maplibregl.NavigationControl;
  const originalGeolocateControl = maplibregl.GeolocateControl;
  const calls = [];
  const map = {
    addControl(control, position) {
      calls.push({ control, position });
    }
  };

  class FakeNavigationControl {}
  class FakeGeolocateControl {}

  maplibregl.NavigationControl = FakeNavigationControl;
  maplibregl.GeolocateControl = FakeGeolocateControl;

  try {
    addControls(map);
  } finally {
    maplibregl.NavigationControl = originalNavigationControl;
    maplibregl.GeolocateControl = originalGeolocateControl;
  }

  assert.deepEqual(
    calls.map(({ control, position }) => [control.constructor.name, position]),
    [
      ["FakeNavigationControl", "bottom-left"],
      ["LayerControl", "bottom-left"],
      ["FakeGeolocateControl", "bottom-left"]
    ]
  );
});
