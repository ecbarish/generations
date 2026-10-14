extends SceneTree
## Contact sheet for the catalogue batch. Draws each new creature at world scale
## (about 12.35px per metre, beside the 12x21 tamer) and saves a nearest-neighbour sheet.
##   Godot --headless --path wildbond-godot --script res://tests/cat_sheet.gd
const Figures := preload("res://scripts/figures.gd")
const SCALE := { "tiny": 0.7, "small": 0.85, "medium": 1.0, "large": 1.2, "huge": 1.45 }
const ZOOM := 6
const LINES := [
	["creekribbon", "murkcoil", "gloomtide"],
	["seedmoth", "sootcloak", "hearthbloom"],
	["dawnfoal", "sunford"],
	["whisperpup", "ridgehowl"],
	["charcup", "kilnback"],
]

func _initialize() -> void:
	var data: Dictionary = load("res://data/wildbond.json").data
	var evo: Dictionary = load("res://data/evolution.json").data
	for k in evo.species:
		data.SPECIES[k] = evo.species[k]
	var cell_w := 300
	var cell_h := 170
	var cols := 3
	var rows := LINES.size()
	var img := Image.create(cols * cell_w, 48 + rows * cell_h, false, Image.FORMAT_RGBA8)
	img.fill(Color("e6dcc6"))
	_label(img, Vector2i(16, 14), "12 new Wildbond species at world scale beside a 12x21 tamer")
	for r in rows:
		for c in LINES[r].size():
			var id: String = LINES[r][c]
			var s: Dictionary = data.SPECIES[id]
			var look: Dictionary = Figures.look_for(s)
			var pose := { "walking": false, "wag": 0, "ears_up": true }
			var parts: Array = Figures.parts_of(true, pose, look)
			var span: Vector2i = Figures.pixel_span(parts)
			var sc: float = float(SCALE.get(str(s.size), 1.0))
			var origin := Vector2i(c * cell_w + 48, 48 + r * cell_h + 18)
			_stamp(img, origin, parts, sc)
			var px_h := int(round(float(span.y) * sc))
			var metres := float(px_h) / 12.35
			_label(img, Vector2i(c * cell_w + 12, 48 + r * cell_h + cell_h - 40), s.name)
			_label(img, Vector2i(c * cell_w + 12, 48 + r * cell_h + cell_h - 22), "%s  %dpx  %.1fm" % [s.size, px_h, metres])
	# the tamer, same zoom, so the size rule is visible
	var tamer := Figures.person_parts(Vector2i.DOWN, false, 0, false, {
		"skin": Color("f1c9a0"), "hair": Color("6b4423"), "hat": Color("2a3f6b"),
		"shirt": Color("d8453a"), "legs": Color("3a4a6a"), "shoes": Color("3a2a1a"),
		"style": "short", "outfit": "trousers", "body": "broad",
	})
	_stamp(img, Vector2i(2 * cell_w + 70, 48 + 2 * cell_h + 12), tamer, 1.0)
	_label(img, Vector2i(2 * cell_w + 12, 48 + 2 * cell_h + cell_h - 40), "Tamer")
	_label(img, Vector2i(2 * cell_w + 12, 48 + 2 * cell_h + cell_h - 22), "12x21px  1.7m")
	var out := OS.get_environment("SHEET_OUTPUT")
	if out == "":
		out = "res://frames/cat-sheet.png"
	img.save_png(out)
	print("CAT SHEET ", out, " ", img.get_width(), "x", img.get_height())
	_audit_sheet(data, tamer)
	quit(0)

