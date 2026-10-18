extends "res://tests/journey/scene.gd"
## Measured geography and authored character hooks over the persistent chapter systems.
const Map := preload("res://tests/opening/map.gd")
const OpeningBattle := preload("res://tests/opening/battle.gd")
var world_map := Map.new()
var outdoors: Node3D
var chapter := fresh_chapter()
var story_queue: Array = []
var story_done := Callable()
var encounter_trainer := ""
var outdoor_return := Vector3.ZERO
var previous_wild := "pokemon:16"
var npc_art: Dictionary = {}
var last_area := ""
var item_nodes := {}

static func fresh_chapter() -> Dictionary:
	return {"version":1,"position":[0.0,8.75],"met_maren":false,"wren":false,"bram":false,"reported":false,"items":[]}

func _ready() -> void:
	super._ready()
	chapter=profile.state.get("opening",fresh_chapter()).duplicate(true)
	room="town"
	player.position=Vector3(float(chapter.position[0]),0,float(chapter.position[1]))
	if world_map.blocked(player.position): player.position=Map.point(Vector2i(11,7))
	_reset_follow()
	_goal_hint()
	_update_items()
	_update_camera()

func _build_world() -> void:
	super._build_world()
	# Retain the tested actors, weather, lighting and camera, replace all prototype geography.
	var keep: Array=[player,companion,creature,camera,sun]
	keep.append_array(rain_nodes);keep.append_array(motes)
	for node in get_children():
		if node is Node3D and node not in keep and not node.is_queued_for_deletion(): node.queue_free()
	props.clear();occluders.clear();obstacles.clear();lamps.clear();splashes.clear();healing_lights.clear();building_bounds.clear();places.clear()
	town_ground=null;trail_ground=null;fountain=null
	outdoors=Node3D.new();add_child(outdoors)
	var before := get_children()
	var surfaces := MultiMesh.new()
	surfaces.transform_format=MultiMesh.TRANSFORM_3D;surfaces.use_colors=true;surfaces.mesh=BoxMesh.new()
	surfaces.instance_count=world_map.cells.size()
	var backdrop := PlaneMesh.new();backdrop.size=Vector2(180,160)
	# A single green base keeps the measured crop inside a larger landscape, not floating in a void.
	_mesh(backdrop,Vector3(0,-.10,-5),_material(Color("6d8c54")))
	for x in range(-22,39):
		for y in range(-27,21):
			var cell := Vector2i(x,y)
			if world_map.cells.has(cell) or posmod(x*3+y*2,7)!=0: continue
			_tree(Map.point(cell),2.6+fposmod(x*.3+y*.4,1.0),Color.WHITE)
	var index := 0
	for cell in world_map.cells:
		var glyph: String=world_map.glyph(cell)
		var at := Map.point(cell)
		var color: Color={"T":Color("426f43"),".":Color("bca77a"),"~":Color("699caa"),"\"":Color("54833d"),"r":Color("66834d"),"#":Color("66834d"),"D":Color("b9a579"),"C":Color("777575"),"G":Color("bba16e")}.get(glyph,Color("779651"))
		surfaces.set_instance_transform(index,Transform3D(Basis.from_scale(Vector3(Map.CELL,.08,Map.CELL)),at-Vector3(0,.045,0)))
		surfaces.set_instance_color(index,color);index+=1
		if glyph=="T" and posmod(cell.x+cell.y*2,3)==0: _tree(at,2.4+fposmod(cell.x*.3+cell.y*.4,1.0),Color.WHITE)
		elif glyph=="=":
			var vertical: bool=world_map.glyph(cell+Vector2i.UP)=="=" or world_map.glyph(cell+Vector2i.DOWN)=="="
			var horizontal: bool=world_map.glyph(cell+Vector2i.LEFT)=="=" or world_map.glyph(cell+Vector2i.RIGHT)=="="
			_solid(at+Vector3(0,.45,0),Vector3(.13,.9,.13),PAPER)
			for y in [.28,.63]: _solid(at+Vector3(0,y,0),Vector3(.09,.09,Map.CELL) if vertical and not horizontal else Vector3(Map.CELL,.09,.09),Color("ded3b5"))
		elif glyph=="\"": _prop("grass_leafs",at,.35,cell.x+cell.y)
		elif glyph=="f": _prop("flower_yellowC" if cell.x%2 else "flower_purpleA",at,.35)
		elif glyph=="~":
			var plane := PlaneMesh.new();plane.size=Vector2(Map.CELL,Map.CELL)
			_mesh(plane,at+Vector3(0,.005,0),water_material)
		elif glyph=="G": _solid(at+Vector3(0,.5,0),Vector3(.2,1,Map.CELL),Color("a48d65"))
	var surface_node := MultiMeshInstance3D.new();surface_node.multimesh=surfaces
	var material := ShaderMaterial.new();material.shader=load("res://tests/opening/ground.gdshader")
	surface_node.material_override=material;add_child(surface_node)
	_building(Map.point(Vector2i(4,3)),Vector2(6.1,3.3),Color("bd5b54"),"HEALING INN","center")
	_building(Map.point(Vector2i(18,3)),Vector2(6.1,3.3),Color("528baf"),"SHOP","mart")
	_building(Map.point(Vector2i(7,9)),Vector2(6.1,3.3),Color("819552"),"MAREN'S RANCH","ranch")
	places.clear()
	for row in [["center",4,5,"Healing Inn"],["mart",18,5,"Shop"],["ranch",7,11,"Ranch Storage"],["maren",9,11,"Talk to Maren"],["wren",13,7,"Talk to Wren"],["pip",21,7,"Talk to Pip"],["bram",11,-13,"Talk to Bram"],["sign",12,1,"Read the Sign"],["cave",-14,7,"Larkburrow"],["dewcut",30,-10,"Dewcut Approach"],["north",10,-20,"Thornwood Hollow"],["paddock",16,11,"Visit the Paddock"],["item_lh1",22,12,"Pick Up"],["item_tw1",5,-15,"Pick Up"]]:
		places.append({"kind":row[0],"at":Map.point(Vector2i(row[1],row[2])),"label":row[3]})
	for place in places:
		if str(place.kind).begins_with("item_"):
			var holder := _actor(place.at)
			var ball := SphereMesh.new();ball.radius=.16;ball.height=.32
			var marker := MeshInstance3D.new();marker.mesh=ball;marker.position.y=.19;marker.material_override=_material(Color("dfb456"));holder.add_child(marker)
			_shadow(holder,.18);item_nodes[str(place.kind).trim_prefix("item_")]=holder
	for row in [["maren",9,11],["wren",13,7],["pip",21,7],["bram",11,-13]]: _npc(row[0],Map.point(Vector2i(row[1],row[2])))
	_sign(Map.point(Vector2i(12,1)),"THORNWOOD",Color("4f7353"))
	_sign(Map.point(Vector2i(-4,6)),"MILLGRASS",Color("88724f"))
	_sign(Map.point(Vector2i(29,-11)),"DEWCUT",Color("648869"))
	var cave_at := Map.point(Vector2i(-15,7))
	_solid(cave_at+Vector3(0,1.0,0),Vector3(1.0,2.0,3.1),Color("777675"))
	_solid(cave_at+Vector3(.55,.65,0),Vector3(.1,1.3,1.2),Color("353c3a"))
	for cell in [Vector2i(4,6),Vector2i(18,6),Vector2i(8,11),Vector2i(10,-3)]: _lantern(Map.point(cell))
	for node in get_children():
		if node is Node3D and node not in before: node.reparent(outdoors,true)
	_make_room(60,"center");_make_room(90,"mart")
	player.position=Map.point(Vector2i(11,7));creature.position=Map.point(Vector2i(15,-7))
	_reset_follow()
	_apply_light()

