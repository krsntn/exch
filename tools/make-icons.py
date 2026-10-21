# Draws the Exch icon (a bold "E" whose middle bar is a two-way arrow) and writes
# icon.svg, the PNG icons, and favicon.ico. Needs Python 3 and Pillow.
#   python3 tools/make-icons.py
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BG = '#111317'
MARK = '#4ade80'

# The mark on a 100 x 100 grid. Every point is inside the maskable safe zone (radius 40 from the center).
BARS = [  # x, y, width, height
    (30, 24, 12, 52),  # stem
    (30, 24, 44, 12),  # top bar
    (30, 64, 44, 12),  # bottom bar
    (26, 46, 46, 8),   # arrow shaft (the middle bar)
]
HEADS = [  # arrow heads
    [(18, 50), (31, 39), (31, 61)],
    [(82, 50), (69, 39), (69, 61)],
]
CORNER = 22  # corner radius of the rounded-square background


def svg():
    parts = [f'<rect width="100" height="100" rx="{CORNER}" fill="{BG}"/>']
    parts += [f'<rect x="{x}" y="{y}" width="{w}" height="{h}"/>' for x, y, w, h in BARS]
    parts += ['<polygon points="' + ' '.join(f'{x},{y}' for x, y in p) + '"/>' for p in HEADS]
    body = '\n  '.join(parts)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="{MARK}">\n'
            f'  {body}\n</svg>\n')


def png(size, rounded):
    scale = 8  # draw large, then shrink, for smooth edges
    s = size * scale / 100
    img = Image.new('RGBA', (size * scale,) * 2, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, size * scale - 1, size * scale - 1], radius=CORNER * s, fill=BG)
    else:
        d.rectangle([0, 0, size * scale, size * scale], fill=BG)
    for x, y, w, h in BARS:
        d.rectangle([x * s, y * s, (x + w) * s - 1, (y + h) * s - 1], fill=MARK)
    for p in HEADS:
        d.polygon([(x * s, y * s) for x, y in p], fill=MARK)
    return img.resize((size, size), Image.LANCZOS)


(ROOT / 'icon.svg').write_text(svg())
png(192, True).save(ROOT / 'icon-192.png')
png(512, True).save(ROOT / 'icon-512.png')
png(512, False).save(ROOT / 'icon-maskable-512.png')
png(180, False).convert('RGB').save(ROOT / 'apple-touch-icon.png')
png(256, True).save(ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
