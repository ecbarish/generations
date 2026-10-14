extends Control
## The first page when a journey is saved: continue it, or start a new one. Same book style as the register.
## Arrow keys and Enter, a gamepad, the mouse or a finger. The third button shows the controls (howto.gd).

signal chosen(choice: String)                  # "continue", "new" or "howto" (the controls page)
const INK := Color("3e2c20")
const FAINT := Color("8a6e50")

var summary := ""                              # e.g. "Rowan and Ripplet, in Thornwood. 1 badge, 6 in the Wilddex."
var sel := 0
var confirm_new := false                       # starting over asks twice, so a stray key never loses a journey
var font: Font

func _ready() -> void:
	Controls.fill(self)
	mouse_filter = MOUSE_FILTER_STOP
	font = ThemeDB.fallback_font
	visible = summary != ""                    # stays shut unless it was opened already

func open(text: String) -> void:
	summary = text
	sel = 0
	confirm_new = false
	visible = true
	queue_redraw()

func _pick(i: int) -> void:
	if i == 2:
		visible = false
		chosen.emit("howto")
	elif i == 0:
		visible = false
		chosen.emit("continue")
	elif not confirm_new:
		confirm_new = true
		queue_redraw()
	else:
		visible = false
		chosen.emit("new")

func _btn(i: int) -> Rect2:
	return Rect2(112, 106 + i * 22, 160, 18)

func _input(e: InputEvent) -> void:
	if not visible:
		return
	var d := Controls.dir(e)                    # named actions (controls.gd): keys, a gamepad
	if d != Vector2i.ZERO or Controls.pressed(e, "interact") or Controls.pressed(e, "back") or (e is InputEventKey and e.pressed):
		if d.y != 0: sel = clampi(sel + d.y, 0, 2)
		elif Controls.pressed(e, "interact"): _pick(sel)
		elif Controls.pressed(e, "back"): confirm_new = false
		get_viewport().set_input_as_handled()
		queue_redraw()
	elif Controls.pointing(e):
		var p := Controls.at(self, e)
		for i in 3:
			if _btn(i).has_point(p):
				sel = i
				_pick(i)
		get_viewport().set_input_as_handled()
		queue_redraw()
	elif Controls.swallow_pointer(e):
		get_viewport().set_input_as_handled()

func _draw() -> void:
	draw_rect(Rect2(0, 0, 384, 216), Color("121418"))
	draw_rect(Rect2(72, 36, 240, 150), Color("4a2e1a"))
	draw_rect(Rect2(76, 40, 232, 142), Color("f4e9cd"))
	draw_string(font, Vector2(76, 62), "Wildbond", HORIZONTAL_ALIGNMENT_CENTER, 232, 14, INK)
	draw_multiline_string(font, Vector2(90, 80), summary, HORIZONTAL_ALIGNMENT_CENTER, 204, 7, -1, FAINT)
	var labels := ["Continue your journey", "Start a new journey" if not confirm_new else "Really start over? Press again", "How to play"]
	for i in 3:
		var r := _btn(i)
		draw_rect(r, INK if sel == i else Color("d8c8a0"))
		draw_string(font, r.position + Vector2(0, 13), labels[i], HORIZONTAL_ALIGNMENT_CENTER, r.size.x, 8, Color("f4e9cd") if sel == i else INK)
