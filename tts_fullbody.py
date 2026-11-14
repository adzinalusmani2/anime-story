#!/usr/bin/env python3
"""Generate TikTok TTS (voice id_001, Indonesian female — "Suara Wanita")
untuk video demo full-body anime-story. Menggunakan curl (urllib kena 403
dari worker; curl dengan browser UA berhasil). Menulis
public/audio/fb-01..03.mp3.

Naskah demo bersifat netral (pengantar demo) — BUKAN kutipan atau
pernyataan yang dikaitkan dengan orang di foto.
"""
import base64
import json
import os
import subprocess
import tempfile

ENDPOINT = "https://tiktok-tts.weilnet.workers.dev/api/generation"
OUTDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "audio")

TEXTS = [
    "Ini mode full-body anime-story.",
    "Tokohnya tampil sebadan, berdiri di satu adegan utuh.",
    "Karakternya tetap bicara mengikuti suara, dengan caption karaoke.",
    "Satu foto, jadi tokoh sebadan.",
]


def fetch_mp3(text: str) -> bytes:
    payload = json.dumps({"text": text, "voice": "id_001"})
    with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as tmp:
        tmp_path = tmp.name
    try:
        subprocess.run(
            [
                "curl", "-sL", "-X", "POST", ENDPOINT,
                "-H", "Content-Type: application/json",
                "-H", "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
                "-d", payload, "-o", tmp_path,
            ],
            check=True, timeout=90,
        )
        with open(tmp_path, "rb") as f:
            body = f.read()
    finally:
        os.unlink(tmp_path)
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return body  # sudah berupa byte MP3 mentah
    b64 = data.get("data") or data.get("audio") or data.get("result")
    if not b64:
        raise RuntimeError(f"respons tak terduga: {body[:200]!r}")
    return base64.b64decode(b64)


def main() -> None:
    os.makedirs(OUTDIR, exist_ok=True)
    for i, text in enumerate(TEXTS, 1):
        out = os.path.join(OUTDIR, f"fb-{i:02d}.mp3")
        data = fetch_mp3(text)
        if len(data) < 1000:
            raise RuntimeError(f"fb-{i:02d}: MP3 mencurigakan ({len(data)} byte)")
        with open(out, "wb") as f:
            f.write(data)
        print(f"fb-{i:02d}.mp3: {len(data)} byte — {text}")


if __name__ == "__main__":
    main()
