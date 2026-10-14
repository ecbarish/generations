extends Control
## A creature's page (Wilddex style): opens when you walk up to one of Maren's three young creatures and press Enter.
## The creature moves on the left, its page on the right: element, a line about it, its role, its six stats, its first
## moves, what it's strong and weak against, and what Maren thinks of it. Two choices: "Choose <name>" or "Not yet".
## Data comes from data/species.json (exported from the browser game, so both versions stay the same).

signal chosen(id: String)
signal closed
signal picked(index: int)                     # with custom buttons (the ranch): which one was pressed
const Figures := preload("res://scripts/figures.gd")
const Sprites := preload("res://scripts/creature_sprites.gd")
const INK := Color("3e2c20")
const FAINT := Color("8a6e50")
const STATS := [["hp", "Health"], ["pow", "Power"], ["grd", "Guard"], ["spd", "Speed"], ["wit", "Wits"], ["spi", "Spirit"]]
const STATS_H := 40                             # three rows of stat bars, and a gap before the note under them
## The bars measure a creature's kind against the strongest creature known in the valley (the highest natural strength in the
## Wilddex is about 116), so every page uses the same yardstick and a full bar means "as strong as any".
const STRONGEST := 120.0
const EL_COL := { "Ember": Color("d8642e"), "Tide": Color("3a8fd8"), "Grove": Color("5d9a3e") }

var id := ""
var info: Dictionary = {}                     # name, el, dex, base, moves, strong, weak, role, maren, look
var sel := 0                                  # 0 choose, 1 not yet (or the custom button picked)
var buttons: Array = []                       # custom choices (the ranch); empty: "Choose <name>" / "Not yet"
var t := 0.0
var font: Font
var press_here := false                      # the press began while this card was already open
var tap_landed := false                      # that press already hit a button, so the lift must not choose again

func _ready() -> void:
	Controls.fill(self)
	mouse_filter = MOUSE_FILTER_STOP
	font = ThemeDB.fallback_font
	visible = false

func open(creature_id: String, data: Dictionary, btns: Array = []) -> void:
	id = creature_id
	info = data
	buttons = btns
	# The starter page highlights Choose, so the confirm is the one that looks ready.
	# A custom row (a change, the ranch) still opens on its last line, the one that waits.
	sel = 0 if buttons.is_empty() else _count() - 1
	t = 0.0
	visible = true

func _count() -> int:
	return buttons.size() if not buttons.is_empty() else 2

func _pick(i: int) -> void:
	if buttons.is_empty():
		_close(i == 0)
		return
	visible = false
	picked.emit(i)

func _close(choose: bool) -> void:
	visible = false
	if choose:
		chosen.emit(id)
	else:
		closed.emit()

func _input(e: InputEvent) -> void:
	if not visible:
		press_here = false
		tap_landed = false
		return
	var d := Controls.dir(e)                    # named actions (controls.gd): keys, a gamepad
	if d != Vector2i.ZERO or Controls.pressed(e, "interact") or Controls.pressed(e, "back") or (e is InputEventKey and e.pressed):
		if d.x != 0 or d.y != 0: sel = (sel + d.x + d.y + _count()) % _count()
		elif e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_TAB: sel = (sel + 1) % _count()
		elif Controls.pressed(e, "interact"): _pick(sel)
		elif Controls.pressed(e, "back"): _pick(_count() - 1)
		get_viewport().set_input_as_handled()
	elif Controls.pointing(e):
		press_here = true
		var p := Controls.at(self, e)
		tap_landed = false
		for i in _count():
			if _btn(i).has_point(p):
				tap_landed = true
				_pick(i)
				break
		get_viewport().set_input_as_handled()
	elif Controls.released(e):
		# The lift that opened this card is not a choice. Only a press that began here can finish on the way up.
		if press_here and not tap_landed:
			var p := Controls.at(self, e)
			for i in _count():
				if _btn(i).has_point(p):
					_pick(i)
					break
		press_here = false
		tap_landed = false
		get_viewport().set_input_as_handled()
	elif Controls.swallow_pointer(e):
		get_viewport().set_input_as_handled()

## How tall a choice must be so a thumb can hit it: 44 device pixels, and never shorter than the page's 16.
func _choice_h() -> float:
	return _choice_h_for(_screen_scale())

func _screen_scale() -> float:
	var win := Vector2(DisplayServer.window_get_size())
	if win.x < 8.0 or win.y < 8.0:
		return 4.0
	return maxf(0.25, minf(win.x / 384.0, win.y / 216.0))

func _choice_h_for(scale: float) -> float:
	return maxf(16.0, ceil(44.0 / maxf(scale, 0.01)))

func _btn(i: int) -> Rect2:
	var h := _choice_h()
	if _count() == 2 and h <= 16.0:
		return Rect2(196 + i * 82, 182, 76, 16)
	if _count() == 2:
		var gap := 4.0
		var top := 208.0 - 2.0 * h - gap
		return Rect2(188, top + i * (h + gap), 160, h)
	# more choices share the same 160-pixel row, each as wide as its words need ("Have it made (90 coins)" next to "Next")
	var size := _btn_size()
	var need: Array = []
	var total := 0.0
	for k in _count():
		need.append(_label_w(k, size) + 6.0)
		total += need[k]
	var room := 160.0 - 4.0 * (_count() - 1)
	var x := 192.0
	for k in i:
		x += need[k] * room / total + 4.0
	return Rect2(x, 182.0 if h <= 16.0 else 208.0 - h, need[i] * room / total, h)