func _npc(who: String, at: Vector3) -> void:
	var owner_node := _actor(at)
	_shadow(owner_node,.22)
	var image := Image.create(18,28,false,Image.FORMAT_RGBA8)
	var cast: Dictionary=Map.SOURCE.CAST.get(who,{})
	var look := {"skin":Color(cast.get("skin","#d7a878")),"hair":Color(cast.get("hairCol","#593b2c")),"shirt":Color(cast.get("shirt","#a76682")),"legs":Color("34464c"),"shoes":Color("49382c"),"hat":Color(cast.get("hatCol","#dfb76c")),"style":"cap" if cast.get("hair")=="hat" else "short"}
	for bit in Figures.person_parts(Vector2i.DOWN,false,0,false,look): image.fill_rect(Rect2i(int(bit[0])+3,int(bit[1])+3,int(bit[2]),int(bit[3])).intersection(Rect2i(0,0,18,28)),bit[4])
	var face := _sprite(owner_node);face.texture=ImageTexture.create_from_image(image);face.pixel_size=.055;face.offset=Vector2(0,10)
	_text3(str(cast.get("name",who.capitalize())),at+Vector3(0,1.8,0),25)
	npc_art[who]=owner_node

func _reset_follow() -> void:
	companion.position=player.position+Vector3(-.5,0,.5)
	if world_map.blocked(companion.position) and room=="town": companion.position=player.position
	trail.clear();trail.append(player.position);following=false
	gait.advance(Vector2.ZERO,Vector3.ZERO,false);_animate_tamer()

