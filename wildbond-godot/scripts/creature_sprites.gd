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
## The bonded tamer is drawn at twice the person sheet. The shoes end on source row 19.
const TAMER_SCALE := 2.0
const TAMER_SRC_W := 12
const TAMER_FEET := 19
const TAMER_SEAT := 6.0

static var _tex: Dictionary = {}
static var _ink: Dictionary = {}

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

## res://assets/creatures/battle/<id>_battle_back.png. The player's own creature uses it, facing the foe.
static func battle_back_file(species_id: String) -> String:
	return "%s%s_battle_back.png" % [BATTLE_DIR, species_id]

static func battle_back_texture(species_id: String) -> Texture2D:
	var key := "battle-back/" + species_id
	if _tex.has(key):
		return _tex[key]
	var path := battle_back_file(species_id)
	var tex: Texture2D = null
	if ResourceLoader.exists(path):
		tex = load(path)
	_tex[key] = tex
	return tex

static func has_battle_back(species_id: String) -> bool:
	return battle_back_texture(species_id) != null

static func battle_back_size(species_id: String) -> Vector2i:
	var tex := battle_back_texture(species_id)
	if tex == null:
		return Vector2i.ZERO
	return Vector2i(tex.get_width(), tex.get_height())

## Opaque pixels of one frame. Empty art falls back to the whole frame. Cached per texture and region.
static func ink_box(tex: Texture2D, region: Rect2i = Rect2i()) -> Rect2i:
	if tex == null:
		return Rect2i()
	var reg := region
	if reg.size.x <= 0 or reg.size.y <= 0:
		reg = Rect2i(0, 0, tex.get_width(), tex.get_height())
	var key := "%d|%d|%d|%d|%d" % [tex.get_instance_id(), reg.position.x, reg.position.y, reg.size.x, reg.size.y]
	if _ink.has(key):
		return _ink[key]
	var img := tex.get_image()
	var box := Rect2i(0, 0, reg.size.x, reg.size.y)
	if img != null:
		var slice := img.get_region(reg)
		var min_x := slice.get_width()
		var min_y := slice.get_height()
		var max_x := -1
		var max_y := -1
		for y in slice.get_height():
			for x in slice.get_width():
				if slice.get_pixel(x, y).a > 0.0:
					min_x = mini(min_x, x)
					min_y = mini(min_y, y)
					max_x = maxi(max_x, x)
					max_y = maxi(max_y, y)
		if max_x >= min_x and max_y >= min_y:
			box = Rect2i(min_x, min_y, max_x - min_x + 1, max_y - min_y + 1)
	_ink[key] = box
	return box

## Gear sits on the visible body: the middle half of the ink, across its full width.
## A sprite that fills the frame keeps the old band. A small figure does not wear the gear on empty canvas.
static func gear_band(tex: Texture2D, region: Rect2i, sz: Vector2i) -> Rect2i:
	var ink := ink_box(tex, region) if tex != null else Rect2i(0, 0, sz.x, sz.y)
	if ink.size.x <= 0 or ink.size.y <= 0:
		ink = Rect2i(0, 0, maxi(1, sz.x), maxi(1, sz.y))
	var top := ink.position.y + int(floor(float(ink.size.y) * 0.25))
	var h := maxi(1, int(floor(float(ink.size.y) * 0.5)))
	return Rect2i(ink.position.x, top, maxi(1, ink.size.x), h)

## Where the tamer sits on a battle sprite: on the back, feet a few pixels under the ink
## in the tamer's own columns. A tall spike at the chest does not lift that seat.
## `mirrored` is a front that was flipped to face right. A back sprite is not mirrored.
static func tamer_anchor(foot: Vector2, sz: Vector2i, scale: float, tex: Texture2D, mirrored: bool) -> Vector2:
	var whole := whole_scale(scale)
	var dest := dest_rect(foot, sz, whole)
	var ink := ink_box(tex)
	if ink.size.x <= 0 or ink.size.y <= 0:
		ink = Rect2i(0, 0, sz.x, sz.y)
	var back_x := dest.position.x + (float(sz.x - ink.position.x - ink.size.x) if mirrored else float(ink.position.x)) * whole
	var anchor_x := back_x + 6.0
	var line := _column_ink_top(tex, dest, sz, whole, mirrored, anchor_x, anchor_x + float(TAMER_SRC_W) * TAMER_SCALE)
	return Vector2(anchor_x, line + TAMER_SEAT - float(TAMER_FEET) * TAMER_SCALE)

## The highest opaque pixel under the tamer's columns, in view space. Empty columns use the ink box.
static func _column_ink_top(tex: Texture2D, dest: Rect2, sz: Vector2i, whole: float, mirrored: bool, view_left: float, view_right: float) -> float:
	var fallback := dest.position.y
	var ink := ink_box(tex)
	if ink.size.y > 0:
		fallback = dest.position.y + float(ink.position.y) * whole
	if tex == null or whole <= 0.0 or sz.x <= 0:
		return fallback
	var img := tex.get_image()
	if img == null:
		return fallback
	var x0 := int(floor((view_left - dest.position.x) / whole))
	var x1 := int(ceil((view_right - dest.position.x) / whole)) - 1
	x0 = clampi(x0, 0, sz.x - 1)
	x1 = clampi(x1, 0, sz.x - 1)
	if x1 < x0:
		var swap := x0
		x0 = x1
		x1 = swap
	var best := -1
	var limit := mini(img.get_height(), sz.y)
	for vx in range(x0, x1 + 1):
		var sx := (sz.x - 1 - vx) if mirrored else vx
		if sx < 0 or sx >= img.get_width():
			continue
		for y in limit:
			if img.get_pixel(sx, y).a > 0.0:
				if best < 0 or y < best:
					best = y
				break
	if best < 0:
		return fallback
	return dest.position.y + float(best) * whole

