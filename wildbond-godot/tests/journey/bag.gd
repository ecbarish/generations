extends "res://tests/private_sprites/bag.gd"
## The shared bag's party chooser must fit six recipients above its description.
func build() -> void:
	super.build()
	if not choosing: return
	var row := 0
	for control in controls:
		if control is Button and control.position.x==132 and control.position.y>=60 and control.position.y<190:
			control.add_theme_font_size_override("font_size",9)
			control.position.y=60+row*15
			control.size.y=15
			row+=1
