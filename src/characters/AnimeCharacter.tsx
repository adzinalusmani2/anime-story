import React from "react";
import {Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {speakAt} from "../captions/speaking";
import type {WordCue} from "../captions/WordCaptionTrack";
import {FPS} from "../styles/palette";

/*
 * AnimeCharacter — tokoh anime (portrait PNG hasil photo_to_anime.py)
 * yang "bicara" mengikuti VO.
 *
 * Gerakannya adaptasi dari konsep speaking.ts milik stickman-story:
 *   - saat VO mengucapkan kata (speakAt -> open 0..1): portrait naik
 *     sedikit + membesar (denyut bicara, puncak di tengah kata);
 *   - saat VO diam: portrait bergoyang pelan (sway) + napas halus.
 * Semua deterministik per frame: frame yang sama selalu menggambar
 * gambar yang sama. Tidak ada timer atau angka acak tanpa seed.
 *
 * Portrait ditampilkan sebagai kartu persegi berbingkai (rounded rect
 * + border + bayangan lembut) supaya terlihat seperti "tokoh" di panggung,
 * bukan sekadar gambar ditempel.
 */

export const AnimeCharacter: React.FC<{
  /** Path relatif di public/, misal "characters/jokowi/anime.png". */
  src: string;
  /** Kata-kata adegan ini (dari word_timing.py) — penentu gerak bicara. */
  words?: WordCue[];
  /** Lebar kartu portrait (px). Default 680. */
  size?: number;
  /** Warna border kartu. Default emas. */
  border?: string;
  /** Skala tambahan (misal untuk portrait kecil di adegan foto->anime). */
  scale?: number;
}> = ({src, words, size = 680, border = "#E8C763", scale = 1}) => {
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

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `translateY(${bob}px) rotate(${sway + nod}deg) scale(${pulse * scale})`,
        transformOrigin: "50% 100%",
        borderRadius: 28,
        overflow: "hidden",
        border: `6px solid ${border}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        backgroundColor: "#222",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}}
      />
    </div>
  );
};

/** Bar suara animasi: tinggi bar mengikuti `open` (gerak bicara). */
export const VoiceBars: React.FC<{open: number; color?: string}> = ({open, color = "#E8C763"}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <div style={{display: "flex", alignItems: "center", gap: 10, height: 90}}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const phase = Math.sin(t * 6 + i * 1.1);
        const h = 18 + (open > 0 ? 34 * open : 6) * (0.55 + 0.45 * phase) + 10 * Math.max(0, phase);
        return (
          <div
            key={i}
            style={{
              width: 12,
              height: Math.max(10, Math.min(90, h)),
              borderRadius: 6,
              backgroundColor: color,
              opacity: 0.55 + 0.45 * open,
            }}
          />
        );
      })}
    </div>
  );
};

/** Label kecil di atas kartu (misal "FOTO" / "ANIME"). */
export const TagLabel: React.FC<{text: string; color?: string}> = ({text, color = "#111213"}) => (
  <div
    style={{
      fontFamily: "Inter",
      fontWeight: 900,
      fontSize: 34,
      letterSpacing: 4,
      color,
      backgroundColor: "#E8C763",
      padding: "8px 22px",
      borderRadius: 999,
      boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
    }}
  >
    {text}
  </div>
);

// Re-export agar scene bisa memakai speakAt tanpa import ganda.
export {speakAt};
export const __interpolate = interpolate;
