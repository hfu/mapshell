/**
 * Mapshell Dataset Resolver
 * Resolves canonical vocabulary terms to their dataset configurations.
 */

export class DatasetResolver {
  /**
   * @param {Object} datasets - Dataset registry loaded from config/datasets.json
   */
  constructor(datasets) {
    this.datasets = datasets;
  }

  /**
   * Resolve a vocabulary term to its dataset configuration.
   *
   * @param {string} term - Canonical vocabulary term, e.g. "roads"
   * @returns {Object|null} Dataset configuration or null if the term is not registered
   */
  resolve(term) {
    return this.datasets[term] || null;
  }

  /**
   * List all registered vocabulary terms (excludes internal keys starting with "_").
   *
   * @returns {string[]}
   */
  listTerms() {
    return Object.keys(this.datasets).filter(k => !k.startsWith('_'));
  }

  /**
   * Check whether a vocabulary term is registered.
   *
   * @param {string} term
   * @returns {boolean}
   */
  has(term) {
    return term in this.datasets && !term.startsWith('_');
  }
}
