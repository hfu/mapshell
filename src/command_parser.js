/**
 * Mapshell Command Parser
 * Parses shell-style commands into structured action objects.
 */

/** Supported command verbs. */
export const VERBS = ['show', 'hide', 'zoom', 'focus', 'filter', 'style', 'inspect', 'remove'];

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

  const noun = tokens[1] || null;
  const args = tokens.slice(2);

  return { verb, noun, args, raw };
}
