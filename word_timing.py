"""Ambil per-kata timing untuk narasi anime-story (caption karaoke).

Menggunakan faster-whisper (small, int8, CPU) dengan word_timestamps=True,
lalu menyejajarkan kata yang dikenali dengan kata NASKAH yang diketahui
(difflib), sehingga kata yang tampil selalu sama dengan naskah (whisper
sering salah dengar nama/angka). Kata naskah yang tidak cocok mendapat
timing interpolasi dari tetangga terdekatnya.

Menulis src/captions/words/<stem>.words.json:
  {"words": [{"w": "Halo!", "start": 0.0, "end": 0.62}, ...]}
(start/end dalam detik relatif terhadap awal file audio.)

PyAV 19 menghapus kwarg `metadata_errors` yang dipakai faster-whisper
saat memanggil av.open, jadi av.open di-monkey-patch untuk membuangnya.
"""
import av
_orig_open = av.open


def _patched_open(*args, **kwargs):
    kwargs.pop("metadata_errors", None)
    return _orig_open(*args, **kwargs)


av.open = _patched_open

import difflib
import json
import os
import re
import sys

from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(HERE, "public", "audio")
WORDS_DIR = os.path.join(HERE, "src", "captions", "words")

# Teks naskah per file narasi (harus sama persis dengan kata caption).
SCRIPTS = {
    "demo-01": "Halo! Ini demo anime-story.",
    "demo-02": "Foto orang nyata bisa berubah jadi karakter anime.",
    "demo-03": "Karakternya bicara mengikuti suara, dengan caption karaoke.",
    "demo-04": "Tiap adegan punya latar yang sesuai dengan cerita.",
    "fb-01": "Ini mode full-body anime-story.",
    "fb-02": "Tokohnya tampil sebadan, berdiri di satu adegan utuh.",
    "fb-03": "Karakternya tetap bicara mengikuti suara, dengan caption karaoke.",
    "fb-04": "Satu foto, jadi tokoh sebadan.",
}


def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def main() -> None:
    if len(sys.argv) < 2:
        print("pakai: .venv/bin/python word_timing.py <stem> [<stem> ...]")
        print("contoh: .venv/bin/python word_timing.py demo-01 demo-02")
        sys.exit(1)
    model = WhisperModel("small", device="cpu", compute_type="int8")
    os.makedirs(WORDS_DIR, exist_ok=True)
    for stem in sys.argv[1:]:
        audio = os.path.join(AUDIO_DIR, f"{stem}.mp3")
        if not os.path.exists(audio):
            print(f"lewat: {audio} tidak ada")
            continue
        if stem not in SCRIPTS:
            print(f"lewat: {stem} tidak ada di SCRIPTS")
            continue
        script_words = SCRIPTS[stem].split(" ")
        segments, _info = model.transcribe(audio, language="id", word_timestamps=True)
        heard = []
        for seg in segments:
            for w in seg.words or []:
                heard.append((w.word.strip(), w.start, w.end))
        # Sejajarkan kata yang didengar dengan kata naskah (difflib pada
        # bentuk ternormalisasi, supaya tanda baca tidak mengganggu).
        sm = difflib.SequenceMatcher(
            a=[norm(w) for w, _s, _e in heard],
            b=[norm(w) for w in script_words],
            autojunk=False,
        )
        timed = [None] * len(script_words)
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == "equal":
                for k in range(i2 - i1):
                    _w, s, e = heard[i1 + k]
                    timed[j1 + k] = (s, e)
        # Interpolasi untuk kata yang tidak cocok.
        known = [(i, t) for i, t in enumerate(timed) if t is not None]
        if not known:
            # Fallback: bagi rata sepanjang durasi audio.
            import subprocess

            dur = float(
                subprocess.check_output(
                    ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                     "-of", "csv=p=0", audio],
                    text=True,
                ).strip()
            )
            step = dur / max(1, len(script_words))
            timed = [(i * step, (i + 0.8) * step) for i in range(len(script_words))]
        else:
            for i, t in enumerate(timed):
                if t is not None:
                    continue
                prev = [k for k in known if k[0] < i]
                nxt = [k for k in known if k[0] > i]
                if prev and nxt:
                    (pi, (ps, pe)) = prev[-1]
                    (ni, (ns, ne)) = nxt[0]
                    frac = (i - pi) / (ni - pi)
                    s = pe + (ns - pe) * frac
                    timed[i] = (s, s + 0.25)
                elif prev:
                    (pi, (ps, pe)) = prev[-1]
                    timed[i] = (pe + 0.05 * (i - pi), pe + 0.05 * (i - pi) + 0.25)
                else:
                    (ni, (ns, ne)) = nxt[0]
                    timed[i] = (max(0.0, ns - 0.05 * (ni - i)), max(0.0, ns - 0.05 * (ni - i)) + 0.25)
        words = [
            {"w": w, "start": round(s, 2), "end": round(e, 2)}
            for w, (s, e) in zip(script_words, timed)
        ]
        out = os.path.join(WORDS_DIR, f"{stem}.words.json")
        with open(out, "w", encoding="utf-8") as f:
            json.dump({"words": words}, f, ensure_ascii=False, indent=2)
        print(f"{stem}: {len(words)} kata -> {out}")


if __name__ == "__main__":
    main()
