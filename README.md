# anime-story

Alat pembuat **video konten** seperti `stickman-story`, tapi tokohnya
**bukan stickman**: foto orang nyata diubah otomatis jadi **karakter anime**,
lalu karakter anime itu dianimasikan dalam video — bicara mengikuti
voice-over, caption karaoke kata-per-kata, latar literal per adegan.

> **Terpisah dari Si Lidi.** Proyek ini alat sampingan, bukan bagian dari
> channel Si Lidi. Jangan campur branding, antrean, caption, atau posting
> Si Lidi ke sini.

## Cara kerja (foto → karakter → video)

```
foto orang nyata (JPG/PNG)
  └─► photo_to_anime.py  (AnimeGANv3 ONNX, lokal, CPU)
        └─► characters/<nama>/anime.png  (portrait anime — atau tegak
              full-body dengan --size WxH, misal 512x1024)
              └─► make_character.py  (registri karakter)
                    └─► scene Remotion  (AnimeCharacter / FullBodyCharacter
                          + VO + karaoke)
                          └─► out/<video>.mp4  (1080x1920 @30fps)
```

## Syarat

- Node.js 24 + npm (Remotion 4.0.535, React 19)
- Python 3.12 + venv (ONNX Runtime, Pillow, faster-whisper)
- ffmpeg / ffprobe (cek durasi & audio)
- Semua gratis/lokal — tanpa API berbayar, tanpa langganan.

## Setup

```bash
# 1. Dependensi Node
npm install

# 2. Dependensi Python
python3 -m venv .venv
.venv/bin/pip install onnxruntime pillow numpy faster-whisper

# 3. Model anime (sekali saja, ~4 MB per gaya, masuk models/ — di-gitignore)
#    Unduh dari rilis resmi AnimeGANv3 v1.1.0:
#    https://github.com/TachibanaYoshino/AnimeGANv3/releases/tag/v1.1.0
#      AnimeGANv3_Hayao_36.onnx    (gaya Hayao Miyazaki — default)
#      AnimeGANv3_Shinkai_37.onnx  (gaya Makoto Shinkai)
```

## 1. Foto → karakter anime

```bash
# Konversi langsung (satu gambar):
.venv/bin/python photo_to_anime.py foto.jpg out/anime.png --style hayao

# Daftarkan sebagai tokoh (disarankan) — crop dulu ke kepala+bahu bila
# foto aslinya foto resmi yang lebar:
.venv/bin/python make_character.py foto.jpg jokowi --style hayao \
  --crop 190,30,1090,930 \
  --source-url "https://commons.wikimedia.org/wiki/File:..." \
  --license "Public domain"
```

## Mode full-body (tokoh sebadan)

Foto **full-body** (orang berdiri dari kepala sampai kaki) diubah dengan
cara yang sama — AnimeGANv3 men-stylize **seluruh gambar**, jadi hasilnya
anime full-body. Yang berbeda hanya bentuk inputnya: pakai `--size WxH`
(tegak) supaya tokoh tidak gepeng, dan crop ke satu orang saja.

```bash
# Contoh: Jokowi berjalan di karpet merah (foto domain publik, lihat bawah)
.venv/bin/python make_character.py foto-fullbody.jpg jokowi-fullbody \
  --style hayao --crop 30,540,370,1265 --size 512x1024 \
  --source-url "https://commons.wikimedia.org/wiki/File:Mahathir_Mohamad_walking_with_Joko_Widodo.jpg" \
  --license "Public domain (Indonesian Embassy Kuala Lumpur, via Wikimedia Commons)"
```

Di video, pakai komponen `src/characters/FullBodyCharacter.tsx`
(bukan `AnimeCharacter`): gambar tegak ditampilkan **tanpa bingkai kartu**,
berdiri sebadan di dalam adegan, kaki menapak di lantai, dengan gerak
speaking-sync yang sama (denyut bicara + goyang + napas) ditambah
Ken Burns lambat. Lihat `src/scenes/DemoFullBody.tsx`.

**Penilaian jujur kualitas full-body (diuji di repo ini):**

- Siluet, pakaian, dan latar ikut ter-stylize dengan konsisten — tokoh
  sebadan terbaca jelas sebagai anime (jas, dasi, karpet merah, pasukan
  kehormatan di belakang semua utuh).
