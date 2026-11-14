#!/usr/bin/env python3
"""Foto nyata -> portrait bergaya anime, lokal dan gratis.

Model: AnimeGANv3 (TachibanaYoshino/AnimeGANv3, rilis resmi v1.1.0) —
ONNX resmi `AnimeGANv3_Hayao_36.onnx` (gaya Hayao Miyazaki) dan
`AnimeGANv3_Shinkai_37.onnx` (gaya Makoto Shinkai), dijalankan dengan
ONNX Runtime di CPU. Tanpa API, tanpa biaya, tanpa PyTorch.

Lisensi model: gratis untuk pemakaian non-komersial; pemakaian komersial
butuh izin tertulis dari pembuat (lihat README.md).

Cara pakai:
    .venv/bin/python photo_to_anime.py <foto-masuk> <png-keluar> \
        [--style hayao|shinkai] [--size 512] [--crop x0,y0,x1,y1]

- Input: foto JPG/PNG (foto orang nyata, wajah terlihat jelas).
- `--crop x0,y0,x1,y1`: crop dulu ke kotak itu (piksel, koordinat gambar
  asli) sebelum diubah — berguna untuk mengambil kepala + bahu dari foto
  resmi yang lebar.
- `--size`: sisi gambar yang masuk ke model (default 512; model dilatih di
  256, tapi ONNX-nya fully-convolutional jadi 512 memberi hasil lebih tajam
  di CPU dalam hitungan detik). Boleh juga "512x1024" (lebar x tinggi) untuk
  foto tegak seperti full-body — model menerima input non-persegi.
- Output: PNG RGB ukuran --size (persegi atau "WxH" sesuai permintaan).

Detail teknis (diverifikasi dari model ONNX yang diunduh):
- Input ONNX: NHWC float32, nama `AnimeGANv3_input:0`, dinamis H/W.
- Output: satu tensor, `generator_1/main/out_layer:0` — ekor utama
  (main tail) generator, sudah hasil akhir yang diperhalus.
- Normalisasi: masuk [-1, 1] (x/127.5 - 1), keluar (y + 1) * 127.5.
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(HERE, "models")

STYLES = {
    "hayao": "AnimeGANv3_Hayao_36.onnx",
    "shinkai": "AnimeGANv3_Shinkai_37.onnx",
}


def load_session(style: str):
    import onnxruntime as ort

    name = STYLES[style]
    path = os.path.join(MODELS_DIR, name)
    if not os.path.exists(path):
        sys.exit(
            f"model tidak ditemukan: {path}\n"
            "Unduh dulu dari rilis resmi v1.1.0:\n"
            "  https://github.com/TachibanaYoshino/AnimeGANv3/releases/tag/v1.1.0\n"
            f"  -> {name} (letakkan di models/)"
        )
    sess = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
    return sess, path


def parse_size(text: str):
    """'512' -> (512, 512); '512x1024' -> (512, 1024)."""
    text = text.strip().lower()
    if "x" in text:
        w, h = text.split("x", 1)
        return (int(w), int(h))
    n = int(text)
    return (n, n)


def convert(img: Image.Image, sess, size) -> Image.Image:
    """Jalankan AnimeGANv3 pada satu gambar PIL (RGB), kembalikan PIL RGB.

    `size` boleh int (persegi) atau tuple (lebar, tinggi) — untuk foto
    tegak/full-body pakai tuple, misal (512, 1024), supaya tokoh tidak
    gepeng.
    """
    if isinstance(size, int):
        size = (size, size)
    img = img.convert("RGB").resize(size, Image.LANCZOS)
    arr = np.asarray(img).astype(np.float32) / 127.5 - 1.0  # [-1, 1], NHWC
    arr = np.expand_dims(arr, axis=0)
    inp = sess.get_inputs()[0].name
    out = sess.run(None, {inp: arr})[0]  # (1, H, W, 3), [-1, 1]
    out = np.clip((out[0] + 1.0) * 127.5, 0, 255).astype(np.uint8)
    return Image.fromarray(out, mode="RGB")


def parse_crop(text: str):
    parts = text.split(",")
    if len(parts) != 4:
        raise ValueError("--crop harus x0,y0,x1,y1")
    return tuple(int(p) for p in parts)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input", help="foto masuk (JPG/PNG)")
    ap.add_argument("output", help="PNG anime keluar")
    ap.add_argument("--style", choices=list(STYLES), default="hayao")
    ap.add_argument("--size", type=str, default="512",
                    help="512 (persegi) atau WxH, misal 512x1024 untuk full-body")
    ap.add_argument("--crop", default=None, help="x0,y0,x1,y1 (piksel gambar asli)")
    args = ap.parse_args()

    if not os.path.exists(args.input):
        sys.exit(f"file tidak ditemukan: {args.input}")

    img = Image.open(args.input)
    if args.crop:
        box = parse_crop(args.crop)
        img = img.crop(box)
        print(f"crop {box} -> {img.size}")
    size = parse_size(args.size)
    print(f"masuk: {args.input} {img.size} | gaya: {args.style} | ukuran model: {size}")

    import time

    t0 = time.time()
    sess, model_path = load_session(args.style)
    print(f"model: {model_path} ({time.time() - t0:.1f} dtk dimuat)")
    t0 = time.time()
    out = convert(img, sess, size)
    print(f"inferensi: {time.time() - t0:.1f} dtk")

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    out.save(args.output, format="PNG")
    print(f"keluar: {args.output} {out.size}")


if __name__ == "__main__":
    main()
