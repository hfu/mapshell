import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCommand } from '../src/command_parser.js';

test('parses a basic verb-noun command', () => {
  assert.deepEqual(parseCommand('show roads'), {
    verb: 'show',
    objects: ['roads'],
    raw: 'show roads'
  });
});

test('parses multiple objects joined with and', () => {
  assert.deepEqual(parseCommand('show roads and buildings'), {
    verb: 'show',
    objects: ['roads', 'buildings'],
    raw: 'show roads and buildings'
  });
});

test('ignores optional filler words for object commands', () => {
  assert.deepEqual(parseCommand('hide all the buildings and waterways'), {
    verb: 'hide',
    objects: ['buildings', 'waterways'],
    raw: 'hide all the buildings and waterways'
  });
});

test('ignores optional movement words for zoom commands', () => {
  assert.deepEqual(parseCommand('zoom to tokyo'), {
    verb: 'zoom',
    target: 'tokyo',
    raw: 'zoom to tokyo'
  });
});

test('normalizes mixed-case input before parsing', () => {
  assert.deepEqual(parseCommand('Show The Roads And Buildings'), {
    verb: 'show',
    objects: ['roads', 'buildings'],
    raw: 'Show The Roads And Buildings'
  });
});

test('parses near as a spatial operator between two objects', () => {
  assert.deepEqual(parseCommand('show hospitals near coast'), {
    verb: 'show',
    objects: ['hospitals'],
    spatial: {
      operator: 'near',
      object: 'coast'
    },
    raw: 'show hospitals near coast'
  });
});
