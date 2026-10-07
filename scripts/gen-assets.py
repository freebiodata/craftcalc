#!/usr/bin/env python3
"""Generate favicon.svg + og-default.png for CraftCalc."""
from PIL import Image, ImageDraw, ImageFont
import os, math

OUT = os.path.join(os.path.dirname(__file__), '../public')
os.makedirs(OUT, exist_ok=True)

# ---------- OG image 1200x630 ----------
W, H = 1200, 630
img = Image.new('RGB', (W, H), '#0c0e0a')
d = ImageDraw.Draw(img)

# subtle grid
for x in range(0, W, 40):
    d.line([(x, 0), (x, H)], fill='#121608', width=1)
for y in range(0, H, 40):
    d.line([(0, y), (W, y)], fill='#121608', width=1)

# accent glow circle (crosshair motif)
cx, cy = 1010, 170
for r, alpha in [(140, 12), (110, 20), (80, 30)]:
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(79, 140, 255, alpha))
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
d = ImageDraw.Draw(img)

# crosshair
ch_x, ch_y, ch_len, ch_gap, ch_w = 1010, 170, 90, 22, 6
accent = '#5fbb46'
for (x1, y1, x2, y2) in [
    (ch_x - ch_gap - ch_len, ch_y, ch_x - ch_gap, ch_y),
    (ch_x + ch_gap, ch_y, ch_x + ch_gap + ch_len, ch_y),
    (ch_x, ch_y - ch_gap - ch_len, ch_x, ch_y - ch_gap),
    (ch_x, ch_y + ch_gap, ch_x, ch_y + ch_gap + ch_len),
]:
    d.rectangle([x1 - ch_w // 2 if x1 == x2 else x1, y1 - ch_w // 2 if y1 == y2 else y1,
                 x2 + ch_w // 2 if x1 == x2 else x2, y2 + ch_w // 2 if y1 == y2 else y2], fill=accent)
d.ellipse([ch_x - 5, ch_y - 5, ch_x + 5, ch_y + 5], fill=accent)

try:
    font_big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 64)
    font_med = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 34)
    font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 27)
except Exception:
    font_big = font_med = font_small = ImageFont.load_default()

d.text((80, 180), 'CraftCalc', font=font_big, fill='#e8ecf4')
d.text((80, 270), 'Free Minecraft circle, portal & build calculators', font=font_med, fill='#9aa5bd')
d.text((80, 330), 'Circle generator · Sphere layers · Nether portals · Beacons', font=font_small, fill='#6b768f')

# badges
bx, by = 80, 420
for label, color in [('12 games', '#3ddc97'), ('No sign-up', '#5fbb46'), ('In-browser math', '#ffb454')]:
    tw = d.textlength(label, font=font_small)
    d.rounded_rectangle([bx, by, bx + tw + 36, by + 48], radius=24, outline=color, width=2)
    d.text((bx + 18, by + 9), label, font=font_small, fill=color)
    bx += tw + 56

img.save(os.path.join(OUT, 'og-default.png'))
print('og-default.png written')

# ---------- favicon.svg ----------
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0c0e0a"/>
  <circle cx="32" cy="32" r="20" stroke="#5fbb46" stroke-width="4" fill="none"/>
  <circle cx="32" cy="32" r="4" fill="#5fbb46"/>
  <path d="M32 6v10M32 48v10M6 32h10M48 32h10" stroke="#5fbb46" stroke-width="4" stroke-linecap="round"/>
</svg>'''
open(os.path.join(OUT, 'favicon.svg'), 'w').write(svg)
print('favicon.svg written')

# ---------- logo-512.png (for Organization JSON-LD) ----------
logo = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
ld = ImageDraw.Draw(logo)
ld.rounded_rectangle([0, 0, 511, 511], radius=110, fill='#0c0e0a')
ld.ellipse([146, 146, 366, 366], outline='#5fbb46', width=26)
ld.ellipse([234, 234, 278, 278], fill='#5fbb46')
for (x1, y1, x2, y2) in [(256, 60, 256, 136), (256, 376, 256, 452), (60, 256, 136, 256), (376, 256, 452, 256)]:
    ld.rounded_rectangle([x1 - 13, y1, x2 + 13, y2], radius=13, fill='#5fbb46')
logo.save(os.path.join(OUT, 'logo-512.png'))
print('logo-512.png written')
