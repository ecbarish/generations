extends Control
## The menu you open with Esc, I, or the bag (WBL-1). Party and the field book are the pages you already carry.
## Save uses the journey's own save. Close, Esc, or a tap outside the page puts you back where you were.
## While this is open the world does not take the click, so a tap cannot walk you off.

signal chose(action: String)
const INK := Color("3e2c20")
const CREAM := Color("f4e9cd")
const FAINT := Color("8a6e50")
const ROWS := ["Party", "Field book", "Save", "Close"]
const ACTIONS := ["party", "book", "save", "close"]

var sel := 0
var note := ""
var font: Font

func _ready() -> void:
	Controls.fill(self)
	mouse_filter = MOUSE_FILTER_STOP
	font = ThemeDB.fallback_font
	visible = false

func open() -> void:
	sel = 0
	note = ""
	visible = true
	queue_redraw()

func close() -> void:
	visible = false
	note = ""

func _row(i: int) -> Rect2:
	return Rect2(120, 64 + i * 22, 144, 18)

func _pick(i: int) -> void:
	sel = i
	var action: String = ACTIONS[i]
	if action != "save":
		visible = false
	chose.emit(action)
	queue_redraw()

func _input(e: InputEvent) -> void:
	if not visible:
		return
	var d := Controls.dir(e)
	if d.y != 0:
		sel = clampi(sel + d.y, 0, ROWS.size() - 1)
		get_viewport().set_input_as_handled()
		queue_redraw()
	elif Controls.pressed(e, "interact"):
		_pick(sel)
		get_viewport().set_input_as_handled()
	elif Controls.pressed(e, "back") or Controls.pressed(e, "open_menu"):
		close()
		get_viewport().set_input_as_handled()
	elif Controls.pointing(e):
		var p := Controls.at(self, e)
		var hit := -1
		for i in ROWS.size():
			if _row(i).has_point(p):
				hit = i
		if hit >= 0:
			_pick(hit)
		else:
			close()
		get_viewport().set_input_as_handled()
	elif Controls.swallow_pointer(e) or (e is InputEventKey and e.pressed):
		get_viewport().set_input_as_handled()

func _draw() -> void:
	draw_rect(Rect2(0, 0, 384, 216), Color(0.05, 0.04, 0.06, 0.45))
	draw_rect(Rect2(104, 40, 176, 136), Color("4a2e1a"))
	draw_rect(Rect2(108, 44, 168, 128), Color("f4e9cd"))
	for i in ROWS.size():
		var r := _row(i)
		var on := i == sel
		draw_rect(r, INK if on else Color("e8dcc4"))
		draw_string(font, r.position + Vector2(0, 13), ROWS[i], HORIZONTAL_ALIGNMENT_CENTER, r.size.x, 8, CREAM if on else INK)
	var hint := note if note != "" else ("Tap a line, or outside to close" if Controls.touch else "Esc closes")
	draw_string(font, Vector2(108, 162), hint, HORIZONTAL_ALIGNMENT_CENTER, 168, 6, FAINT)
