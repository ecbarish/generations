"""Contact sheet of the 8 region mood panels, captioned with each region's name. Run: python3 make_contact_sheet.py"""
import os
from PIL import Image, ImageDraw, ImageFont
import world_data as W
HERE = os.path.dirname(os.path.abspath(__file__))
# Panels live in gen/ while working and in regions/ in the repo; the sheet is written next to them.
SRC = next(d for d in (os.path.join(HERE, "gen"), os.path.join(HERE, "regions")) if os.path.isdir(d))
INTERIM = set()                               # region panels waiting on a re-run (none since the 21:05 re-runs)
TW, TH, CAP, PAD, COLS = 480, 270, 40, 12, 4
bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 20)
small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
rows = (len(W.REGIONS) + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * (TW + PAD) + PAD, 56 + rows * (TH + CAP + PAD) + PAD), (20, 24, 32))
d = ImageDraw.Draw(sheet)
d.text((PAD, 14), "Wildbond regions: mood panels (concept only; the schematic is the planning truth)", font=bold, fill=(242, 208, 128))
for i, r in enumerate(W.REGIONS):
    x = PAD + (i % COLS) * (TW + PAD); y = 56 + (i // COLS) * (TH + CAP + PAD)
    img = Image.open(os.path.join(SRC, f"region-{r['id']}.png")).convert("RGB").resize((TW, TH), Image.LANCZOS)
    sheet.paste(img, (x, y))
    d.rectangle([x, y + TH, x + TW - 1, y + TH + CAP - 1], fill=(27, 36, 48))
    d.text((x + 10, y + TH + 9), r["name"], font=bold, fill=(244, 237, 220))
    tag = "interim: re-run pending" if r["id"] in INTERIM else f"{r['badge']} · {r['warden']}"
    tw = d.textlength(tag, font=small)
    d.text((x + TW - tw - 10, y + TH + 14), tag, font=small, fill=(242, 208, 128) if r["id"] in INTERIM else (207, 196, 172))
out = os.path.join(HERE if SRC.endswith("regions") else SRC, "region-contact-sheet.png"); sheet.save(out); print("wrote", out, sheet.size)