## The stages added by the roster audit, same world scale, so the new finals and the two young forms can be seen together.
func _audit_sheet(data: Dictionary, tamer: Array) -> void:
	var skip := {
		"creekribbon": true, "murkcoil": true, "gloomtide": true, "seedmoth": true, "sootcloak": true, "hearthbloom": true,
		"dawnfoal": true, "sunford": true, "whisperpup": true, "ridgehowl": true, "charcup": true, "kilnback": true,
	}
	var ids: Array = []
	for id in data.SPECIES:
		if data.SPECIES[id].get("marks", false) and not skip.has(str(id)):
			ids.append(str(id))
	ids.sort_custom(func(a, b): return str(data.SPECIES[a].name) < str(data.SPECIES[b].name))
	var cols := 4
	var cell_w := 240
	var cell_h := 150
	var rows := int(ceil(float(ids.size() + 1) / float(cols)))
	var sheet := Image.create(cols * cell_w, 36 + rows * cell_h, false, Image.FORMAT_RGBA8)
	sheet.fill(Color("e6dcc6"))
	_label(sheet, Vector2i(12, 8), "%d new stages at world scale beside a 12x21 tamer" % ids.size())
	var z := 4
	for i in ids.size():
		var id: String = ids[i]
		var s: Dictionary = data.SPECIES[id]
		var look: Dictionary = Figures.look_for(s)
		var pose := { "walking": false, "wag": 0, "ears_up": true }
		var parts: Array = Figures.parts_of(true, pose, look)
		var span: Vector2i = Figures.pixel_span(parts)
		var sc: float = float(SCALE.get(str(s.size), 1.0))
		var c := i % cols
		var r := int(i / cols)
		var origin := Vector2i(c * cell_w + 36, 36 + r * cell_h + 8)
		_stamp(sheet, origin, parts, sc, z)
		var px_h := int(round(float(span.y) * sc))
		_label(sheet, Vector2i(c * cell_w + 8, 36 + r * cell_h + cell_h - 36), s.name)
		_label(sheet, Vector2i(c * cell_w + 8, 36 + r * cell_h + cell_h - 18), "%s  %dpx" % [s.size, px_h])
	var t := ids.size()
	_stamp(sheet, Vector2i((t % cols) * cell_w + 48, 36 + int(t / cols) * cell_h + 8), tamer, 1.0, z)
	_label(sheet, Vector2i((t % cols) * cell_w + 8, 36 + int(t / cols) * cell_h + cell_h - 36), "Tamer")
	_label(sheet, Vector2i((t % cols) * cell_w + 8, 36 + int(t / cols) * cell_h + cell_h - 18), "12x21px")
	var audit_out := OS.get_environment("AUDIT_SHEET")
	if audit_out == "":
		audit_out = "res://frames/audit-sheet.png"
	sheet.save_png(audit_out)
	print("AUDIT SHEET ", audit_out, " ", sheet.get_width(), "x", sheet.get_height(), " ", ids.size())

func _stamp(img: Image, origin: Vector2i, parts: Array, sc: float, z: int = ZOOM) -> void:
	for layer in 2:
		for p in parts:
			var col: Color = Color("1e1a22") if layer == 0 else p[4]
			var grow := z if layer == 0 else 0
			var x0 := origin.x + int(floor(float(p[0]) * sc)) * z - (z if layer == 0 else 0)
			var y0 := origin.y + int(floor(float(p[1]) * sc)) * z - (z if layer == 0 else 0)
			var w := maxi(1, int(ceil(float(p[2]) * sc))) * z + grow
			var h := maxi(1, int(ceil(float(p[3]) * sc))) * z + grow
			for y in h:
				for x in w:
					var px := x0 + x
					var py := y0 + y
					if px < 0 or py < 0 or px >= img.get_width() or py >= img.get_height():
						continue
					if layer == 1 or img.get_pixel(px, py).a < 0.5:
						img.set_pixel(px, py, col)

## A 5×7 pixel font, enough to name each creature on the sheet.
const GLYPHS := {
	"A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
	"B": ["11110", "10001", "11110", "10001", "10001", "10001", "11110"],
	"C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
	"D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
	"E": ["11111", "10000", "11110", "10000", "10000", "10000", "11111"],
	"F": ["11111", "10000", "11110", "10000", "10000", "10000", "10000"],
	"G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
	"H": ["10001", "10001", "11111", "10001", "10001", "10001", "10001"],
	"I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
	"J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
	"K": ["10001", "10010", "11100", "10010", "10001", "10001", "10001"],
	"L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
	"M": ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
	"N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
	"O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
	"P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
	"R": ["11110", "10001", "10001", "11110", "10010", "10001", "10001"],
	"S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
	"T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
	"U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
	"V": ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
	"W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
	"Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
	"0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
	"1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
	"2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
	"3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
	"4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
	"5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
	"6": ["01110", "10000", "11110", "10001", "10001", "10001", "01110"],
	"7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
	"8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
	"9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
	" ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
	".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
	"·": ["00000", "00000", "00100", "00000", "00100", "00000", "00000"],
	"×": ["00000", "10001", "01010", "00100", "01010", "10001", "00000"],
	"-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
	"m": ["00000", "00000", "11010", "10101", "10101", "10101", "10001"],
	"p": ["00000", "00000", "11110", "10001", "11110", "10000", "10000"],
	"x": ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
}

func _label(img: Image, at: Vector2i, text: String) -> void:
	var x := at.x
	for i in text.length():
		var ch := text.substr(i, 1)
		var keep := ch == "m" or ch == "p" or ch == "x"
		var g: Array = GLYPHS.get(ch if keep else ch.to_upper(), GLYPHS[" "])
		if ch == " ":
			x += 8
			continue
		for row in g.size():
			var bits: String = g[row]
			for col in bits.length():
				if bits.substr(col, 1) != "1":
					continue
				for dy in 2:
					for dx in 2:
						var px := x + col * 2 + dx
						var py := at.y + row * 2 + dy
						if px >= 0 and py >= 0 and px < img.get_width() and py < img.get_height():
							img.set_pixel(px, py, Color("1e1a22"))
		x += 12
