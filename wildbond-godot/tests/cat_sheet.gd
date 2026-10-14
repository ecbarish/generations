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
	if OS.get_environment("SCALE_BEFORE") != "":
		_scale_before()
		quit(0)
		return
	if OS.get_environment("SCALE_AFTER") != "":
		_scale_after()
		quit(0)
		return
	var data: Dictionary = load("res://data/wildbond.json").data
	var evo: Dictionary = load("res://data/evolution.json").data
	for k in evo.species:
		data.SPECIES[k] = evo.species[k]
	var cell_w := 380
	var cell_h := 250
	var cols := 3
	var rows := LINES.size()
	var img := Image.create(cols * cell_w, 48 + rows * cell_h, false, Image.FORMAT_RGBA8)
	img.fill(Color("e6dcc6"))
	_label(img, Vector2i(16, 14), "12 new Wildbond species at world scale beside a 12x21 tamer")
	for r in rows:
		for c in LINES[r].size():
			var id: String = LINES[r][c]
			var s: Dictionary = data.SPECIES[id]
			var pose := { "walking": false, "wag": 0, "ears_up": true }
			var parts: Array = Figures.sized_parts(s, true, pose)
			var span: Vector2i = Figures.pixel_span(parts)
			var origin := Vector2i(c * cell_w + 70, 48 + r * cell_h + cell_h - 64 - 12 * ZOOM)
			_stamp(img, origin, parts, 1.0)
			_label(img, Vector2i(c * cell_w + 12, 48 + r * cell_h + cell_h - 40), s.name)
			_label(img, Vector2i(c * cell_w + 12, 48 + r * cell_h + cell_h - 22), "%dpx  %.2fm" % [span.y, float(s.metres)])
	# the tamer, same zoom, so the size rule is visible
	var tamer := _tamer()
	_stamp(img, Vector2i(2 * cell_w + 90, 48 + 2 * cell_h + cell_h - 64 - 21), tamer, 1.0)
	_label(img, Vector2i(2 * cell_w + 12, 48 + 2 * cell_h + cell_h - 40), "Tamer")
	_label(img, Vector2i(2 * cell_w + 12, 48 + 2 * cell_h + cell_h - 22), "12x21px  1.7m")
	var out := OS.get_environment("SHEET_OUTPUT")
	if out == "":
		out = "res://frames/cat-sheet.png"
	img.save_png(out)
	print("CAT SHEET ", out, " ", img.get_width(), "x", img.get_height())
	_audit_sheet(data, tamer)
	_all_sheet(data, tamer)
	quit(0)

## Existing creatures at the fractional world scale, saved before that scale became whole pixels.
func _scale_before() -> void:
	var data: Dictionary = load("res://data/wildbond.json").data
	var evo: Dictionary = load("res://data/evolution.json").data
	for k in evo.species:
		data.SPECIES[k] = evo.species[k]
	var ids := ["poolkit", "glimmerwing", "bogsnap", "elderhorn", "hearthlaugh", "cindercub"]
	var cell_w := 160
	var cell_h := 150
	var img := Image.create(ids.size() * cell_w, 36 + cell_h, false, Image.FORMAT_RGBA8)
	img.fill(Color("e6dcc6"))
	_label(img, Vector2i(8, 8), "Before  fractional world scale")
	for i in ids.size():
		var id: String = ids[i]
		var s: Dictionary = data.SPECIES[id]
		var look: Dictionary = Figures.look_for(s)
		var pose := { "walking": false, "wag": 0, "ears_up": true }
		var parts: Array = Figures.parts_of(true, pose, look)
		var span: Vector2i = Figures.pixel_span(parts)
		var sc: float = float(SCALE.get(str(s.get("size", "medium")), 1.0))
		_stamp(img, Vector2i(i * cell_w + 28, 36), parts, sc, 4)
		var px_h := int(round(float(span.y) * sc))
		_label(img, Vector2i(i * cell_w + 6, 36 + cell_h - 28), s.name)
		_label(img, Vector2i(i * cell_w + 6, 36 + cell_h - 12), "%dpx" % px_h)
	var out := OS.get_environment("SCALE_BEFORE")
	img.save_png(out)
	print("SCALE BEFORE ", out, " ", img.get_width(), "x", img.get_height())

## The same six creatures after size lives in the pixels, at a whole-number scale of 1.
func _scale_after() -> void:
	var data: Dictionary = load("res://data/wildbond.json").data
	var evo: Dictionary = load("res://data/evolution.json").data
	for k in evo.species:
		data.SPECIES[k] = evo.species[k]
	var ids := ["poolkit", "glimmerwing", "bogsnap", "elderhorn", "hearthlaugh", "cindercub"]
	var cell_w := 180
	var cell_h := 190
	var img := Image.create(ids.size() * cell_w, 36 + cell_h, false, Image.FORMAT_RGBA8)
	img.fill(Color("e6dcc6"))
	_label(img, Vector2i(8, 8), "After  pixel height, scale 1")
	for i in ids.size():
		var id: String = ids[i]
		var s: Dictionary = data.SPECIES[id]
		var pose := { "walking": false, "wag": 0, "ears_up": true }
		var parts: Array = Figures.sized_parts(s, true, pose)
		var span: Vector2i = Figures.pixel_span(parts)
		_stamp(img, Vector2i(i * cell_w + 36, 36 + cell_h - 48 - 12 * 4), parts, 1.0, 4)
		_label(img, Vector2i(i * cell_w + 6, 36 + cell_h - 40), s.name)
		_label(img, Vector2i(i * cell_w + 6, 36 + cell_h - 24), "%dpx" % span.y)
	var out := OS.get_environment("SCALE_AFTER")
	img.save_png(out)
	print("SCALE AFTER ", out, " ", img.get_width(), "x", img.get_height())

