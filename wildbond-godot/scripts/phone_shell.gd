extends Control
## Upright phone: the 384×216 (or narrower) view sits in a Game Boy frame, with a dialogue strip and a
## d-pad / A / B / Menu deck under it. A sideways phone keeps that same view, with a hint band under it
## and a deck on either side. A wide computer window keeps the existing layout. docs/art/wildbond-upright-layout.md

const INK := Color("1e1a22")
const DECK := Color("e6dcc6")
const PAPER := Color("f4eddc")
const SHADOW := Color("cfc4ac")
const SLATE := Color("435a78")
const SLATE_LIT := Color("7290ad")
const SLATE_DIM := Color("33465e")
const A_FACE := Color("ab463a")
const A_LIT := Color("c45e4e")
const A_DIM := Color("8e342c")
const B_FACE := Color("8e342c")
const B_LIT := Color("ab463a")
const B_DIM := Color("6e2620")
const MENU_FACE := Color("8a6444")
const MENU_LIT := Color("a8875a")
const MENU_DIM := Color("6a4a32")
const RING := Color("f2d080")
const HINT := Color("4a3426")
const CREAM := Color("f4eddc")
## #8a6444 on #cfc4ac is about 3:1, under the 4.5:1 line, so disabled words use the darker bark.
const DIM_TEXT := Color("6a4a32")
const TOUCH_HINT := "Use the d-pad to walk. Tap A or the dialogue box to talk and go on. Tap Menu for your party and to save."
## Enough coming turns that two chip lines fill and the rest become +N.
const CHIP_LOOKAHEAD := 12
const Sprites := preload("res://scripts/creature_sprites.gd")
const HowTo := preload("res://scripts/howto.gd")

const DIR_ACTION := {
	Vector2i.LEFT: "move_left",
	Vector2i.RIGHT: "move_right",
	Vector2i.UP: "move_up",
	Vector2i.DOWN: "move_down",
}

static var use_forced := false
static var forced := Vector4.ZERO

var font: Font
var L: Dictionary = {}
var _main: Node
var _host: Control
var _svc: SubViewportContainer
var _sv: SubViewport
var _root: Window
var _saved: Dictionary = {}
var held_action := ""
var held_vec := Vector2i.ZERO
var held_at := 0
var held_moved := false
var tap_dir := Vector2i.ZERO
var finger := -1
var flash := ""
var flash_t := 0.0
var battle_note := ""
var battle_page := 0

func _ready() -> void:
	mouse_filter = MOUSE_FILTER_STOP
	font = _pixel_font()

## The deck's letters are stepped. The fallback font is gray-antialiased, which would put
## blended colours on the buttons that are not in the palette.
static func _pixel_font() -> Font:
	var base := ThemeDB.fallback_font
	if base == null:
		return base
	var copy: Font = base.duplicate()
	copy.antialiasing = TextServer.FONT_ANTIALIASING_NONE
	copy.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED
	return copy

static func wants(win: Vector2) -> bool:
	if win.x < 8.0 or win.y < 8.0:
		return false
	if win.y > win.x * 1.05:
		return win.x <= 900.0
	return side_wants(win)

## A phone held sideways: short edge at most 520, long edge at most 1000. A desktop stays as it is.
static func side_wants(win: Vector2) -> bool:
	if win.x < 8.0 or win.y < 8.0 or win.x <= win.y * 1.05:
		return false
	var short := minf(win.x, win.y)
	var long := maxf(win.x, win.y)
	return short <= 520.0 and long <= 1000.0

static func read_insets() -> Vector4:
	if use_forced:
		return forced
	if OS.has_feature("web"):
		var raw = JavaScriptBridge.eval("typeof wildbondInsets==='function'?wildbondInsets():'0,0,0,0'", true)
		return _parse_insets(str(raw))
	return Vector4.ZERO

static func read_dpr() -> float:
	if OS.has_feature("web"):
		var raw = JavaScriptBridge.eval("typeof wildbondDpr==='function'?wildbondDpr():'1'", true)
		return maxf(1.0, float(str(raw)))
	return 1.0

static func _parse_insets(raw: String) -> Vector4:
	var bits: PackedStringArray = raw.split(",")
	if bits.size() < 4:
		return Vector4.ZERO
	return Vector4(float(bits[0]), float(bits[1]), float(bits[2]), float(bits[3]))

## A short press that never got a walking frame is one tile. A hold, or a press that already stepped, is not.
static func release_is_step(elapsed_ms: int, moved: bool) -> bool:
	return elapsed_ms < 100 and not moved

static func contrast(a: Color, b: Color) -> float:
	var hi := maxf(_lum(a), _lum(b))
	var lo := minf(_lum(a), _lum(b))
	return (hi + 0.05) / (lo + 0.05)

static func _lum(c: Color) -> float:
	return 0.2126 * _chan(c.r) + 0.7152 * _chan(c.g) + 0.0722 * _chan(c.b)

static func _chan(u: float) -> float:
	if u <= 0.04045:
		return u / 12.92
	return pow((u + 0.055) / 1.055, 2.4)

static func dpad_dir(dpad: Rect2, p: Vector2) -> Vector2i:
	if not dpad.has_point(p):
		return Vector2i.ZERO
	var c := dpad.position + dpad.size * 0.5
	var d := p - c
	if absf(d.x) <= 22.0 and absf(d.y) <= 22.0:
		return Vector2i.ZERO
	if absf(d.x) > absf(d.y):
		return Vector2i.RIGHT if d.x > 0.0 else Vector2i.LEFT
	if absf(d.y) > 0.01:
		return Vector2i.DOWN if d.y > 0.0 else Vector2i.UP
	return Vector2i.ZERO

