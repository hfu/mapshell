/**
 * Mapshell Command Parser
 * Parses shell-style commands into structured command objects.
 *
 * Grammar:
 *   command ::= object-command | target-command
 *   object-command ::= verb [filler...] object ("and" object)*
 *   spatial-command ::= verb [filler...] object "near" object
 *   target-command ::= ("zoom" | "focus") ["to"] target
 */

/** Supported command verbs. */
export const VERBS = ['show', 'hide', 'zoom', 'focus', 'filter', 'style', 'inspect', 'remove'];

const TARGET_VERBS = new Set(['zoom', 'focus']);

/** Optional natural-language filler words accepted after each verb. */
const FILLERS_BY_VERB = {
  show: new Set(['the', 'all']),
  hide: new Set(['the', 'all']),
  remove: new Set(['the', 'all']),
  zoom: new Set(['to']),
  focus: new Set(['to']),
  filter: new Set(['the', 'all']),
  style: new Set(['the', 'all']),
  inspect: new Set(['the', 'all'])
};

/**
 * Parse a command string into a structured command object.
 *
 * @param {string} input - Raw command string, e.g. "show roads" or "zoom tokyo"
 * @returns {{ verb: string, objects: string[], raw: string, spatial?: { operator: string, object: string } }
 *           |{ verb: string, target: string|null, raw: string }
 *           |{ error: string, raw: string }}
 *
 * @example
 * parseCommand('show roads')
 * // => { verb: 'show', objects: ['roads'], raw: 'show roads' }
 *
 * parseCommand('show roads and buildings')
 * // => { verb: 'show', objects: ['roads', 'buildings'], raw: 'show roads and buildings' }
 *
 * parseCommand('zoom to sapporo')
 * // => { verb: 'zoom', target: 'sapporo', raw: 'zoom to sapporo' }
 */
export function parseCommand(input) {
  const raw = input;
  const tokens = input.trim().toLowerCase().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { error: 'Empty command', raw };
  }

  const verb = tokens[0];

  if (!VERBS.includes(verb)) {
    return {
      error: `Unknown verb: "${verb}". Available verbs: ${VERBS.join(', ')}`,
      raw
    };
  }

  const phrase = tokens.slice(1);
  const fillers = FILLERS_BY_VERB[verb] || new Set();

  if (TARGET_VERBS.has(verb)) {
    let start = 0;

    while (start < phrase.length && fillers.has(phrase[start])) {
      start += 1;
    }

    return {
      verb,
      target: phrase.slice(start).join(' ') || null,
      raw
    };
  }

  const objectPhrase = phrase.filter(token => !fillers.has(token));
  const nearIndex = objectPhrase.indexOf('near');

  if (nearIndex !== -1) {
    const subject = objectPhrase.slice(0, nearIndex).join(' ').trim();
    const reference = objectPhrase.slice(nearIndex + 1).join(' ').trim();

    if (!subject || !reference) {
      return {
        error: 'near requires terms on both sides — e.g. "show schools near rivers"',
        raw
      };
    }

    return {
      verb,
      objects: [subject],
      spatial: {
        operator: 'near',
        object: reference
      },
      raw
    };
  }

  const objects = objectPhrase
    .join(' ')
    .split(/\band\b/g)
    .map(token => token.trim())
    .filter(Boolean);

  return { verb, objects, raw };
}
