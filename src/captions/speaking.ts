import type {WordCue} from "./WordCaptionTrack";

/*
 * Si Lidi talks when the VO talks. Word timings (from word_timing.py) give
 * every word a [start, end) window in seconds, relative to the narration
 * audio start — which is also the local scene time (each scene Sequence
 * starts its Narration at frame 0). So at local time t:
 *   - inside a word window  -> speaking, mouth opens (peaks mid-word)
 *   - in a gap / silence    -> silent, mouth closed
 * Deterministic per frame: same frame always draws the same mouth.
 */

export function speakAt(
  words: WordCue[] | undefined,
  t: number,
): {speaking: boolean; open: number} {
  if (!words) return {speaking: false, open: 0};
  for (const w of words) {
    if (t >= w.start && t < w.end) {
      const p = (t - w.start) / Math.max(0.01, w.end - w.start);
      return {speaking: true, open: Math.sin(Math.PI * Math.min(1, Math.max(0, p)))};
    }
  }
  return {speaking: false, open: 0};
}