func _blocked(at: Vector3) -> bool:
	if room in ["center","mart"]: return super._blocked(at)
	return world_map.blocked(at)

func _snapshot() -> void:
	# Retain schema-two's safe legacy landing for older chapter builds. New coordinates are additive.
	profile.state.team=[]
	for c in supplies.team: profile.state.team.append(Catalogue.encode(c))
	profile.state.berries=mini(999,supplies.berries);profile.state.balls=mini(999,supplies.lures);profile.state.coins=mini(999999,coins)
	profile.state.room="town";profile.state.position=[0,6]
	var at := outdoor_return if room in ["center","mart"] else player.position
	chapter.position=[at.x,at.z]
	profile.state.opening=chapter.duplicate(true)

func _goal_hint() -> void:
	if hint==null: return
	var goal := "Choose your partner"
	if profile.state.started:
		if not chapter.met_maren: goal="Speak to Maren beside the ranch"
		elif not profile.state.first_catch: goal="Explore Thornwood / Catch a wild Pokemon"
		elif not profile.state.healed_after_catch: goal="Bring your new partner to the Healing Inn"
		elif not chapter.reported: goal="Return to Maren at the ranch"
		else: goal="First outing complete / Wren and Bram await"
	hint.text=goal+(" / "+save_note if save_note!="" else "");hint.position=Vector2(8,188);hint.size=Vector2(218,24)

func _nearest() -> Dictionary:
	if room in ["center","mart"]: return super._nearest()
	var nearest := {};var distance := 1.65
	for place in places:
		if str(place.kind).begins_with("item_") and str(place.kind).trim_prefix("item_") in chapter.items: continue
		var d := player.position.distance_to(place.at)
		if d<distance: nearest=place;distance=d
	if player.position.distance_to(creature.position)<1.7: return {"kind":"battle","label":"Meet "+Catalogue.NAMES[selected]}
	return nearest

func interact() -> void:
	if not active or _modal() or not profile.state.started: return
	var near := _nearest()
	match near.get("kind",""):
		"center","mart": change_room(near.kind)
		"exit": change_room("town")
		"heal": say("HEALING INN","Shall we restore your partners?",[{"text":"Restore","call":heal_party},{"text":"Later","call":close_dialogue}])
		"shop": open_shop()
		"ranch": toggle_menu();show_storage()
		"paddock": say("MAREN'S PADDOCK","Your caught partners are safe here. Open Ranch Storage to choose who travels with you.",[{"text":"Storage","call":func(): close_dialogue();toggle_menu();show_storage()},{"text":"Back","call":close_dialogue}])
		"maren": talk_maren()
		"wren","bram": talk_trainer(near.kind)
		"pip": tell(Map.SOURCE.MAPS.larkhaven.npcs[1].lines)
		"sign": say("LARKHAVEN",Map.SOURCE.MAPS.larkhaven.signs["12,1"])
		"cave": say("LARKBURROW","The old burrow is blocked. Stone Break and the Loom Badge will reopen the way home from Threadmeet.")
		"dewcut": say("DEWCUT APPROACH","The trail continues east. This stretch is closed for now.")
		"north": say("THORNWOOD HOLLOW","The path deeper into Thornwood is closed for now. Larkhaven is south along the trail.")
		"item_lh1","item_tw1":
			var id: String=str(near.kind).trim_prefix("item_")
			if id not in chapter.items:
				chapter.items.append(id);_update_items();coins=mini(999999,coins+(30 if id=="lh1" else 60));save_progress()
				say("FOUND","You found %d coins." % (30 if id=="lh1" else 60))
		"battle": enter_battle()

