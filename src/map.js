/**
 * Mapshell Map Initializer
 * Creates and returns a configured MapLibre GL JS map instance.
 *
 * Requires `maplibregl` to be available as a global (CDN) or imported separately.
 */

/**
 * Initialize a MapLibre GL JS map.
 *
 * @param {string|HTMLElement} container - Map container element or its HTML id
 * @param {Object} [options={}]
 * @param {string|Object} [options.style] - MapLibre style URL or style object
 * @param {[number, number]} [options.center] - Initial center [longitude, latitude]
 * @param {number} [options.zoom] - Initial zoom level
 * @param {boolean} [options.attributionControl] - Show attribution control (default true)
 * @returns {maplibregl.Map}
 */
export function initMap(container, options = {}) {
  return new maplibregl.Map({
    container,
    style: options.style || 'https://tiles.openfreemap.org/styles/liberty',
    center: options.center || [0, 20],
    zoom: options.zoom !== undefined ? options.zoom : 2,
    attributionControl: options.attributionControl !== false
  });
}
