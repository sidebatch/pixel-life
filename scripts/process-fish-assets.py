from pathlib import Path
from math import ceil
import argparse

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "fishing" / "source"
OUTPUT_DIR = ROOT / "assets" / "fishing"
FISH_NAMES = [
    "crucian_carp",
    "koi",
    "goldfish",
    "largemouth_bass",
    "catfish",
    "golden_koi",
    "bluegill",
    "killifish",
    "minnow",
    "trout",
    "ayu",
    "salmon",
    "snakehead",
    "rainbow_trout",
    "masou_salmon",
    "mandarin_fish",
    "pond_smelt",
    "freshwater_eel",
    "manchurian_trout",
    "lake_trout",
    "brown_trout",
    "sturgeon",
    "aurora_trout",
    "golden_trout",
    "nile_perch",
    "sockeye_salmon",
    "falls_catfish",
    "silver_manchurian",
    "tigerfish",
    "crystal_trout",
    "swamp_eel",
    "swamp_catfish",
    "piranha",
    "black_ghost",
    "electric_eel",
    "arowana",
    "swamp_king_eel",
    "damselfish",
    "wrasse",
    "filefish",
    "striped_damsel",
    "barred_knifejaw",
    "black_seabream",
    "cuttlefish",
    "spanish_mackerel",
    "yellowtail",
    "amberjack",
    "marlin",
    "sevenband_grouper",
    "bluefin_tuna",
    "deep_octopus",
    "sardine",
    "mackerel",
    "horse_mackerel",
    "red_seabream",
    "rockfish",
    "seabass",
    "flounder",
    "korean_rockfish",
    "coelacanth",
]


def normalize_sprite(source_path: Path) -> Image.Image:
    image = Image.open(source_path).convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 255 if value >= 72 else 0)
    image.putalpha(alpha)
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError(f"No visible pixels in {source_path}")
    image = image.crop(bounds)
    scale = min(86 / image.width, 72 / image.height)
    size = (
        max(1, round(image.width * scale)),
        max(1, round(image.height * scale)),
    )
    image = image.resize(size, Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((96 - size[0]) // 2, (96 - size[1]) // 2))
    return canvas


def build_contact_sheet(sprites: dict[str, Image.Image]) -> None:
    cell_width, cell_height = 128, 116
    sheet = Image.new("RGBA", (cell_width * 5, cell_height * ceil(len(FISH_NAMES) / 5)), (8, 35, 35, 255))
    draw = ImageDraw.Draw(sheet)
    for index, name in enumerate(FISH_NAMES):
        x = (index % 5) * cell_width
        y = (index // 5) * cell_height
        if index % 2:
            draw.rounded_rectangle(
                (x + 4, y + 4, x + cell_width - 4, y + cell_height - 4),
                radius=12,
                fill=(19, 56, 54, 255),
            )
        sheet.alpha_composite(sprites[name], (x + 16, y + 2))
        draw.text((x + 7, y + 99), name, fill=(218, 245, 238, 255))
    sheet.save(OUTPUT_DIR / "fish-contact-sheet.png", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize fish assets without rewriting unrelated sprites")
    parser.add_argument("--only", nargs="+", choices=FISH_NAMES)
    selected = set(parser.parse_args().only or FISH_NAMES)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sprites = {}
    for name in FISH_NAMES:
        if name not in selected:
            sprites[name] = Image.open(OUTPUT_DIR / f"{name}.png").convert("RGBA")
            continue
        source_path = SOURCE_DIR / f"{name}.png"
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        sprite = normalize_sprite(source_path)
        sprite.save(OUTPUT_DIR / f"{name}.png", optimize=True)
        sprites[name] = sprite
    build_contact_sheet(sprites)
    print(f"Processed {len(selected)} fish sprites at 96x96; contact sheet contains {len(sprites)}")


if __name__ == "__main__":
    main()
