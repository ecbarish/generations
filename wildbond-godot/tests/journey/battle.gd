extends "res://tests/private_sprites/battle.gd"
const Catalogue := preload("res://tests/journey/catalogue.gd")
var can_store := true

func restart() -> void:
	model=Fixture.create()
	var foe := Catalogue.creature(opponent_id)
	model.setup(supplies.team,foe,model.moves,model.elements,randi())
	# The reused setup initializes PP; restore the chapter party's actual remaining uses.
	for i in model.team.size():
		for move in model.team[i].moves: model.team[i].pp[move]=int(supplies.team[i].pp[move])
	for i in model.team.size():
		if model.team[i].hp>0: model.active=i; break
	model.berries=supplies.berries
	model.lures=supplies.lures
	page="commands"
	message="A wild %s appeared!" % foe.name
	event={}
	message_time=0
	shown=[float(model.team[model.active].hp),float(foe.hp)]
	_build_menu()
	queue_redraw()

func _build_menu() -> void:
	super._build_menu()
	if model==null: return
	if model.state=="ended" and event.is_empty():
		for button in buttons:
			remove_child(button)
			button.queue_free()
		buttons.clear()
		_button("Return to Trail",func(): return_to_world.emit(model.result))
		buttons[0].grab_focus()
	elif model.state=="choose" and page=="commands" and event.is_empty():
		buttons[3].disabled=not can_store or model.lures<=0
	elif model.state=="choose" and page=="party" and buttons.size()>6:
		buttons.back().position=Vector2(302,3)
		buttons.back().size=Vector2(74,17)

func _act(action: Dictionary) -> void:
	if action.kind=="catch" and not can_store:
		message="Your party and storage are full."
		queue_redraw()
		return
	super._act(action)

func open_bag() -> void:
	if bag!=null: return
	bag=preload("res://tests/journey/bag.gd").new()
	bag.model=model
	bag.pack=pack
	bag.in_battle=true
	bag.closed.connect(func(): bag.queue_free(); bag=null; _build_menu())
	bag.used.connect(func(action: Dictionary): bag.queue_free(); bag=null; _act(action))
	add_child(bag)

func _creature(c: Dictionary, foot: Vector2, back: bool, side: String) -> void:
	if pack!=null and pack.entries.has(str(c.id)): super._creature(c,foot,back,side); return
	var fallback := c.duplicate(true)
	fallback.id=Catalogue.ALIASES.get(str(c.id),"cindercub")
	super._creature(fallback,foot,back,side)

func _draw() -> void:
	super._draw()
	if model==null: return
	draw_style_box(_paper(),Rect2(7,3,370,17))
	_text(Vector2(13,15),"Thornwood / Wild Encounter",10)
	_text(Vector2(282,15),"Round %d" % model.round_number,9)

func _continue() -> void:
	super._continue()
	if model.state=="ended" and event.is_empty():
		message={"won":"Victory! Return to the trail to collect your reward.","lost":"Your team needs the Center.","caught":"You caught %s!" % model.foe.name,"escaped":"You got away safely."}.get(model.result,message)
