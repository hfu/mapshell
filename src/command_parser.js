/**
 * Mapshell Command Parser
 * Parses shell-style commands into structured action objects.
 *
 * Grammar:
 *   command ::= verb [filler...] [noun] [args...]
 *   filler  ::= "the" | "all" | "to"
 */

/** Supported command verbs. */
export const VERBS = ['show', 'hide', 'zoom', 'focus', 'filter', 'style', 'inspect', 'remove'];

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
 * Parse a command string into a structured action object.
 *
 * @param {string} input - Raw command string, e.g. "show roads" or "zoom tokyo"
 * @returns {{ verb: string, noun: string|null, args: string[], raw: string }
 *           |{ error: string, raw: string }}
 *
 * @example
 * parseCommand('show roads')
 * // => { verb: 'show', noun: 'roads', args: [], raw: 'show roads' }
 *
 * parseCommand('zoom sapporo 12')
 * // => { verb: 'zoom', noun: 'sapporo', args: ['12'], raw: 'zoom sapporo 12' }
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
  let start = 0;

  while (start < phrase.length && fillers.has(phrase[start])) {
    start += 1;
  }

  const noun = phrase[start] || null;
  const args = phrase.slice(start + 1);

  return { verb, noun, args, raw };
}