func talk_maren() -> void:
	if not chapter.met_maren:
		chapter.met_maren=true;save_progress()
		tell([Map.SOURCE.SCENES.intro[2],Map.SOURCE.SCENES.intro[4],Map.SOURCE.SCENES.rival1Win[1]])
	elif profile.state.healed_after_catch and not chapter.reported:
		chapter.reported=true;supplies.lures=mini(999,supplies.lures+2);supplies.berries=mini(999,supplies.berries+1);save_progress()
		say("MAREN","Your new partner is safely home. Take two Bond Balls and a Ranch Berry for your next outing.")
	else:
		say("MAREN","The barn and paddock are open. Rest here whenever your partners need it.",[{"text":"The Valley","call":func(): tell([Map.SOURCE.SCENES.intro[3]])},{"text":"Continue","call":close_dialogue}])

func talk_trainer(who: String) -> void:
	if chapter[who]:
		tell(Map.SOURCE.SCENES.rival1Win.slice(0,1) if who=="wren" else Map.SOURCE.MAPS.thornwood_route.npcs[0].trainer.after)
		return
	var line: String=Map.SOURCE.SCENES.rival1[3][1] if who=="wren" else Map.SOURCE.MAPS.thornwood_route.npcs[0].lines[0][1]
	var other: String = Catalogue.IDS[(Catalogue.IDS.find(str(supplies.team[0].id))+1)%3] if who=="wren" else "pokemon:37"
	line=line.replace("{starter}",supplies.team[0].name).replace("{rival}",Catalogue.NAMES[other])
	tell([[who,line]],func(): say(who.capitalize(),"Ready for a friendly battle?",[{"text":"Battle","call":func(): close_dialogue();begin_encounter(who,other)},{"text":"Later","call":close_dialogue}]))

func tell(lines: Array, then := Callable()) -> void:
	story_queue=[];story_done=then
	for pair in lines:
		var title: String=str(Map.SOURCE.CAST.get(str(pair[0]),{}).get("name","Larkhaven"))
		var text: String=str(pair[1]).replace("{name}","Traveler")
		var chunk := ""
		for word in text.split(" "):
			if (chunk+word).length()>165: story_queue.append([title,chunk.strip_edges()]);chunk=""
			chunk+=word+" "
		if chunk!="": story_queue.append([title,chunk.strip_edges()])
	_next_story()

func _next_story() -> void:
	if story_queue.is_empty():
		close_dialogue()
		if story_done.is_valid(): var callback := story_done;story_done=Callable();callback.call()
		return
	var line: Array=story_queue.pop_front()
	say(line[0],line[1],[{"text":"Continue","call":_next_story}])

func say(title: String, line: String, choices: Array = []) -> void:
	close_dialogue()
	dialogue=_panel(Vector2(5,117),Vector2(374,95))
	_label(dialogue,title,Vector2(9,5),Vector2(350,16),10)
	_label(dialogue,line,Vector2(10,24),Vector2(350,43),10)
	if choices.is_empty(): choices=[{"text":"Continue","call":close_dialogue}]
	for i in choices.size():
		var button := _choice(dialogue,choices[i].text,Vector2(260-i*120,71),Vector2(108,19),choices[i].call)
		if i==0: button.grab_focus()
	prompt.hide()

func change_room(destination: String) -> void:
	close_dialogue();close_menu()
	if destination in ["center","mart"]:
		outdoor_return=player.position;room=destination
		player.position=Vector3(60 if room=="center" else 90,0,2.6)
	else:
		room="town";player.position=outdoor_return if outdoor_return!=Vector3.ZERO else Map.point(Vector2i(11,7))
	_reset_follow();_apply_light();_update_camera()
	if location!=null: location.text="HEALING INN" if room=="center" else ("LARKHAVEN / SHOP" if room=="mart" else world_map.area(player.position).to_upper())
	save_progress()

func enter_battle() -> void:
	if room!="town" or player.position.distance_to(creature.position)>2.4: return
	begin_encounter("",selected)

