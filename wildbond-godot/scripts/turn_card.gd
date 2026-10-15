extends Control
## The upright phone used to stop here and ask you to turn it sideways. That gate is gone: an upright phone
## plays in the Game Boy frame (phone_shell.gd). This control stays in the tree so a covering page can still
## swallow a click in a test, and it never pauses the journey on its own.

const INK := Color("3e2c20")
const FAINT := Color("8a6e50")
const TITLE := "Turn your phone sideways"
const BODY := "Wildbond needs the wide screen. Turn the phone so the long side runs across. Your journey is waiting right here, and nothing is lost."
const DESK := "On a computer, make this window wider than it is tall."

var font: Font

func _ready() -> void:
	Controls.fill(self)
	mouse_filter = MOUSE_FILTER_STOP
	process_mode = Node.PROCESS_MODE_ALWAYS
	font = ThemeDB.fallback_font
	visible = false

## True while the window stands upright, like a phone held the normal way.
static func upright(size: Vector2) -> bool:
	return size.y > size.x * 1.05

func message() -> PackedStringArray:
	return PackedStringArray([TITLE, BODY, DESK])

func _process(_dt: float) -> void:
	if visible:
		queue_redraw()

## The rotate gate is retired. Calling this never covers the game and never pauses it.
func check(_size: Vector2) -> void:
	visible = false

## A portrait window letterboxes the game into a thin strip. While this page is up, let the canvas
## fill the window so the words are the whole screen. A wide window goes back to the game's shape.
func _fit_window(size: Vector2) -> void:
	var win := get_window()
	if win == null:
		return
	var real := Vector2(DisplayServer.window_get_size())
	if real.x < 8.0 or real.y < 8.0 or real.distance_to(size) > 1.0:
		return
	var want := Window.CONTENT_SCALE_ASPECT_EXPAND if upright(size) else Window.CONTENT_SCALE_ASPECT_KEEP
	if win.content_scale_aspect != want:
		win.content_scale_aspect = want

func _input(e: InputEvent) -> void:
	if visible and (e is InputEventMouseButton or e is InputEventScreenTouch or e is InputEventScreenDrag or e is InputEventKey):
		get_viewport().set_input_as_handled()

func _draw() -> void:
	var s := size
	if s.x < 8.0 or s.y < 8.0:
		s = Vector2(384, 216)
	draw_rect(Rect2(Vector2.ZERO, s), Color("121418"))
	var panel := Rect2(s.x * 0.06, s.y * 0.18, s.x * 0.88, s.y * 0.64)
	draw_rect(panel, Color("4a2e1a"))
	draw_rect(panel.grow(-4), Color("f4e9cd"))
	var title_size := 22 if s.y >= 320.0 else 16
	var body_size := 12 if s.y >= 320.0 else 8
	var y := panel.position.y + panel.size.y * 0.28
	draw_string(font, Vector2(panel.position.x, y), TITLE, HORIZONTAL_ALIGNMENT_CENTER, panel.size.x, title_size, INK)
	y += title_size + 16.0
	var body_w := panel.size.x - 28.0
	draw_multiline_string(font, Vector2(panel.position.x + 14.0, y), BODY, HORIZONTAL_ALIGNMENT_CENTER, body_w, body_size, -1, INK)
	y += font.get_multiline_string_size(BODY, HORIZONTAL_ALIGNMENT_CENTER, body_w, body_size).y + 14.0
	draw_multiline_string(font, Vector2(panel.position.x + 14.0, y), DESK, HORIZONTAL_ALIGNMENT_CENTER, body_w, body_size, -1, FAINT)
