extends "res://tests/opening_space/scene.gd"
var hard_edges := false
var path_image: Image
var ground_blend: ShaderMaterial
func _init() -> void:
    super()
    hard_edges="--hard-edges" in OS.get_cmdline_user_args()
func _build_world() -> void:
    super._build_world()
    if hard_edges:return
    var low := Vector2i(999,999)
    var high := Vector2i(-999,-999)
    for cell in world_map.cells:
        low=low.min(cell);high=high.max(cell)
    var dims := high-low+Vector2i.ONE
    path_image=Image.create(dims.x,dims.y,false,Image.FORMAT_R8)
    for cell in world_map.cells:
        path_image.set_pixelv(cell-low,Color.WHITE if world_map.glyph(cell) in [".","D"] else Color.BLACK)
    ground_blend=ShaderMaterial.new()
    ground_blend.shader=preload("res://tests/soft_ground/ground.gdshader")
    ground_blend.set_shader_parameter("path_mask",ImageTexture.create_from_image(path_image))
    ground_blend.set_shader_parameter("cell_min",Vector2(low))
    ground_blend.set_shader_parameter("mask_size",Vector2(dims))
    ground_blend.set_shader_parameter("grass_tint",Color("708b55").srgb_to_linear())
    ground_blend.set_shader_parameter("dirt_tint",Color("b4a081").srgb_to_linear())
    for child in outdoors.get_children():
        if child is MultiMeshInstance3D:child.material_override=ground_blend
