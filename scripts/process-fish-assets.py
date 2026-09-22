from pathlib import Path

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
    "minnow",
    "trout",
    "ayu",
    "salmon",
    "snakehead",
    "rainbow_trout",
    "masou_salmon",
    "sardine",
    "mackerel",
    "horse_mackerel",
    "red_seabream",
    "seabass",
    "flounder",
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
    sheet = Image.new("RGBA", (cell_width * 5, cell_height * 4), (8, 35, 35, 255))
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
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sprites = {}
    for name in FISH_NAMES:
        source_path = SOURCE_DIR / f"{name}.png"
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        sprite = normalize_sprite(source_path)
        sprite.save(OUTPUT_DIR / f"{name}.png", optimize=True)
        sprites[name] = sprite
    build_contact_sheet(sprites)
    print(f"Processed {len(sprites)} fish sprites at 96x96")


if __name__ == "__main__":
    main()
