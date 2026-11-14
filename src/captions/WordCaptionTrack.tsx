import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {C, FONT, FPS, W} from "../styles/palette";

/*
 * Karaoke captions: words appear one by one as the voice-over speaks them,
 * instead of the whole caption block showing at once. The active word is
 * yellow, spoken words are bone, upcoming words are laid out but invisible
 * (so the block never reflows as words appear).
 *
 * Word timings come from word_timing.py (faster-whisper + alignment to the
 * script) as src/captions/words/<stem>.words.json. `lines` is the caption's
 * line breaks; the word counts of the lines must add up to words.length.
 * Same look as CaptionTrack: 40 px, dark pill, lower band (y 1380).
 */

export type WordCue = {
  w: string; // display word, exactly as in the script
  start: number; // seconds, relative to the narration audio start
  end: number; // seconds
};

export type WordCaptionCue = {
  from: number; // global start frame of the scene
  len: number; // scene length in frames
  words: WordCue[];
  lines: string[];
  y?: number;
};

const WordLine: React.FC<{words: WordCue[]; t: number}> = ({words, t}) => (
  <div style={{display: "flex", flexWrap: "wrap", justifyContent: "center"}}>
    {words.map((word, i) => {
      const active = t >= word.start && t < word.end;
      const fade = interpolate(t, [word.start - 0.03, word.start + 0.09], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return (
        <span
          key={i}
          style={{
            opacity: fade,
            color: active ? C.yellow : C.bone,
            fontWeight: active ? 900 : 800,
            display: "inline-block",
            marginRight: "0.28em",
          }}
        >
          {word.w}
        </span>
      );
    })}
  </div>
);

const WordCueView: React.FC<{cue: WordCaptionCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // Group the flat word list into the caption's lines, in order.
  const lineWords: WordCue[][] = [];
  let idx = 0;
  for (const line of cue.lines) {
    const count = line.split(" ").filter(Boolean).length;
    lineWords.push(cue.words.slice(idx, idx + count));
    idx += count;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        width: W - 180,
        top: cue.y ?? 1380,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 40,
          lineHeight: 1.4,
          textAlign: "center",
          backgroundColor: "rgba(0,0,0,0.55)",
          padding: "14px 28px",
          borderRadius: 18,
          textShadow: "0 2px 8px rgba(0,0,0,0.85)",
        }}
      >
        {lineWords.map((words, i) => (
          <WordLine key={i} words={words} t={t} />
        ))}
      </div>
    </div>
  );
};

export const WordCaptionTrack: React.FC<{cues: WordCaptionCue[]}> = ({cues}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={c.len}>
        <WordCueView cue={c} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
