extends Node3D
## Private visual role only. Original character identity and interactions stay in the scene.
const Motion := preload("res://tests/private_sprites/actor_motion.gd")
var pack: RefCounted
var role := ""
var who := ""
var home := Vector3.ZERO
var pace := false
var phase_offset := 0.0
var gait := Motion.new()
var body := Sprite3D.new()
var atlas := AtlasTexture.new()
var last_frame := -1
func configure(source: RefCounted, visual_role: String, identity: String, at: Vector3, pacing: bool, phase: float) -> void:
	pack=source;role=visual_role;who=identity;home=at;position=at;pace=pacing and bool(source.npcs[visual_role].walks);phase_offset=phase
	body.billboard=BaseMaterial3D.BILLBOARD_ENABLED
	body.texture_filter=BaseMaterial3D.TEXTURE_FILTER_NEAREST
	body.alpha_cut=SpriteBase3D.ALPHA_CUT_DISCARD
	body.shaded=false;body.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(body)
	render()
func step(dt: float, clock: float, player_at: Vector3, can_walk: bool, map: RefCounted, bow := false) -> void:
	var before := position
	var near := position.distance_to(player_at)<2.8
	if pace and can_walk and not near:
		var cycle := fposmod(clock+phase_offset,12.0)
		var target := home+Vector3(.32 if cycle>2 and cycle<7 else 0,0,0)
		var proposed := position.move_toward(target,dt*.65)
		if not map.blocked(proposed): position=proposed
	var displacement := position-before
	var intent := player_at-position if near else displacement
	gait.advance(Vector2(intent.x,intent.z),displacement,false)
	render(bow)
func render(bow := false) -> void:
	var frame: Dictionary=pack.npc_frame(role,gait.trainer_frame(),gait.face.x>0,bow)
	if frame.is_empty():body.hide();return
	atlas.atlas=frame.texture;atlas.region=frame.region;body.texture=atlas
	body.pixel_size=frame.pixel_size;body.flip_h=frame.flip
	body.offset=Vector2(frame.region.size.x*.5-frame.anchor.x,frame.anchor.y-frame.region.size.y*.5)
	last_frame=int(frame.frame)
