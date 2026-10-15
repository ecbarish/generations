class_name Controls
extends RefCounted
## Every control in the game has a name (WB6.1, docs/learning/godot-practices.md rule 2). A key, a gamepad button or a
## finger on the phone pad (touch_pad.gd) all set off the same named action, so each screen asks "was this Talk?"
## rather than "was this the E key?". setup() puts the actions in Godot's Input Map when the game starts; a rebinding
## screen later only has to change this table.

## name: [keys, gamepad buttons]
const ACTIONS := {
	"move_up": [[KEY_UP, KEY_W], [JOY_BUTTON_DPAD_UP]],
	"move_down": [[KEY_DOWN, KEY_S], [JOY_BUTTON_DPAD_DOWN]],
	"move_left": [[KEY_LEFT, KEY_A], [JOY_BUTTON_DPAD_LEFT]],
	"move_right": [[KEY_RIGHT, KEY_D], [JOY_BUTTON_DPAD_RIGHT]],
	"interact": [[KEY_E, KEY_ENTER, KEY_KP_ENTER, KEY_SPACE], [JOY_BUTTON_A]],   # talk, choose, next line
	"back": [[KEY_ESCAPE, KEY_BACKSPACE, KEY_Q], [JOY_BUTTON_B]],
	"open_book": [[KEY_TAB, KEY_J], [JOY_BUTTON_Y]],
	"open_menu": [[KEY_I, KEY_ESCAPE], [JOY_BUTTON_START]],
	"page_prev": [[KEY_Q], [JOY_BUTTON_LEFT_SHOULDER]],
	"page_next": [[KEY_E], [JOY_BUTTON_RIGHT_SHOULDER]],
	"calendar": [[KEY_C], [JOY_BUTTON_X]],
	"toggle_music": [[KEY_M], []],
	"toggle_sound": [[KEY_N], []],
}
## The left stick walks too.
const STICK := { "move_up": [JOY_AXIS_LEFT_Y, -1.0], "move_down": [JOY_AXIS_LEFT_Y, 1.0],
	"move_left": [JOY_AXIS_LEFT_X, -1.0], "move_right": [JOY_AXIS_LEFT_X, 1.0] }
static var touch := false                      # the phone pad is showing (touch_pad.gd): hints say "tap", not key names
const DIRS := { "move_up": Vector2i.UP, "move_down": Vector2i.DOWN, "move_left": Vector2i.LEFT, "move_right": Vector2i.RIGHT }

static func setup() -> void:
	# Deliver a press on the frame it happens. Accumulated input holds keys across a hitch and replays them later.
	Input.use_accumulated_input = false
	for a in ACTIONS:
		var fresh := not InputMap.has_action(a)
		if fresh:
			InputMap.add_action(a, 0.4)
			for b in ACTIONS[a][1]:
				var j := InputEventJoypadButton.new()
				j.button_index = b
				InputMap.action_add_event(a, j)
			if STICK.has(a):
				var m := InputEventJoypadMotion.new()
				m.axis = STICK[a][0]
				m.axis_value = STICK[a][1]
				InputMap.action_add_event(a, m)
		for k in ACTIONS[a][0]:
			_bind_key(a, k)

## A real key carries both codes. A tool sometimes sends only one. Either press must count, and only once.
static func _bind_key(action: String, key: Key) -> void:
	var physical := false
	var code := false
	for ev in InputMap.action_get_events(action):
		if ev is InputEventKey and ev.physical_keycode == key and ev.keycode == KEY_NONE:
			physical = true
		if ev is InputEventKey and ev.keycode == key and ev.physical_keycode == KEY_NONE:
			code = true
	if not physical:
		var placed := InputEventKey.new()
		placed.physical_keycode = key                 # where the key sits, so WASD works on any keyboard layout
		InputMap.action_add_event(action, placed)
	if not code:
		var named := InputEventKey.new()
		named.keycode = key
		InputMap.action_add_event(action, named)

## True when this event is a fresh press of the action (held-key repeats don't count).
static func pressed(e: InputEvent, action: String) -> bool:
	return InputMap.has_action(action) and e.is_action_pressed(action, false)

## Which way a fresh press points in a menu, or zero.
static func dir(e: InputEvent) -> Vector2i:
	for a in DIRS:
		if pressed(e, a):
			return DIRS[a]
	return Vector2i.ZERO

static var _down := false
static var _release_seen: InputEvent
static var _release_kind := 0

## A fresh left click, or a finger when the engine is not also sending that finger as a mouse click.
## One tap must do one thing: the emulated mouse is the click, and the leftover touch is only swallowed.
static func pointing(e: InputEvent) -> bool:
	var hit := _press(e)
	if hit:
		_down = true
	return hit

static func note(e: InputEvent) -> void:
	if _press(e):
		_down = true

static func _press(e: InputEvent) -> bool:
	if e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		return true
	return e is InputEventScreenTouch and e.pressed and not Input.emulate_mouse_from_touch and e.device != InputEvent.DEVICE_ID_EMULATION

## The finger or the mouse button coming up.
static func released(e: InputEvent) -> bool:
	return release_kind(e) != 0