func _label(i: int) -> String:
	return buttons[i] if not buttons.is_empty() else (("Choose " + info.name) if i == 0 else "Not yet")

func _label_w(i: int, size: int) -> float:
	return font.get_string_size(_label(i), HORIZONTAL_ALIGNMENT_LEFT, -1, size).x

## The button text size: 8 for two choices, 7 for a row of them, 6 when the row's words don't fit at 7.
func _btn_size() -> int:
	if _count() <= 2:
		return 8
	var total := 0.0
	for k in _count():
		total += _label_w(k, 7) + 6.0
	return 7 if total <= 160.0 - 4.0 * (_count() - 1) else 6

func _process(dt: float) -> void:
	if visible:
		t += dt
		queue_redraw()

func _text(s: String, at: Vector2, size: int, col: Color, width := -1.0) -> void:
	draw_string(font, at, s, HORIZONTAL_ALIGNMENT_LEFT if width < 0 else HORIZONTAL_ALIGNMENT_CENTER, width, size, col)

func _para(s: String, at: Vector2, width: float, size: int, col: Color) -> float:
	# wrapped text; returns the y just below it
	draw_multiline_string(font, at, s, HORIZONTAL_ALIGNMENT_LEFT, width, size, -1, col)
	var h := font.get_multiline_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, width, size).y
	return at.y + h

func _draw() -> void:
	if info.is_empty():
		return
	var el_col: Color = EL_COL.get(info.el, FAINT)
	draw_rect(Rect2(0, 0, 384, 216), Color(0.05, 0.04, 0.06, 0.55))
	draw_rect(Rect2(22, 10, 340, 198), Color("4a2e1a"))
	draw_rect(Rect2(24, 12, 336, 194), Color("6e4a2c"))
	draw_rect(Rect2(28, 16, 151, 186), Color("f2e6c8"))
	draw_rect(Rect2(181, 16, 175, 186), Color("f4e9cd"))
	draw_rect(Rect2(176, 16, 8, 186), Color("dccca4"))
	# left page: the creature, four times life size, alive (it wags, blinks and glances at you)
	_text(info.name, Vector2(28, 34), 12, INK, 151)
	draw_rect(Rect2(76, 40, 56, 11), el_col)
	_text(info.el, Vector2(76, 48), 7, Color("fdf6e6"), 56)
	draw_rect(Rect2(66, 134, 76, 4), Color(0, 0, 0, 0.12))
	var pose := { "wag": [1, 0, -1, 0][int(t * 8.0) % 4], "blink": fmod(t, 2.7) < 0.12, "ears_up": true,
		"twitch": int(t * 6.0) % 2 if fmod(t, 4.0) > 3.0 else 0, "bird": info.look.get("kind") == "boar" }
	# Four times life size, in whole pixels. Feet rest on the shadow. A species without art keeps the procedural page.
	var page_scale := 4
	if not Sprites.try_draw(self, id, Vector2(104, 134), true, "idle", int(t * 6.0), float(page_scale), 0.0, str(info.get("look", {}).get("gear", ""))):
		draw_set_transform(Vector2(68, 86), 0, Vector2(page_scale, page_scale))
		var species: Dictionary = info.get("species", {})
		if species.is_empty():
			Figures.creature(self, Vector2.ZERO, true, pose, info.look)
		else:
			Figures.paint(self, Vector2.ZERO, Figures.sized_parts(species, true, pose, info.look))
		draw_set_transform(Vector2.ZERO)
	var y := _para(info.dex, Vector2(36, 156), 135, 7, FAINT)
	# right page: what it is like
	y = _para(info.role, Vector2(190, 30), 158, 7, INK) + 2
	for i in STATS.size():
		var k: String = STATS[i][0]
		var v: float = info.base.get(k, 0)
		var col := i % 2
		var row := i / 2
		var sx := 190 + col * 82
		var sy := y + row * 12
		_text(STATS[i][1], Vector2(sx, sy + 7), 6, FAINT)
		draw_rect(Rect2(sx + 30, sy + 2, 36, 5), Color("e4d6b4"))
		draw_rect(Rect2(sx + 30, sy + 2, 36.0 * clampf(v / STRONGEST, 0.0, 1.0), 5), el_col.darkened(0.1))
		_text(str(int(v)), Vector2(sx + 68, sy + 7), 6, INK)
	y += STATS_H                                    # (room enough that the note below doesn't touch the last bars, WB-C3b)
	_text("Its kind's strength. Full bar: the strongest known (%d)." % int(STRONGEST), Vector2(190, y + 1), 6, FAINT, 158)
	y += 10
	y = _para(info.get("moves_line", "Starts with %s." % preload("res://scripts/rules.gd").words(info.moves)), Vector2(190, y), 158, 7, INK) + 1
	y = _para("Strong against %s, weak to %s." % [info.strong, info.weak], Vector2(190, y), 158, 7, INK) + 3
	var stop := _btn(0).position.y - 4.0
	if y < stop - 8.0:
		_para(info.get("note", "Maren: \"%s\"" % info.get("maren", "")), Vector2(190, y), 158, 7, FAINT)
	# the choices
	for i in _count():
		var r := _btn(i)
		var on := sel == i
		draw_rect(r, INK if on else Color("7a5a3a"))
		if on:
			draw_rect(Rect2(r.position - Vector2(1, 1), r.size + Vector2(2, 2)), Color("f2d24a"), false, 1.0)
		var baseline := 11.0 if r.size.y <= 16.0 else r.size.y * 0.5 + 3.0
		_text(_label(i), r.position + Vector2(0, baseline), _btn_size(), Color("f4e9cd"), r.size.x)
