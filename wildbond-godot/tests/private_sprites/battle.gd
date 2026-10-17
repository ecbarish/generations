extends "res://tests/battle_slice/view.gd"
## Reuse the existing tested turn rules; imported combat stats are explicit study proxies.
signal return_to_world(result: String)
var pack: RefCounted
var opponent_id := "pokemon:16"

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

func _build_menu() -> void:
	super._build_menu()
	if model != null and model.state == "ended" and event.is_empty():
		_button("Return to Clearing", func(): return_to_world.emit(model.result))

func _continue() -> void:
	super._continue()
	if model.state == "ended" and event.is_empty() and model.result == "caught":
		message = "You caught %s!" % model.foe.name

func _creature(c: Dictionary, foot: Vector2, back: bool, side: String) -> void:
	if pack == null or not pack.entries.has(str(c.id)):
		super._creature(c, foot, back, side)
		return
	if c.hp <= 0: return
	var frame: Dictionary = pack.battle_frame(str(c.id), back)
	var box: Rect2 = frame.region
	var zoom := minf(78.0 / box.size.x, 64.0 / box.size.y)
	draw_texture_rect_region(frame.texture, Rect2(foot - Vector2(box.size.x * zoom * 0.5, box.size.y * zoom), box.size * zoom), box)
