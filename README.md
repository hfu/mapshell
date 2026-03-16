# Mapshell

Mapshell is an experimental **command-driven generative map interface** built on [MapLibre GL JS](https://maplibre.org/).
Maps are controlled with simple verb–noun commands, similar to a shell interface.

```
show roads
hide buildings
zoom sapporo
inspect waterways
```

→ **[Live demo](https://hfu.github.io/mapshell/docs/)**

Current demo status: the GitHub Pages page is built with Vite as a single self-contained `docs/index.html` runtime using MapLibre GL JS, Protomaps basemaps, and PMTiles-backed terrain. The runtime now parses typed commands in the UI, logs the parsed structure, and leaves command execution work to future issues.

---

## Project structure

```
mapshell/
├── SPEC.md               # Vocabulary, commands, and architecture
├── README.md
├── Justfile              # just dev / build / preview wrappers
├── index.html            # Vite entry HTML
├── package.json          # Pinned runtime dependencies
├── config/
│   ├── datasets.json     # Maps vocabulary terms to style layer patterns
│   └── styles.json       # Default paint/layout properties
├── docs/
│   ├── index.html        # Built single-file GitHub Pages runtime
│   ├── vocabulary.json   # Public semantic vocabulary registry
│   └── vocabulary.js     # Browser lookup helpers for the registry
├── src/
│   ├── main.js              # Runtime entrypoint
│   ├── command_parser.js    # parseCommand(input) → { verb, objects } / { verb, target }
│   ├── dataset_resolver.js  # DatasetResolver – resolve terms to datasets
│   ├── action_engine.js     # ActionEngine – execute actions on a MapLibre map
│   └── map.js               # initMap(container, options) – create a map
```

---

## Running the demo locally

Install the pinned dependencies once:

```bash
npm install
```

Use `just` to wrap the Vite workflow:

```bash
just dev
just build
just preview
```

`just dev` and `just preview` both run Vite with `--host`, so LAN access stays available.
The production build is written directly to `docs/index.html` as a self-contained single file.

---

## Planned command reference

| Verb      | Example                   | Description                            |
|-----------|---------------------------|----------------------------------------|
| `show`    | `show roads`              | Make a vocabulary layer visible        |
| `hide`    | `hide buildings`          | Hide a vocabulary layer                |
| `remove`  | `remove landuse`          | Alias for `hide`                       |
| `zoom`    | `zoom tokyo`              | Fly to a named location                |
| `zoom`    | `zoom 35.689 139.691 12`  | Fly to lat/lng at zoom level           |
| `focus`   | `focus europe`            | Alias for `zoom`                       |
| `inspect` | `inspect roads`           | Show matched layers and their state    |
| `inspect` | `inspect`                 | List all layers in the current style   |
| `show`    | `show hospitals near coast` | Highlight features that are spatially near another layer |

Full vocabulary and architecture: see [SPEC.md](SPEC.md).

---

## Vocabulary

Canonical geographic terms (plural nouns) are published in `docs/vocabulary.json`
and exposed in the browser console through `getVocabulary(term)` and
`listVocabulary()`:

`roads` · `railways` · `airports` · `buildings` · `waterways` · `rivers` ·
`inlandwater` · `coastline` · `coast` · `ocean` · `elevation` · `contours` ·
`landuse` · `pois` · `schools` · `hospitals`

---

## Design principles

- **Simplicity first** – minimal vocabulary, minimal code
- **Command-driven interaction** – all map state changes via commands
- **JSON configuration** – vocabulary and datasets are data, not code
- **Single-file deploy** – Vite builds a self-contained `docs/index.html`
- **No heavy frameworks** – vanilla JavaScript only

---

## Tile source

The runtime uses a Protomaps dark basemap from the Martin TileJSON endpoint:

- `https://tunnel.optgeo.org/martin/protomaps-basemap`

Terrain and hillshade come from:

- `https://tunnel.optgeo.org/martin/mapterhorn`

---

## License

[CC0 1.0 Universal](LICENSE) – public domain
