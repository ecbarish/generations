extends "res://tests/town/scene.gd"
const Profile := preload("res://tests/journey/profile.gd")
const Catalogue := preload("res://tests/journey/catalogue.gd")
const JourneyBattle := preload("res://tests/journey/battle.gd")
var profile := Profile.new()
var save_path := Profile.PATH
var no_save := false
var ready_to_save := false
var save_clock := 0.0
var storage_page := 0
var save_note := ""

func _ready() -> void:
	super._ready()
	profile.open_profile(save_path)
	if profile.state.started:
		_hydrate()
		super.change_room(profile.state.room)
		player.position=Vector3(float(profile.state.position[0]),0,float(profile.state.position[1]))
		if _blocked(player.position): player.position=Vector3(120,0,5) if room=="trail" else Vector3(0,0,6)
		companion.position=player.position+Vector3(-.9,0,.6)
		trail.clear()
		trail.append(player.position)
		_animate_partner()
		_update_camera()
	ready_to_save=true
	location.text="WILDBOND / First Journey" if room=="town" else "THORNWOOD / Trail"
	if profile.hold:
		say("SAVE KEPT SAFE",profile.issue,[{"text":"Play Unsaved","call":func(): close_dialogue(); choose_partner() if not profile.state.started else _goal_hint()}])
	elif not profile.state.started: choose_partner()
	_goal_hint()

func _hydrate() -> void:
	supplies.team=[]
	for c in profile.state.team: supplies.team.append(Catalogue.decode(c))
	supplies.berries=int(profile.state.berries)
	supplies.lures=int(profile.state.balls)
	coins=int(profile.state.coins)

func _snapshot() -> void:
	profile.state.team=[]
	for c in supplies.team: profile.state.team.append(Catalogue.encode(c))
	profile.state.berries=mini(999,supplies.berries)
	profile.state.balls=mini(999,supplies.lures)
	profile.state.coins=mini(999999,coins)
	if room in ["center","mart"]:
		profile.state.room="town"
		profile.state.position=[outside_position.x,outside_position.z]
	else:
		profile.state.room=room
		profile.state.position=[player.position.x,player.position.z]

func save_progress() -> bool:
	if not ready_to_save or not profile.state.started or not active or battle!=null: return false
	_snapshot()
	if no_save: return true
	var ok := profile.save()
	save_note="Saved" if ok else "Unsaved"
	_goal_hint()
	return ok

func choose_partner() -> void:
	if profile.state.started: return
	close_dialogue()
	close_menu()
	menu=_panel(Vector2(20,35),Vector2(344,142))
	_label(menu,"CHOOSE YOUR PARTNER",Vector2(13,8),Vector2(318,22),15)
	_label(menu,"Who will walk beside you?",Vector2(13,34),Vector2(318,20),10)
	modal_buttons.clear()
	for i in Catalogue.IDS.size():
		var sid: String=Catalogue.IDS[i]
		var b := _choice(menu,Catalogue.NAMES[sid],Vector2(12+i*108,98),Vector2(104,29),func(): start_journey(sid))
		modal_buttons.append(b)
		var art: Dictionary=pack.battle_frame(sid,false)
		if not art.is_empty():
			var picture := TextureRect.new()
			var texture := AtlasTexture.new()
			texture.atlas=art.texture
			texture.region=art.region
			picture.texture=texture
			picture.expand_mode=TextureRect.EXPAND_IGNORE_SIZE
			picture.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			picture.position=Vector2(36+i*108,52)
			picture.size=Vector2(56,44)
			picture.mouse_filter=Control.MOUSE_FILTER_IGNORE
			menu.add_child(picture)
	modal_buttons[0].grab_focus()
	prompt.hide()

func start_journey(sid: String) -> void:
	if not profile.start(sid): return
	_hydrate()
	close_menu()
	_animate_partner()
	save_progress()
	say("YOUR FIRST JOURNEY","%s is ready! Explore the trail, catch a Pokemon, then visit the Center." % Catalogue.NAMES[sid])

func _goal_hint() -> void:
	if hint==null: return
	var goal := "Choose a partner"
	if profile.state.started:
		goal="Catch a Pokemon on the trail" if not profile.state.first_catch else ("Return to the Center" if not profile.state.healed_after_catch else "Explore, battle and grow your collection")
	hint.text=goal+("  /  "+save_note if save_note!="" else "")
	hint.size=Vector2(370,12)

