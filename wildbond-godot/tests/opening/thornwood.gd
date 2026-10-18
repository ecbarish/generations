extends RefCounted
## Native chapter extension. Canonical map/data and regional graph remain unchanged.
const OFFSET := Vector2i(-3,-40)
const HEALER := Vector2i(3,-27)
const ISOLDE := Vector2i(9,-38)
const GATE := Vector2i(10,-40)
const ROSTER := [["pokemon:16",6],["pokemon:194",7],["wildbond:mosshog",8]]

static func add_to(cells: Dictionary, source: Dictionary) -> void:
	for y in source.rows.size():
		for x in str(source.rows[y]).length(): cells[OFFSET+Vector2i(x,y)]=str(source.rows[y])[x]
	# Two-cell connector joins the original south path to the trail's north edge.
	for y in range(-24,-20):
		for x in [10,11]: cells[Vector2i(x,y)]="."
	# Proposed Gate Loft footprint; door and approach are explicit, reachable cells.
	for y in range(-30,-27):
		for x in range(1,6): cells[Vector2i(x,y)]="r"
	for x in range(3,12): cells[Vector2i(x,-27)]="."
	for center in [Vector2i(17,-29),Vector2i(17,-35)]:
		for y in range(center.y-1,center.y+2):
			for x in range(center.x-2,center.x+3):cells[Vector2i(x,y)]="r"
		for x in range(10,18):cells[Vector2i(x,center.y+2)]="."
	for y in range(-43,-39):
		for x in [10,11]: cells[Vector2i(x,y)]="."
	for x in [10,11]:
		cells[Vector2i(x,-40)]="G"
		cells[Vector2i(x,-44)]="G" # Unbuilt Saltmarsh route stays a physical boundary.

static func apply_badge(cells: Dictionary, earned: bool) -> void:
	for x in [10,11]: cells[Vector2i(x,-40)]="." if earned else "G"
