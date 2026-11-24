"""Saltmarsh Shipping Office palette. 18 colours, under the house cap of 32."""
PALETTE = {
    "ink":      (0x1E, 0x1A, 0x22, 255),  # house outline
    "water":    (0x23, 0x39, 0x4C, 255),  # deep water, night, UI ink, deep shade
    "water_m":  (0x3A, 0x55, 0x68, 255),  # wave face, wet stone, glass shade
    "sky":      (0x9C, 0xBE, 0xCB, 255),  # day sky, sail shade, frost shadow
    "mist":     (0xD4, 0xE5, 0xE4, 255),  # mist, sails, ice, glass light
    "paper":    (0xE7, 0xF0, 0xEF, 255),  # page, chart ground, snow mid
    "panel":    (0xF4, 0xFA, 0xF8, 255),  # cards, snow light, sail light, foam, shine
    "sand":     (0xC8, 0xC5, 0xA0, 255),  # beach, pale stone
    "sand_d":   (0x9A, 0x95, 0x6E, 255),  # beach shade, stone mid
    "timber_l": (0xB5, 0x9A, 0x68, 255),  # lit timber, upper-left faces
    "timber":   (0x8D, 0x7A, 0x52, 255),  # timber mid (existing)
    "hull":     (0x6E, 0x58, 0x40, 255),  # hull mid, timber shade (existing)
    "hull_d":   (0x4A, 0x38, 0x28, 255),  # hull / timber deep shade
    "lamp":     (0xF2, 0xD0, 0x80, 255),  # house lamplight, current glow
    "lamp_d":   (0xC4, 0x92, 0x4A, 255),  # lamp shade, warm ember
    "reed_l":   (0x8A, 0x9A, 0x6A, 255),  # sunlit reed
    "reed":     (0x6B, 0x7A, 0x54, 255),  # reed mid, headland grass
    "reed_d":   (0x4A, 0x56, 0x40, 255),  # reed shade
}
P = PALETTE
HEX = {k: "#{:02x}{:02x}{:02x}".format(*v[:3]) for k, v in PALETTE.items()}
RGB = {v[:3]: k for k, v in PALETTE.items()}
TRANSPARENT = (0, 0, 0, 0)

ROLES = {
    "ink": "outline (house ink)",
    "water": "deep water, night, UI ink, deep shade",
    "water_m": "wave face, wet stone, glass shade",
    "sky": "day sky, sail shade, frost shadow, water highlight",
    "mist": "sea mist, sails, ice, glass light",
    "paper": "page, chart ground, snow mid",
    "panel": "cards, snow light, sail light, foam, shine",
    "sand": "beach, pale stone",
    "sand_d": "beach shade, stone mid",
    "timber_l": "lit timber, upper-left faces",
    "timber": "timber mid (existing)",
    "hull": "hull mid, timber shade, quiet text (existing)",
    "hull_d": "hull and timber deep shade",
    "lamp": "lamplight, current glow, flags, stern light (house)",
    "lamp_d": "lamp shade, warm ember",
    "reed_l": "sunlit reed",
    "reed": "reed mid, headland grass",
    "reed_d": "reed shade",
}

EXISTING_UI = [
    "#23394c", "#9cbecb", "#d4e5e4", "#c8c5a0", "#f2d080",
    "#8d7a52", "#6e5840", "#e7f0ef", "#f4faf8",
]
NEW_FOR_ART = [
    "#1e1a22", "#3a5568", "#9a956e", "#b59a68", "#4a3828",
    "#c4924a", "#8a9a6a", "#6b7a54", "#4a5640",
]

STOPS = [
    ("pier", "Pier", "Pier"),
    ("headland", "Headland", "Head"),
    ("reed", "Reed", "Reed"),
    ("quay", "Quay", "Quay"),
    ("voyage", "Voyage", "Voyage"),
    ("frost", "Frost Lane", "Frost"),
    ("glass", "Glass", "Glass"),
]
STATES = ("locked", "current", "done")
TOWERS = ("pier", "headland", "reed", "quay", "glass")
