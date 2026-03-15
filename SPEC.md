# Mapshell Specification

Mapshell is an experimental command-driven map interface.
Users control a web map using simple verb–noun commands, similar to a shell interface.

---

## Vocabulary

The canonical geographic vocabulary consists of plural nouns that represent logical map layers.
These terms do **not** directly correspond to MapLibre GL JS layer IDs; they are resolved
through the public semantic registry in `docs/vocabulary.json` and matched to
actual style layers via `config/datasets.json`.

| Term         | Category  | Description                                      |
|--------------|-----------|--------------------------------------------------|
| `roads`      | transport | Road network (motorways, primary, local roads)   |
| `railways`   | transport | Railway lines and transit corridors              |
| `airports`   | transport | Airport runways, taxiways, and aprons            |
| `buildings`  | built     | Building footprints                              |
| `waterways`  | water     | Rivers, streams, and canals                      |
| `inlandwater`| water     | Lakes, reservoirs, and ponds                     |
| `coastline`  | water     | Coastal boundary                                 |
| `ocean`      | water     | Ocean and sea fill                               |
| `elevation`  | terrain   | Hillshade and terrain shading                    |
| `contours`   | terrain   | Elevation contour lines                          |
| `landuse`    | land      | Land use and land cover polygons                 |
| `pois`       | places    | Points of interest                               |

Vocabulary is registered in `docs/vocabulary.json`.

---

## Commands

Commands follow a short, verb-first grammar with optional natural-language filler
words:

```text
command            ::= visibility-command
                     | navigation-command
                     | inspect-command
                     | filter-command
                     | style-command

visibility-command ::= ("show" | "hide" | "remove") [article]... <term>
navigation-command ::= ("zoom" | "focus") [direction] <location> [zoom-level]
inspect-command    ::= "inspect" [article]... [<term>]
filter-command     ::= "filter" [article]... <term> <expr>
style-command      ::= "style" [article]... <term> <property>

article            ::= "the" | "all"
direction          ::= "to"
```

The parser strips only these filler words when they appear immediately after the
verb. Everything after the noun remains in `args` for vocabulary resolution or
later command-specific handling.

This keeps commands simple, predictable, natural to read, and easy for an LLM
to generate.

### Supported verbs

| Verb      | Usage                          | Description                              |
|-----------|--------------------------------|------------------------------------------|
| `show`    | `show <term>`                  | Make a vocabulary layer visible          |
| `hide`    | `hide <term>`                  | Hide a vocabulary layer                  |
| `remove`  | `remove <term>`                | Alias for `hide`                         |
| `zoom`    | `zoom <location> [zoom-level]` | Fly to a named location or coordinates   |
| `focus`   | `focus <location>`             | Alias for `zoom`                         |
| `filter`  | `filter <term> <expr>`         | Apply a filter to a layer *(planned)*    |
| `style`   | `style <term> <property>`      | Override a layer style *(planned)*       |
| `inspect` | `inspect [term]`               | List matched layers and their visibility |

### Examples

```
show roads
show the roads
hide buildings
hide all buildings
zoom sapporo
zoom to tokyo
zoom tokyo 14
zoom 35.689 139.691 12
inspect roads
inspect all
inspect
```

---

## Architecture

### Component overview

```
User input
    │
    ▼
command_parser.js      Tokenises input → { verb, objects } / { verb, target }
    │
    ▼
dataset_resolver.js    Resolves noun → layerPatterns via datasets.json
    │
    ▼
action_engine.js       Maps { verb, layerPatterns } → MapLibre API calls
    │
    ▼
MapLibre GL JS         Renders tiles and applies layer changes
```

### Configuration files

| File                    | Purpose                                                      |
|-------------------------|--------------------------------------------------------------|
| `docs/vocabulary.json`  | Canonical term registry with dataset-layer mappings          |
| `config/datasets.json`  | Maps vocabulary terms to layer ID patterns in the map style  |
| `config/styles.json`    | Default paint/layout properties for custom layer additions   |

### Layer resolution strategy

`config/datasets.json` defines `layerPatterns` for each vocabulary term.
At runtime, the action engine scans `map.getStyle().layers` and collects all
layer IDs that contain any of the patterns as a substring.

This approach is style-agnostic: it works with any OpenMapTiles-compatible
style (e.g. OpenFreeMap Liberty, MapTiler Basic, Protomaps basemap) without
needing to enumerate exact layer IDs up front.

### Source modules

| File                    | Description                                                  |
|-------------------------|--------------------------------------------------------------|
| `src/command_parser.js` | `parseCommand(input)` → parsed command object                |
| `src/dataset_resolver.js`| `DatasetResolver` class – resolve terms to dataset configs  |
| `src/action_engine.js`  | `ActionEngine` class – execute actions on a MapLibre map     |
| `src/map.js`            | `initMap(container, options)` – create a MapLibre map        |

### Demo site (`docs/`)

The `docs/` directory hosts the built GitHub Pages runtime.
Vite compiles the source entrypoint and inlines the JavaScript and CSS so the
final deliverable remains a self-contained `docs/index.html`.

---

## Future directions

The following capabilities are intentionally **not** implemented yet:

- LLM / natural-language command integration
- `filter` and `style` command implementations
- Advanced layer styling and theming
- Analytics overlays
- Custom geocoder for the `zoom` command