func _animate_partner() -> void:
	if supplies==null or supplies.team.is_empty() or str(supplies.team[0].id) not in Catalogue.IDS:
		super._animate_partner()
		return
	var sid: String=supplies.team[0].id
	var frame: Dictionary=pack.world_frame(sid,"Walk" if partner_gait.moving else "Idle",partner_gait.direction8,partner_idle)
	if frame.is_empty(): super._animate_partner(); return
	partner_atlas.atlas=frame.texture
	partner_atlas.region=frame.region
	partner.texture=partner_atlas
	partner.pixel_size=.028
	partner.flip_h=false
	partner.scale.y=1
	partner.offset=Vector2(frame.region.size.x*.5-frame.anchor.x,frame.anchor.y-frame.region.size.y*.5)
	var radius: float={"pokemon:16":.18,"pokemon:37":.28,"pokemon:194":.22}[sid]
	for child in companion.get_children():
		if child is MeshInstance3D and child.mesh is CylinderMesh and child.mesh.top_radius!=radius:
			child.mesh.top_radius=radius
			child.mesh.bottom_radius=radius

func toggle_menu() -> void:
	if not profile.state.started: choose_partner(); return
	if not active or bag!=null or dialogue!=null: return
	if menu!=null: close_menu(); return
	menu=_panel(Vector2(246,30),Vector2(133,183))
	_label(menu,"WILDBOND",Vector2(10,6),Vector2(114,18),12)
	modal_buttons.clear()
	var callbacks := [show_party,func(): close_menu(); open_bag(),show_storage,show_journey,func(): close_menu(); say("SAVE","Progress saved." if save_progress() else (profile.issue if profile.issue!="" else "This visit could not be saved.")),close_menu]
	var titles := ["Party","Bag","Storage","Journey","Save","Close"]
	for i in titles.size(): modal_buttons.append(_choice(menu,titles[i],Vector2(7,27+i*25),Vector2(119,23),callbacks[i]))
	modal_buttons[0].grab_focus()
	prompt.hide()

func show_party() -> void:
	_detail("PARTY  /  %d of 6" % supplies.team.size())
	for i in supplies.team.size():
		var c: Dictionary=supplies.team[i]
		_choice(detail,"%s  %d/%d HP%s" % [c.name,c.hp,c.max_hp,"  *" if i==0 else ""],Vector2(8,29+i*20),Vector2(219,19),func(): party_action(i))
		var bar := ColorRect.new()
		bar.position=Vector2(137,45+i*20)
		bar.size=Vector2(81,2)
		bar.color=INK
		bar.mouse_filter=Control.MOUSE_FILTER_IGNORE
		detail.add_child(bar)
		var fill := ColorRect.new()
		fill.size=Vector2(81*clampf(float(c.hp)/float(c.max_hp),0,1),2)
		fill.color=Color("64ab72")
		fill.mouse_filter=Control.MOUSE_FILTER_IGNORE
		bar.add_child(fill)

func party_action(index: int) -> void:
	close_menu()
	var c: Dictionary=supplies.team[index]
	say(c.name.to_upper(),"Choose what %s does next." % c.name,[{"text":"Lead","call":func(): set_lead(index)},{"text":"Store","call":func(): store_partner(index)},{"text":"Back","call":close_dialogue}])

func set_lead(index: int) -> bool:
	if index<0 or index>=supplies.team.size(): return false
	if supplies.team[index].hp<=0:
		say("PARTY","A fainted Pokemon needs the Center before leading.")
		return false
	var c: Dictionary=supplies.team.pop_at(index)
	supplies.team.push_front(c)
	close_dialogue()
	_animate_partner()
	save_progress()
	return true

func store_partner(index: int) -> bool:
	if index<0 or index>=supplies.team.size(): return false
	if supplies.team.size()<=1 or profile.state.box.size()>=60:
		say("STORAGE","Keep a partner with you, and leave a free space in storage.")
		return false
	var remaining: Array=supplies.team.duplicate()
	remaining.remove_at(index)
	if remaining.all(func(c): return c.hp<=0):
		say("STORAGE","Keep a healthy partner with you.")
		return false
	profile.state.box.append(Catalogue.encode(supplies.team.pop_at(index)))
	close_dialogue()
	_animate_partner()
	save_progress()
	return true

func show_storage() -> void:
	_detail("STORAGE  /  %d of 60" % profile.state.box.size())
	storage_page=clampi(storage_page,0,maxi(0,(profile.state.box.size()-1)/5))
	if profile.state.box.is_empty(): _label(detail,"Caught Pokemon go here when your party is full. Select one to withdraw.",Vector2(12,34),Vector2(210,58),10)
	for row in mini(5,profile.state.box.size()-storage_page*5):
		var index := storage_page*5+row
		var c := Catalogue.decode(profile.state.box[index])
		_choice(detail,"%s  #%d" % [c.name,c.individual],Vector2(8,29+row*21),Vector2(219,20),func(): withdraw(index))
	_choice(detail,"Previous",Vector2(8,140),Vector2(100,20),func(): storage_page-=1; show_storage())
	_choice(detail,"Next",Vector2(119,140),Vector2(108,20),func(): storage_page+=1; show_storage())

