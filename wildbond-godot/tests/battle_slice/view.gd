extends Control
## Save-free playable study. Later a 3D view can consume the same model/events.
const Fixture := preload("res://tests/battle_slice/fixture.gd")
const Sprites := preload("res://scripts/creature_sprites.gd")
const Sounds := preload("res://scripts/sfx.gd")
const MuseArt := preload("res://tests/battle_slice/muse_art.gd")
const INK := Color("2a2230")
const PAPER := Color("f8f2e4")
var model: RefCounted
var page := "commands"
var message := ""
var event: Dictionary = {}
var message_time := 0.0
var clock := 0.0
var motion := true
var shown := [0.0, 0.0]
var buttons: Array[Button] = []
var font: Font
var sounds: Node

func _ready() -> void:
	font = ThemeDB.fallback_font
	sounds = Sounds.new()
	add_child(sounds)
	mouse_filter = Control.MOUSE_FILTER_STOP
	restart()

func restart() -> void:
	model = Fixture.create()
	page = "commands"
	message = "Practice encounter. What will Bogsnap do?"
	event = {}
	message_time = 0
	shown = [float(model.team[0].hp), float(model.foe.hp)]
	_build_menu()
	queue_redraw()

func _button(label: String, action: Callable) -> void:
	var b := Button.new()
	var i := buttons.size()
	b.position = Vector2(8 + (i % 2) * 186, 160 + (i / 2) * 17)
	b.size = Vector2(182, 16)
	b.text = label
	b.add_theme_font_size_override("font_size", 10)
	for style_name in ["normal", "hover", "pressed", "disabled", "focus"]:
		var box := StyleBoxFlat.new()
		box.bg_color = Color("42665b") if style_name != "hover" else Color("567d69")
		box.border_color = PAPER if style_name == "focus" else Color("294b43")
		box.set_border_width_all(1)
		box.set_content_margin_all(1)
		box.set_corner_radius_all(2)
		if style_name == "focus": box.bg_color = Color.TRANSPARENT
		b.add_theme_stylebox_override(style_name, box)
	b.pressed.connect(action)
	add_child(b)
	buttons.append(b)

func _build_menu() -> void:
	for b in buttons:
		remove_child(b)
		b.queue_free()
	buttons.clear()
	if not event.is_empty():
		_button("Continue", _continue)
	elif model.state == "ended":
		_button("Try Again", restart)
		_button("Motion: " + ("On" if motion else "Off"), _toggle_motion)
	elif page == "moves":
		var ally: Dictionary = model.team[model.active]
		var ids: Array = model.available(ally)
		if ids.is_empty():
			_button("Struggle", func(): _act({"kind": "move", "id": "struggle"}))
		for id in ally.moves:
			var mv: Dictionary = model.moves[id]
			_button("%s  %d/%d  %d%%" % [mv.name, ally.pp[id], mv.pp, roundi(mv.accuracy * 100)], func(): _act({"kind": "move", "id": id}))
			buttons.back().disabled = ally.pp[id] <= 0
			var element: String = str(mv.el) if mv.get("el") != null else "Untyped"
			var explain := "%s: %s · Power %d · Accuracy %d%%" % [mv.name, element, mv.pow, roundi(mv.accuracy * 100)]
			buttons.back().focus_entered.connect(func(): message = explain)
			buttons.back().mouse_entered.connect(func(): message = explain)
		_button("Back", func(): _show("commands"))
	elif page == "party" or model.state == "switch":
		for i in model.team.size():
			var c: Dictionary = model.team[i]
			_button("%s  %d/%d" % [c.name, c.hp, c.max_hp], func(): _act({"kind": "switch", "target": i}))
			buttons.back().disabled = i == model.active or c.hp <= 0
		if model.state != "switch": _button("Back", func(): _show("commands"))
	else:
		_button("Fight", func(): _show("moves"))
		_button("Switch", func(): _show("party"))
		_button("Berry (%d)" % model.berries, func(): _act({"kind": "berry"}))
		_button("Catch (%d)" % model.lures, func(): _act({"kind": "catch"}))
		_button("Run", func(): _act({"kind": "run"}))
		_button("Motion: " + ("On" if motion else "Off"), _toggle_motion)
	for b in buttons:
		if not b.disabled:
			b.grab_focus()
			break

func _toggle_motion() -> void:
	motion = not motion
	_build_menu()

func _show(next_page: String) -> void:
	page = next_page
	_build_menu()

func _act(action: Dictionary) -> void:
	var error: String = model.submit(action)
	if error != "":
		message = error
		queue_redraw()
		return
	page = "commands"
	_continue()

func _continue() -> void:
	# Finishing a line also finishes its health animation before the next event.
	shown = [float(model.team[model.active].hp), float(model.foe.hp)]
	event = model.advance()
	if event.get("kind", "") == "switch": shown[0] = float(model.team[model.active].hp)
	if not event.is_empty():
		message = event.text
		message_time = maxf(1.5, message.length() * 0.035)
		sounds.play("hit" if event.get("hit", false) else ("heal" if event.kind == "berry" else "whoosh"))
	else:
		message_time = 0
		if model.state == "ended":
			message = {"won": "Victory! Your partners can rest. Try a different approach?", "lost": "Your team needs a rest. Try switching or using a berry.", "caught": "Cindercub joined you! This study does not write a save.", "escaped": "Back on the trail. Ready for another encounter?"}[model.result]
		elif model.state == "switch": message = "Choose a healthy partner."
		else: message = "Round %d. What will %s do?" % [model.round_number, model.team[model.active].name]
	_build_menu()
	queue_redraw()