- **Detail wajah mengecil dan kasar.** Di foto full-body, kepala hanya
  ~90 px dari tinggi foto 1280 px, jadi model hanya punya sedikit detail
  wajah untuk diolah: mata agak tidak simetris, area mulut sedikit
  meleleh. Wajah tetap dikenali, tapi tidak setajam portrait kepala+bahu.
- Crop setengah badan (kepala sampai pinggang) sudah diuji sebagai
  alternatif — wajah hanya sedikit lebih tajam, karena sumber masalahnya
  resolusi kepala di foto aslinya, bukan crop-nya. Perbaikan nyata butuh
  foto sumber beresolusi lebih tinggi, atau jalur redraw (Flux.1 img2img,
  lihat peta jalan v2).
- Gambar anime full-body **membawa latar foto aslinya** (bukan tokoh
  terpotong dengan latar transparan): jadi adegan video dibangun *di
  sekitar* gambar itu (karpet, langit, pohon sebagai bingkai), bukan
  dengan menempel tokoh ke latar yang digambar terpisah.

### Dua level "video anime full-body" — baca sebelum berharap lebih

**(a) Full-body stylization — jalan sekarang.** Satu foto full-body →
AnimeGANv3 → gambar anime sebadan → dianimasikan (denyut bicara, goyang,
Ken Burns) di dalam adegan Remotion. Inilah yang repo ini lakukan.
Tokohnya tidak berjalan atau bergerak bebas — ia satu gambar yang
"hidup" lewat denyut dan zoom.

**(b) Tampilan video AI viral — belum, roadmap v2.** Video seperti
referensi (tokoh anime full-body yang *bergerak dalam* satu adegan utuh
yang digenerate — berjalan, mengangkat benda, kamera bergerak) butuh
**image-to-video**: gambar anime (atau foto) dijadikan frame awal, lalu
model video (Wan 2.2) menggenerate gerakannya. Itu di luar Remotion dan
di luar CPU: jalurnya Google Colab (rute Content Factory: Wan 2.2 di
Colab, model di Drive, zero-credit) — didokumentasikan di peta jalan,
**sengaja belum diimplementasi**, tanpa API berbayar. AnimeGANv3 tidak
bisa menghasilkan gerakan; ia hanya men-stylize satu frame.

Hasilnya di `characters/<nama>/`:

| File | Isi |
|---|---|
| `source.jpg` | salinan foto asli |
| `anime.png` | portrait anime (512×512) |
| `meta.json` | nama, gaya, model, crop, sumber foto, lisensi |

**Aturan foto sumber:** pakai foto yang kamu punya hak pakainya — foto
sendiri, foto domain publik, atau foto berlisensi bebas (misal potret
resmi pemerintah). Jangan pakai foto orang lain tanpa izin.

### Model: AnimeGANv3 (lokal, ONNX, CPU)

- Repo resmi: https://github.com/TachibanaYoshino/AnimeGANv3
- Model ONNX resmi dari rilis v1.1.0 (`AnimeGANv3_Hayao_36.onnx`,
  `AnimeGANv3_Shinkai_37.onnx`, masing-masing ±4,2 MB).
- Input ONNX: NHWC float32 `AnimeGANv3_input:0`; output satu tensor,
  ekor utama generator (`generator_1/main/out_layer:0`). Normalisasi
  masuk [-1, 1], keluar (y+1)·127.5. Model dilatih di 256×256 tapi
  fully-convolutional — inferensi default 512×512, ±3–4 detik per gambar
  di CPU (diuji di VM ini).
- Lisensi model: **gratis untuk pemakaian non-komersial**; pemakaian
  komersial butuh izin tertulis dari pembuat. Lihat
  https://github.com/TachibanaYoshino/AnimeGANv3 (bagian lisensi).
- Catatan jujur: AnimeGANv3 adalah *stylization* — foto diubah ke gaya
  gambar anime (warna diratakan, garis dipertegas, shading sel), wajah
  tetap dikenali. Ini bukan redraw karakter anime penuh dari nol.

## 2. Voice-over (TikTok TTS id_001)

Sama seperti stickman-story: suara "Suara Wanita" (id_001), generate
dengan **curl, bukan Python urllib** (urllib kena 403 dari worker).

```bash
# Contoh untuk demo (lihat tts_demo.py untuk pola lengkapnya):
.venv/bin/python tts_demo.py   # -> public/audio/demo-01..04.mp3
```

