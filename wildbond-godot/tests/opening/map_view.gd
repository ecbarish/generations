extends Control
const Map := preload("res://tests/opening/map.gd")
var world_map: RefCounted
var player_at := Vector3.ZERO
func _draw() -> void:
	if world_map==null: return
	var minimum := Vector2(999,999);var maximum := Vector2(-999,-999)
	for cell in world_map.cells:
		minimum=minimum.min(Vector2(cell));maximum=maximum.max(Vector2(cell))
	var extent := maximum-minimum+Vector2.ONE
	var scale_map := minf((size.x-12)/extent.x,(size.y-12)/extent.y)
	var origin := Vector2((size.x-extent.x*scale_map)*.5,6)-minimum*scale_map
	for cell in world_map.cells:
		var glyph: String=world_map.glyph(cell)
		var color: Color={"T":Color("57794c"),"~":Color("70a7bd"),"r":Color("b56c5a"),"#":Color("b56c5a"),".":Color("d4bd87"),"C":Color("766d7d"),"G":Color("a68d57")}.get(glyph,Color("93ad70"))
		draw_rect(Rect2(origin+Vector2(cell)*scale_map,Vector2.ONE*scale_map),color)
	var at := Map.tile(player_at)
	draw_circle(origin+(Vector2(at)+Vector2(.5,.5))*scale_map,2.7,Color("dd593d"))
	var font := ThemeDB.fallback_font
	for row in [["Thornwood",Vector2(9,-36)],["Larkhaven",Vector2(10,7)],["Millgrass",Vector2(-14,5)],["Dewcut",Vector2(26,-12)]]:
		var label_at: Vector2=origin+row[1]*scale_map
		label_at.x=clampf(label_at.x,2,size.x-58)
		draw_string(font,label_at,row[0],HORIZONTAL_ALIGNMENT_LEFT,-1,8,Color("263e50"))
