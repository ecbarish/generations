extends RefCounted
## Coordinates from the reviewed measured plan. Outdoor movement uses one continuous grid.
const CELL := 1.25
static var PLAN: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://tests/layout_plan/layout.json"))
static var SOURCE: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/wildbond.json"))
var cells := {}
func _init() -> void:
	for map in PLAN.maps+PLAN.proposals:
		for y in map.rows.size():
			for x in str(map.rows[y]).length(): cells[Vector2i(x+int(map.offset[0]),y+int(map.offset[1]))]=str(map.rows[y])[x]
	for at in PLAN.connector: cells[Vector2i(at[0],at[1])]="."
	cells[Vector2i(0,7)]="."
	# Short east approach; the distant Stone-partner shelf is not moved to this entrance.
	for x in range(26,32):
		for y in [-11,-10,-9,-8]: cells[Vector2i(x,y)]="T" if y in [-11,-8] else "."
	cells[Vector2i(31,-10)]="G";cells[Vector2i(31,-9)]="G"
static func point(at: Vector2i) -> Vector3: return Vector3((at.x-11)*CELL,0,at.y*CELL)
static func tile(at: Vector3) -> Vector2i: return Vector2i(roundi(at.x/CELL)+11,roundi(at.z/CELL))
func glyph(at: Vector2i) -> String: return str(cells.get(at,"T"))
func blocked(at: Vector3) -> bool:
	for x in [-.16,.16]:
		for z in [-.16,.16]:
			if glyph(tile(at+Vector3(x,0,z))) in PLAN.solid+["C","G"]: return true
	return false
func area(at: Vector3) -> String:
	var cell := tile(at)
	if cell.x<0: return "Millgrass Lane"
	if cell.x>25 and cell.y<0: return "Dewcut Approach"
	return "Thornwood Trail" if cell.y<0 else "Larkhaven"
