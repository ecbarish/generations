extends RefCounted
## Painted creatures, looked up by species id (EVO-1).
## A file is res://assets/creatures/<id>_side_<pose>.png. An animated pose is one row of equal-width
## frames, left to right. The idle sheet's width is one frame; walk is four of those frames.
## Art faces left. Pass facing_right to flip it. Feet sit on the bottom row; `foot` is that point,
## bottom centre. `scale` is screen pixels per sprite pixel (1 in the world, so a 16px creature stays 16px).
## Tidewyrm's crawl and crawl_idle sheets are provisional. Walking asks for "walk", never "crawl".
## No PNG: try_draw returns false and the caller draws the procedural figure in figures.gd, unchanged.

const Figures := preload("res://scripts/figures.gd")
const ROOT := "res://assets/creatures/"

static var _tex: Dictionary = {}

static func _file(species_id: String, pose: String) -> String:
	return "%s%s_side_%s.png" % [ROOT, species_id, pose]

static func texture(species_id: String, pose: String) -> Texture2D:
	var key := species_id + "/" + pose
	if _tex.has(key):
		return _tex[key]
	var path := _file(species_id, pose)
	var tex: Texture2D = null
	if ResourceLoader.exists(path):
		tex = load(path)
	_tex[key] = tex
	return tex

static func has(species_id: String) -> bool:
	return texture(species_id, "idle") != null

## One frame's pixel size. The matching idle sheet (crawl_idle for the crawl poses) gives the frame width.
static func frame_size(species_id: String, pose: String) -> Vector2i:
	var tex := texture(species_id, pose)
	if tex == null:
		return Vector2i.ZERO
	var idle_pose := "crawl_idle" if pose.begins_with("crawl") else "idle"
	var idle := texture(species_id, idle_pose)
	var fw := tex.get_width()
	if idle != null and idle.get_width() > 0 and tex.get_width() % idle.get_width() == 0:
		fw = idle.get_width()
	return Vector2i(fw, tex.get_height())

static func frame_count(species_id: String, pose: String) -> int:
	var tex := texture(species_id, pose)
	var sz := frame_size(species_id, pose)
	if tex == null or sz.x <= 0:
		return 0
	return tex.get_width() / sz.x

## Whole sprite pixels only. The largest whole scale that fits in `box`, and never above `cap`.
## At least 1. A sprite that cannot shrink to the box stays 1x and overflows, rather than drawing at a fraction.
static func fit_scale(sz: Vector2i, box: Vector2, cap: float) -> float:
	if sz.x <= 0 or sz.y <= 0:
		return 1.0
	var fit := minf(cap, minf(box.x / float(sz.x), box.y / float(sz.y)))
	return float(maxi(1, int(floor(fit))))

## Draw the painted sprite. Returns false when this species has no PNG, so the caller keeps figures.gd.
## `scale` is whole screen pixels per sprite pixel.
static func try_draw(ci: CanvasItem, species_id: String, foot: Vector2, facing_right: bool, pose: String, frame: int, scale: float = 1.0, fade: float = 0.0, gear: String = "") -> bool:
	var use := pose
	var tex := texture(species_id, use)
	if tex == null and use != "idle":
		use = "idle"
		tex = texture(species_id, use)
	if tex == null:
		return false
	var sz := frame_size(species_id, use)
	var count := maxi(1, int(tex.get_width() / sz.x))
	var i := posmod(frame, count)
	var src := Rect2(i * sz.x, 0, sz.x, sz.y)
	var dest_w := float(sz.x) * scale
	var dest_h := float(sz.y) * scale
	var origin := foot - Vector2(dest_w * 0.5, dest_h)
	var prev := ci.texture_filter
	ci.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var dest := Rect2(origin, Vector2(dest_w, dest_h))
	if facing_right:
		dest.position.x += dest.size.x
		dest.size.x = -dest.size.x
	if fade > 0.001:
		ci.draw_texture_rect(_washed(tex, Rect2i(i * sz.x, 0, sz.x, sz.y), fade), dest, false)
	else:
		ci.draw_texture_rect_region(tex, dest, src)
	if gear != "":
		_paint_gear(ci, gear, origin, sz, scale, facing_right)
	ci.texture_filter = prev
	return true

## The same wash as the faded world (shaders/fade.gdshader and main.gd _faded_look), for a sprite drawn
## on the colour layer where that shader does not run. Built once per frame of art and fade step, then reused.
const _WASH_STEPS := 32
static var _wash: Dictionary = {}

static func _washed(tex: Texture2D, region: Rect2i, amount: float) -> Texture2D:
	var step := clampi(int(round(clampf(amount, 0.0, 1.0) * float(_WASH_STEPS))), 0, _WASH_STEPS)
	var key := "%d|%d|%d|%d|%d|%d" % [tex.get_instance_id(), region.position.x, region.position.y, region.size.x, region.size.y, step]
	if _wash.has(key):
		return _wash[key]
	var img := tex.get_image().get_region(region)
	var fade := 0.78 * (float(step) / float(_WASH_STEPS))
	for y in img.get_height():
		for x in img.get_width():
			var c := img.get_pixel(x, y)
			if c.a <= 0.0:
				continue
			var g := c.r * 0.299 + c.g * 0.587 + c.b * 0.114
			img.set_pixel(x, y, Color(lerpf(c.r, g * 1.03, fade), lerpf(c.g, g, fade), lerpf(c.b, g * 0.92, fade), c.a))
	var made := ImageTexture.create_from_image(img)
	_wash[key] = made
	return made

## The same gear marks as figures.gd, fitted to the sprite's body so a bell or a harness still shows.
static func _paint_gear(ci: CanvasItem, gear: String, origin: Vector2, sz: Vector2i, scale: float, facing_right: bool) -> void:
	var body := [0, int(float(sz.y) * 0.25), sz.x, maxi(1, int(float(sz.y) * 0.5)), Color.WHITE]
	var parts: Array = Figures._gear_parts([body], gear)
	var box_w := int(round(float(sz.x) * scale))
	for p in parts:
		p[0] = int(round(float(p[0]) * scale))
		p[1] = int(round(float(p[1]) * scale))
		p[2] = maxi(1, int(round(float(p[2]) * scale)))
		p[3] = maxi(1, int(round(float(p[3]) * scale)))
		if facing_right:
			p[0] = box_w - p[0] - p[2]
	Figures.paint(ci, origin, parts)