func begin_encounter(who: String, sid: String) -> void:
	if not active or _modal() or not profile.state.started: return
	if who!="" and chapter[who]: return
	encounter_trainer=who;previous_wild=selected
	profile.state.encounters=mini(999999,int(profile.state.encounters)+1)
	save_progress();return_position=player.position;active=false;ui.hide()
	battle=OpeningBattle.new();battle.pack=pack;battle.supplies=supplies;battle.opponent_id=sid;battle.can_store=profile.room_for_capture()
	battle.trainer_name=who.capitalize()
	battle.return_to_world.connect(_return)
	var layer := CanvasLayer.new();layer.name="BattleOverlay";add_child(layer);layer.add_child(battle)

func _return(result: String) -> void:
	if battle==null or battle.model.state!="ended" or result!=battle.model.result: return
	var who := encounter_trainer
	if who!="" and result=="won": chapter[who]=true
	super._return(result)
	room="town"
	if result=="lost": player.position=Map.point(Vector2i(4,5))
	if who!="": selected=previous_wild
	encounter_trainer="";_reset_follow();_apply_light();_update_camera();save_progress()
	if who!="" and result=="won": tell(Map.SOURCE.SCENES.rival1Win.slice(0,2) if who=="wren" else Map.SOURCE.MAPS.thornwood_route.npcs[0].trainer.win)

func _apply_light() -> void:
	super._apply_light()
	if is_instance_valid(outdoors): outdoors.visible=room not in ["center","mart"]
	if creature!=null: creature.visible=room not in ["center","mart"]

func _process(dt: float) -> void:
	super._process(dt)
	if player==null or location==null: return
	hint.visible=active and not _modal()
	if room=="town":
		var area := world_map.area(player.position)
		if area!=last_area: location.text=area.to_upper();last_area=area
		for i in rain_nodes.size():
			if rain_nodes[i].position.distance_to(player.position)>15: rain_nodes[i].position=player.position+Vector3(sin(i*2.3)*8,4+fposmod(i*.3,4),cos(i*1.3)*7)

func show_journey() -> void:
	_detail("LARKHAVEN / FIRST OUTING")
	_label(detail,"Maren: %s\nNew partner: %s\nInn visit: %s\nSafe return: %s\n\nWren: %s\nBram: %s\n\nNorth: Thornwood\nWest: Millgrass Lane\nEast: Dewcut Approach" % ["Met" if chapter.met_maren else "Waiting","Caught" if profile.state.first_catch else "Not yet","Rested" if profile.state.healed_after_catch else "Not yet","Complete" if chapter.reported else "Return to Maren","Won" if chapter.wren else "Ready","Won" if chapter.bram else "Ready"],Vector2(12,32),Vector2(210,128),9)


func save_progress() -> bool:
	var ok := super.save_progress()
	_goal_hint()
	return ok

func _update_items() -> void:
	for id in item_nodes: item_nodes[id].visible=id not in chapter.items

func _build_ui() -> void:
	super._build_ui()
	_choice(ui,"Map [Tab]",Vector2(228,5),Vector2(74,20),open_map)

func open_map() -> void:
	if not active or _modal() or not profile.state.started: return
	toggle_menu()
	show_map()

func show_map() -> void:
	_detail("LARKHAVEN / LOCAL MAP")
	var view := preload("res://tests/opening/map_view.gd").new()
	view.world_map=world_map;view.player_at=outdoor_return if room in ["center","mart"] else player.position
	view.position=Vector2(8,29);view.size=Vector2(219,132);view.mouse_filter=Control.MOUSE_FILTER_IGNORE
	detail.add_child(view)

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode==KEY_TAB and not _modal():
		open_map();get_viewport().set_input_as_handled();return
	super._unhandled_key_input(event)

func _make_room(origin: float, kind: String) -> void:
	super._make_room(origin,kind)
	for child in get_children():
		if child is Label3D and absf(child.position.x-origin)<1 and child.text in ["PARTNER CENTER","TOWN MART"]:
			child.text="HEALING INN" if kind=="center" else "LARKHAVEN SHOP"

func heal_party() -> void:
	super.heal_party()
	say("HEALING INN","Your partners are fully restored. Take care out there!")