## 0 is not a release. 1 had a press with it. 2 is the whole tap (the press never arrived).
static func release_kind(e: InputEvent) -> int:
	if not _up(e):
		return 0
	if _release_seen == e:
		return _release_kind
	_release_seen = e
	_release_kind = 2 if not _down else 1
	_down = false
	return _release_kind

static func _up(e: InputEvent) -> bool:
	if e is InputEventMouseButton and not e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		return true
	return e is InputEventScreenTouch and not e.pressed and not Input.emulate_mouse_from_touch and e.device != InputEvent.DEVICE_ID_EMULATION

## Where that click or tap landed, in the control's own pixels. The event carries the point. The cursor
## (get_local_mouse_position) stays wherever it was, so a headless click and a real tap would miss the button.
## Only a pointer event is scaled. A key or a joypad button keeps the control's own mouse position.
static func at(control: Control, e: InputEvent) -> Vector2:
	var raw := control.get_local_mouse_position()
	var pointer := e is InputEventMouse or e is InputEventScreenTouch or e is InputEventScreenDrag
	if not pointer:
		return raw
	raw = e.position
	var view := control.get_viewport().get_visible_rect().size
	if view.x < 2.0 or view.y < 2.0:
		view = _base_view()
	var local := into_view(raw, view, Vector2(DisplayServer.window_get_size()), control.get_viewport().get_screen_transform())
	return control.get_global_transform_with_canvas().affine_inverse() * local

static func _base_view() -> Vector2:
	return Vector2(
		float(ProjectSettings.get_setting("display/window/size/viewport_width", 384)),
		float(ProjectSettings.get_setting("display/window/size/viewport_height", 216)))

## Window pixels to view pixels. view is the game's own size. win is the window or the canvas backing store.
## screen is the viewport stretch. A point the stretch has already mapped is left alone.
## A point whose numbers merely sit inside 384×216 is still a window point when the window is larger, so it is scaled.
## Headless, where the window is no bigger than the view, a point inside the view is already in view pixels.
static func into_view(raw: Vector2, view: Vector2, win: Vector2, screen: Transform2D) -> Vector2:
	if view.x < 2.0 or view.y < 2.0:
		view = _base_view()
	var box := Rect2(Vector2.ZERO, view).grow(1.0)
	var win_bigger := win.x > view.x + 1.0 and win.y > view.y + 1.0
	if screen != Transform2D.IDENTITY:
		var mapped: Vector2 = screen.affine_inverse() * raw
		if box.has_point(mapped):
			return mapped
	if not win_bigger and box.has_point(raw):
		return raw
	if win_bigger and view.x > 1.0 and view.y > 1.0:
		var fit := minf(win.x / view.x, win.y / view.y)
		# Desktop keeps whole-number enlargement, with black bars when the window is not an exact multiple.
		var whole := float(int(floor(fit)))
		if whole >= 2.0:
			var margin := (win - view * whole) * 0.5
			var brought := (raw - margin) / whole
			if box.has_point(brought):
				return brought
		# A phone uses fractional stretch, so the same point is scaled by the exact fit.
		if fit > 1.01 and not is_equal_approx(fit, whole):
			var edge := (win - view * fit) * 0.5
			var phone := (raw - edge) / fit
			if box.has_point(phone):
				return phone
	if box.has_point(raw):
		return raw
	return raw

## Drop presses that arrived during a fade or a menu toggle. Input.flush_buffered_events delivers them.
static func flush_buffered_events() -> void:
	var tree := Engine.get_main_loop() as SceneTree
	var window: Window = tree.root if tree != null else null
	if window != null:
		window.set_disable_input(true)
	Input.flush_buffered_events()
	if window != null:
		window.set_disable_input(false)

## Cover the view. Anchors alone leave a new panel at 0×0, and a zero-size panel cannot keep a click off the world.
static func fill(control: Control) -> void:
	control.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

## The press, the duplicate touch, and the release: none of them should reach the world under a panel.
static func swallow_pointer(e: InputEvent) -> bool:
	var sw: bool = e is InputEventScreenTouch or e is InputEventScreenDrag or (e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT)
	if sw:
		release_kind(e)
	return sw

## Which way the walking controls are held right now (keys, stick, or the phone pad), or zero.
## A real key is also read on its own. Two bindings for one key can drop the action while the key is still down,
## and a held walk would then wait for the next tap.
static func held_dir() -> Vector2i:
	for a in DIRS:
		if InputMap.has_action(a) and Input.is_action_pressed(a):
			return DIRS[a]
	for a in DIRS:
		if _action_key_down(a):
			return DIRS[a]
	return Vector2i.ZERO

## Keys currently bound to the action, so a remap still walks and an unbound key does not.
static func _action_key_down(action: String) -> bool:
	if not InputMap.has_action(action):
		return false
	for ev in InputMap.action_get_events(action):
		if ev is InputEventKey:
			if ev.physical_keycode != KEY_NONE and Input.is_physical_key_pressed(ev.physical_keycode):
				return true
			if ev.keycode != KEY_NONE and Input.is_key_pressed(ev.keycode):
				return true
	return false
