import assert from 'node:assert/strict';
import test from 'node:test';

import { findCurrentSegment } from '../src/features/playback/utils/lyrics-gap.ts';
import { splitLongSegments } from '../src/features/playback/utils/transcript-segments.ts';

function segment(start, end, text) {
  return { start, end, text, words: [{ word: text, start, end }] };
}

test('estimated lines returned out of order cannot make playback switch endlessly', () => {
  const segments = splitLongSegments([
    segment(0.8, 1.5, 'title'),
    segment(2.4, 3.1, 'credit'),
    segment(4.0, 4.5, 'credit'),
    segment(0, 0.1, 'estimated credit'),
    segment(0, 0.1, 'another estimated credit'),
    segment(7.8, 8.5, 'first lyric'),
  ]);

  assert.deepEqual(
    segments.map(({ start }) => start),
    [0, 0, 0.8, 2.4, 4.0, 7.8],
  );
  assert.equal(findCurrentSegment(segments, 4.66), 4);
  assert.equal(findCurrentSegment(segments, 7.65), 5);

  let previous = 0;
  for (let tick = 0; tick <= 900; tick++) {
    const index = findCurrentSegment(segments, tick / 100);
    assert.ok(index >= previous, `segment index regressed at ${tick / 100}s`);
    previous = index;
  }
});

test('short gaps retain the previous line until the next lead-in', () => {
  const segments = [segment(1, 2, 'first'), segment(4, 5, 'second')];

  assert.equal(findCurrentSegment(segments, 2.6), 0);
  assert.equal(findCurrentSegment(segments, 3.84), 0);
  assert.equal(findCurrentSegment(segments, 3.85), 1);
});

test('long gaps select the upcoming line after the previous line lingers', () => {
  const segments = [segment(1, 2, 'first'), segment(8, 9, 'second')];

  assert.equal(findCurrentSegment(segments, 2.5), 0);
  assert.equal(findCurrentSegment(segments, 2.51), 1);
});