static func paginate(text: String, font: Font, size: int, width: float, max_lines: int) -> PackedStringArray:
	var words: PackedStringArray = text.split(" ", false)
	var lines: PackedStringArray = PackedStringArray()
	var cur := ""
	for w in words:
		var trial := w if cur == "" else cur + " " + w
		if font == null or font.get_string_size(trial, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x <= width:
			cur = trial
		else:
			if cur != "":
				lines.append(cur)
			cur = w
	if cur != "":
		lines.append(cur)
	var pages := PackedStringArray()
	if lines.is_empty():
		pages.append(text)
		return pages
	var i := 0
	var take := maxi(1, max_lines)
	while i < lines.size():
		var chunk := PackedStringArray()
		for j in take:
			if i + j >= lines.size():
				break
			chunk.append(lines[i + j])
		pages.append("\n".join(chunk))
		i += take
	return pages

## Turn-order chips. Two lines, then a +N chip. Right edge stays at or inside `limit`.
static func place_chips(labels: PackedStringArray, font: Font, x0: float, y0: float, limit: float, font_size: int, chip_h: float) -> Dictionary:
	var gap := 6.0
	var rects: Array = []
	var out: Array = []
	var x := x0
	var y := y0
	var row := 1
	var i := 0
	while i < labels.size():
		var w := _chip_w(font, labels[i], font_size, limit - x0)
		var nx := x
		var ny := y
		var nrow := row
		if x > x0 + 0.5 and x + w > limit:
			nrow = row + 1
			nx = x0
			ny = y + chip_h + gap
		if nrow > 2:
			_put_plus(rects, out, labels.size() - i, font, font_size, x, y, x0, limit, chip_h)
			break
		# Leave room for a +N chip when more names remain than this row and the next can hold.
		x = nx
		y = ny
		row = nrow
		if x + w > limit:
			w = maxf(36.0, limit - x)
		rects.append(Rect2(x, y, w, chip_h))
		out.append(labels[i])
		x += w + gap
		i += 1
	var packed := PackedStringArray()
	for s in out:
		packed.append(str(s))
	return {"font": font_size, "rects": rects, "labels": packed}

static func _chip_w(font: Font, lab: String, font_size: int, room: float) -> float:
	var w := 16.0 + (font.get_string_size(lab, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x if font != null else lab.length() * font_size * 0.6)
	return clampf(w, 36.0, maxf(36.0, room))

static func _put_plus(rects: Array, out: Array, extra: int, font: Font, font_size: int, x: float, y: float, x0: float, limit: float, chip_h: float) -> void:
	var count := extra
	var pw := _chip_w(font, "+%d" % count, font_size, limit - x0)
	if x > x0 + 0.5 and x + pw > limit and rects.size() > 0:
		count += 1
		pw = _chip_w(font, "+%d" % count, font_size, limit - x0)
		var last: Rect2 = rects[rects.size() - 1]
		rects[rects.size() - 1] = Rect2(last.position, Vector2(pw, chip_h))
		out[out.size() - 1] = "+%d" % count
		return
	var px := x if x + pw <= limit else x0
	rects.append(Rect2(px, y, pw, chip_h))
	out.append("+%d" % count)

static func layout_for(win: Vector2, insets: Vector4, dpr: float = 1.0) -> Dictionary:
	if side_wants(win):
		return _layout_side(win, insets, dpr)
	var left := insets.x
	var top := insets.y
	var right := insets.z
	var bottom := insets.w
	var avail_w := maxf(16.0, win.x - left - right)
	var avail_h := maxf(16.0, win.y - top - bottom)
	var game_w := 384
	var k := 1
	if avail_w < 384.0:
		game_w = maxi(16, int(floor(avail_w / 16.0)) * 16)
		k = 1
	else:
		k = maxi(1, int(floor(avail_w / 384.0)))
		var guard := 4.0 + 4.0 + 112.0 + 220.0
		while k > 1 and 216.0 * float(k) + guard > avail_h:
			k -= 1
		game_w = 384
	var view_w := float(game_w * k)
	var view_h := 216.0 * float(k)
	var view := Rect2(left + floor((avail_w - view_w) / 2.0), top + 4.0, view_w, view_h)
	var strip_h := 112.0 if game_w >= 384 else 104.0
	var strip := Rect2(left + 8.0, view.end.y + 4.0, maxf(16.0, avail_w - 16.0), strip_h)
	var deck_bot := win.y - bottom
	var deck := Rect2(left, strip.end.y, avail_w, maxf(0.0, deck_bot - strip.end.y))
	var wide := game_w >= 384
	var dpad_s := 132.0 if wide else 124.0
	var edge := 20.0 if wide else 16.0
	var dpad := Rect2(left + edge, deck.position.y + (deck.size.y - dpad_s) * 0.5, dpad_s, dpad_s)
	var ar := 32.0 if wide else 30.0
	var a := Vector2(win.x - right - edge - ar, dpad.get_center().y - 24.0)
	var b := Vector2(a.x - ar - 16.0 - ar, dpad.get_center().y)
	var menu := _menu_rect(win.x, left, right, dpad, b, ar, wide, deck_bot)
	var bw := 112.0 if wide else 104.0
	var bh := 48.0
	var gap := 8.0
	var grid_w := bw * 3.0 + gap * 2.0
	var bx := strip.position.x + maxf(0.0, (strip.size.x - grid_w) * 0.5)
	var by := strip.position.y + 8.0 + 28.0 + 6.0 + 28.0 + 8.0
	var buttons: Array = []
	for i in 6:
		buttons.append(Rect2(bx + float(i % 3) * (bw + gap), by + float(i / 3) * (bh + gap), bw, bh))
	var card := Rect2(left + 12.0, view.position.y, maxf(32.0, avail_w - 24.0), strip.end.y - view.position.y)
	var cw := 140.0 if wide else 132.0
	var ch := 48.0
	var pair := cw * 2.0 + 16.0
	var cx := card.position.x + (card.size.x - pair) * 0.5
	var cy := card.end.y - 16.0 - ch
	var choose := Rect2(cx, cy, cw, ch)
	var not_yet := Rect2(cx + cw + 16.0, cy, cw, ch)
	return {
		"game_w": game_w, "k": k, "dpr": dpr,
		"backing": Vector2(float(game_w * k) * dpr, 216.0 * float(k) * dpr),
		"view": view, "strip": strip, "deck": deck, "dpad": dpad,
		"a": a, "a_r": ar, "b": b, "b_r": ar, "menu": menu,
		"buttons": buttons, "card": card, "choose": choose, "not_yet": not_yet,
		"top": top, "bottom": bottom, "left": left, "right": right, "side": false,
	}

## Sideways phone. The view stays 384×216. Deck colour sits on both sides of it. The hint has its own
## band under the view, never over it. Whatever is left is ink, not black.
static func _layout_side(win: Vector2, insets: Vector4, dpr: float) -> Dictionary:
	var left := insets.x
	var top := insets.y
	var right := insets.z
	var bottom := insets.w
	var avail_w := maxf(16.0, win.x - left - right)
	var avail_h := maxf(16.0, win.y - top - bottom)
	var game_w := 384
	if avail_w < 384.0:
		game_w = maxi(16, int(floor(avail_w / 16.0)) * 16)
	var view_w := float(game_w)
	var view_h := 216.0
	var gap := 4.0
	var hint_h := 72.0
	if view_h + gap + hint_h > avail_h:
		hint_h = maxf(48.0, avail_h - view_h - gap)
	var extra := maxf(0.0, avail_h - view_h - gap - hint_h)
	var view := Rect2(left + floor((avail_w - view_w) / 2.0), top + extra, view_w, view_h)
	var strip := Rect2(left, view.end.y + gap, avail_w, hint_h)
	var deck_left := Rect2(left, view.position.y, maxf(0.0, view.position.x - left), view.size.y)
	var deck_right := Rect2(view.end.x, view.position.y, maxf(0.0, win.x - right - view.end.x), view.size.y)
	var dpad_s := 132.0 if deck_left.size.x >= 160.0 else 124.0
	var dpad := Rect2(left + 20.0, deck_left.position.y + (deck_left.size.y - dpad_s) * 0.5, dpad_s, dpad_s)
	if dpad.end.x > view.position.x - 8.0:
		dpad.position.x = maxf(left + 8.0, view.position.x - 8.0 - dpad_s)
	var ar := 32.0 if deck_right.size.x >= 96.0 else 22.0
	var stack := ar * 2.0 + 8.0 + ar * 2.0 + 8.0 + 44.0
	var sy := deck_right.position.y + maxf(0.0, (deck_right.size.y - stack) * 0.5)
	var ax := deck_right.get_center().x
	var a := Vector2(ax, sy + ar)
	var b := Vector2(ax, a.y + ar + 8.0 + ar)
	var mw := 96.0 if deck_right.size.x >= 112.0 else 88.0
	var menu := Rect2(ax - mw * 0.5, b.y + ar + 8.0, mw, 44.0)
	var card := Rect2(view.position, view.size)
	return {
		"game_w": game_w, "k": 1, "dpr": dpr, "side": true,
		"backing": Vector2(float(game_w) * dpr, 216.0 * dpr),
		"view": view, "strip": strip, "deck": deck_left, "deck_left": deck_left, "deck_right": deck_right,
		"dpad": dpad, "a": a, "a_r": ar, "b": b, "b_r": ar, "menu": menu,
		"buttons": [], "card": card, "choose": Rect2(), "not_yet": Rect2(),
		"top": top, "bottom": bottom, "left": left, "right": right,
	}

## The starter portrait: the painted sheet at 2×, 16px below the card's ink and 16px above the name.
## Lines of 16px text that fit in a strip, with 12px padding and a line height of 1.3.
static func strip_lines(strip_h: float) -> int:
	return maxi(1, int(floor((strip_h - 24.0) / 20.8)))

static func portrait_rect(card: Rect2, frame: Vector2i) -> Rect2:
	var w := maxf(2.0, float(frame.x)) * 2.0
	var h := maxf(2.0, float(frame.y)) * 2.0
	var top := card.position.y + 4.0 + 16.0
	return Rect2(card.get_center().x - w * 0.5, top, w, h)

static func _menu_rect(win_x: float, left: float, right: float, dpad: Rect2, b: Vector2, br: float, wide: bool, deck_bot: float) -> Rect2:
	var mw := 96.0 if wide else 88.0
	var mh := 44.0
	var mx := left + (win_x - left - right - mw) * 0.5
	var my := deck_bot - 24.0 - mh
	var menu := Rect2(mx, my, mw, mh)
	if menu.position.y - dpad.end.y < 8.0:
		var mid := (dpad.end.x + (b.x - br)) * 0.5
		menu = Rect2(mid - mw * 0.5, dpad.end.y - mh, mw, mh)
	return menu

static func box_gap(a: Rect2, b: Rect2) -> float:
	var dx := maxf(a.position.x - b.end.x, b.position.x - a.end.x)
	var dy := maxf(a.position.y - b.end.y, b.position.y - a.end.y)
	if dx > 0.0 and dy > 0.0:
		return sqrt(dx * dx + dy * dy)
	return maxf(dx, dy)

static func circle_box(c: Vector2, r: float) -> Rect2:
	return Rect2(c.x - r, c.y - r, r * 2.0, r * 2.0)

func has_tap() -> bool:
	return tap_dir != Vector2i.ZERO

func consume_tap() -> Vector2i:
	var d := tap_dir
	tap_dir = Vector2i.ZERO
	return d

func mark_moved() -> void:
	held_moved = true

func drop_pending() -> void:
	tap_dir = Vector2i.ZERO
	held_moved = true
	if held_action != "":
		Input.action_release(held_action)
		held_action = ""
		held_vec = Vector2i.ZERO

static func attach(main: Node) -> Control:
	var shell = load("res://scripts/phone_shell.gd").new()
	shell._mount(main)
	return shell

func _mount(main: Node) -> void:
	_main = main
	_root = main.get_tree().root
	_saved = {
		"mode": _root.content_scale_mode,
		"aspect": _root.content_scale_aspect,
		"csize": _root.content_scale_size,
		"stretch": _root.content_scale_stretch,
		"vsize": _root.size,
	}
	var win := Vector2i(DisplayServer.window_get_size())
	_root.content_scale_mode = Window.CONTENT_SCALE_MODE_DISABLED
	_root.content_scale_aspect = Window.CONTENT_SCALE_ASPECT_IGNORE
	_root.size = win
	_host = Control.new()
	_host.name = "PhoneHost"
	_host.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_host.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.add_child(_host)
	_svc = SubViewportContainer.new()
	# stretch would resize the game to the frame. The view stays 384×216 (or 352×216) and the
	# container enlarges it by the whole factor k with nearest filtering.
	_svc.stretch = false
	_svc.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_svc.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_svc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_sv = SubViewport.new()
	_sv.disable_3d = true
	_sv.handle_input_locally = true
	_sv.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	_sv.canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	_sv.msaa_2d = Viewport.MSAA_DISABLED
	_sv.snap_2d_transforms_to_pixel = true
	_svc.add_child(_sv)
	_host.add_child(_svc)
	_host.add_child(self)
	# Top-left anchors so the frame's size stays the window. Full-rect anchors left this
	# control at 0×0, and the inset paint (which uses that size) never showed.
	set_anchors_preset(Control.PRESET_TOP_LEFT)
	position = Vector2.ZERO
	mouse_filter = MOUSE_FILTER_STOP
	_root.remove_child(main)
	_sv.add_child(main)
	if font == null:
		font = _pixel_font()
	relayout(Vector2(win))

func detach() -> void:
	drop_pending()
	# The window is already the size the phone just turned to. Putting back the size from
	# when the upright frame opened snaps a sideways phone upright again, and the frame remounts.
	var keep := Vector2i(DisplayServer.window_get_size())
	if _sv != null and _main != null and is_instance_valid(_main) and _main.get_parent() == _sv:
		_sv.remove_child(_main)
		_root.add_child(_main)
	if _root != null and not _saved.is_empty():
		_root.content_scale_mode = int(_saved["mode"])
		_root.content_scale_aspect = int(_saved["aspect"])
		_root.content_scale_size = _saved["csize"]
		_root.content_scale_stretch = int(_saved["stretch"])
		if keep.x >= 8 and keep.y >= 8:
			DisplayServer.window_set_size(keep)
			_root.size = keep
	if _host != null and is_instance_valid(_host):
		_host.queue_free()
	_host = null
	_sv = null
	_svc = null

func relayout(win: Vector2) -> void:
	if OS.has_feature("web"):
		var raw = str(JavaScriptBridge.eval("typeof wildbondVisual==='function'?wildbondVisual():''", true))
		var bits: PackedStringArray = raw.split(",")
		if bits.size() >= 2:
			var vw := int(float(bits[0]))
			var vh := int(float(bits[1]))
			if vw > 8 and vh > 8 and Vector2i(vw, vh) != Vector2i(win):
				DisplayServer.window_set_size(Vector2i(vw, vh))
				win = Vector2(vw, vh)
				_root.size = Vector2i(win)
	L = layout_for(win, read_insets(), read_dpr())
	size = win
	if _svc != null:
		var view: Rect2 = L["view"]
		_svc.position = view.position
		_svc.size = view.size
		_sv.size = Vector2i(int(L["game_w"]), 216)
	queue_redraw()

func _process(dt: float) -> void:
	flash_t = maxf(0.0, flash_t - dt)
	queue_redraw()

func _can_walk() -> bool:
	if _main == null:
		return false
	return _main.lines.is_empty() and _main.trans_t < 0.0 and not _main._covering() and _main.stage in ["to_barn", "barn_choose", "walk_out", "free"]

func _at(e: InputEvent) -> Vector2:
	return get_global_transform_with_canvas().affine_inverse() * e.position

func _input(e: InputEvent) -> void:
	if _main == null or L.is_empty():
		return
	if e is InputEventKey and e.pressed and not e.echo:
		HowTo.note("keys")
		_forward(e)
		return
	if e is InputEventJoypadButton or e is InputEventJoypadMotion:
		if e is InputEventJoypadButton and e.pressed:
			HowTo.note("pad")
		_forward(e)
		return
	var screen := e is InputEventScreenTouch or e is InputEventScreenDrag
	var mouse: bool = e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT
	var motion := e is InputEventMouseMotion
	if mouse and e.device == InputEvent.DEVICE_ID_EMULATION:
		get_viewport().set_input_as_handled()
		return
	if not (screen or mouse or motion):
		return
	var down := false
	var up := false
	var id := -1
	if e is InputEventScreenTouch:
		down = e.pressed
		up = not e.pressed
		id = e.index
		if down:
			HowTo.note("touch")
	elif e is InputEventScreenDrag:
		id = e.index
	elif mouse:
		down = e.pressed
		up = not e.pressed
		id = -2
	elif motion:
		id = -2
	var p := _at(e)
	if e is InputEventScreenDrag or (motion and finger == -2):
		_drag(p)
		get_viewport().set_input_as_handled()
		return
	if down:
		_press(p, id)
		get_viewport().set_input_as_handled()
	elif up:
		_release(id)
		get_viewport().set_input_as_handled()

func _press(p: Vector2, id: int) -> void:
	var dpad: Rect2 = L["dpad"]
	if _can_walk() and dpad.has_point(p):
		var d := dpad_dir(dpad, p)
		if d != Vector2i.ZERO:
			_begin_dir(d, id)
			return
	if _hit_circle(L["a"], float(L["a_r"]), p):
		flash = "A"
		flash_t = 0.12
		_do_a()
		return
	if _hit_circle(L["b"], float(L["b_r"]), p):
		flash = "B"
		flash_t = 0.12
		_do_b()
		return
	var menu: Rect2 = L["menu"]
	if menu.has_point(p):
		flash = "M"
		flash_t = 0.12
		_do_menu()
		return
	if bool(L.get("side", false)):
		var side_strip: Rect2 = L["strip"]
		if side_strip.has_point(p) and not _main.lines.is_empty():
			_advance_talk()
			return
		var side_view: Rect2 = L["view"]
		if side_view.has_point(p):
			_forward_point(p)
		return
	if _main.card.visible:
		var choose: Rect2 = L["choose"]
		var wait: Rect2 = L["not_yet"]
		if choose.has_point(p):
			_main.card.sel = 0
			_main.card._pick(0)
			return
		if wait.has_point(p):
			_main.card._pick(_main.card._count() - 1)
			return
		return
	if _main.battle.visible and _main.battle.state in ["choose", "moves", "orders"]:
		var slots: Array = _slots()
		var buttons: Array = L["buttons"]
		for i in mini(slots.size(), buttons.size()):
			var r: Rect2 = buttons[i]
			if r.has_point(p):
				_main.battle.deck_press(int(slots[i]["i"]))
				return
	if _main.battle.visible and _main.battle.state in ["beat", "results"]:
		var note_strip: Rect2 = L["strip"]
		if note_strip.has_point(p):
			if not _page_battle_note():
				_main.battle.deck_press(0)
			return
	var strip: Rect2 = L["strip"]
	if strip.has_point(p) and not _main.lines.is_empty():
		_advance_talk()
		return
	var view: Rect2 = L["view"]
	if view.has_point(p):
		_forward_point(p)

func _drag(p: Vector2) -> void:
	if finger == -1 or held_vec == Vector2i.ZERO:
		return
	var dpad: Rect2 = L["dpad"]
	if not dpad.has_point(p):
		_end_dir()
		return
	var d := dpad_dir(dpad, p)
	if d == Vector2i.ZERO:
		_end_dir()
		return
	if d != held_vec:
		_swap_dir(d)

func _release(id: int) -> void:
	if id == finger:
		_end_dir()

func _begin_dir(d: Vector2i, id: int) -> void:
	_end_dir()
	held_vec = d
	held_moved = false
	held_at = Time.get_ticks_msec()
	finger = id
	held_action = str(DIR_ACTION[d])
	Input.action_press(held_action)
	HowTo.note("touch")

func _swap_dir(d: Vector2i) -> void:
	if held_action != "":
		Input.action_release(held_action)
	held_vec = d
	held_action = str(DIR_ACTION[d])
	Input.action_press(held_action)

func _end_dir() -> void:
	if held_action != "":
		Input.action_release(held_action)
	var elapsed := Time.get_ticks_msec() - held_at
	if held_vec != Vector2i.ZERO and release_is_step(elapsed, held_moved):
		tap_dir = held_vec
	held_action = ""
	held_vec = Vector2i.ZERO
	finger = -1

func _hit_circle(c: Vector2, r: float, p: Vector2) -> bool:
	return p.distance_to(c) <= r

func _do_a() -> void:
	HowTo.note("touch")
	if _main.card.visible:
		_push_action("interact")
		return
	if _main.battle.visible:
		if not bool(L.get("side", false)) and _main.battle.state in ["beat", "results"] and _page_battle_note():
			return
		_push_action("interact")
		return
	if not _main.lines.is_empty():
		_advance_talk()
		return
	_push_action("interact")

func _do_b() -> void:
	HowTo.note("touch")
	if _main.card.visible or _main.battle.visible or (_main.menu != null and _main.menu.visible):
		_push_action("back")
		return
	if not _main.lines.is_empty():
		_advance_talk()
		return
	_push_action("back")

func _do_menu() -> void:
	HowTo.note("touch")
	if _main.menu == null:
		return
	if _main.menu.visible or _main._menu_allowed():
		_main._toggle_menu()

func _advance_talk() -> void:
	var pages := _pages()
	if pages.size() > 1 and int(_main.talk_page) < pages.size() - 1:
		_main.talk_page = int(_main.talk_page) + 1
	else:
		_main.talk_page = 0
		_main.talk_key = ""
		_main.advance()

func _pages() -> PackedStringArray:
	# Once the frame is coming off, leave the open page alone. A last redraw must not clamp it.
	if _main == null or _sv == null or not is_instance_valid(_main) or _main.get_parent() != _sv:
		return PackedStringArray()
	if _main.lines.is_empty():
		return PackedStringArray()
	var text := str(_main.lines[0].text)
	if text != str(_main.talk_key):
		_main.talk_key = text
		_main.talk_page = 0
	var strip: Rect2 = L["strip"]
	var max_lines := strip_lines(strip.size.y)
	var pages := paginate(text, font, 16, maxf(32.0, strip.size.x - 24.0), max_lines)
	if int(_main.talk_page) >= pages.size():
		_main.talk_page = maxi(0, pages.size() - 1)
	return pages

func _slots() -> Array:
	var b = _main.battle
	var slots: Array = []
	if b.state == "choose":
		for i in 6:
			slots.append({"i": i, "text": b.menu_word(i), "on": b.menu_i == i, "dim": b.command_dim(i)})
	elif b.state == "moves":
		var mv: Array = b.R.moves_of(b.wait_u.c)
		for i in mv.size():
			var m: Dictionary = b.R.DATA.MOVES[mv[i]]
			var resting: bool = b.wait_u.cds.get(mv[i], 0.0) > 0.0
			slots.append({"i": i, "text": str(m.name), "on": b.move_i == i, "dim": resting})
	elif b.state == "orders":
		var ol: Array = b.known_orders()
		var base := int(b.order_i / 4) * 4
		for n in mini(4, ol.size() - base):
			var o: Dictionary = b.ORDERS[ol[base + n]]
			slots.append({"i": base + n, "text": str(o.name), "on": b.order_i == base + n, "dim": b.orders < int(o.cost)})
	return slots

func _push_action(action: String) -> void:
	if _sv == null:
		return
	for down in [true, false]:
		var ev := InputEventAction.new()
		ev.action = action
		ev.pressed = down
		_sv.push_input(ev)

func _forward(e: InputEvent) -> void:
	if _sv != null:
		_sv.push_input(e)

func _forward_point(p: Vector2) -> void:
	if _sv == null:
		return
	var view: Rect2 = L["view"]
	var k := maxf(1.0, float(L["k"]))
	var local := (p - view.position) / k
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = true
	ev.position = local
	_sv.push_input(ev)
	var up := ev.duplicate()
	up.pressed = false
	_sv.push_input(up)

func _draw() -> void:
	if L.is_empty() or font == null:
		return
	var win := size
	var top := float(L["top"])
	var bottom := float(L["bottom"])
	var left := float(L["left"])
	var right := float(L["right"])
	if top > 0.0:
		draw_rect(Rect2(0, 0, win.x, top), INK)
	if bottom > 0.0:
		draw_rect(Rect2(0, win.y - bottom, win.x, bottom), DECK)
	if left > 0.0:
		draw_rect(Rect2(0, top, left, win.y - top - bottom), INK)
	if right > 0.0:
		draw_rect(Rect2(win.x - right, top, right, win.y - top - bottom), INK)
	var view: Rect2 = L["view"]
	var strip: Rect2 = L["strip"]
	var deck: Rect2 = L["deck"]
	# Ink frame around the view. The view itself stays clear so the game shows through.
	draw_rect(Rect2(left, top, win.x - left - right, view.position.y - top), INK)
	draw_rect(Rect2(left, view.position.y, view.position.x - left, view.size.y), INK)
	draw_rect(Rect2(view.end.x, view.position.y, win.x - right - view.end.x, view.size.y), INK)
	draw_rect(Rect2(left, view.end.y, win.x - left - right, strip.position.y - view.end.y), INK)
	# The strip is inset 8px. Those side gaps are frame, not the empty window colour.
	draw_rect(Rect2(left, strip.position.y, maxf(0.0, strip.position.x - left), strip.size.y), INK)
	draw_rect(Rect2(strip.end.x, strip.position.y, maxf(0.0, win.x - right - strip.end.x), strip.size.y), INK)
	if bool(L.get("side", false)):
		_draw_side()
		return
	draw_rect(deck, DECK)
	draw_rect(Rect2(deck.position, Vector2(deck.size.x, 1)), PAPER)
	draw_rect(Rect2(deck.position.x, deck.end.y - 1, deck.size.x, 1), SHADOW)
	var battle_on: bool = _main != null and _main.battle.visible
	var card_on: bool = _main != null and _main.card.visible and _main.card.buttons.is_empty()
	if battle_on:
		_draw_battle(strip)
	else:
		_draw_strip(strip)
	if card_on:
		_draw_card()
	_draw_pad()

## Letterbox is ink. The panels beside the view are deck. The hint band is under the view.
func _draw_side() -> void:
	var win := size
	var view: Rect2 = L["view"]
	var strip: Rect2 = L["strip"]
	draw_rect(Rect2(0, 0, win.x, maxf(0.0, view.position.y)), INK)
	draw_rect(Rect2(0, view.end.y, win.x, maxf(0.0, strip.position.y - view.end.y)), INK)
	if strip.end.y < win.y:
		draw_rect(Rect2(0, strip.end.y, win.x, win.y - strip.end.y), INK)
	_paint_deck(L["deck_left"])
	_paint_deck(L["deck_right"])
	_draw_strip(strip)
	_draw_pad()

func _paint_deck(deck: Rect2) -> void:
	if deck.size.x < 1.0 or deck.size.y < 1.0:
		return
	draw_rect(deck, DECK)
	draw_rect(Rect2(deck.position, Vector2(deck.size.x, 1)), PAPER)
	draw_rect(Rect2(deck.position.x, deck.end.y - 1, deck.size.x, 1), SHADOW)

func _draw_strip(strip: Rect2) -> void:
	draw_rect(strip, INK)
	draw_rect(strip.grow(-1), PAPER)
	draw_rect(strip.grow(-3), SHADOW, false, 2.0)
	var pages := _pages()
	var body := ""
	var col := INK
	var more := false
	if not pages.is_empty():
		body = pages[int(_main.talk_page)]
		more = int(_main.talk_page) < pages.size() - 1
	elif _main != null and not _main.howto.visible and str(_main.caption.text) != "":
		var hint_pages := paginate(str(_main.caption.text), font, 16, maxf(32.0, strip.size.x - 24.0), strip_lines(strip.size.y))
		body = hint_pages[0]
		col = HINT
		more = hint_pages.size() > 1
	if body != "":
		var y := strip.position.y + 12.0 + font.get_ascent(16)
		for line in body.split("\n"):
			draw_string(font, Vector2(strip.position.x + 12.0, y), line, HORIZONTAL_ALIGNMENT_LEFT, strip.size.x - 24.0, 16, col)
			y += 16.0 * 1.3
	if more and int(Time.get_ticks_msec() / 400) % 2 == 0:
		var tip := strip.end - Vector2(16, 14)
		draw_colored_polygon(PackedVector2Array([tip + Vector2(-6, -6), tip + Vector2(6, -6), tip + Vector2(0, 2)]), A_DIM)

func _draw_battle(strip: Rect2) -> void:
	draw_rect(strip, INK)
	draw_rect(strip.grow(-1), PAPER)
	draw_rect(strip.grow(-3), SHADOW, false, 2.0)
	# While a move plays, the grid steps aside and the strip is the message.
	if _main.battle.state not in ["choose", "moves", "orders"]:
		_draw_battle_note(strip)
		return
	var buttons: Array = L["buttons"]
	var slots: Array = _slots()
	var names := PackedStringArray()
	var sides := PackedStringArray()
	if _main.battle.has_method("next_names"):
		names = _main.battle.next_names(CHIP_LOOKAHEAD)
		sides = _main.battle.next_sides(CHIP_LOOKAHEAD)
	var label := "Next:"
	var label_w := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 16).x
	var row := Rect2(strip.position.x + 12.0, strip.position.y + 6.0, label_w + 4.0, 28.0)
	_text_in(row, label, 16, INK)
	var chips: Dictionary = place_chips(names, font, row.end.x + 6.0, strip.position.y + 6.0, strip.end.x, 14, 28.0)
	var rects: Array = chips["rects"]
	var labs: PackedStringArray = chips["labels"]
	for i in rects.size():
		var r: Rect2 = rects[i]
		var lab := labs[i]
		var fill := SLATE
		if lab.begins_with("+"):
			fill = DECK
		elif i < sides.size() and sides[i] == "f":
			fill = A_DIM
		draw_rect(r.grow(1), INK)
		draw_rect(r, fill)
		var ink := INK if lab.begins_with("+") else CREAM
		_text_in(r, lab, 14, ink)
	for i in mini(slots.size(), buttons.size()):
		var r: Rect2 = buttons[i]
		var on: bool = bool(slots[i]["on"])
		var dim: bool = bool(slots[i]["dim"])
		if dim:
			draw_rect(r.grow(1), INK)
			draw_rect(r, SHADOW)
			_text_in(r, str(slots[i]["text"]), 16, DIM_TEXT)
		elif on:
			draw_rect(r.grow(2), RING)
			draw_rect(r.grow(1), INK)
			draw_rect(r, INK)
			_text_in(r, str(slots[i]["text"]), 16, CREAM)
		else:
			draw_rect(r.grow(1), INK)
			draw_rect(r, DECK)
			_text_in(r, str(slots[i]["text"]), 16, INK)

## The line the move just spoke, or the results, once the grid steps aside. Long text pages at 16px.
func _draw_battle_note(strip: Rect2) -> void:
	var pages := _battle_pages(strip)
	var body := pages[battle_page] if not pages.is_empty() else "…"
	var y := strip.position.y + 12.0 + font.get_ascent(16)
	for line in body.split("\n"):
		draw_string(font, Vector2(strip.position.x + 12.0, y), line, HORIZONTAL_ALIGNMENT_LEFT, strip.size.x - 24.0, 16, INK)
		y += 16.0 * 1.3
	if battle_page < pages.size() - 1 and int(Time.get_ticks_msec() / 400) % 2 == 0:
		var tip := strip.end - Vector2(16, 14)
		draw_colored_polygon(PackedVector2Array([tip + Vector2(-6, -6), tip + Vector2(6, -6), tip + Vector2(0, 2)]), A_DIM)

func _battle_note_text() -> String:
	if _main == null or not _main.battle.visible:
		return ""
	if str(_main.battle.state) == "results":
		var parts := PackedStringArray()
		for line in _main.battle.results:
			var s := str(line).strip_edges()
			if s != "":
				parts.append(s)
		if not parts.is_empty():
			return " ".join(parts)
	var lines: Array = _main.battle.log_lines
	if lines.is_empty():
		return ""
	return str(lines[lines.size() - 1])

func _battle_pages(strip: Rect2) -> PackedStringArray:
	var text := _battle_note_text()
	if text != battle_note:
		battle_note = text
		battle_page = 0
	var pages := paginate(text if text != "" else "…", font, 16, maxf(32.0, strip.size.x - 24.0), strip_lines(strip.size.y))
	if battle_page >= pages.size():
		battle_page = maxi(0, pages.size() - 1)
	return pages

## True when another page of the battle note was waiting. The last page leaves the press to continue.
func _page_battle_note() -> bool:
	var strip: Rect2 = L["strip"]
	var pages := _battle_pages(strip)
	if battle_page < pages.size() - 1:
		battle_page += 1
		queue_redraw()
		return true
	return false

func _draw_card() -> void:
	var card: Rect2 = L["card"]
	draw_rect(card, INK)
	draw_rect(card.grow(-4), PAPER)
	var info: Dictionary = _main.card.info
	var name := str(info.get("name", ""))
	var id := str(_main.card.id)
	var dest := portrait_rect(card, Sprites.frame_size(id, "idle"))
	var foot := Vector2(dest.get_center().x, dest.end.y)
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	if not Sprites.try_draw(self, id, foot, true, "idle", int(Time.get_ticks_msec() / 160.0), 2.0, 0.0, ""):
		draw_rect(dest, SLATE)
	var y := dest.end.y + 16.0 + font.get_ascent(20)
	draw_string(font, Vector2(card.position.x, y), name, HORIZONTAL_ALIGNMENT_CENTER, card.size.x, 20, INK)
	y += 22.0
	draw_string(font, Vector2(card.position.x, y), str(info.get("el", "")), HORIZONTAL_ALIGNMENT_CENTER, card.size.x, 16, HINT)
	y += 8.0
	var desc := str(info.get("dex", ""))
	var pages := paginate(desc, font, 16, card.size.x - 32.0, 3)
	var dy := y + font.get_ascent(16)
	for line in pages[0].split("\n"):
		draw_string(font, Vector2(card.position.x + 16.0, dy), line, HORIZONTAL_ALIGNMENT_CENTER, card.size.x - 32.0, 16, INK)
		dy += 16.0 * 1.3
	_choice_button(L["choose"], _main.card._label(0), _main.card.sel == 0)
	_choice_button(L["not_yet"], _main.card._label(1), _main.card.sel == 1)

func _choice_button(r: Rect2, text: String, on: bool) -> void:
	if on:
		draw_rect(r.grow(2), RING)
		draw_rect(r, INK)
		_text_in(r, text, 16, CREAM)
	else:
		draw_rect(r.grow(1), INK)
		draw_rect(r, DECK)
		_text_in(r, text, 16, INK)

func _draw_pad() -> void:
	var dpad: Rect2 = L["dpad"]
	var pressed := held_vec
	_plus(dpad, pressed)
	var a_down := flash == "A" and flash_t > 0.0
	var b_down := flash == "B" and flash_t > 0.0
	var m_down := flash == "M" and flash_t > 0.0
	_disc(L["a"], float(L["a_r"]), A_FACE, A_LIT, A_DIM, a_down)
	_disc(L["b"], float(L["b_r"]), B_FACE, B_LIT, B_DIM, b_down)
	_glyph(L["a"] + Vector2(0, 2 if a_down else 0), "A", float(L["a_r"]))
	_glyph(L["b"] + Vector2(0, 2 if b_down else 0), "B", float(L["b_r"]))
	var menu: Rect2 = L["menu"]
	if m_down:
		menu.position.y += 2.0
	_pill(menu, MENU_FACE, MENU_LIT, MENU_DIM, m_down)
	_text_in(menu, "Menu", 16, CREAM)

func _glyph(c: Vector2, text: String, _r: float) -> void:
	var w := 24.0
	draw_string(font, c + Vector2(-w * 0.5, font.get_ascent(16) * 0.35), text, HORIZONTAL_ALIGNMENT_CENTER, w, 16, CREAM)

func _text_in(r: Rect2, text: String, size: int, col: Color) -> void:
	var baseline := r.position.y + (r.size.y + font.get_ascent(size) - font.get_descent(size)) * 0.5
	draw_string(font, Vector2(r.position.x, baseline), text, HORIZONTAL_ALIGNMENT_CENTER, r.size.x, size, col)

func _disc(c: Vector2, radius: float, fill: Color, light: Color, shadow: Color, pressed: bool) -> void:
	var center := c + Vector2(0, 2 if pressed else 0)
	var rad := int(round(radius))
	var cx := int(round(center.x))
	var cy := int(round(center.y))
	var ring := pressed
	for y in range(-rad - 3, rad + 4):
		for x in range(-rad - 3, rad + 4):
			var d2 := x * x + y * y
			var px := cx + x
			var py := cy + y
			if ring and d2 <= (rad + 3) * (rad + 3) and d2 > (rad + 1) * (rad + 1):
				draw_rect(Rect2(px, py, 1, 1), RING)
			elif d2 <= (rad + 1) * (rad + 1) and d2 > rad * rad:
				draw_rect(Rect2(px, py, 1, 1), INK)
			elif d2 <= rad * rad:
				var col := fill
				if d2 > (rad - 2) * (rad - 2):
					var lit := (x + y) < 0
					if pressed:
						lit = not lit
					col = light if lit else shadow
				draw_rect(Rect2(px, py, 1, 1), col)

func _plus(dpad: Rect2, pressed: Vector2i) -> void:
	var c := dpad.get_center()
	# Bevels sit outside the slate, so the measured face stays 132 (124 on a narrow phone) and each arm stays 44.
	var bevel := 2.0
	var thick := 44.0
	var vert := Rect2(c.x - thick * 0.5 - bevel, dpad.position.y - bevel, thick + bevel * 2.0, dpad.size.y + bevel * 2.0)
	var horiz := Rect2(dpad.position.x - bevel, c.y - thick * 0.5 - bevel, dpad.size.x + bevel * 2.0, thick + bevel * 2.0)
	draw_rect(vert.grow(1), INK)
	draw_rect(horiz.grow(1), INK)
	draw_rect(vert, SLATE)
	draw_rect(horiz, SLATE)
	draw_rect(Rect2(vert.position, Vector2(bevel, vert.size.y)), SLATE_LIT)
	draw_rect(Rect2(vert.position, Vector2(vert.size.x, bevel)), SLATE_LIT)
	draw_rect(Rect2(vert.end.x - bevel, vert.position.y, bevel, vert.size.y), SLATE_DIM)
	draw_rect(Rect2(vert.position.x, vert.end.y - bevel, vert.size.x, bevel), SLATE_DIM)
	draw_rect(Rect2(horiz.position, Vector2(bevel, horiz.size.y)), SLATE_LIT)
	draw_rect(Rect2(horiz.position, Vector2(horiz.size.x, bevel)), SLATE_LIT)
	draw_rect(Rect2(horiz.end.x - bevel, horiz.position.y, bevel, horiz.size.y), SLATE_DIM)
	draw_rect(Rect2(horiz.position.x, horiz.end.y - bevel, horiz.size.x, bevel), SLATE_DIM)
	var arm := _arm(dpad, pressed)
	if arm.size.x > 1.0:
		draw_rect(arm, SLATE_DIM)
		draw_rect(arm.grow(2), RING, false, 2.0)

func _arm(dpad: Rect2, d: Vector2i) -> Rect2:
	var c := dpad.get_center()
	var bevel := 2.0
	if d == Vector2i.UP:
		return Rect2(c.x - 22.0 - bevel, dpad.position.y - bevel, 44.0 + bevel * 2.0, 44.0 + bevel)
	if d == Vector2i.DOWN:
		return Rect2(c.x - 22.0 - bevel, dpad.end.y - 44.0, 44.0 + bevel * 2.0, 44.0 + bevel)
	if d == Vector2i.LEFT:
		return Rect2(dpad.position.x - bevel, c.y - 22.0 - bevel, 44.0 + bevel, 44.0 + bevel * 2.0)
	if d == Vector2i.RIGHT:
		return Rect2(dpad.end.x - 44.0, c.y - 22.0 - bevel, 44.0 + bevel, 44.0 + bevel * 2.0)
	return Rect2()

func _pill(r: Rect2, fill: Color, light: Color, shadow: Color, pressed: bool) -> void:
	var box := r
	if pressed:
		box.position.y += 2.0
	_capsule(box.grow(1), INK)
	_capsule(box, fill)
	if not pressed:
		draw_rect(Rect2(box.position.x + 4, box.position.y + 1, box.size.x - 8, 2), light)
		draw_rect(Rect2(box.position.x + 4, box.end.y - 3, box.size.x - 8, 2), shadow)
	else:
		draw_rect(Rect2(box.position.x + 4, box.position.y + 1, box.size.x - 8, 2), shadow)
		draw_rect(Rect2(box.position.x + 4, box.end.y - 3, box.size.x - 8, 2), light)
		draw_rect(box.grow(2), RING, false, 2.0)

func _capsule(r: Rect2, col: Color) -> void:
	var rad := r.size.y * 0.5
	var cy := r.position.y + rad
	var body_l := r.position.x + rad
	var body_r := r.end.x - rad
	var y0 := int(floor(r.position.y))
	var y1 := int(ceil(r.end.y))
	for y in range(y0, y1):
		var dy := (float(y) + 0.5) - cy
		var reach := 0.0
		if absf(dy) <= rad:
			reach = sqrt(maxf(0.0, rad * rad - dy * dy))
		var x0 := body_l - reach
		var x1 := body_r + reach
		if x1 > x0:
			draw_rect(Rect2(floor(x0), y, maxf(1.0, ceil(x1) - floor(x0)), 1), col)
