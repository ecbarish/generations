extends "res://tests/battle_slice/view.gd"
## Reuse the existing tested turn rules; imported combat stats are explicit study proxies.
signal return_to_world(result: String)
var pack: RefCounted
var opponent_id := "pokemon:16"
var supplies: RefCounted
var bag: Control
var bogsnap_frames: Array = JSON.parse_string(FileAccess.get_file_as_string("res://tests/private_sprites/bogsnap/frames.json"))
var bogsnap_texture: Texture2D = load("res://tests/private_sprites/bogsnap/walk-idle-v2.png")

func restart() -> void:
	super.restart()
	if pack != null and pack.entries.has(opponent_id):
		var foe: Dictionary = model.foe.duplicate(true)
		foe.id = opponent_id
		foe.name = pack.entries[opponent_id].name
		foe.element = {"pokemon:16": "Gale", "pokemon:37": "Ember", "pokemon:194": "Tide"}[opponent_id]
		foe.moves = {"pokemon:16": ["peck", "gust"], "pokemon:37": ["bite", "emberSnap"], "pokemon:194": ["bubbleJet", "bite"]}[opponent_id]
		model.setup(model.team, foe, model.moves, model.elements, 42)
		message = "A wild %s appeared!" % foe.name
		shown = [float(model.team[0].hp), float(model.foe.hp)]
		_build_menu()
	if supplies != null:
		model.setup(supplies.team, model.foe, model.moves, model.elements, 42)
		model.berries = supplies.berries
		model.lures = supplies.lures
		shown = [float(model.team[0].hp), float(model.foe.hp)]
		_build_menu()

func _build_menu() -> void:
	super._build_menu()
	if model != null and model.state == "choose" and page == "commands" and event.is_empty():
		buttons[2].text = "Bag"
		buttons[3].text = "Bond Ball (%d)" % model.lures
	if model != null and model.state == "ended" and event.is_empty():
		_button("Return to Clearing", func(): return_to_world.emit(model.result))

func _act(action: Dictionary) -> void:
	if action.kind == "berry" and not action.has("target"):
		open_bag()
		return
	super._act(action)

func open_bag() -> void:
	if bag != null: return
	bag = preload("res://tests/private_sprites/bag.gd").new()
	bag.model = model
	bag.pack = pack
	bag.in_battle = true
	bag.closed.connect(func(): bag.queue_free(); bag = null; _build_menu())
	bag.used.connect(func(action: Dictionary):
		bag.queue_free()
		bag = null
		_act(action))
	add_child(bag)

func _continue() -> void:
	super._continue()
	if model.state == "ended" and event.is_empty() and model.result == "caught":
		message = "You caught %s!" % model.foe.name

func _creature(c: Dictionary, foot: Vector2, back: bool, side: String) -> void:
	if c.id == "bogsnap" and back:
		if c.hp <= 0: return
		var index: int = preload("res://tests/private_sprites/actor_motion.gd").idle_frame(clock) if motion else 0
		var meta: Dictionary = bogsnap_frames[index]
		var area := Rect2(meta.region[0], meta.region[1], meta.region[2], meta.region[3])
		var zoom := 0.29
		draw_texture_rect_region(bogsnap_texture, Rect2(foot - Vector2(area.size.x * 0.5, area.size.y) * zoom, area.size * zoom), area)
		return
	if pack == null or not pack.entries.has(str(c.id)):
		super._creature(c, foot, back, side)
		return
	if c.hp <= 0: return
	var frame: Dictionary = pack.battle_frame(str(c.id), back)
	var box: Rect2 = frame.region
	var zoom := minf(78.0 / box.size.x, 64.0 / box.size.y)
	draw_texture_rect_region(frame.texture, Rect2(foot - Vector2(box.size.x * zoom * 0.5, box.size.y * zoom), box.size * zoom), box)
