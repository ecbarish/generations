extends Control
## Maren's ranch register: the character creator (W13, docs/wildbond-plan.md phase 2), framed as a book every tamer in
## the valley signs. The left page shows you four times life size, walking and turning; the right page holds your
## name, body, skin, hair, clothes and the line you sign. Arrow keys or the mouse; type your name. Signing paints you
## into the faded world (main.gd). Your last choices are kept in user://register.json and fill the book next time.

signal signed(look: Dictionary)
const Figures := preload("res://scripts/figures.gd")
const SAVE := "user://register.json"

const NAMES := ["Rowan", "Tamsin", "Ellis", "Briar", "Sol", "Hazel", "Corin", "Linden"]
const BODIES := [["Broad", "broad"], ["Narrow", "narrow"]]
const SKINS := [["Porcelain", "f6d8c0"], ["Fair", "f1c9a0"], ["Golden", "e0b088"], ["Tan", "c08a60"], ["Brown", "9a6440"], ["Deep", "6e4428"]]
const STYLES := [["Cap", "cap"], ["Short", "short"], ["Long", "long"], ["Ponytail", "ponytail"], ["Bun", "bun"]]
const HAIRS := [["Black", "2a1a12"], ["Chestnut", "6b4423"], ["Copper", "a8743a"], ["Wheat", "d8b06a"], ["Red", "c84a3a"], ["Silver", "e8e4dc"], ["Blue", "4a5aa8"], ["Moss", "3a7a5a"]]
const TOPS := [["Red", "d8453a"], ["Amber", "e8a03a"], ["Leaf", "4f8a5a"], ["Sky", "3a6ab8"], ["Plum", "7a4aa0"], ["Cream", "eae2d0"], ["Charcoal", "3a3a44"]]
const BOTTOMS := [["Navy", "3a4a6a"], ["Brown", "5a3a22"], ["Black", "2e2e36"], ["Olive", "6a7a3a"], ["Wine", "8a2a2a"], ["Sand", "c8b890"]]
const OUTFITS := [["Trousers", "trousers"], ["Skirt", "skirt"], ["Overalls", "overalls"]]
## Your family's heritage (docs/proposals/wildbond-heritage.md): where your people come from, a small gift in bonding or
## exploring, and the tale they tell about the fading. Everyone is human; nobody's heritage is the best one.
const FAMILIES := [["Farmfolk", "farm"], ["Coastfolk", "coast"], ["Highlanders", "highland"], ["Wanderers", "wander"]]
const FAMILY_TEXT := {
	"farm": "Larkhaven's farms. Field and forest creatures trust you a little sooner.",
	"coast": "Saltmarsh Coast. One partner for life: your lead creature's trust grows faster.",
	"highland": "Emberfall's high villages. Trust grows faster in hard battles against tamers.",
	"wander": "The roads of Farwatch. You find more in the tall grass.",
}
const ROWS := [["Name", []], ["Body", BODIES], ["Skin", SKINS], ["Hair", STYLES], ["Hair colour", HAIRS], ["Top", TOPS], ["Bottom", BOTTOMS], ["Outfit", OUTFITS], ["Family", FAMILIES]]
const COLOUR_ROWS := [2, 4, 5, 6]
const SIGN_ROW := 9
const ROW_Y := 28
const ROW_STEP := 13
const INK := Color("3e2c20")
const FAINT := Color("8a6e50")

var pick := [0, 0, 1, 0, 1, 0, 0, 0, 0]          # one choice per row (the name row uses name_i for suggestions)
var name_i := 0
var name_text := ""
var row := 0
var t := 0.0
var demo_i := 0
var font: Font
var keep := true                             # false in the recorded demo, so it never touches your saved choices

func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	font = ThemeDB.fallback_font
	visible = false
	if keep and FileAccess.file_exists(SAVE):
		var d = JSON.parse_string(FileAccess.get_file_as_string(SAVE))
		if d is Dictionary and d.get("pick") is Array and d.pick.size() == pick.size():
			for i in pick.size():
				pick[i] = clampi(int(d.pick[i]), 0, max(0, ROWS[i][1].size() - 1))
			name_text = str(d.get("name", "")).substr(0, 12)

func open() -> void:
	visible = true
	row = 0

