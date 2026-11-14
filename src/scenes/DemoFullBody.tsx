import React from "react";
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {Narration} from "../audio/Narration";
import {WordCaptionCue, WordCaptionTrack, WordCue} from "../captions/WordCaptionTrack";
import {speakAt} from "../captions/speaking";
import {TagLabel, VoiceBars} from "../characters/AnimeCharacter";
import {FullBodyCharacter} from "../characters/FullBodyCharacter";
import {C, FPS, H, W} from "../styles/palette";
import w01 from "../captions/words/fb-01.words.json";
import w02 from "../captions/words/fb-02.words.json";
import w03 from "../captions/words/fb-03.words.json";
import w04 from "../captions/words/fb-04.words.json";

/*
 * DEMO FULL-BODY — video pengantar mode full-body (~17 dtk, 4 adegan).
 * Tokoh: "jokowi-fullbody" (gambar tegak 512x1024 hasil AnimeGANv3 Hayao
 * dari foto domain publik "Mahathir Mohamad walking with Joko Widodo",
 * crop ke Jokowi saja; kaki menapak di karpet merah seperti foto aslinya).
 * Narasi demo BERSIFAT NETRAL — pengantar cara kerja alat ini — BUKAN
 * kutipan atau pernyataan yang dikaitkan dengan orangnya, dan BUKAN
 * narasi politik. Adegan ijazah/pengadilan dari video referensi TIDAK
 * ditiru — referensi itu hanya contoh gaya full-body.
 *
 * Tiap adegan satu panggung utuh dengan tokoh sebadan di dalamnya (pola
 * stickman-story: latar literal terhadap narasi). Panjang adegan =
 * durasi narasi + ~0,8 dtk. Caption karaoke (WordCaptionTrack),
 * VO TikTok TTS id_001. Tanpa watermark/endcard/teks merek di layar.
 */

const ANIME = "characters/jokowi-fullbody/anime.png";
const FOTO = "characters/jokowi-fullbody/source-crop.jpg";

type SceneDef = {
  len: number;
  audio: string;
  kind: "stage" | "outdoor" | "voice" | "transform";
  words: WordCue[];
  lines: string[];
};

const SCENES: SceneDef[] = [
  {len: 102, audio: "audio/fb-01.mp3", kind: "stage", words: (w01 as {words: WordCue[]}).words, lines: ["Ini mode full-body", "anime-story."]},
  {len: 154, audio: "audio/fb-02.mp3", kind: "outdoor", words: (w02 as {words: WordCue[]}).words, lines: ["Tokohnya tampil sebadan,", "berdiri di satu adegan utuh."]},
  {len: 160, audio: "audio/fb-03.mp3", kind: "voice", words: (w03 as {words: WordCue[]}).words, lines: ["Karakternya tetap bicara mengikuti suara,", "dengan caption karaoke."]},
  {len: 104, audio: "audio/fb-04.mp3", kind: "transform", words: (w04 as {words: WordCue[]}).words, lines: ["Satu foto,", "jadi tokoh sebadan."]},
];

export const DEMO_FULLBODY_FRAMES = SCENES.reduce((sum, s) => sum + s.len, 0);

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

/** Karpet merah di lantai — literal dari foto sumber (karpet merah). */
const RedCarpet: React.FC<{top: number; height?: number}> = ({top, height = 260}) => (
  <div
    style={{
      ...BG,
      top,
      height,
      background: `linear-gradient(180deg, #C22E3A 0%, #8E1B26 100%)`,
      borderTop: "10px solid #E8C763",
    }}
  />
);

/** Adegan 1 — panggung hangat: tokoh sebadan di tengah, karpet merah di bawah. */
const StageScene: React.FC<{words: WordCue[]}> = ({words}) => (
  <AbsoluteFill>
    <div style={{...BG, background: `linear-gradient(180deg, ${C.warmTop} 0%, ${C.warmBottom} 100%)`}} />
    <div
      style={{
        position: "absolute", left: 540 - 420, top: 420, width: 840, height: 840,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(232,199,99,0.28) 0%, rgba(232,199,99,0) 70%)",
      }}
    />
    <RedCarpet top={1440} />
    <div style={{position: "absolute", left: 540 - 340, top: 80}}>
      <FullBodyCharacter src={ANIME} words={words} height={1360} />
    </div>
    <FloorShadow cx={540} top={1450} w={460} />
  </AbsoluteFill>
);

