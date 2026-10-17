extends RefCounted
const Town := preload("res://tests/town/scene.gd")

static func run(tree: SceneTree, check: Callable, private_pack: bool = false) -> void:
	var town := Town.new()
	town.pack_path=town.Pack.configured_root() if private_pack else "Z:/no-private-pack"
	tree.root.add_child(town)
	await tree.process_frame
	check.call(town.room=="town" and town.places.size()==5,"town has center, mart, two homes and trail")
	check.call(town.props.size()>40 and town.fountain!=null,"town reuses 3D landscaping around original buildings")
	check.call(town._blocked(Vector3(-7,0,-5)) and town._blocked(Vector3(7,0,-5)),"building walls block walking")
	check.call(town._blocked(Vector3(0,0,-3)),"fountain blocks walking")
	check.call(not town._blocked(Vector3(-7,0,-1.4)),"center doorstep is reachable")
	var before: Vector3=town.player.position
	town.move_player(Vector2.UP,.2)
	check.call(town.player.position.z<before.z,"town movement works")
	town.player.position=Vector3(-7,0,-1.4)
	town.interact()
	check.call(town.room=="center" and town.player.position==Vector3(60,0,2.6),"center door enters cutaway interior")
	check.call(town._blocked(Vector3(60,0,-1.5)) and not town._blocked(Vector3(60,0,1)),"counter blocks walking but lobby stays open")
	town.player.position=Vector3(60,0,.5)
	town.supplies.team[0].hp=1
	town.supplies.team[0].status="poison"
	town.supplies.team[0].stages={"power":-2}
	var move_id: String=town.supplies.team[0].moves[0]
	town.supplies.team[0].pp[move_id]=0
	town.interact()
	check.call(town.dialogue!=null,"healing requires an interaction choice")
	town.heal_party()
	check.call(town.supplies.team[0].hp==town.supplies.team[0].max_hp and town.supplies.team[0].status=="","center restores HP and clears status")
	check.call(town.supplies.team[0].pp[move_id]>0 and town.supplies.team[0].stages.is_empty(),"center restores move PP and clears stages")
	check.call(town.heal_time>0,"healing station animation begins")
	town.close_dialogue()
	town.player.position.z=3
	town.interact()
	check.call(town.room=="town" and town.player.position==Vector3(-7,0,-1.4),"center exit restores exact doorstep")
	town.player.position=Vector3(7,0,-1.4)
	town.interact()
	check.call(town.room=="mart","mart door enters its own interior")
	town.player.position=Vector3(90,0,.7)
	town.interact()
	check.call(town.dialogue!=null,"mart counter opens prices and wallet")
	var berries: int=town.supplies.berries
	var balls: int=town.supplies.lures
	town.buy("berry")
	check.call(town.coins==260 and town.supplies.berries==berries+1,"berry purchase charges price and adds bag stock")
	town.buy("ball")
	check.call(town.coins==185 and town.supplies.lures==balls+1,"ball purchase charges price and adds bag stock")
	town.coins=0
	town.buy("ball")
	check.call(town.coins==0 and town.supplies.lures==balls+1,"insufficient funds cannot create stock or negative balance")
	town.change_room("town")
	check.call(town.player.position==Vector3(7,0,-1.4),"mart exit restores exact doorstep")
	town.toggle_menu()
	town.show_party()
	check.call(town.menu!=null and town.detail!=null,"pause menu shows party health")
	before=town.player.position
	var key := InputEventKey.new()
	key.keycode=KEY_W
	key.physical_keycode=KEY_W
	key.pressed=true
	Input.parse_input_event(key)
	await tree.process_frame
	check.call(town.player.position==before,"pause menu stops exploration movement")
	key=key.duplicate()
	key.pressed=false
	Input.parse_input_event(key)
	town.show_map()
	town.show_options()
	check.call(town.detail!=null,"map and weather pages replace detail panel")
	town.close_menu()
	town.player.position=Vector3(-7,0,-9)
	var building: Node3D=town.occluders[0]
	town._process(.4)
	check.call(building.get_meta("meshes")[0].transparency>.5,"buildings fade when they obscure the player behind them")
	town.player.position=before
	town.open_bag()
	check.call(town.bag!=null,"town bag uses the shared visit inventory")
	town.close_bag()
	town.set_rain(true)
	town.change_room("center")
	check.call(not town.rain_nodes[0].visible,"rain stays outside clinic")
	check.call(not town.town_ground.visible and town.environment.background_mode==Environment.BG_COLOR,"interior hides distant ground and uses a clean backdrop")
	town.change_room("town")
	check.call(town.rain_nodes[0].visible,"return outside restores rain")
	town.set_rain(false)
	town.player.position=Vector3(0,0,12)
	town.interact()
	check.call(town.room=="trail" and town.player.position==Vector3(120,0,5),"town route reaches a walkable trail")
	town.player.position=Vector3(122,0,-2)
	before=town.player.position
	town.interact()
	await tree.process_frame
	check.call(town.battle!=null and not town.active,"trail encounter opens existing turn-based battle")
	if town.battle!=null:
		town.battle.sounds.on=false
		town.battle._act({"kind":"run"})
		while not town.battle.event.is_empty(): town.battle._continue()
		town.battle.return_to_world.emit(town.battle.model.result)
		await tree.process_frame
	check.call(town.active and town.room=="trail" and town.player.position==before,"battle return keeps exact trail position")
	town.player.position=Vector3(120,0,7)
	town.interact()
	check.call(town.room=="town" and town.player.position==Vector3(0,0,12),"trail returns to town sign")
	for child in town.ui.get_children():
		if child is Control and child.visible:
			if child.position.x+child.size.x>384 or child.position.y+child.size.y>216: print("Town UI bounds: ",child.name," ",child.position," ",child.size)
			check.call(child.position.x>=0 and child.position.y>=0 and child.position.x+child.size.x<=384 and child.position.y+child.size.y<=216,"town overlay remains inside logical viewport")
	if private_pack: check.call(town.pack.trainer_texture(false)!=null and town.pack.trainer_texture(true)!=null,"installed private trainer supplies walking and running")
	town.Art.cache.clear()
	town.queue_free()
	await tree.process_frame
	await tree.process_frame