Untuk video baru: tulis skrip TTS sendiri mengikuti pola `tts_demo.py`
(POST ke `https://tiktok-tts.weilnet.workers.dev/api/generation`,
header `User-Agent` browser, respons base64 → MP3). Simpan MP3 di
`public/audio/<stem>-NN.mp3`.

## 3. Timing kata (karaoke)

Tambahkan teks naskah ke dict `SCRIPTS` di `word_timing.py`, lalu:

```bash
.venv/bin/python word_timing.py demo-01 demo-02
# -> src/captions/words/demo-01.words.json, dst.
```

Menggunakan faster-whisper `small` (int8, CPU) + alignment difflib ke
naskah, jadi kata yang tampil selalu sama dengan naskah.

## 4. Scene video (Remotion)

- Tokoh: komponen `src/characters/AnimeCharacter.tsx` — menerima portrait
  anime + timing kata; gerak **speaking-sync** (naik + membesar saat
  mengucapkan kata, goyang pelan + napas saat diam) dari
  `src/captions/speaking.ts` (`speakAt`). Untuk gambar **tegak/full-body**
  pakai `src/characters/FullBodyCharacter.tsx` (tanpa bingkai kartu,
  berdiri sebadan, plus Ken Burns lambat) — lihat bagian "Mode full-body".
- Caption: `src/captions/WordCaptionTrack.tsx` — karaoke kata-per-kata
  (kata aktif kuning, sudah diucapkan putih tulang, belum diucapkan tak
  terlihat tapi layout stabil). Tampilan: 40 px, pill gelap, band bawah.
- Latar: **literal terhadap narasi** — kalau narasi bilang foto berubah
  jadi anime, adegannya menampilkan foto vs anime; kalau bilang latar,
  adegannya menampilkan latar.
- Ukuran: 1080×1920 @30fps. Tanpa watermark/endcard/teks merek di layar.

Buat scene baru dengan menyalin `src/scenes/DemoJokowi.tsx`, daftarkan
di `src/Root.tsx` sebagai `<Composition>`, lalu:

```bash
npm run typecheck                                   # harus lolos dulu
npx remotion still src/index.ts <Id> out/cek.png --frame=<n> --overwrite
npx remotion render src/index.ts <Id> out/<nama>.mp4 --overwrite
ffprobe -v error -show_entries format=duration -of csv=p=0 out/<nama>.mp4
```

## Demo (sudah jadi & terverifikasi)

`out/demo-jokowi.mp4` — 4 adegan, ±17 detik, 1080×1920 @30fps, VO
Bahasa Indonesia + karaoke:

1. Studio — perkenalan alat ("Halo! Ini demo anime-story.")
2. Foto → anime — foto asli vs portrait anime berdampingan
3. Bicara — bar suara berdenyut mengikuti kata
4. Latar — pemandangan (langit, matahari, bukit, pohon)

Tokoh demo: "jokowi" — potret resmi 2019 dari Wikimedia Commons
(domain publik, PD Indonesian Government). Narasi demo bersifat netral
(pengantar cara kerja alat), **bukan** kutipan/pernyataan yang dikaitkan
dengan orangnya. Lihat `src/scenes/DemoJokowi.tsx` dan
`characters/jokowi/meta.json`.

Perintah untuk mengulang demo dari nol:

```bash
.venv/bin/python make_character.py characters/jokowi/source.jpg jokowi \
  --style hayao --crop 190,30,1090,930
.venv/bin/python tts_demo.py
.venv/bin/python word_timing.py demo-01 demo-02 demo-03 demo-04
npx remotion render src/index.ts DemoJokowi out/demo-jokowi.mp4 --overwrite
```

## Demo full-body (sudah jadi & terverifikasi)

`out/demo-fullbody.mp4` — 4 adegan, 520 frame = **17,3 detik**,
1080×1920 @30fps, VO Bahasa Indonesia + karaoke (ffprobe: h264 + aac,
6,4 MB):

1. Panggung — tokoh sebadan di karpet merah ("Ini mode full-body anime-story.")
2. Luar ruangan — tokoh berdiri di satu adegan utuh, langit + pepohonan + karpet
3. Bicara — bar suara berdenyut mengikuti kata
4. Foto → tokoh — crop foto asli vs anime full-body, berdampingan

