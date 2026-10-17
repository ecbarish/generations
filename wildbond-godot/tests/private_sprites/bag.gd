extends Control
## A pause overlay around the existing practice inventory; no adventure save access.
signal closed
signal used(action: Dictionary)
var model: RefCounted
var pack: RefCounted
var in_battle := false
var pocket := 0
var choosing := false
var controls: Array[Control] = []
var note := ""
var description: Label
const POCKETS := ["Berries", "Balls", "Key Items"]
const PAPER := Color("f6eed5")
const DARK := Color("253f45")

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	build()

func text_at(value: String, at: Vector2, dims: Vector2, size_px: int = 10) -> Label:
	var label := Label.new()
	label.text = value
	label.position = at
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", size_px)
	label.add_theme_color_override("font_color", DARK)
	add_child(label)
	label.size = dims
	controls.append(label)
	return label

func button(value: String, at: Vector2, dims: Vector2, action: Callable) -> Button:
	var b := Button.new()
	b.text = value
	b.position = at
	b.add_theme_font_size_override("font_size", 10)
	for state in ["normal", "hover", "pressed", "focus", "disabled"]:
		var box := StyleBoxFlat.new()
		box.bg_color = Color("d9cbb0") if state == "normal" else Color("bfdec3")
		box.border_color = Color("3f7b71") if state == "focus" else DARK
		box.set_border_width_all(2 if state == "focus" else 1)
		box.set_corner_radius_all(3)
		b.add_theme_stylebox_override(state, box)
	for key in ["font_color", "font_focus_color", "font_hover_color", "font_pressed_color", "font_disabled_color"]:
		b.add_theme_color_override(key, DARK)
	b.pressed.connect(action)
	add_child(b)
	b.size = dims
	controls.append(b)
	return b

func build() -> void:
	for c in controls:
		remove_child(c)
		c.queue_free()
	controls.clear()
	text_at("BAG", Vector2(16, 10), Vector2(100, 25), 20)
	text_at("Practice supplies", Vector2(16, 39), Vector2(110, 16), 8)
	for i in POCKETS.size():
		button(("• " if i == pocket else "") + POCKETS[i], Vector2(132 + i * 80, 12), Vector2(76, 27), func(): pocket = i; choosing = false; note = ""; build())
	if choosing:
		text_at("Give the berry to…", Vector2(136, 44), Vector2(230, 16))
		for i in model.team.size():
			var c: Dictionary = model.team[i]
			var row := button("%s   %d/%d HP" % [c.name, c.hp, c.max_hp], Vector2(132, 63 + i * 25), Vector2(238, 23), func(): use_item(i))
			row.disabled = c.hp <= 0 or c.hp >= c.max_hp
	else:
		if pocket == 2:
			text_at("No key items yet.", Vector2(142, 72), Vector2(210, 45))
		else:
			var count: int = model.berries if pocket == 0 else model.lures
			var item := "Ranch Berry" if pocket == 0 else "Bond Ball"
			var row := button("%s                         ×%d" % [item, count], Vector2(132, 66), Vector2(238, 33), func(): activate())
			row.disabled = count <= 0 or (pocket == 1 and not in_battle)
			text_at("Choose an item to use it.", Vector2(136, 109), Vector2(230, 25), 9)
	description = text_at(note if note != "" else ["A ranch-grown berry. Restores half a partner's maximum HP. Cannot revive a fainted partner.", "A practice catching ball. Use it in a wild battle; weakening the creature helps.", "Important belongings will appear here as the journey grows."][pocket], Vector2(16, 150), Vector2(351, 36), 10)
	button("Back" if choosing else "Close Bag", Vector2(264, 190), Vector2(106, 21), back)
	var focusable: Array[Button] = []
	for c in controls:
		if c is Button and not c.disabled: focusable.append(c)
	for i in focusable.size():
		var b := focusable[i]
		var previous := b.get_path_to(focusable[posmod(i - 1, focusable.size())])
		var next := b.get_path_to(focusable[(i + 1) % focusable.size()])
		b.focus_previous = previous
		b.focus_next = next
		b.focus_neighbor_left = previous
		b.focus_neighbor_top = previous
		b.focus_neighbor_right = next
		b.focus_neighbor_bottom = next
	for c in controls:
		if c is Button and not c.disabled and c.position.y >= 60:
			c.grab_focus()
			break
	queue_redraw()

func activate() -> void:
	if pocket == 0:
		choosing = true
		build()
	elif pocket == 1 and in_battle and model.lures > 0:
		used.emit({"kind": "catch"})

func use_item(target: int) -> void:
	var action := {"kind": "berry", "target": target}
	var problem: String = model.validate(action)
	if problem != "":
		note = problem
		build()
		return
	used.emit(action)

func back() -> void:
	if choosing:
		choosing = false
		build()
	else: closed.emit()

func _unhandled_key_input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed and not e.echo and e.keycode in [KEY_ESCAPE, KEY_B]:
		back()
		get_viewport().set_input_as_handled()

func _draw() -> void:
	draw_rect(Rect2(0, 0, 384, 216), Color(0.04, 0.10, 0.12, 0.94))
	draw_style_box(_panel(PAPER), Rect2(6, 6, 372, 204))
	draw_style_box(_panel(Color("d6b879")), Rect2(12, 61, 108, 79))
	draw_style_box(_panel(Color("fff9e5")), Rect2(128, 44, 246, 97))
	draw_line(Vector2(16, 145), Vector2(368, 145), Color("bfae8b"), 1)
	# Original bag silhouette, with optional external item art layered on it.
	draw_style_box(_panel(Color("5a8b7e")), Rect2(39, 78, 54, 52))
	draw_arc(Vector2(66, 82), 14, PI, TAU, 16, DARK, 4)
	draw_style_box(_panel(Color("94b8a0")), Rect2(44, 103, 44, 20))
	var texture: Texture2D = pack.item_texture("oran-berry" if pocket == 0 else "poke-ball") if pack != null and pocket != 2 else null
	if texture != null: draw_texture_rect(texture, Rect2(49, 85, 34, 34), false)
	elif pocket == 0:
		draw_circle(Vector2(66, 106), 10, Color("ce815e"))
		draw_line(Vector2(65, 97), Vector2(72, 90), DARK, 3)
	elif pocket == 1:
		draw_circle(Vector2(66, 105), 11, PAPER)
		draw_arc(Vector2(66, 105), 11, PI, TAU, 16, Color("c56f58"), 8)
		draw_line(Vector2(54, 105), Vector2(78, 105), DARK, 2)
		draw_circle(Vector2(66, 105), 3, DARK)

func _panel(color: Color) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = color
	box.border_color = DARK
	box.set_border_width_all(1)
	box.set_corner_radius_all(4)
	return box
