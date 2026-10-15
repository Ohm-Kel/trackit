#!/usr/bin/env python3
"""Generate the PWA icons in frontend/public from the clock emblem in logo.png.

The full logo includes the wordmark, which is unreadable at icon sizes, so the
icons use only the emblem, on the logo's white background. Maskable icons keep
the emblem inside the central 80% circle that every launcher mask preserves.

Run from the repository root after changing logo.png, and commit the output:
    pip install pillow && python3 scripts/generate-pwa-icons.py
"""
from pathlib import Path

from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "frontend" / "public"
# Square around the emblem in the 640x640 logo (measured from its pixels).
EMBLEM_BOX = (150, 92, 490, 432)
BACKGROUND = (255, 255, 255)

# file name, size in pixels, emblem diameter as a share of the icon
ICONS = [
    ("pwa-64x64.png", 64, 0.94),
    ("pwa-192x192.png", 192, 0.9),
    ("pwa-512x512.png", 512, 0.9),
    ("maskable-icon-512x512.png", 512, 0.7),
    ("apple-touch-icon-180x180.png", 180, 0.8),
]


def main():
    emblem = Image.open(PUBLIC / "logo.png").convert("RGB").crop(EMBLEM_BOX)
    for name, size, share in ICONS:
        icon = Image.new("RGB", (size, size), BACKGROUND)
        inner = round(size * share)
        scaled = emblem.resize((inner, inner), Image.Resampling.LANCZOS)
        offset = (size - inner) // 2
        icon.paste(scaled, (offset, offset))
        icon.save(PUBLIC / name, optimize=True)
        print(f"wrote {name}")


if __name__ == "__main__":
    main()
