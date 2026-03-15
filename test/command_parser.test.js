import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCommand } from '../src/command_parser.js';

test('parses a basic verb-noun command', () => {
  assert.deepEqual(parseCommand('show roads'), {
    verb: 'show',
    noun: 'roads',
    args: [],
    raw: 'show roads'
  });
});

test('ignores optional article words for layer commands', () => {
  assert.deepEqual(parseCommand('hide all the buildings'), {
    verb: 'hide',
    noun: 'buildings',
    args: [],
    raw: 'hide all the buildings'
  });
});

test('ignores optional movement words for zoom commands', () => {
  assert.deepEqual(parseCommand('zoom to tokyo 14'), {
    verb: 'zoom',
    noun: 'tokyo',
    args: ['14'],
    raw: 'zoom to tokyo 14'
  });
});

test('keeps inspect noun optional after ignoring filler words', () => {
  assert.deepEqual(parseCommand('inspect all'), {
    verb: 'inspect',
    noun: null,
    args: [],
    raw: 'inspect all'
  });
});
