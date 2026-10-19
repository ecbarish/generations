extends "res://tests/opening/map.gd"
## Expanded unsaved audition; route/cave/badge cells outside this village stay unchanged.
const BUILDINGS := {"center":Vector2i(0,4),"mart":Vector2i(24,5),"ranch":Vector2i(5,17)}
const ANCHORS := {"center":Vector2i(0,6),"mart":Vector2i(24,7),"ranch":Vector2i(5,19),"maren":Vector2i(8,19),"wren":Vector2i(15,11),"pip":Vector2i(28,11),"paddock":Vector2i(21,22),"item_lh1":Vector2i(28,20),"inn_neighbor":Vector2i(3,8)}
func _init() -> void:
    super()
    if "--compact" in OS.get_cmdline_user_args():return
    for y in range(0,26):
        for x in range(-5,33):
            cells[Vector2i(x,y)]="T" if x in [-5,32] or y in [0,25] else ","
    # Keep both established regional connections, with room to arrive and orient.
    for y in range(0,24):
        for x in range(10,13):cells[Vector2i(x,y)]="."
    for x in range(-5,31):
        for y in range(10,13):cells[Vector2i(x,y)]="."
    for x in range(-5,12):cells[Vector2i(x,7)]="."
    for kind in BUILDINGS:
        var at: Vector2i=BUILDINGS[kind]
        for x in range(at.x-2,at.x+3):
            for y in range(at.y-1,at.y+2):cells[Vector2i(x,y)]="r"
        cells[at+Vector2i(0,2)]="D"
    for x in range(5,13):
        for y in [19,20]:cells[Vector2i(x,y)]="."
    for y in range(6,12):cells[Vector2i(0,y)]="."
    for y in range(7,12):cells[Vector2i(24,y)]="."
    # Actual paddock perimeter and its single open entrance, not a painted rectangle.
    for x in range(17,27):
        for y in [16,22]:cells[Vector2i(x,y)]="="
    for y in range(16,23):
        for x in [17,26]:cells[Vector2i(x,y)]="="
    cells[Vector2i(21,22)]="."
    for x in range(11,29):cells[Vector2i(x,23)]="."
    for y in range(19,24):cells[Vector2i(28,y)]="."
    for rect in [Rect2i(5,3,3,3),Rect2i(-3,15,3,4),Rect2i(27,13,3,3)]:
        for y in range(rect.position.y,rect.end.y):
            for x in range(rect.position.x,rect.end.x):cells[Vector2i(x,y)]="T"

func area(at: Vector3) -> String:
    var cell := tile(at)
    if "--compact" not in OS.get_cmdline_user_args() and cell.x>=-5 and cell.x<=32 and cell.y>=0 and cell.y<=25:return "Larkhaven"
    return super.area(at)
