import React from "react";
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {Narration} from "../audio/Narration";
import {WordCaptionCue, WordCaptionTrack, WordCue} from "../captions/WordCaptionTrack";
import {speakAt} from "../captions/speaking";
import {AnimeCharacter, TagLabel, VoiceBars} from "../characters/AnimeCharacter";
import {C, FPS, H, W} from "../styles/palette";
import w01 from "../captions/words/demo-01.words.json";
import w02 from "../captions/words/demo-02.words.json";
import w03 from "../captions/words/demo-03.words.json";
import w04 from "../captions/words/demo-04.words.json";

/*
 * DEMO ANIME-STORY — video pengantar (~17 dtk, 4 adegan).
 * Tokoh: "jokowi" (portrait anime hasil AnimeGANv3 Hayao dari potret resmi
 * 2019, domain publik). Narasi demo BERSIFAT NETRAL — pengantar cara kerja
 * alat ini — BUKAN kutipan atau pernyataan yang dikaitkan dengan orangnya.
 *
 * Tiap adegan punya latar yang literal terhadap narasinya (pola
 * stickman-story): studio, foto-berubah-jadi-anime, bicara-mengikuti-suara,
 * latar pemandangan. Panjang adegan = durasi narasi + ~0,8 dtk.
 * Caption karaoke (WordCaptionTrack), VO TikTok TTS id_001.
 * Tanpa watermark/endcard/teks merek di layar.
 */

const ANIME = "characters/jokowi/anime.png";
const FOTO = "characters/jokowi/source.jpg";

type SceneDef = {
  len: number;
  audio: string;
  kind: "studio" | "transform" | "voice" | "landscape";
  words: WordCue[];
  lines: string[];
};

const SCENES: SceneDef[] = [
  {len: 111, audio: "audio/demo-01.mp3", kind: "studio", words: (w01 as {words: WordCue[]}).words, lines: ["Halo! Ini demo", "anime-story."]},
  {len: 138, audio: "audio/demo-02.mp3", kind: "transform", words: (w02 as {words: WordCue[]}).words, lines: ["Foto orang nyata bisa berubah", "jadi karakter anime."]},
  {len: 150, audio: "audio/demo-03.mp3", kind: "voice", words: (w03 as {words: WordCue[]}).words, lines: ["Karakternya bicara mengikuti suara,", "dengan caption karaoke."]},
  {len: 122, audio: "audio/demo-04.mp3", kind: "landscape", words: (w04 as {words: WordCue[]}).words, lines: ["Tiap adegan punya latar", "yang sesuai dengan cerita."]},
];

export const DEMO_JOKOWI_FRAMES = SCENES.reduce((sum, s) => sum + s.len, 0);

const STARTS: number[] = [];
SCENES.reduce((acc, s) => {
  STARTS.push(acc);
  return acc + s.len;
}, 0);

const CAPTIONS: WordCaptionCue[] = SCENES.map((s, i) => ({
  from: STARTS[i],
  len: s.len,
  words: s.words,
  lines: s.lines,
}));

const BG: React.CSSProperties = {position: "absolute", left: 0, top: 0, width: W, height: H};

const FloorShadow: React.FC<{cx: number; top: number; w?: number}> = ({cx, top, w = 520}) => (
  <div
    style={{
      position: "absolute",
      left: cx - w / 2,
      top,
      width: w,
      height: 44,
      borderRadius: "50%",
      backgroundColor: "rgba(0,0,0,0.45)",
    }}
  />
);

/** Adegan 1 — studio hangat: portrait besar di tengah, glow emas di belakang. */
const StudioScene: React.FC<{words: WordCue[]}> = ({words}) => (
  <AbsoluteFill>
    <div style={{...BG, background: `linear-gradient(180deg, ${C.warmTop} 0%, ${C.warmBottom} 100%)`}} />
    <div
      style={{
        position: "absolute", left: 540 - 420, top: 540, width: 840, height: 840,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(232,199,99,0.28) 0%, rgba(232,199,99,0) 70%)",
      }}
    />
    <div style={{position: "absolute", left: 540 - 340, top: 620}}>
      <AnimeCharacter src={ANIME} words={words} size={680} />
    </div>
    <FloorShadow cx={540} top={1310} />
  </AbsoluteFill>
);

