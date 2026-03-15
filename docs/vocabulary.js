export const vocabulary = Object.freeze({
  roads: {
    description: "road transportation network",
    layers: {
      protomaps: ["roads"],
      osm: ["highway"],
      gsi: ["road"]
    }
  },
  railways: {
    description: "rail transportation network",
    layers: {
      protomaps: ["rail"],
      osm: ["railway"],
      gsi: ["railway"]
    }
  },
  airports: {
    description: "airport runways, taxiways, and terminals",
    layers: {
      protomaps: ["aeroway"],
      osm: ["aeroway"],
      gsi: ["airport"]
    }
  },
  buildings: {
    description: "building footprints",
    layers: {
      protomaps: ["buildings"],
      osm: ["building"],
      gsi: ["building"]
    }
  },
  waterways: {
    description: "rivers, streams, and canals",
    layers: {
      protomaps: ["waterway"],
      osm: ["waterway"],
      gsi: ["waterway"]
    }
  },
  inlandwater: {
    description: "lakes, reservoirs, and ponds",
    layers: {
      protomaps: ["water"],
      osm: ["natural=water", "water"],
      gsi: ["waterarea"]
    }
  },
  coastline: {
    description: "coastal boundary between land and sea",
    layers: {
      protomaps: ["coastline"],
      osm: ["natural=coastline"],
      gsi: ["coastline"]
    }
  },
  ocean: {
    description: "ocean and sea areas",
    layers: {
      protomaps: ["ocean"],
      osm: ["place=sea", "natural=coastline"],
      gsi: ["sea"]
    }
  },
  elevation: {
    description: "terrain shading and elevation surfaces",
    layers: {
      protomaps: ["hillshade"],
      osm: ["ele"],
      gsi: ["dem"]
    }
  },
  contours: {
    description: "elevation contour lines",
    layers: {
      protomaps: ["contours"],
      osm: ["contour"],
      gsi: ["contour"]
    }
  },
  pois: {
    description: "points of interest",
    layers: {
      protomaps: ["pois"],
      osm: ["amenity", "shop", "tourism"],
      gsi: ["poi"]
    }
  },
  landuse: {
    description: "land use and land cover polygons",
    layers: {
      protomaps: ["landuse"],
      osm: ["landuse"],
      gsi: ["landform"]
    }
  }
});

const cloneValue = (value) => {
  if (value == null) {
    return null;
  }

  return JSON.parse(JSON.stringify(value));
};

export const getVocabulary = (term) => {
  if (typeof term !== "string") {
    return null;
  }

  return cloneValue(vocabulary[term.trim().toLowerCase()] ?? null);
};

export const listVocabulary = () => Object.keys(vocabulary);

globalThis.MapshellVocabulary = Object.freeze({
  getVocabulary,
  listVocabulary
});

globalThis.getVocabulary = getVocabulary;
globalThis.listVocabulary = listVocabulary;