func look() -> Dictionary:
	return {
		"name": name_text.strip_edges() if name_text.strip_edges() != "" else NAMES[name_i],
		"body": BODIES[pick[1]][1], "skin": Color(SKINS[pick[2]][1]), "style": STYLES[pick[3]][1],
		"hair": Color(HAIRS[pick[4]][1]), "shirt": Color(TOPS[pick[5]][1]), "legs": Color(BOTTOMS[pick[6]][1]),
		"hat": Color(BOTTOMS[pick[6]][1]).darkened(0.15), "shoes": Color("3a2a1a"), "outfit": OUTFITS[pick[7]][1],
		"heritage": FAMILIES[pick[8]][1],
	}

func change(d: int) -> void:
	if row == 0:
		name_i = wrapi(name_i + d, 0, NAMES.size())
		name_text = NAMES[name_i]
	elif row < SIGN_ROW:
		pick[row] = wrapi(pick[row] + d, 0, ROWS[row][1].size())

func sign_it() -> void:
	var l := look()
	name_text = l.name
	var f := FileAccess.open(SAVE, FileAccess.WRITE) if keep else null
	if f:
		f.store_string(JSON.stringify({ "pick": pick, "name": name_text }))
	visible = false
	signed.emit(l)

## For the recorded demo: fill the book one line at a time, then sign.
func demo_step() -> void:
	var steps := [[0, 1], [1, 1], [3, 3], [4, 3], [5, 3], [6, 3], [SIGN_ROW, 0]]
	if demo_i >= steps.size():
		return
	row = steps[demo_i][0]
	for i in steps[demo_i][1]:
		change(1)
	demo_i += 1
	if row == SIGN_ROW:
		sign_it()

# ---------------------------------------------------------------- input: arrows and Enter, typing, or the mouse
func _input(e: InputEvent) -> void:
	if not visible:
		return
	var typed := char(e.unicode) if e is InputEventKey and e.pressed and e.unicode >= 32 else ""
	if row == 0 and typed != "" and not (e.keycode in [KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT]):
		if name_text.length() < 12 and (typed.is_valid_identifier() or typed in " -'" or typed.is_valid_int()):
			name_text += typed                  # on the name line, letters (even W, A, S, D and E) are typing
		get_viewport().set_input_as_handled()
	elif row == 0 and e is InputEventKey and e.pressed and e.keycode == KEY_BACKSPACE:
		name_text = name_text.left(-1)
		get_viewport().set_input_as_handled()
	elif e is InputEventKey and e.pressed and e.keycode == KEY_TAB:
		row = wrapi(row + 1, 0, SIGN_ROW + 1)
		get_viewport().set_input_as_handled()
	elif Controls.dir(e) != Vector2i.ZERO or Controls.pressed(e, "interact") or (e is InputEventKey and e.pressed):
		var d := Controls.dir(e)              # named actions (controls.gd): arrows, WASD off the name line, a gamepad
		if d.y != 0: row = wrapi(row + d.y, 0, SIGN_ROW + 1)
		elif d.x != 0: change(d.x)
		elif Controls.pressed(e, "interact"):
			if row == SIGN_ROW: sign_it()
			else: row += 1
		get_viewport().set_input_as_handled()
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		var p := get_local_mouse_position()
		if Rect2(204, 166, 146, 15).has_point(p):
			row = SIGN_ROW
			sign_it()
		else:
			for i in ROWS.size():
				var y := ROW_Y + i * ROW_STEP
				if p.y >= y - 9 and p.y < y + 4 and p.x > 196:
					row = i
					if p.x < 270: change(-1)
					elif p.x > 332 or i != 0: change(1)
		get_viewport().set_input_as_handled()

func _process(dt: float) -> void:
	if visible:
		t += dt
		queue_redraw()

# ---------------------------------------------------------------- the book
func _text(s: String, at: Vector2, size: int, col: Color, width := -1.0) -> void:
	draw_string(font, at, s, HORIZONTAL_ALIGNMENT_LEFT if width < 0 else HORIZONTAL_ALIGNMENT_CENTER, width, size, col)

func _arrow(x: float, y: float, left: bool) -> void:
	var d := -1.0 if left else 1.0
	draw_colored_polygon(PackedVector2Array([Vector2(x - 2 * d, y - 6), Vector2(x + 2 * d, y - 3), Vector2(x - 2 * d, y)]), INK)