/** Adegan 2 — foto berubah jadi anime: foto asli vs portrait anime, berdampingan. */
const TransformScene: React.FC<{words: WordCue[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // Panah "berubah" berdenyut pelan sepanjang adegan.
  const pulse = 1 + 0.08 * Math.sin(t * 3);
  return (
    <AbsoluteFill>
      <div style={{...BG, background: `linear-gradient(180deg, #1E2A44 0%, #12151F 100%)`}} />
      <div style={{position: "absolute", left: 70, top: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
        <TagLabel text="FOTO" />
        <div style={{width: 400, height: 400, borderRadius: 28, overflow: "hidden", border: "6px solid #E9E7DF", boxShadow: "0 24px 60px rgba(0,0,0,0.55)", backgroundColor: "#222"}}>
          <Img src={staticFile(FOTO)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 18%", display: "block"}} />
        </div>
      </div>
      <div
        style={{
          position: "absolute", left: 540 - 70, top: 830, width: 140, textAlign: "center",
          fontFamily: "Inter", fontWeight: 900, fontSize: 110, color: C.yellow,
          transform: `scale(${pulse})`, textShadow: "0 4px 18px rgba(0,0,0,0.6)",
        }}
      >
        →
      </div>
      <div style={{position: "absolute", left: 610, top: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
        <TagLabel text="ANIME" />
        <AnimeCharacter src={ANIME} words={words} size={400} />
      </div>
    </AbsoluteFill>
  );
};

/** Adegan 3 — bicara mengikuti suara: bar suara berdenyut dengan kata. */
const VoiceScene: React.FC<{words: WordCue[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const {open} = speakAt(words, t);
  return (
    <AbsoluteFill>
      <div style={{...BG, background: `linear-gradient(180deg, ${C.plum} 0%, #171019 100%)`}} />
      <div style={{position: "absolute", left: 540 - 280, top: 640}}>
        <AnimeCharacter src={ANIME} words={words} size={560} />
      </div>
      <FloorShadow cx={540} top={1210} w={440} />
      <div style={{position: "absolute", left: 540 - 130, top: 1250}}>
        <VoiceBars open={open} />
      </div>
    </AbsoluteFill>
  );
};

/** Adegan 4 — latar pemandangan: langit, matahari, bukit, pohon. */
const LandscapeScene: React.FC<{words: WordCue[]}> = ({words}) => (
  <AbsoluteFill>
    <div style={{...BG, background: `linear-gradient(180deg, ${C.skyTop} 0%, ${C.skyBottom} 62%, #E8B96A 100%)`}} />
    <div style={{position: "absolute", left: 90, top: 150, width: 180, height: 180, borderRadius: "50%", backgroundColor: C.sun, boxShadow: "0 0 80px 30px rgba(242,193,78,0.55)"}} />
    <div style={{position: "absolute", left: -200, top: 1420, width: 1500, height: 500, borderRadius: "50%", backgroundColor: C.hillFar}} />
    <div style={{position: "absolute", left: -100, top: 1580, width: 1300, height: 420, borderRadius: "50%", backgroundColor: C.hill}} />
    {/* Pohon sederhana di kiri */}
    <div style={{position: "absolute", left: 150, top: 1150, width: 36, height: 330, backgroundColor: "#5A3A22", borderRadius: 12}} />
    <div style={{position: "absolute", left: 60, top: 980, width: 220, height: 220, borderRadius: "50%", backgroundColor: "#3F6B34"}} />
    <div style={{position: "absolute", left: 540 - 280, top: 740}}>
      <AnimeCharacter src={ANIME} words={words} size={560} border="#F2C14E" />
    </div>
    <FloorShadow cx={540} top={1310} w={440} />
  </AbsoluteFill>
);

const SceneBody: React.FC<{scene: SceneDef}> = ({scene}) => {
  switch (scene.kind) {
    case "studio":
      return <StudioScene words={scene.words} />;
    case "transform":
      return <TransformScene words={scene.words} />;
    case "voice":
      return <VoiceScene words={scene.words} />;
    case "landscape":
      return <LandscapeScene words={scene.words} />;
  }
};

export const DemoJokowi: React.FC = () => (
  <AbsoluteFill>
    {SCENES.map((scene, i) => (
      <Sequence key={i} from={STARTS[i]} durationInFrames={scene.len}>
        <SceneBody scene={scene} />
        <Narration file={scene.audio} />
      </Sequence>
    ))}
    <WordCaptionTrack cues={CAPTIONS} />
  </AbsoluteFill>
);
