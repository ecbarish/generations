extends Control
const Map := preload("res://tests/opening/map.gd")
var world_map: RefCounted
var player_at := Vector3.ZERO
func _draw() -> void:
	if world_map==null: return
	var origin := Vector2(53,72)
	var scale_map := 3.5
	for cell in world_map.cells:
		var glyph: String=world_map.glyph(cell)
		var color: Color={"T":Color("57794c"),"~":Color("70a7bd"),"r":Color("b56c5a"),"#":Color("b56c5a"),".":Color("d4bd87"),"C":Color("766d7d"),"G":Color("a68d57")}.get(glyph,Color("93ad70"))
		draw_rect(Rect2(origin+Vector2(cell)*scale_map,Vector2.ONE*scale_map),color)
	var at := Map.tile(player_at)
	draw_circle(origin+(Vector2(at)+Vector2(.5,.5))*scale_map,2.7,Color("dd593d"))
	var font := ThemeDB.fallback_font
	for row in [["Thornwood",Vector2(79,11)],["Larkhaven",Vector2(87,127)],["Millgrass",Vector2(0,79)],["Dewcut",Vector2(164,22)]]:
		draw_string(font,row[1],row[0],HORIZONTAL_ALIGNMENT_LEFT,-1,9,Color("263e50"))
