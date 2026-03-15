const VERBS = ['show', 'hide', 'zoom', 'focus', 'filter', 'style', 'inspect', 'remove'];
const TARGET_VERBS = new Set(['zoom', 'focus']);

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

  const objects = phrase
    .filter(token => !fillers.has(token))
    .join(' ')
    .split(/\band\b/g)
    .map(token => token.trim())
    .filter(Boolean);

  return { verb, objects, raw };
}
