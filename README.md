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

---

## Project structure

```
mapshell/
├── SPEC.md               # Vocabulary, commands, and architecture
├── README.md
├── config/
│   ├── vocabulary.json   # Canonical geographic vocabulary with categories
│   ├── datasets.json     # Maps vocabulary terms to style layer patterns
│   └── styles.json       # Default paint/layout properties
├── src/
│   ├── command_parser.js    # parseCommand(input) → action object
│   ├── dataset_resolver.js  # DatasetResolver – resolve terms to datasets
│   ├── action_engine.js     # ActionEngine – execute actions on a MapLibre map
│   └── map.js               # initMap(container, options) – create a map
└── docs/
    ├── index.html        # Demo page (GitHub Pages)
    ├── main.js           # Self-contained demo logic (no build step)
    └── style.css         # Demo styles
```

---

## Running the demo locally

No build step is required. Serve the repository root with any static file server:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8080/docs/` in your browser.

---

## Command reference

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

Full vocabulary and architecture: see [SPEC.md](SPEC.md).

---

## Vocabulary

Canonical geographic terms (plural nouns):

`roads` · `railways` · `airports` · `buildings` · `waterways` · `inlandwater` ·
`coastline` · `ocean` · `elevation` · `contours` · `landuse` · `pois`

---

## Design principles

- **Simplicity first** – minimal vocabulary, minimal code
- **Command-driven interaction** – all map state changes via commands
- **JSON configuration** – vocabulary and datasets are data, not code
- **No build step** – plain ES modules, no bundler required
- **No heavy frameworks** – vanilla JavaScript only

---

## Tile source

The demo uses the free [OpenFreeMap](https://openfreemap.org/) Liberty style.
To use a different tile source (e.g. Protomaps, MapTiler, a local Martin server),
update `config/datasets.json` with your source's layer patterns and change the
style URL in `docs/main.js`.

---

## License

[CC0 1.0 Universal](LICENSE) – public domain
