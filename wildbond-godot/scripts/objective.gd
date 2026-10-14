extends Control
## The next thing to do (WBL-4). One short line, in a box exactly as tall as the words, so it cannot spill out.

const INK := Color("3e2c20")
const CREAM := Color("f4e9cd")
var line := ""
var font_size := 8
var font: Font

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	font = ThemeDB.fallback_font
	visible = false

func setup(text: String, px := 8) -> void:
	line = text
	font_size = px
	visible = text != ""
	queue_redraw()

## How tall the words are inside a box of this width, including the padding the box draws.
func block_height(width: float) -> float:
	if line == "" or font == null:
		return 0.0
	var inner := maxf(8.0, width - 8.0)
	return font.get_multiline_string_size(line, HORIZONTAL_ALIGNMENT_LEFT, inner, font_size).y + 6.0

func _draw() -> void:
	if line == "":
		return
	draw_rect(Rect2(Vector2.ZERO, size), Color("4a2e1a"))
	draw_rect(Rect2(1, 1, maxf(0, size.x - 2), maxf(0, size.y - 2)), CREAM)
	draw_multiline_string(font, Vector2(4, font_size + 2), line, HORIZONTAL_ALIGNMENT_LEFT, maxf(8.0, size.x - 8.0), font_size, -1, INK)