func _process(dt: float) -> void:
	clock += dt
	if model == null: return
	shown[0] = move_toward(shown[0], float(model.team[model.active].hp), dt * 35)
	shown[1] = move_toward(shown[1], float(model.foe.hp), dt * 35)
	if not event.is_empty():
		message_time -= dt
		if message_time <= 0: _continue()
	queue_redraw()

func _unhandled_key_input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed and not e.echo and e.keycode == KEY_N:
		sounds.on = not sounds.on
		get_viewport().set_input_as_handled()
	if e is InputEventKey and e.pressed and not e.echo and e.keycode == KEY_ESCAPE:
		if model.state == "choose" and event.is_empty(): _show("commands")
		get_viewport().set_input_as_handled()

func _text(at: Vector2, text: String, size_px: int = 10, color: Color = INK) -> void:
	draw_string(font, at, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size_px, color)

func _panel(at: Vector2, c: Dictionary, hp: float) -> void:
	draw_style_box(_paper(), Rect2(at, Vector2(156, 34)))
	_text(at + Vector2(5, 12), "%s  Lv. %d" % [c.name, c.level])
	draw_rect(Rect2(at + Vector2(5, 17), Vector2(102, 5)), Color("454a42"))
	var ratio := clampf(hp / c.max_hp, 0, 1)
	draw_rect(Rect2(at + Vector2(6, 18), Vector2(100 * ratio, 3)), Color("579857") if ratio > 0.3 else Color("dc8652"))
	_text(at + Vector2(111, 23), "%d/%d" % [ceili(hp), c.max_hp], 8)
	_text(at + Vector2(5, 31), c.element, 8, Color("61705c"))

func _paper() -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = PAPER
	box.border_color = INK
	box.set_border_width_all(1)
	box.set_corner_radius_all(3)
	return box

func _creature(c: Dictionary, foot: Vector2, back: bool, side: String) -> void:
	if c.hp <= 0: return
	var supplied: bool = c.id == "bogsnap" and back
	var tex: Texture2D
	if supplied: tex = MuseArt.texture(MuseArt.player_frame(clock, motion and model.state != "ended"))
	elif c.id == "cindercub" and not back: tex = MuseArt.texture("cindercub-front.png")
	else: tex = Sprites.battle_back_texture(c.id) if back else Sprites.battle_texture(c.id)
	if tex == null: tex = Sprites.battle_texture(c.id)
	if tex == null: return
	var ink: Rect2i = Sprites.ink_box(tex)
	if supplied: ink = MuseArt.APPROVED_INK
	var zoom := minf(1.0, minf(78.0 / ink.size.x, 64.0 / ink.size.y))
	var bob := roundf(sin(clock * 2.5) * 1.0) if motion else 0.0
	var recoil := 0.0
	if motion and event.get("hit", false) and event.get("side", side) != side and message_time > 0:
		recoil = roundf(sin(clock * 35) * minf(2, message_time))
	draw_set_transform(foot, 0, Vector2(1, 0.22))
	draw_circle(Vector2.ZERO, 24, Color(0.1, 0.2, 0.15, 0.22))
	draw_set_transform(Vector2.ZERO)
	var dest := Rect2(foot + Vector2(-ink.size.x * zoom * 0.5 + recoil, -ink.size.y * zoom + bob), Vector2(ink.size) * zoom)
	if supplied: dest = MuseArt.destination(ink, foot + Vector2(recoil, bob), 64)
	draw_texture_rect_region(tex, dest, Rect2(ink))

func _draw() -> void:
	if model == null: return
	draw_rect(Rect2(0, 0, 384, 216), Color("7fada1"))
	var background: Texture2D = MuseArt.texture("battle-bg.jpg")
	# Uniform scale; a vertical crop puts both painted platforms under their creatures.
	draw_texture_rect(background, Rect2(0, -40, 384, 384.0 * background.get_height() / background.get_width()), false)
	draw_style_box(_paper(), Rect2(7, 3, 370, 17))
	_text(Vector2(13, 15), "Thornwood · Battle Study", 10)
	_text(Vector2(282, 15), "Round %d" % model.round_number, 9)
	_creature(model.foe, Vector2(297, 84), false, "foe")
	_creature(model.team[model.active], Vector2(83, 132), true, "ally")
	_panel(Vector2(8, 27), model.foe, shown[1])
	_panel(Vector2(219, 94), model.team[model.active], shown[0])
	draw_style_box(_paper(), Rect2(8, 134, 368, 23))
	# draw_multiline_string uses a width bound, so long hit/result lines wrap inside the field.
	draw_multiline_string(font, Vector2(14, 144), message, HORIZONTAL_ALIGNMENT_LEFT, 354, 9, 2, INK)