/** Adegan 2 — luar ruangan: langit, pepohonan, karpet merah; tokoh berdiri di adegan utuh. */
const OutdoorScene: React.FC<{words: WordCue[]}> = ({words}) => (
  <AbsoluteFill>
    <div style={{...BG, background: `linear-gradient(180deg, ${C.skyTop} 0%, ${C.skyBottom} 62%, #E8B96A 100%)`}} />
    <div style={{position: "absolute", left: 90, top: 150, width: 180, height: 180, borderRadius: "50%", backgroundColor: C.sun, boxShadow: "0 0 80px 30px rgba(242,193,78,0.55)"}} />
    {/* Pepohonan di kiri dan kanan */}
    <div style={{position: "absolute", left: 60, top: 980, width: 220, height: 220, borderRadius: "50%", backgroundColor: "#3F6B34"}} />
    <div style={{position: "absolute", left: 130, top: 1150, width: 36, height: 330, backgroundColor: "#5A3A22", borderRadius: 12}} />
    <div style={{position: "absolute", left: 800, top: 1020, width: 200, height: 200, borderRadius: "50%", backgroundColor: "#4A7A3E"}} />
    <div style={{position: "absolute", left: 870, top: 1180, width: 32, height: 300, backgroundColor: "#5A3A22", borderRadius: 12}} />
    <div style={{position: "absolute", left: -200, top: 1420, width: 1500, height: 500, borderRadius: "50%", backgroundColor: C.hillFar}} />
    <RedCarpet top={1440} />
    <div style={{position: "absolute", left: 540 - 340, top: 80}}>
      <FullBodyCharacter src={ANIME} words={words} height={1360} />
    </div>
    <FloorShadow cx={540} top={1450} w={460} />
  </AbsoluteFill>
);

/** Adegan 3 — bicara mengikuti suara: bar suara berdenyut dengan kata. */
const VoiceScene: React.FC<{words: WordCue[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const {open} = speakAt(words, t);
  return (
    <AbsoluteFill>
      <div style={{...BG, background: `linear-gradient(180deg, ${C.plum} 0%, #171019 100%)`}} />
      <div style={{position: "absolute", left: 540 - 295, top: 100}}>
        <FullBodyCharacter src={ANIME} words={words} height={1180} />
      </div>
      <FloorShadow cx={540} top={1290} w={400} />
      <div style={{position: "absolute", left: 540 - 130, top: 1330}}>
        <VoiceBars open={open} />
      </div>
    </AbsoluteFill>
  );
};

/** Adegan 4 — foto berubah jadi tokoh sebadan: crop foto asli vs anime, berdampingan. */
const TransformScene: React.FC<{words: WordCue[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // Panah "berubah" berdenyut pelan sepanjang adegan.
  const pulse = 1 + 0.08 * Math.sin(t * 3);
  return (
    <AbsoluteFill>
      <div style={{...BG, background: `linear-gradient(180deg, #1E2A44 0%, #12151F 100%)`}} />
      <div style={{position: "absolute", left: 60, top: 240, display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
        <TagLabel text="FOTO" />
        <div style={{width: 440, height: 940, borderRadius: 28, overflow: "hidden", border: "6px solid #E9E7DF", boxShadow: "0 24px 60px rgba(0,0,0,0.55)", backgroundColor: "#222"}}>
          <Img src={staticFile(FOTO)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 50%", display: "block"}} />
        </div>
      </div>
      <div
        style={{
          position: "absolute", left: 540 - 50, top: 680, width: 100, textAlign: "center",
          fontFamily: "Inter", fontWeight: 900, fontSize: 96, color: C.yellow,
          transform: `scale(${pulse})`, textShadow: "0 4px 18px rgba(0,0,0,0.6)",
        }}
      >
        →
      </div>
      <div style={{position: "absolute", left: 580, top: 240, display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
        <TagLabel text="ANIME" />
        <FullBodyCharacter src={ANIME} words={words} height={940} />
      </div>
    </AbsoluteFill>
  );
};

const SceneBody: React.FC<{scene: SceneDef}> = ({scene}) => {
  switch (scene.kind) {
    case "stage":
      return <StageScene words={scene.words} />;
    case "outdoor":
      return <OutdoorScene words={scene.words} />;
    case "voice":
      return <VoiceScene words={scene.words} />;
    case "transform":
      return <TransformScene words={scene.words} />;
  }
};

export const DemoFullBody: React.FC = () => (
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
