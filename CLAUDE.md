# CLAUDE.md — anime-story

Panduan membangun video konten dari karakter anime di proyek Remotion ini
(1080 × 1920, 30 fps, TypeScript + React). Baca file ini dulu. Singkat
sengaja: buka hanya file yang ditunjuk.

Proyek ini TERPISAH dari Si Lidi dan dari stickman-story. Jangan ubah apa
pun di `~/workspace/stickman-story/` — itu hanya referensi baca. Jangan
pakai branding, antrean, caption, atau posting Si Lidi di sini.

## Di mana-mana

| Perlu | File |
|---|---|
| Foto → anime (AnimeGANv3 ONNX, CPU) | `photo_to_anime.py` (`--size WxH` untuk full-body) |
| Daftarkan tokoh | `make_character.py`, hasil di `characters/<nama>/` |
| Tokoh anime di video (gerak speaking-sync) | `src/characters/AnimeCharacter.tsx` |
| Tokoh anime full-body sebadan (tanpa bingkai) | `src/characters/FullBodyCharacter.tsx` |
| Bicara/diam dari timing kata (`speakAt`) | `src/captions/speaking.ts` |
| Caption karaoke kata-per-kata | `src/captions/WordCaptionTrack.tsx` |
| Timing kata (faster-whisper + alignment naskah) | `word_timing.py`, output di `src/captions/words/` |
| Narasi (VO) | `src/audio/Narration.tsx` |
| TTS demo (curl, id_001) | `tts_demo.py` |
| Warna, font, ukuran frame | `src/styles/palette.ts` |
| Daftar video yang bisa di-render | `src/Root.tsx` |

## Alur kerja (foto → video)

1. **Karakter:** `.venv/bin/python make_character.py <foto> <nama>
   [--style hayao|shinkai] [--crop x0,y0,x1,y1]` — crop dulu ke
   kepala+bahu bila foto aslinya lebar. Untuk **full-body**: crop ke satu
   orang sebadan + `--size 512x1024` (tegak, supaya tidak gepeng), lalu
   pakai `FullBodyCharacter` di scene. Cek hasil `anime.png` dengan
   mata sendiri sebelum dipakai — wajah full-body memang lebih kasar
   (lihat README, bagian "Mode full-body").
2. **Naskah + VO:** tulis teks per segmen, generate MP3 dengan pola
   `tts_demo.py` (curl, TikTok TTS id_001) ke `public/audio/`.
3. **Timing kata:** tambahkan teks ke `SCRIPTS` di `word_timing.py`,
   jalankan `.venv/bin/python word_timing.py <stem>...`.
4. **Scene:** salin `src/scenes/DemoJokowi.tsx`, ganti tokoh/latar/teks,
   daftarkan di `src/Root.tsx`. Panjang adegan = durasi narasi + ~0,8 dtk.
5. **Validasi:** `npm run typecheck` → still tiap adegan → render →
   `ffprobe` (durasi + ada audio).

## Gerak tokoh (speaking-sync)

- `AnimeCharacter` memakai `speakAt(words, t)`: saat VO mengucapkan kata,
  portrait naik sedikit + membesar (denyut, puncak di tengah kata);
  saat VO diam, portrait bergoyang pelan + napas halus.
- Selalu oper `words` adegan itu ke `AnimeCharacter` — tanpa itu tokoh
  diam (tidak ada gerak bicara).
- Verifikasi dengan still: satu frame di tengah kata (portrait naik) vs
  satu frame di jeda antar kata (portrait turun).

## Pakai dulu (REUSE → RESKIN → NEW)

1. **REUSE** adegan demo. `DemoJokowi` mencakup 4 pola: studio, transform
   (foto→anime), voice (bar suara), landscape.
2. **RESKIN** dengan ganti tokoh, warna, teks, posisi, panjang frame.
   Kebanyakan pekerjaan baru adalah ini.
3. **NEW** hanya bila 1 dan 2 tidak cukup. Tambah komponen baru ke folder
   yang sesuai di `src/`.

## Membangun scene

- Scene adalah komponen React. Ambil frame dengan `useCurrentFrame()`.
  Frame yang sama harus selalu menggambar gambar yang sama: tanpa timer,
  tanpa angka acak tanpa seed.
- Portrait tokoh: `<AnimeCharacter src="characters/<nama>/anime.png"
  words={words} size={...} />` — path relatif di `public/`. Untuk gambar
  tegak/full-body: `<FullBodyCharacter src="characters/<nama>/anime.png"
  words={words} height={...} />` (tanpa bingkai, kaki menapak di lantai).
- Letakkan caption dengan `<WordCaptionTrack cues={...} />` di akhir
  komposisi (bukan per adegan). Jangan pernah pakai caption blok.
- Narasi per adegan: `<Narration file={scene.audio} />` di dalam
  `<Sequence>` adegan itu.
- Daftarkan di `src/Root.tsx` sebagai `<Composition>` dengan
  `durationInFrames`, `fps={FPS}`, `width={W}`, `height={H}`.

## Validasi dan render

```bash
npm run typecheck                                              # harus 0 dulu
npx remotion compositions src/index.ts                         # daftar komposisi
npm run still -- <Id> out/check.png --frame=<n>                # cek satu frame
npm run render -- <Id> out/<nama>.mp4                          # MP4 penuh
```

Cek still di awal tiap caption dan di tiap pergantian latar sebelum
render penuh. Setelah render, cek `ffprobe` (durasi benar, ada stream
audio) dan buka satu frame tengah video.

## Aturan proyek

- Jangan tambah watermark, handle, atau logo.
- Jangan tambah audio/voice selain narasi yang digenerate dari naskah.
- Caption selalu karaoke kata-per-kata (`WordCaptionTrack`); suara
  selalu TikTok TTS id_001 (generate dengan curl, bukan urllib).
- Visual harus literal terhadap narasi: narasi bilang foto berubah jadi
  anime → adegan menampilkan foto vs anime; narasi bilang latar →
  adegan menampilkan latar itu.
- Foto sumber hanya yang kamu punya hak pakainya (foto sendiri, domain
  publik, lisensi bebas). Catat sumber + lisensi di `meta.json` tokoh.
- Narasi demo/contoh harus netral — jangan mengarang kutipan atau
  pernyataan yang dikaitkan dengan orang di foto.
- Jangan commit atau publish tanpa perintah user. Jangan simpan
  secret/key di repo.
