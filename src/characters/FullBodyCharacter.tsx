import React from "react";
import {Img, staticFile, useCurrentFrame} from "remotion";
import {speakAt} from "../captions/speaking";
import type {WordCue} from "../captions/WordCaptionTrack";
import {FPS} from "../styles/palette";

/*
 * FullBodyCharacter — tokoh anime FULL-BODY (gambar tegak hasil
 * photo_to_anime.py --size WxH, misal 512x1024) yang berdiri sebadan
 * di dalam adegan, tanpa bingkai kartu.
 *
 * Beda dari AnimeCharacter (kartu portrait persegi berbingkai): di sini
 * tokoh tampil seperti di video anime viral — satu figur utuh berdiri
 * di latar, kaki menapak di "lantai" adegan, tanpa bingkai.
 *
 * Gerakannya sama seperti AnimeCharacter (adaptasi speaking.ts):
 *   - saat VO mengucapkan kata: tokoh naik sedikit + membesar (denyut
 *     bicara, puncak di tengah kata) + angguk kecil;
 *   - saat VO diam: goyang pelan + napas halus;
 *   - plus Ken Burns lambat (zoom maju-mundur halus sepanjang adegan).
 * Semua deterministik per frame. transformOrigin di kaki ("50% 100%")
 * supaya kaki tetap menapak saat tokoh membesar/naik.
 */

export const FullBodyCharacter: React.FC<{
  /** Path relatif di public/, misal "characters/jokowi-fullbody/anime.png". */
  src: string;
  /** Kata-kata adegan ini (dari word_timing.py) — penentu gerak bicara. */
  words?: WordCue[];
  /** Tinggi tokoh di layar (px). Default 1360 (kepala ~y80, kaki ~y1440). */
  height?: number;
  /** Rasio lebar/tinggi gambar. Default 0.5 (gambar 512x1024). */
  aspect?: number;
}> = ({src, words, height = 1360, aspect = 0.5}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const {open} = speakAt(words, t);

  // Napas halus (selalu ada) + goyangan pelan saat diam.
  const breathe = Math.sin(t * 1.6) * 0.004;
  const sway = Math.sin(t * 0.7) * 0.6; // derajat
  // Denyut bicara: naik + membesar saat mengucapkan kata.
  const bob = -10 * open;
  const pulse = 1 + 0.018 * open + breathe;
  // Sedikit "angguk" saat bicara: rotasi kecil mengikuti open.
  const nod = 0.5 * open;
  // Ken Burns lambat: zoom maju-mundur halus (periode ~18 dtk).
  const kenBurns = 1 + 0.02 * Math.sin(t * 0.35);

  const w = height * aspect;

  return (
    <div
      style={{
        width: w,
        height,
        transform: `translateY(${bob}px) rotate(${sway + nod}deg) scale(${pulse * kenBurns})`,
        transformOrigin: "50% 100%",
        filter: "drop-shadow(0 24px 30px rgba(0,0,0,0.5))",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}}
      />
    </div>
  );
};