func withdraw(index: int) -> bool:
	if index<0 or index>=profile.state.box.size(): return false
	if supplies.team.size()>=6:
		close_menu()
		say("STORAGE","Your party is full. Store a partner first.")
		return false
	supplies.team.append(Catalogue.decode(profile.state.box.pop_at(index)))
	save_progress()
	if menu!=null: show_storage()
	return true

func show_journey() -> void:
	_detail("FIRST JOURNEY")
	_label(detail,"Party: %d / 6\nStored: %d / 60\nBattles won: %d\nCoins: %d\n\n%s" % [supplies.team.size(),profile.state.box.size(),profile.state.wins,coins,"Your first catch is safely home." if profile.state.healed_after_catch else ("Bring your catch to the Center." if profile.state.first_catch else "Catch a Pokemon on Thornwood Trail.")],Vector2(12,32),Vector2(210,121),10)

func change_room(destination: String) -> void:
	if ready_to_save and not profile.state.started: return
	super.change_room(destination)
	if location!=null and room=="town": location.text="WILDBOND / First Journey"
	save_progress()

func heal_party() -> void:
	super.heal_party()
	if profile.state.first_catch: profile.state.healed_after_catch=true
	save_progress()

func buy(item: String) -> void:
	if (item=="berry" and supplies.berries>=999) or (item=="ball" and supplies.lures>=999):
		say("MART","Your Bag has enough of that item.")
		return
	super.buy(item)
	save_progress()

func close_bag() -> void:
	super.close_bag()
	save_progress()

func open_bag() -> void:
	if not active or _modal() or not profile.state.started: return
	gait.advance(Vector2.ZERO,Vector3.ZERO,false)
	_animate_tamer()
	bag=preload("res://tests/journey/bag.gd").new()
	bag.model=supplies
	bag.pack=pack
	bag.closed.connect(close_bag)
	bag.used.connect(func(action: Dictionary):
		var c: Dictionary=supplies.team[action.target]
		c.hp+=mini(int(c.max_hp)-int(c.hp),maxi(1,roundi(c.max_hp*.5)))
		supplies.berries-=1
		close_bag())
	ui.add_child(bag)

func enter_battle() -> void:
	if room!="trail" or not active or _modal() or not profile.state.started: return
	if player.position.distance_to(creature.position)>2.4: return
	profile.state.encounters=mini(999999,int(profile.state.encounters)+1)
	save_progress() # A closed window mid-battle resumes from the last complete world checkpoint.
	return_position=player.position
	active=false
	ui.hide()
	battle=JourneyBattle.new()
	battle.pack=pack
	battle.supplies=supplies
	battle.opponent_id=selected
	battle.can_store=profile.room_for_capture()
	battle.return_to_world.connect(_return)
	var layer := CanvasLayer.new()
	layer.name="BattleOverlay"
	add_child(layer)
	layer.add_child(battle)

func _return(result: String) -> void:
	if battle==null or battle.model.state!="ended" or result!=battle.model.result: return
	var caught: Dictionary=battle.model.foe.duplicate(true)
	var lead: int=battle.model.active
	super._return(result)
	if lead>0 and supplies.team[lead].hp>0: supplies.team.push_front(supplies.team.pop_at(lead))
	_snapshot()
	var destination := ""
	if result=="caught":
		destination=profile.caught(caught)
		_hydrate()
		coins=mini(999999,coins+20)
	elif result=="won":
		profile.state.wins=mini(999999,int(profile.state.wins)+1)
		coins=mini(999999,coins+30)
	elif result=="lost":
		for c in supplies.team:
			for move in c.moves: c.pp[move]=int(supplies.moves[move].pp)
		super.change_room("town")
		player.position=Vector3(-7,0,-1.4)
		companion.position=player.position+Vector3(-.9,0,.6)
	selected=Catalogue.IDS[(Catalogue.IDS.find(selected)+1)%Catalogue.IDS.size()]
	_refresh_creature()
	_animate_partner()
	save_progress()
	if result=="caught": say("A NEW PARTNER","%s joined your %s! You received 20 coins." % [caught.name,"party" if destination=="party" else "storage"])
	elif result=="won": say("VICTORY","You received 30 coins. Your party's health and moves carry into the next battle.")
	elif result=="lost": say("PARTNER CENTER","Your team has rested. You're safe beside the Center.")

func _process(dt: float) -> void:
	super._process(dt)
	save_clock+=dt
	if save_clock>=8:
		save_clock=0
		if active and not _modal(): save_progress()

func _exit_tree() -> void:
	if ready_to_save and active: save_progress()

func _unhandled_key_input(event: InputEvent) -> void:
	if not profile.state.started and event is InputEventKey and event.pressed and not event.echo:
		if event.keycode in [KEY_ESCAPE,KEY_E,KEY_B]: choose_partner(); get_viewport().set_input_as_handled()
		return
	super._unhandled_key_input(event)
