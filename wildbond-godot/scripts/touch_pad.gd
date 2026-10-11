extends Control
## Thumbs on a phone or tablet (WB6.1): a walking pad in the bottom-left corner and one button in the bottom-right that
## says what it will do ("Talk", "Feed", "Next"). They press the same named actions as the keys (controls.gd), so
## nothing else in the game needs to know a phone is in use. Taps anywhere else still walk you there, and every menu
## (the book, battles, shops) is tapped directly, so the pad only shows while you walk and talk.
## Shown on touch screens, or always, or never (the Settings page, settings.gd "Phone buttons").

const PAD := Vector2(80, 184)                  # between Larkhaven's lower doors; full hit circle stays on screen
const PAD_R := 32.0                            # how far from the middle a thumb still counts
const ARM := 12.0
const BTN := Vector2(344, 178)
const BTN_R := 20.0
const MOUSE := -2                              # a held mouse button standing in for a finger (testing on a computer)

var mode := "auto"                             # "auto" (on touch screens), "on" or "off"
var touched := false                           # a finger has touched the screen at least once
var pad_on := false                            # main.gd says when walking is possible...
var btn_on := false                            # ...and when there is something to press
var word := ""                                 # what the button says
var held := ""                                 # the walking action held down right now
var pad_finger := -1
var btn_finger := -1
var btn_t := 0.0                               # the button's press flash
var font: Font

func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	font = ThemeDB.fallback_font

func wanted() -> bool:
	return mode == "on" or (mode == "auto" and (touched or DisplayServer.is_touchscreen_available()))

func _process(dt: float) -> void:
	btn_t = maxf(0.0, btn_t - dt)
	queue_redraw()

## main.gd calls this each frame after saying what's possible: show or hide, and let go when the pad goes away.
func refresh() -> void:
	Controls.touch = wanted()
	visible = wanted() and (pad_on or btn_on)
	if not (visible and pad_on) and held != "":
		_aim(PAD)                              # the pad went away (a battle, a door): let go
		pad_finger = -1

func _on_pad(p: Vector2) -> bool:
	return visible and pad_on and p.distance_to(PAD) <= PAD_R

func _on_btn(p: Vector2) -> bool:
	return visible and btn_on and p.distance_to(BTN) <= BTN_R

func _input(e: InputEvent) -> void:
	if e is InputEventScreenTouch:
		touched = true
		_finger(e.index, e.position, e.pressed)
	elif e is InputEventScreenDrag:
		if e.index == pad_finger:
			_aim(e.position)
			get_viewport().set_input_as_handled()
	elif e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT:
		if e.device == InputEvent.DEVICE_ID_EMULATION:
			if _on_pad(e.position) or _on_btn(e.position) or (not e.pressed and pad_finger != -1):
				get_viewport().set_input_as_handled()   # the finger already did this; don't also walk to the spot
		else:
			_finger(MOUSE, e.position, e.pressed)
	elif e is InputEventMouseMotion and pad_finger == MOUSE:
		_aim(e.position)

## A finger (or the mouse) goes down or comes up.
func _finger(i: int, p: Vector2, down: bool) -> void:
	if down:
		if pad_finger == -1 and _on_pad(p):
			pad_finger = i
			_aim(p)
			get_viewport().set_input_as_handled()
		elif _on_btn(p):
			btn_finger = i
			btn_t = 0.2
			press("interact")
			get_viewport().set_input_as_handled()
	else:
		if i == pad_finger:
			pad_finger = -1
			_aim(PAD)
			get_viewport().set_input_as_handled()
		if i == btn_finger:
			btn_finger = -1
			get_viewport().set_input_as_handled()

## Sends a named action through the game, as if its key were pressed.
func press(action: String) -> void:
	for down in [true, false]:
		var ev := InputEventAction.new()
		ev.action = action
		ev.pressed = down
		Input.parse_input_event.call_deferred(ev)

## Points the walk the way the thumb leans from the pad's middle (none when it's right in the middle).
func _aim(p: Vector2) -> void:
	var v := p - PAD
	var want := ""
	if v.length() >= 5.0:
		if absf(v.x) > absf(v.y):
			want = "move_right" if v.x > 0 else "move_left"
		else:
			want = "move_down" if v.y > 0 else "move_up"
	if want == held:
		return
	if held != "":
		Input.action_release(held)
	held = want
	if held != "":
		Input.action_press(held)

func _draw() -> void:
	if pad_on:
		draw_circle(PAD, PAD_R - 4, Color(0.05, 0.05, 0.07, 0.35))
		for a in Controls.DIRS:
			var d: Vector2 = Vector2(Controls.DIRS[a])
			var c := PAD + d * ARM
			var lit: bool = held == a
			draw_rect(Rect2(c - Vector2(7, 7), Vector2(14, 14)), Color(0.96, 0.92, 0.8, 0.85 if lit else 0.45))
			var side := Vector2(-d.y, d.x)       # a small arrow pointing outwards
			draw_colored_polygon(PackedVector2Array([c + d * 4, c - d * 2 + side * 4, c - d * 2 - side * 4]),
				Color(0.24, 0.17, 0.12, 0.95 if lit else 0.7))
	if btn_on:
		draw_circle(BTN, BTN_R - 2, Color(0.96, 0.92, 0.8, 0.85 if btn_t > 0.0 else 0.55))
		draw_arc(BTN, BTN_R - 2, 0, TAU, 32, Color(0.24, 0.17, 0.12, 0.8), 1.0)
		draw_string(font, BTN + Vector2(-BTN_R, 3), word, HORIZONTAL_ALIGNMENT_CENTER, BTN_R * 2, 8, Color(0.24, 0.17, 0.12))