Tokoh demo: "jokowi-fullbody" — crop ke Jokowi saja dari foto domain
publik "Mahathir Mohamad walking with Joko Widodo"
(https://commons.wikimedia.org/wiki/File:Mahathir_Mohamad_walking_with_Joko_Widodo.jpg,
Public domain, Indonesian Embassy Kuala Lumpur). Narasi demo bersifat
netral (pengantar cara kerja alat), **bukan** kutipan/pernyataan yang
dikaitkan dengan orangnya dan **bukan** narasi politik — adegan
ijazah/pengadilan dari video referensi tidak ditiru. Lihat
`src/scenes/DemoFullBody.tsx` dan `characters/jokowi-fullbody/meta.json`.

Perintah untuk mengulang demo full-body dari nol:

```bash
.venv/bin/python make_character.py characters/jokowi-fullbody/source.jpg jokowi-fullbody \
  --style hayao --crop 30,540,370,1265 --size 512x1024
.venv/bin/python tts_fullbody.py
.venv/bin/python word_timing.py fb-01 fb-02 fb-03 fb-04
npx remotion render src/index.ts DemoFullBody out/demo-fullbody.mp4 --overwrite
```

## Struktur repo

```
anime-story/
├── photo_to_anime.py      foto -> anime (AnimeGANv3 ONNX; --size WxH untuk full-body)
├── make_character.py      daftarkan tokoh ke characters/<nama>/
├── tts_demo.py            contoh TTS demo portrait (curl, id_001)
├── tts_fullbody.py        contoh TTS demo full-body (curl, id_001)
├── word_timing.py         faster-whisper -> timing kata karaoke
├── models/                model ONNX (di-gitignore, unduh sendiri)
├── characters/            registri tokoh (foto sumber di-gitignore)
├── public/
│   ├── audio/             MP3 narasi (id_001; demo-*.mp3 + fb-*.mp3)
│   ├── characters/        salinan portrait untuk Remotion (staticFile)
│   └── fonts/             Inter lokal (OFL)
├── src/
│   ├── Root.tsx           daftar komposisi (DemoJokowi, DemoFullBody)
│   ├── scenes/            adegan video (DemoJokowi, DemoFullBody = contoh)
│   ├── characters/        AnimeCharacter (portrait) + FullBodyCharacter (sebadan)
│   ├── captions/          WordCaptionTrack + speaking + timing kata
│   ├── audio/             Narration
│   └── styles/            palette + fonts
├── out/                   hasil render (di-gitignore)
├── README.md  CLAUDE.md  .gitignore
└── package.json  tsconfig.json  remotion.config.ts
```

## Peta jalan (v2 — belum diimplementasi)

- **Image-to-video (Wan 2.2 di Google Colab)** — gambar anime full-body
  jadi frame awal, Wan 2.2 menggenerate gerakan tokoh di dalam adegan
  (berjalan, mengangkat benda, kamera bergerak): inilah yang membuat
  tampilan video AI viral yang adegannya utuh. Butuh GPU Colab (rute
  Content Factory: model di Drive, zero-credit). Sengaja belum
  diimplementasi — di luar Remotion dan di luar CPU.
- **Flux.1 img2img di Google Colab** sebagai jalur konversi alternatif
  (kualitas redraw lebih "anime" dibanding stylization AnimeGANv3):
  foto → Flux.1 image-to-image dengan prompt gaya anime → portrait
  → masukkan ke `characters/<nama>/anime.png` seperti biasa. Butuh
  GPU Colab (rute Content Factory: model di Drive, zero-credit).
  Sengaja belum diimplementasi — AnimeGANv3 lokal sudah cukup untuk v1.
  Jalur ini juga jawaban untuk detail wajah full-body yang kasar
  (redraw dari foto beresolusi lebih tinggi).
- **Gerak bibir pada portrait** (lip-sync berbasis gambar) — saat ini
  gerak bicara berupa denyut + angguk pada seluruh portrait.
- **Multi-tokoh dalam satu adegan** (dialog dua karakter).
- **Latar literal generatif** (gambar latar dari model, bukan vektor).
- **Latar transparan untuk tokoh full-body** (background removal, misal
  rembg) supaya tokoh bisa ditempel ke latar apa pun tanpa membawa latar
  foto aslinya — saat ini gambar anime membawa latar foto.

## Aturan proyek

- Gratis/lokal saja: tanpa API berbayar, model berbayar, atau langganan.
- Tanpa watermark/endcard/teks merek di video.
- Caption selalu karaoke kata-per-kata; suara selalu TikTok TTS id_001.
- Visual harus literal terhadap narasi.
- Jangan simpan secret/key di repo (lihat `.gitignore`).
- Jangan commit/publish tanpa perintah user.
```
