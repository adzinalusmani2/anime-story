#!/usr/bin/env python3
"""Daftarkan satu tokoh ke registri karakter anime-story.

    .venv/bin/python make_character.py <foto> <nama> [--style hayao|shinkai]
        [--crop x0,y0,x1,y1] [--source-url URL] [--license TEKS]

Hasil di characters/<nama>/:
    source.jpg   — salinan foto asli (apa adanya)
    anime.png    — portrait bergaya anime hasil photo_to_anime.py
    meta.json    — nama, gaya, model, crop, sumber foto, lisensi

Nama tokoh hanya boleh huruf, angka, tanda hubung dan garis bawah.
Foto sumber harus foto yang kamu punya hak pakainya (foto sendiri, foto
domain publik, atau foto berlisensi bebas seperti potret resmi pemerintah).
"""
import argparse
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CHAR_DIR = os.path.join(HERE, "characters")

sys.path.insert(0, HERE)
from photo_to_anime import STYLES, convert, load_session, parse_crop, parse_size  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("photo", help="foto orang nyata (JPG/PNG)")
    ap.add_argument("name", help="nama tokoh, misal jokowi")
    ap.add_argument("--style", choices=list(STYLES), default="hayao")
    ap.add_argument("--size", type=str, default="512",
                    help="512 (persegi) atau WxH, misal 512x1024 untuk full-body")
    ap.add_argument("--crop", default=None, help="x0,y0,x1,y1 (piksel gambar asli)")
    ap.add_argument("--source-url", default="")
    ap.add_argument("--license", default="")
    args = ap.parse_args()

    if not re.fullmatch(r"[A-Za-z0-9_-]+", args.name):
        sys.exit("nama tokoh hanya boleh huruf/angka/-/_")
    if not os.path.exists(args.photo):
        sys.exit(f"file tidak ditemukan: {args.photo}")

    outdir = os.path.join(CHAR_DIR, args.name)
    os.makedirs(outdir, exist_ok=True)

    from PIL import Image

    src_path = os.path.join(outdir, "source.jpg")
    img = Image.open(args.photo).convert("RGB")
    img.save(src_path, format="JPEG", quality=92)
    print(f"sumber disalin: {src_path} {img.size}")

    work = img
    crop = None
    if args.crop:
        crop = parse_crop(args.crop)
        work = work.crop(crop)
        print(f"crop {crop} -> {work.size}")

    sess, model_path = load_session(args.style)
    size = parse_size(args.size)
    anime = convert(work, sess, size)
    anime_path = os.path.join(outdir, "anime.png")
    anime.save(anime_path, format="PNG")
    print(f"anime: {anime_path} {anime.size}")

    meta = {
        "name": args.name,
        "style": args.style,
        "model": os.path.basename(model_path),
        "model_source": "https://github.com/TachibanaYoshino/AnimeGANv3/releases/tag/v1.1.0",
        "size": list(size),
        "crop": list(crop) if crop else None,
        "source_file": "source.jpg",
        "anime_file": "anime.png",
        "source_url": args.source_url,
        "source_license": args.license,
    }
    with open(os.path.join(outdir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"meta: {os.path.join(outdir, 'meta.json')}")
    print(f"tokoh '{args.name}' siap. Pakai di video dengan portrait: characters/{args.name}/anime.png")


if __name__ == "__main__":
    main()
