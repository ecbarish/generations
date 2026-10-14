extends Control
## "Turn your phone sideways" (Playtester, 2026-10-09: in phone portrait the game is a thin strip with tiny text and no
## room for the pad). While the window is taller than it is wide, this card covers the game and the game holds still;
## turning the phone takes it away again, right where you were.

const INK := Color("3e2c20")
const FAINT := Color("8a6e50")

var font: Font
var t := 0.0

func _ready() -> void:
	Controls.fill(self)
	mouse_filter = MOUSE_FILTER_STOP
	process_mode = Node.PROCESS_MODE_ALWAYS
	font = ThemeDB.fallback_font
	visible = false

## True while the window stands upright, like a phone held the normal way.
static func upright(size: Vector2) -> bool:
	return size.y > size.x * 1.05

func _process(dt: float) -> void:
	t += dt
	check(Vector2(DisplayServer.window_get_size()))
	if visible:
		queue_redraw()

func check(size: Vector2) -> void:
	var up := upright(size)
	if up != visible:
		visible = up
		get_tree().paused = up
		queue_redraw()

func _input(e: InputEvent) -> void:
	if visible and (e is InputEventMouseButton or e is InputEventScreenTouch or e is InputEventScreenDrag or e is InputEventKey):
		get_viewport().set_input_as_handled()

func _draw() -> void:
	draw_rect(Rect2(0, 0, 384, 216), Color("121418"))
	draw_rect(Rect2(10, 10, 364, 196), Color("4a2e1a"))
	draw_rect(Rect2(14, 14, 356, 188), Color("f4e9cd"))
	# a phone that tips onto its side, over and over
	var a: float = clampf(fmod(t, 2.4) - 0.6, 0.0, 1.0) * PI / 2.0
	var c := Vector2(192, 92)
	var xf := Transform2D(-a, c)
	var body := PackedVector2Array([Vector2(-14, -24), Vector2(14, -24), Vector2(14, 24), Vector2(-14, 24)])
	var screen := PackedVector2Array([Vector2(-11, -19), Vector2(11, -19), Vector2(11, 19), Vector2(-11, 19)])
	draw_colored_polygon(xf * body, INK)
	draw_colored_polygon(xf * screen, Color("7cb86c"))
	draw_string(font, Vector2(14, 148), "Turn your phone sideways", HORIZONTAL_ALIGNMENT_CENTER, 356, 16, INK)
	draw_string(font, Vector2(14, 170), "Wildbond is played with the screen wide. Your journey waits right here.",
		HORIZONTAL_ALIGNMENT_CENTER, 356, 8, FAINT)
