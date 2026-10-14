extends Control
## How to play (Evan, 2026-10-09: "when launching it's not always clear what the controls are"). A page in the same
## book style as the title, with the controls for a keyboard, a phone or tablet, and a gamepad side by side; the one in
## use is marked. It opens before a new journey begins, from the title page, and from the field book's Settings page.
## Any key, tap, click or button closes it.

signal closed
const INK := Color("3e2c20")
const FAINT := Color("8a6e50")
const COLS := [
	["Keyboard", "keys", [["Walk", "Arrow keys or W A S D"], ["Talk, choose", "E or Enter"], ["Back", "Esc"],
		["Field book", "J or Tab; bag: menu"], ["Book pages", "Q and E"], ["Music, sounds", "M and N"]]],
	["Phone or tablet", "touch", [["Walk", "The pad, or tap where to go"], ["Talk", "The button beside it"],
		["Choose", "Tap what you want"], ["Field book", "Bag opens the menu"], ["Close the book", "Tap outside it"]]],
	["Gamepad", "pad", [["Walk", "Left stick or the cross"], ["Talk, choose", "A"], ["Back", "B"], ["Field book", "Y"],
		["Book pages", "The shoulder buttons"], ["Calendar", "X"]]],
]

var font: Font
var t := 0.0

func _ready() -> void:
	Controls.fill(self)
	mouse_filter = MOUSE_FILTER_STOP
	font = ThemeDB.fallback_font
	visible = false

var foot := "begin"                            # "Tap anywhere to begin" or "...to go on"

func open(word := "begin") -> void:
	foot = word
	visible = true
	t = 0.0
	queue_redraw()

## Which column is in use now: a touch screen, a connected gamepad, or the keyboard.
static func in_use() -> String:
	if Controls.touch:
		return "touch"
	if not Input.get_connected_joypads().is_empty():
		return "pad"
	return "keys"

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

func _draw() -> void:
	draw_rect(Rect2(0, 0, 384, 216), Color("121418"))
	draw_rect(Rect2(10, 10, 364, 196), Color("4a2e1a"))
	draw_rect(Rect2(14, 14, 356, 188), Color("f4e9cd"))
	draw_string(font, Vector2(14, 34), "How to play", HORIZONTAL_ALIGNMENT_CENTER, 356, 13, INK)
	var use := in_use()
	for i in COLS.size():
		var x := 22.0 + i * 116.0
		var mine: bool = COLS[i][1] == use
		if mine:
			draw_rect(Rect2(x - 4, 42, 112, 136), Color(0.85, 0.66, 0.36, 0.3))
		draw_string(font, Vector2(x, 54), COLS[i][0], HORIZONTAL_ALIGNMENT_CENTER, 104, 8, INK)
		if mine:
			draw_string(font, Vector2(x, 63), "(what you're using)", HORIZONTAL_ALIGNMENT_CENTER, 104, 6, FAINT)
		var y := 76.0
		for r in COLS[i][2]:
			draw_string(font, Vector2(x, y), r[0], HORIZONTAL_ALIGNMENT_LEFT, -1, 7, INK)
			draw_string(font, Vector2(x, y + 8), r[1], HORIZONTAL_ALIGNMENT_LEFT, 104, 6, Color("6a5a3a"))
			y += 17.0
	var how := "Tap anywhere" if use == "touch" else ("Press any button" if use == "pad" else "Press any key")
	draw_string(font, Vector2(14, 188), "%s to %s.  This page is also on the Settings page of your field book." % [how, foot], HORIZONTAL_ALIGNMENT_CENTER, 356, 6, FAINT)
