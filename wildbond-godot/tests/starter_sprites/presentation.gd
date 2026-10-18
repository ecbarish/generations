extends TextureRect
## Reusable, grounded original battle/card portrait. No game state or species substitution.
var art: RefCounted
var identity := ""
var back_view := false
var foot := Vector2.ZERO
var box := Vector2(78,64)
var elapsed := 0.0
var animate := true

func configure(source: RefCounted, name: String, back: bool, at: Vector2, bounds := Vector2(78,64)) -> void:
	art=source;identity=name;back_view=back;foot=at;box=bounds
	if material==null:
		expand_mode=TextureRect.EXPAND_IGNORE_SIZE;stretch_mode=TextureRect.STRETCH_SCALE
		texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST;mouse_filter=Control.MOUSE_FILTER_IGNORE
		material=ShaderMaterial.new();material.shader=preload("res://tests/starter_sprites/battle_pixels.gdshader")
	refresh()

func refresh() -> void:
	if art==null or not art.entries.has(identity):hide();return
	var reference: Dictionary=art.frame(identity,2 if back_view else 0)
	var f: Dictionary=art.battle(identity,back_view,elapsed if animate else 0)
	var scale_factor: float=minf(box.x/reference.region.size.x,box.y/reference.region.size.y)
	texture=f.texture;flip_h=f.flip;size=f.region.size*scale_factor
	var anchor: Vector2=f.anchor
	if flip_h:anchor.x=f.region.size.x-anchor.x
	position=foot-anchor*scale_factor
	material.set_shader_parameter("palette",art.palettes[identity])
	material.set_shader_parameter("source_rect",Vector4(f.region.position.x/texture.get_width(),f.region.position.y/texture.get_height(),f.region.size.x/texture.get_width(),f.region.size.y/texture.get_height()))
	var step: float=reference.region.size.y/64.0
	material.set_shader_parameter("pixel_dims",Vector2(roundf(f.region.size.x/step),roundf(f.region.size.y/step)))

func _process(dt: float) -> void:
	elapsed+=dt;refresh()