func _draw() -> void:
	draw_rect(Rect2(0, 0, 384, 216), Color(0.05, 0.04, 0.06, 0.6))
	draw_rect(Rect2(22, 10, 340, 198), Color("4a2e1a"))                  # the leather cover
	draw_rect(Rect2(24, 12, 336, 194), Color("6e4a2c"))
	draw_rect(Rect2(28, 16, 163, 186), Color("f2e6c8"))                  # the pages
	draw_rect(Rect2(193, 16, 163, 186), Color("f4e9cd"))
	draw_rect(Rect2(188, 16, 8, 186), Color("dccca4"))                   # the gutter
	# left page: the register's title and you, four times life size, walking and turning
	_text("Larkhaven Ranch Register", Vector2(28, 33), 9, INK, 163)
	_text("Tamers of the valley, in their own hand", Vector2(28, 44), 6, FAINT, 163)
	var faces := [Vector2i.DOWN, Vector2i.RIGHT, Vector2i.UP, Vector2i.LEFT]
	var face: Vector2i = faces[int(t / 1.8) % 4]
	draw_set_transform(Vector2(109, 147), 0, Vector2(1, 1))
	draw_rect(Rect2(-18, -2, 36, 4), Color(0, 0, 0, 0.12))                # a shadow on the page
	draw_set_transform(Vector2(85, 66), 0, Vector2(4, 4))
	Figures.person(self, Vector2.ZERO, face, true, int(t * 6.0) % 4, fmod(t, 3.1) < 0.12, look())
	draw_set_transform(Vector2.ZERO)
	var nm: String = look().name
	_text(nm, Vector2(28, 176), 12, INK, 163)
	draw_rect(Rect2(60, 180, 98, 1), FAINT)
	_text("signed, this first day of spring", Vector2(28, 190), 6, FAINT, 163)
	# right page: the lines you fill in
	for i in ROWS.size():
		var y := ROW_Y + i * ROW_STEP
		if i == row:
			draw_rect(Rect2(198, y - 9, 153, 12), Color(0.85, 0.66, 0.36, 0.35))
		_text(ROWS[i][0], Vector2(202, y), 7, FAINT)
		_arrow(260, y, true)
		_arrow(342, y, false)
		# every value sits centred between its two arrows; colours get a swatch just before the name
		var mid := 301.0
		if i == 0:
			var shown: String = name_text if name_text != "" else NAMES[name_i]
			var w0 := font.get_string_size(shown, HORIZONTAL_ALIGNMENT_LEFT, -1, 8).x
			_text(shown, Vector2(mid - w0 / 2.0, y), 8, INK if name_text != "" else FAINT)
			if row == 0 and fmod(t, 1.0) < 0.5:
				draw_rect(Rect2(mid + w0 / 2.0 + 1, y - 7, 1, 8), INK)          # the pen, ready to write
		elif i in COLOUR_ROWS:
			var entry: Array = ROWS[i][1][pick[i]]
			var w1 := font.get_string_size(entry[0], HORIZONTAL_ALIGNMENT_LEFT, -1, 8).x
			var x0 := mid - (w1 + 13.0) / 2.0
			draw_rect(Rect2(x0, y - 7, 9, 8), INK)
			draw_rect(Rect2(x0 + 1, y - 6, 7, 6), Color(entry[1]))
			_text(entry[0], Vector2(x0 + 13, y), 8, INK)
		else:
			var s: String = ROWS[i][1][pick[i]][0]
			_text(s, Vector2(mid - font.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, 8).x / 2.0, y), 8, INK)
	# what your family means, under its line
	draw_multiline_string(font, Vector2(202, 147), FAMILY_TEXT[FAMILIES[pick[8]][1]], HORIZONTAL_ALIGNMENT_LEFT, 148, 6, 2, FAINT)
	var on := row == SIGN_ROW
	draw_rect(Rect2(204, 166, 146, 15), INK if on else Color("7a5a3a"))
	_text("Sign the register", Vector2(204, 177), 9, Color("f4e9cd"), 146)
	var h := hints()
	for i in h.size():
		_text(h[i], Vector2(193, 198 - (h.size() - 1 - i) * 8), 6, FAINT, 163)

## The help under the register: a phone gets the one line about tapping, a keyboard both lines (WB-C3b: the keyboard's
## "Up/Down" line used to show on a phone too).
func hints() -> Array:
	if Controls.touch:
		return ["Tap a line to change it, then sign"]
	return ["Up/Down choose a line, Left/Right change it", "Type your name; Enter or click to sign"]
