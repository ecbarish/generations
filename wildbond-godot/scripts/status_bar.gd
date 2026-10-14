extends Control
## A thin strip along the top of the view (WBL-1): where you are, who walks in front, and the coins in the bag.
## It stays put. The big place-name still fades in on its own. Drawn at whole pixels, never scaled.

const CREAM := Color("f4e9cd")
const INK := Color(0.08, 0.07, 0.06, 0.88)
var area := ""
var lead := ""
var hp := 0
var hp_max := 1
var coins := 0
var font: Font

func _ready() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	position = Vector2(0, 0)
	size = Vector2(352, 12)
	font = ThemeDB.fallback_font

func setup(area_name: String, lead_name: String, cur: int, mx: int, money: int) -> void:
	area = area_name
	lead = lead_name
	hp = cur
	hp_max = maxi(mx, 1)
	coins = money
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(0, 0, 352, 12), INK)
	draw_string(font, Vector2(4, 9), area, HORIZONTAL_ALIGNMENT_LEFT, 100, 6, CREAM)
	if lead != "":
		draw_string(font, Vector2(108, 9), lead, HORIZONTAL_ALIGNMENT_LEFT, 72, 6, CREAM)
		var bar := Rect2(182, 4, 40, 4)
		draw_rect(bar, Color("2a2420"))
		var filled := int(bar.size.x) * clampi(hp, 0, hp_max) / hp_max
		var col := Color("5cc85a") if hp * 2 > hp_max else (Color("e8c03a") if hp * 5 > hp_max else Color("e0503a"))
		if filled > 0:
			draw_rect(Rect2(bar.position, Vector2(filled, 4)), col)
		draw_string(font, Vector2(226, 9), "%d/%d" % [hp, hp_max], HORIZONTAL_ALIGNMENT_LEFT, 48, 6, CREAM)
	var money := "%d coins" % coins
	draw_string(font, Vector2(276, 9), money, HORIZONTAL_ALIGNMENT_RIGHT, 72, 6, CREAM)
