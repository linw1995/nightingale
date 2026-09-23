import type { Segment } from '@/types/Transcript';

// Small timing leads keep lyric transitions visually in sync with the audio.
export const LYRICS_LEAD = 0.15;
export const WORD_HIGHLIGHT_LEAD = 0.25;
export const SEGMENT_LINGER = 0.5;
export const GAP_THRESHOLD_SEC = 3.5;
export const BUBBLE_COUNTDOWN_SEC = 3.0;

/** Finds the displayed segment in chronological order, independently of prior frames. */
export function findCurrentSegment(segments: Segment[], time: number): number {
  if (segments.length === 0) {
    return 0;
  }

  let low = 0;
  let high = segments.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (segments[mid].start - LYRICS_LEAD <= time) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const current = low - 1;
  if (current < 0) {
    return 0;
  }
  const next = current + 1;
  if (next >= segments.length || time <= segments[current].end + SEGMENT_LINGER) {
    return current;
  }

  // Keep a finished line through short pauses until the next line's lead-in.
  return segments[next].start - segments[current].end < GAP_THRESHOLD_SEC ? current : next;
}

export function computeLyricGapCaption(
  segments: Segment[],
  time: number,
  segIdx: number,
): string | null {
  const seg = segments.at(segIdx);
  if (!seg) {
    return null;
  }

  // Intro gaps do not get a HUD caption.
  if (segIdx === 0) {
    return null;
  }

  const gapBefore = seg.start - segments[segIdx - 1].end;
  const timeUntil = seg.start - time;
  const inGap = gapBefore >= GAP_THRESHOLD_SEC && timeUntil > 0;
  if (!inGap) {
    return null;
  }

  return `Next lyrics in ${Math.ceil(timeUntil)}s`;
}
