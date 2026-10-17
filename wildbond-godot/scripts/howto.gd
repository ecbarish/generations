extends Control
## How to play (Evan, 2026-10-09: "when launching it's not always clear what the controls are"). A page in the same
## book style as the title, with the controls for a keyboard, a phone or tablet, and a gamepad side by side; the one in
## use is marked. It opens before a new journey begins, from the title page, and from the field book's Settings page.
## Any key, tap, click or button closes it.

signal closed
## Spec palette only (docs/art/wildbond-upright-layout.md). Bark on paper is about 9.9:1.
const INK := Color("1e1a22")
const PAPER := Color("f4eddc")
const BARK := Color("4a3426")
const DECK := Color("e6dcc6")
## Baselines, not the top of the glyphs. 28px apart keeps "How to play" clear of "Phone or tablet".
const TITLE_BASELINE := 40.0
const SUB_BASELINE := 68.0
const COLS := [
	["Keyboard", "keys", [["Walk", "Arrow keys or W A S D"], ["Talk, choose", "E or Enter"], ["Back", "Esc"],
		["Field book", "J or Tab; bag: menu"], ["Book pages", "Q and E"], ["Music, sounds", "M and N"]]],
	["Phone or tablet", "touch", [["Walk", "The d-pad"], ["Talk", "Tap A or the dialogue box"],
		["Menu", "Tap Menu for your party and to save"], ["Choose", "Tap Choose"], ["Back", "Tap B"]]],
	["Gamepad", "pad", [["Walk", "Left stick or the cross"], ["Talk, choose", "A"], ["Back", "B"], ["Field book", "Y"],
		["Book pages", "The shoulder buttons"], ["Calendar", "X"]]],
]

var font: Font
var t := 0.0

func _ready() -> void:
	Controls.fill(self)
	mouse_filter = MOUSE_FILTER_STOP
	font = ThemeDB.fallback_font
	if font != null:
		font = font.duplicate()
		font.antialiasing = TextServer.FONT_ANTIALIASING_NONE
		font.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED
	visible = false

var foot := "begin"                            # "Tap anywhere to begin" or "...to go on"
static var last_kind := ""                     # "touch", "keys" or "pad": whichever you used last

const TOUCH_COPY := "Use the d-pad to walk. Tap A or the dialogue box to talk and go on. Tap Menu for your party and to save."

static func note(kind: String) -> void:
	last_kind = kind

func open(word := "begin") -> void:
	foot = word
	visible = true
	t = 0.0
	queue_redraw()

## Which column is in use now: a touch screen, a connected gamepad, or the keyboard.
static func in_use() -> String:
	if last_kind == "keys":
		return "keys"
	if last_kind == "pad":
		return "pad"
	if last_kind == "touch" or Controls.touch or touch_device():
		return "touch"
	if not Input.get_connected_joypads().is_empty():
		return "pad"
	return "keys"

## A phone or tablet, including a phone-shaped window. The web game often reports no touch screen until the first tap,
## and this page opens before that tap, so a phone must not be told it is using a keyboard.
static func touch_device() -> bool:
	return touch_device_size(Vector2(DisplayServer.window_get_size()))

static func touch_device_size(size: Vector2) -> bool:
	if OS.has_feature("mobile") or OS.has_feature("web_android") or OS.has_feature("web_ios"):
		return true
	if DisplayServer.is_touchscreen_available():
		return true
	if size.x < 8.0 or size.y < 8.0:
		return false
	var short := minf(size.x, size.y)
	var long := maxf(size.x, size.y)
	return short <= 520.0 and long <= 1000.0

## The heading a player reads first. On a touch device that is the phone, not the keyboard.
static func leads_with(use: String) -> String:
	return "Phone or tablet" if use == "touch" else "Keyboard"

func _process(dt: float) -> void:
	if visible:
		t += dt
		queue_redraw()                         # the column in use follows the pad as it appears (a phone: touch, WB-C3)

func _input(e: InputEvent) -> void:
	if not visible:
		return
	# keys and buttons close it as they're pressed; a click or tap as it's let go, so the finger that closes the page
	# doesn't also land on the world underneath (the tap's press is swallowed here first)
	var done: bool = (e is InputEventKey and e.pressed and not e.echo) or (e is InputEventJoypadButton and e.pressed) \
		or (e is InputEventAction and e.pressed) or (e is InputEventMouseButton and not e.pressed) \
		or (e is InputEventScreenTouch and not e.pressed)
	if e is InputEventMouseButton or e is InputEventScreenTouch or e is InputEventKey or e is InputEventJoypadButton or e is InputEventAction:
		get_viewport().set_input_as_handled()
	if done and t > 0.3:                       # a moment's grace, so the key that opened it doesn't close it
		visible = false
		closed.emit()

