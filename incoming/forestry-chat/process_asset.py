#!/usr/bin/env python3
"""Post-process raw generated tree assets into game-ready transparent PNGs.

Usage:
  process_asset.py <input.png> <kind> <output.png>
  kind: tree | stump | item
"""
import sys
from PIL import Image, ImageChops

WHITE_THRESH = 248

def remove_white_bg(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= WHITE_THRESH and g >= WHITE_THRESH and b >= WHITE_THRESH:
                px[x, y] = (r, g, b, 0)
    return im

def fit_canvas(im: Image.Image, tw: int, th: int, anchor_bottom: bool, fill_ratio: float = 1.0):
    bbox = im.getbbox()
    if not bbox:
        raise ValueError("empty image after bg removal")
    im = im.crop(bbox)
    max_w, max_h = int(tw * fill_ratio), int(th * fill_ratio)
    scale = min(max_w / im.width, max_h / im.height, 1.0)
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    im = im.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    x = (tw - nw) // 2
    y = th - nh if anchor_bottom else (th - nh) // 2
    canvas.paste(im, (x, y), im)
    return canvas

def main():
    src, kind, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    im = Image.open(src)
    im = remove_white_bg(im)
    if kind == "tree":
        out = fit_canvas(im, 120, 144, anchor_bottom=True, fill_ratio=0.98)
    elif kind == "stump":
        out = fit_canvas(im, 96, 96, anchor_bottom=True, fill_ratio=0.85)
    elif kind == "item":
        out = fit_canvas(im, 96, 96, anchor_bottom=False, fill_ratio=0.85)
    else:
        raise ValueError(f"unknown kind {kind}")
    out.save(dst)
    # QA info
    bbox = out.getbbox()
    alpha = out.getchannel("A")
    opaque = sum(1 for v in alpha.getdata() if v > 128)
    print(f"saved {dst}: size={out.size} mode={out.mode} bbox={bbox} opaque_ratio={opaque/(96*96 if out.size[0]==96 else 120*144):.2f}")

if __name__ == "__main__":
    main()