## Every new figure on one sheet, for art sign-off. New drawings are the ones that opted into marks.
func _all_sheet(data: Dictionary, tamer: Array) -> void:
	var ids: Array = []
	for id in data.SPECIES:
		if data.SPECIES[id].get("marks", false):
			ids.append(str(id))
	ids.sort_custom(func(a, b): return str(data.SPECIES[a].name) < str(data.SPECIES[b].name))
	var cols := 5
	var cell_w := 280
	var cell_h := 210
	var rows := int(ceil(float(ids.size() + 1) / float(cols)))
	var sheet := Image.create(cols * cell_w, 36 + rows * cell_h, false, Image.FORMAT_RGBA8)
	sheet.fill(Color("e6dcc6"))
	_label(sheet, Vector2i(12, 8), "%d new figures at world scale" % ids.size())
	var z := 4
	for i in ids.size():
		var id: String = ids[i]
		var s: Dictionary = data.SPECIES[id]
		var pose := { "walking": false, "wag": 0, "ears_up": true }
		var parts: Array = Figures.sized_parts(s, true, pose)
		var span: Vector2i = Figures.pixel_span(parts)
		var c := i % cols
		var r := int(i / cols)
		var origin := Vector2i(c * cell_w + 48, 36 + r * cell_h + cell_h - 52 - 12 * z)
		_stamp(sheet, origin, parts, 1.0, z)
		_label(sheet, Vector2i(c * cell_w + 8, 36 + r * cell_h + cell_h - 34), s.name)
		_label(sheet, Vector2i(c * cell_w + 8, 36 + r * cell_h + cell_h - 16), "%dpx  %.2fm" % [span.y, float(s.metres)])
	var t := ids.size()
	_stamp(sheet, Vector2i((t % cols) * cell_w + 48, 36 + int(t / cols) * cell_h + cell_h - 52 - 21 * z), tamer, 1.0, z)
	_label(sheet, Vector2i((t % cols) * cell_w + 8, 36 + int(t / cols) * cell_h + cell_h - 34), "Tamer")
	_label(sheet, Vector2i((t % cols) * cell_w + 8, 36 + int(t / cols) * cell_h + cell_h - 16), "12x21px")
	var all_out := OS.get_environment("ALL_SHEET")
	if all_out == "":
		all_out = "res://frames/all-figures.png"
	sheet.save_png(all_out)
	print("ALL SHEET ", all_out, " ", sheet.get_width(), "x", sheet.get_height(), " ", ids.size())

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
	var cell_w := 280
	var cell_h := 210
	var rows := int(ceil(float(ids.size() + 1) / float(cols)))
	var sheet := Image.create(cols * cell_w, 36 + rows * cell_h, false, Image.FORMAT_RGBA8)
	sheet.fill(Color("e6dcc6"))
	_label(sheet, Vector2i(12, 8), "%d new stages at world scale beside a 12x21 tamer" % ids.size())
	var z := 4
	for i in ids.size():
		var id: String = ids[i]
		var s: Dictionary = data.SPECIES[id]
		var pose := { "walking": false, "wag": 0, "ears_up": true }
		var parts: Array = Figures.sized_parts(s, true, pose)
		var span: Vector2i = Figures.pixel_span(parts)
		var c := i % cols
		var r := int(i / cols)
		var origin := Vector2i(c * cell_w + 48, 36 + r * cell_h + cell_h - 54 - 12 * z)
		_stamp(sheet, origin, parts, 1.0, z)
		_label(sheet, Vector2i(c * cell_w + 8, 36 + r * cell_h + cell_h - 36), s.name)
		_label(sheet, Vector2i(c * cell_w + 8, 36 + r * cell_h + cell_h - 18), "%dpx  %.2fm" % [span.y, float(s.metres)])
	var t := ids.size()
	_stamp(sheet, Vector2i((t % cols) * cell_w + 48, 36 + int(t / cols) * cell_h + cell_h - 54 - 21 * z), tamer, 1.0, z)
	_label(sheet, Vector2i((t % cols) * cell_w + 8, 36 + int(t / cols) * cell_h + cell_h - 36), "Tamer")
	_label(sheet, Vector2i((t % cols) * cell_w + 8, 36 + int(t / cols) * cell_h + cell_h - 18), "12x21px")
	var audit_out := OS.get_environment("AUDIT_SHEET")
	if audit_out == "":
		audit_out = "res://frames/audit-sheet.png"
	sheet.save_png(audit_out)
	print("AUDIT SHEET ", audit_out, " ", sheet.get_width(), "x", sheet.get_height(), " ", ids.size())

func _tamer() -> Array:
	var parts := Figures.person_parts(Vector2i.DOWN, false, 0, false, {
		"skin": Color("f4eddc"), "hair": Color("6a4a32"), "hat": Color("33465e"),
		"shirt": Color("8e342c"), "legs": Color("435a78"), "shoes": Color("4a3426"),
		"style": "short", "outfit": "trousers", "body": "broad",
	})
	for p in parts:
		p[4] = Figures.nearest_palette(p[4])
	return parts

func _stamp(img: Image, origin: Vector2i, parts: Array, sc: float, z: int = ZOOM) -> void:
	for layer in 2:
		for p in parts:
			var col: Color = Color("1e1a22") if layer == 0 else Figures.nearest_palette(p[4])
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
