"""Genera las versiones optimizadas (WebP + JPG) de las fotos del sitio.

Uso:  python3 scripts/optimizar-imagenes.py
Lee de fotos-originales/ y escribe en public/img/.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import random

SRC = Path(__file__).resolve().parent.parent / "fotos-originales"
OUT = Path(__file__).resolve().parent.parent / "public" / "img"
OUT.mkdir(parents=True, exist_ok=True)


def save(im, name, widths):
    for w in widths:
        if w > im.width:
            w = im.width
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(OUT / f"{name}-{w}.webp", "WEBP", quality=80, method=6)
    im.save(OUT / f"{name}.jpg", "JPEG", quality=84, optimize=True, progressive=True)


bn = Image.open(SRC / "frida-bn.jpg").convert("RGB")
color = Image.open(SRC / "frida-color.jpg").convert("RGB")

save(bn, "frida-bn", [640, 960, 1179])
save(color, "frida-color", [640, 960, 1179])

# Detalles (recortes de las fotos reales)
save(bn.crop((380, 470, 940, 890)), "detalle-manos", [560])
save(color.crop((560, 960, 1179, 1493)), "detalle-gato", [619])
save(color.crop((560, 90, 1179, 790)), "detalle-espejo", [619])

# Grano sutil
random.seed(7)
g = Image.new("L", (160, 160))
g.putdata([random.randint(0, 255) for _ in range(160 * 160)])
g = g.filter(ImageFilter.GaussianBlur(0.4))
a = g.point(lambda v: int(abs(v - 128) * 0.35))
grain = Image.merge("LA", (g, a))
grain.save(OUT / "grano.png", optimize=True)

# Miniaturas cuadradas para la esfera de la galería (recortes de las fotos reales)
TILES = [
    ("bn", (330, 130, 850, 650)),      # 1 retrato
    ("bn", (400, 500, 900, 1000)),     # 2 manos
    ("bn", (230, 800, 930, 1460)),     # 3 sillón
    ("bn", (200, 0, 960, 520)),        # 4 espejo y focos
    ("color", (150, 370, 660, 880)),   # 5 perfil
    ("color", (700, 1040, 1179, 1493)),  # 6 gato
    ("color", (220, 690, 700, 1170)),  # 7 reloj y tatuajes
    ("color", (600, 360, 1080, 840)),  # 8 ventana
    ("color", (470, 60, 1090, 680)),   # 9 focos
]
for n, (src, box) in enumerate(TILES, 1):
    im = (bn if src == "bn" else color).crop(box)
    side = min(im.size)
    im = im.crop((0, 0, side, side)).resize((360, 360), Image.LANCZOS)
    im.save(OUT / f"esfera-{n}.webp", "WEBP", quality=78, method=6)