## Rects the checks measure: every block sits inside the paper, and the footer does not meet the lines above it.
func layout_blocks(use: String) -> Array:
	var paper := Rect2(14, 14, 356, 188)
	var blocks: Array = [paper]
	if use == "touch":
		var body := _touch_body()
		blocks.append(body)
		blocks.append(_footer_rect(body.end.y + 14.0, 328.0, 28.0, 16))
		return blocks
	var rows := _keyboard_rows()
	for row in rows:
		blocks.append(row)
	var lowest := 90.0
	for row in rows:
		lowest = maxf(lowest, (row as Rect2).end.y)
	blocks.append(_footer_rect(lowest + 8.0, 356.0, 14.0, 8))
	return blocks

func _footer_rect(top: float, width: float, x: float, size: int) -> Rect2:
	return Rect2(x, top, width, float(size) + 2.0)

func _keyboard_rows() -> Array:
	var rows: Array = []
	var y := 88.0
	for i in COLS.size():
		var x := 22.0 + i * 116.0
		var local_y := y
		for r in COLS[i][2]:
			var detail: String = r[1]
			var h := 14.0
			if font != null:
				h = maxf(14.0, font.get_multiline_string_size(detail, HORIZONTAL_ALIGNMENT_LEFT, 104.0, 6, -1).y + 8.0)
			rows.append(Rect2(x, local_y - 7.0, 104, h))
			local_y += h
	return rows

func _touch_body() -> Rect2:
	var h := 48.0
	if font != null:
		h = font.get_multiline_string_size(TOUCH_COPY, HORIZONTAL_ALIGNMENT_LEFT, 328.0, 14, -1).y
	return Rect2(28, 92, 328, h)

func _draw() -> void:
	draw_rect(Rect2(0, 0, 384, 216), INK)
	draw_rect(Rect2(10, 10, 364, 196), BARK)
	draw_rect(Rect2(14, 14, 356, 188), PAPER)
	var use := in_use()
	if use == "touch":
		_draw_touch()
		return
	draw_string(font, Vector2(14, TITLE_BASELINE), "How to play", HORIZONTAL_ALIGNMENT_CENTER, 356, 16, INK)
	var rows := _keyboard_rows()
	var cursor := 0
	var lowest := 90.0
	for i in COLS.size():
		var x := 22.0 + i * 116.0
		var mine: bool = COLS[i][1] == use
		var col_top := 52.0
		var col_bottom := 80.0
		for r in COLS[i][2]:
			col_bottom = maxf(col_bottom, (rows[cursor] as Rect2).end.y)
			cursor += 1
		if mine:
			draw_rect(Rect2(x - 4, col_top, 112, col_bottom - col_top), DECK)
		draw_string(font, Vector2(x, 66), COLS[i][0], HORIZONTAL_ALIGNMENT_CENTER, 104, 8, INK)
		if mine:
			draw_string(font, Vector2(x, 76), "(what you're using)", HORIZONTAL_ALIGNMENT_CENTER, 104, 6, BARK)
		cursor -= COLS[i][2].size()
		for r in COLS[i][2]:
			var box: Rect2 = rows[cursor]
			draw_string(font, Vector2(x, box.position.y + 7.0), r[0], HORIZONTAL_ALIGNMENT_LEFT, 104, 7, INK)
			draw_multiline_string(font, Vector2(x, box.position.y + 15.0), r[1], HORIZONTAL_ALIGNMENT_LEFT, 104, 6, -1, BARK)
			lowest = maxf(lowest, box.end.y)
			cursor += 1
	var how := "Press any button" if use == "pad" else "Press any key"
	var foot_box := _footer_rect(lowest + 8.0, 356.0, 14.0, 8)
	draw_string(font, Vector2(14, foot_box.position.y + 8.0), "%s to %s.  This page is also on the Settings page of your field book." % [how, foot], HORIZONTAL_ALIGNMENT_CENTER, 356, 8, BARK)

## One readable page of the phone controls. The title and "Phone or tablet" each have their own line.
func _draw_touch() -> void:
	draw_string(font, Vector2(28, TITLE_BASELINE), "How to play", HORIZONTAL_ALIGNMENT_CENTER, 328, 16, INK)
	draw_string(font, Vector2(28, SUB_BASELINE), "Phone or tablet", HORIZONTAL_ALIGNMENT_CENTER, 328, 16, INK)
	var body := _touch_body()
	draw_multiline_string(font, Vector2(body.position.x, body.position.y + 14.0), TOUCH_COPY, HORIZONTAL_ALIGNMENT_LEFT, body.size.x, 14, -1, INK)
	var foot_box := _footer_rect(body.end.y + 14.0, 328.0, 28.0, 16)
	draw_string(font, Vector2(28, foot_box.position.y + 14.0), "Tap anywhere to %s." % foot, HORIZONTAL_ALIGNMENT_CENTER, 328, 14, BARK)