## The pixel the bell hangs from: the first opaque pixel on the chest side of the band's lowest row that has ink.
## Fronts face left in the file, so the chest is the low x. Backs face right.
static func bell_hook(tex: Texture2D, region: Rect2i, sz: Vector2i, chest_right: bool) -> Vector2i:
	var band := gear_band(tex, region, sz)
	var img := _frame_image(tex, region)
	var y1 := band.position.y + band.size.y - 1
	var y0 := band.position.y
	for y in range(y1, y0 - 1, -1):
		if chest_right:
			for x in range(band.position.x + band.size.x - 1, band.position.x - 1, -1):
				if _pixel_opaque(img, x, y):
					return Vector2i(x, y)
		else:
			for x in range(band.position.x, band.position.x + band.size.x):
				if _pixel_opaque(img, x, y):
					return Vector2i(x, y)
	var edge := band.position.x + band.size.x - 1 if chest_right else band.position.x
	return Vector2i(edge, y1)

## Gear marks in source pixels, cut so every mark sits on an opaque pixel.
## A bell is a strap and a 2×2 that include the chest hook, so the mask cannot erase the contact.
static func gear_marks(tex: Texture2D, region: Rect2i, sz: Vector2i, gear: String, chest_right: bool) -> Array:
	var band := gear_band(tex, region, sz)
	var parts: Array = []
	if gear == "bell":
		var hook := bell_hook(tex, region, sz, chest_right)
		var strap_x := hook.x - 2 if chest_right else hook.x
		var bell_x := hook.x - 1 if chest_right else hook.x
		parts = [
			[strap_x, hook.y, 3, 1, Color("6a4a2a"), false],
			[bell_x, hook.y, 2, 2, Color("f2d080")],
		]
	else:
		var body := [band.position.x, band.position.y, band.size.x, band.size.y, Color.WHITE]
		parts = Figures._gear_parts([body], gear)
	if tex != null:
		parts = _mask_gear(parts, tex, region)
	return parts

static func _frame_image(tex: Texture2D, region: Rect2i) -> Image:
	if tex == null:
		return null
	var img := tex.get_image()
	if img == null:
		return null
	if region.size.x > 0 and region.size.y > 0:
		return img.get_region(region)
	return img

static func _pixel_opaque(img: Image, x: int, y: int) -> bool:
	if img == null:
		return true
	if x < 0 or y < 0 or x >= img.get_width() or y >= img.get_height():
		return false
	return img.get_pixel(x, y).a > 0.0

## Keep only the source pixels that land on the creature. Painted gear has no outline, so the outline cannot hang in the gap.
static func _mask_gear(parts: Array, tex: Texture2D, region: Rect2i) -> Array:
	var img := _frame_image(tex, region)
	var out: Array = []
	for p in parts:
		var x0: int = int(p[0])
		var y0: int = int(p[1])
		var w: int = int(p[2])
		var h: int = int(p[3])
		var col: Color = p[4]
		for y in range(y0, y0 + h):
			var run := -1
			for x in range(x0, x0 + w + 1):
				var on := x < x0 + w and _pixel_opaque(img, x, y)
				if on and run < 0:
					run = x
				elif not on and run >= 0:
					out.append([run, y, x - run, 1, col, false])
					run = -1
	return out

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
		_paint_gear(ci, gear, origin, sz, scale, facing_right, tex, Rect2i(i * sz.x, 0, sz.x, sz.y))
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
		_paint_gear(ci, gear, origin, sz, whole, facing_right, tex, Rect2i(0, 0, sz.x, sz.y))
	ci.texture_filter = prev
	return true

## The back view, when this species has one. It already faces the foe, so it is not mirrored.
static func try_draw_battle_back(ci: CanvasItem, species_id: String, foot: Vector2, scale: float = BATTLE_FRONT_SCALE, gear: String = "") -> bool:
	var tex := battle_back_texture(species_id)
	if tex == null:
		return false
	var sz := Vector2i(tex.get_width(), tex.get_height())
	var whole := whole_scale(scale)
	var dest := dest_rect(foot, sz, whole)
	var prev := ci.texture_filter
	ci.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	ci.draw_texture_rect_region(tex, dest, Rect2(0, 0, sz.x, sz.y))
	if gear != "":
		_paint_gear(ci, gear, dest.position, sz, whole, false, tex, Rect2i(0, 0, sz.x, sz.y), true)
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

## The same gear marks as figures.gd, fitted to the visible body. A bell hangs from the chest pixel, and every mark is masked to ink.
## `chest_right` is which way the file faces. `facing_right` flips a front after the marks are placed.
static func _paint_gear(ci: CanvasItem, gear: String, origin: Vector2, sz: Vector2i, scale: float, facing_right: bool, tex: Texture2D = null, region: Rect2i = Rect2i(), chest_right: bool = false) -> void:
	var parts: Array = gear_marks(tex, region, sz, gear, chest_right)
	var box_w := int(round(float(sz.x) * scale))
	for p in parts:
		p[0] = int(round(float(p[0]) * scale))
		p[1] = int(round(float(p[1]) * scale))
		p[2] = maxi(1, int(round(float(p[2]) * scale)))
		p[3] = maxi(1, int(round(float(p[3]) * scale)))
		if facing_right:
			p[0] = box_w - p[0] - p[2]
	Figures.paint(ci, origin, parts)
