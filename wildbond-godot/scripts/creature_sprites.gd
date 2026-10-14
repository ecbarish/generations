extends RefCounted
## Painted creatures, looked up by species id (EVO-1).
## A file is res://assets/creatures/<id>_side_<pose>.png. An animated pose is one row of equal-width
## frames, left to right. The idle sheet's width is one frame; walk is four of those frames.
## Art faces left. Pass facing_right to flip it in place. Feet sit on the bottom row; `foot` is that
## point, bottom centre, and a flip does not move it. `scale` is screen pixels per sprite pixel
## (1 in the world, so a 16px creature stays 16px).
## Tidewyrm's crawl and crawl_idle sheets are provisional. Walking asks for "walk", never "crawl".
## No PNG: try_draw returns false and the caller draws the procedural figure in figures.gd, unchanged.
## A battle front is a separate file, res://assets/creatures/battle/<id>_battle_front.png.
## The battle uses that when it exists. The world keeps the side sheets.

const Figures := preload("res://scripts/figures.gd")
const ROOT := "res://assets/creatures/"
## A finished battle painting lives beside the walk cycles, named only by the species id.
## Game Art Director can replace the file (Mosshog's is temporary) without a code change.
const BATTLE_DIR := "res://assets/creatures/battle/"
## The handed-over fronts are already 64×64. One screen pixel per sprite pixel stays on the grid.
const BATTLE_FRONT_SCALE := 1.0

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

## res://assets/creatures/battle/<id>_battle_front.png. Nothing else is consulted.
static func battle_file(species_id: String) -> String:
	return "%s%s_battle_front.png" % [BATTLE_DIR, species_id]

static func battle_texture(species_id: String) -> Texture2D:
	var key := "battle/" + species_id
	if _tex.has(key):
		return _tex[key]
	var path := battle_file(species_id)
	var tex: Texture2D = null
	if ResourceLoader.exists(path):
		tex = load(path)
	_tex[key] = tex
	return tex

static func has_battle_front(species_id: String) -> bool:
	return battle_texture(species_id) != null

static func battle_size(species_id: String) -> Vector2i:
	var tex := battle_texture(species_id)
	if tex == null:
		return Vector2i.ZERO
	return Vector2i(tex.get_width(), tex.get_height())

## Whole sprite pixels only, and at least 1. A fraction would smear the outline.
static func whole_scale(scale: float) -> float:
	return float(maxi(1, int(floor(scale))))

## The rectangle a battle front covers. Facing right mirrors it in place, so the feet stay put.
static func battle_dest(foot: Vector2, sz: Vector2i, scale: float, facing_right: bool) -> Rect2:
	var dest := dest_rect(foot, sz, whole_scale(scale))
	if facing_right:
		dest.size.x = -dest.size.x
	return dest

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

## The rectangle a sprite covers when its feet stand on `foot`. Bottom centre stays on `foot`.
static func dest_rect(foot: Vector2, sz: Vector2i, scale: float) -> Rect2:
	var w := float(sz.x) * scale
	var h := float(sz.y) * scale
	return Rect2(foot - Vector2(w * 0.5, h), Vector2(w, h))

## Shift `foot` until the sprite is `gap` pixels clear of every panel. Scale is left alone.
## A side panel slides the sprite aside. A bar under the feet, such as the command box, lifts
## them to a whole pixel. The sprite is never drawn smaller.
static func foot_clear_of(foot: Vector2, sz: Vector2i, scale: float, panels: Array, gap: float) -> Vector2:
	if sz.x <= 0 or sz.y <= 0 or scale <= 0.0:
		return foot
	for _step in 4:
		var rect := dest_rect(foot, sz, scale)
		var moved := false
		for panel in panels:
			var box: Rect2 = panel
			var keep := box.grow(gap)
			if not rect.intersects(keep):
				continue
			var hit := rect.intersection(keep)
			if hit.size.x <= 0.0 or hit.size.y <= 0.0:
				continue
			var spans_the_sprite := hit.size.x + 0.5 >= rect.size.x
			var clips_the_feet := hit.position.y >= rect.position.y + rect.size.y * 0.5
			if spans_the_sprite and clips_the_feet:
				var lifted: float = floor(keep.position.y)
				if foot.y <= lifted:
					continue
				foot.y = lifted
			elif foot.x <= keep.get_center().x:
				foot.x = floor(foot.x - hit.size.x)
			else:
				foot.x = ceil(foot.x + hit.size.x)
			rect = dest_rect(foot, sz, scale)
			moved = true
		if not moved:
			break
	return foot

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
	var dest := dest_rect(foot, sz, scale)
	var origin := dest.position
	var prev := ci.texture_filter
	ci.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	# Godot flips a negative width in place and does not move the rect. Adding the width to
	# position first would step the creature off its feet by a whole sprite.
	if facing_right:
		dest.size.x = -dest.size.x
	if fade > 0.001:
		ci.draw_texture_rect(_washed(tex, Rect2i(i * sz.x, 0, sz.x, sz.y), fade), dest, false)
	else:
		ci.draw_texture_rect_region(tex, dest, src)
	if gear != "":
		_paint_gear(ci, gear, origin, sz, scale, facing_right)
	ci.texture_filter = prev
	return true

## The battle painting, when this species has one. Nearest filtering, whole pixels, feet on `foot`.
## Returns false when the file is missing, so the caller keeps the overworld sheet or the figure.
static func try_draw_battle(ci: CanvasItem, species_id: String, foot: Vector2, facing_right: bool, scale: float = BATTLE_FRONT_SCALE, gear: String = "") -> bool:
	var tex := battle_texture(species_id)
	if tex == null:
		return false
	var sz := Vector2i(tex.get_width(), tex.get_height())
	var whole := whole_scale(scale)
	var dest := battle_dest(foot, sz, whole, facing_right)
	var origin := dest_rect(foot, sz, whole).position
	var prev := ci.texture_filter
	ci.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	ci.draw_texture_rect_region(tex, dest, Rect2(0, 0, sz.x, sz.y))
	if gear != "":
		_paint_gear(ci, gear, origin, sz, whole, facing_right)
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
