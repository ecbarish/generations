extends "res://tests/environment_sample/scene.gd"
const Spacious := preload("res://tests/opening_space/map.gd")
var compact := false
func _init() -> void:
    compact="--compact" in OS.get_cmdline_user_args()
    world_map=Spacious.new()
    if not compact:sample_views=[Vector2i(11,19),Vector2i(9,10),Vector2i(24,10),Vector2i(11,-4),Vector2i(6,-15)]
func _building(at: Vector3, dims: Vector2, roof_color: Color, title: String, kind: String) -> void:
    super._building(Map.point(Spacious.BUILDINGS[kind]) if not compact and Spacious.BUILDINGS.has(kind) else at,dims,roof_color,title,kind)
func _npc(who: String, at: Vector3) -> void:
    super._npc(who,Map.point(Spacious.ANCHORS[who]) if not compact and Spacious.ANCHORS.has(who) else at)
func _build_world() -> void:
    super._build_world()
    if compact:return
    for place in places:
        if Spacious.ANCHORS.has(place.kind):place.at=Map.point(Spacious.ANCHORS[place.kind])
    item_nodes.lh1.position=Map.point(Spacious.ANCHORS.item_lh1)
    # Low planting marks the yards while retaining the camera's open approach views.
    for cell in [Vector2i(2,6),Vector2i(-2,6),Vector2i(3,19),Vector2i(7,21),Vector2i(22,7),Vector2i(26,7)]:
        var plant := _prop("flower_purpleA",Map.point(cell),.27)
        plant.reparent(outdoors,true)
func _update_camera() -> void:
    super._update_camera()
    if not compact and camera!=null and room=="town":
        camera.position=player.position+Vector3(0,10.5,12.6)
        camera.look_at(player.position+Vector3(0,.25,-2.6))
        camera.fov=47
func _nearest() -> Dictionary:
    if not compact and room=="town":
        # The inherited six-metre building fade and nearest-anchor interaction follow the new positions.
        for place in places:
            if place.kind=="paddock" and place.at.distance_to(player.position)<1.7:return place
    return super._nearest()
