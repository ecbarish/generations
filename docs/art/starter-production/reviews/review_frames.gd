extends SceneTree
# Review-only analysis of PR #559 starter sheets. Writes to an external folder; never touches the repo.
const OUT := "C:/Users/evanb/AppData/Local/Temp/claude-starter-review/"
var art

func _init() -> void:
	art = load("res://tests/starter_sprites/art.gd").new()
	art.open()
	for name in ["mosshog","ripplet","cindercub"]:
		var e: Dictionary = art.entries[name]
		var img := Image.load_from_file(ProjectSettings.globalize_path("res://tests/starter_sprites/"+e.file))
		img.convert(Image.FORMAT_RGBA8)
		var pal: PackedColorArray = art.palettes[name]
		var wstep: float = float(e.frames[5].region[3])/32.0
		var bstep: float = float(e.frames[0].region[3])/64.0
		print("== ",name," world step ",wstep," battle step ",bstep)
		var natives := []
		for i in 24:
			var f: Dictionary = e.frames[i]
			var r: Array = f.region
			var step := bstep if i < 4 else wstep
			var n := _native(img, r, step, pal)
			natives.append(n)
			# alpha statistics in region: soft matte that the 0.5 cut-off drops or keeps
			var soft_kept := 0; var soft_dropped := 0; var solid := 0
			for y in r[3]:
				for x in r[2]:
					var a := img.get_pixel(r[0]+x, r[1]+y).a
					if a >= 0.99: solid += 1
					elif a >= 0.5: soft_kept += 1
					elif a > 0.02: soft_dropped += 1
			var nb := _bounds(n)
			# body centre (alpha centroid) relative to the foot anchor, in native pixels
			var c := _centroid(n)
			var ax: float = f.anchor[0]/step
			print("%2d native %dx%d ink %s centroid-anchor dx %.1f | solid %d softkept %d softdrop %d" % [i, n.get_width(), n.get_height(), str(nb.size), c.x-ax, solid, soft_kept, soft_dropped])
		_sheet(name, e, natives, wstep, bstep)
	quit()

func _native(img: Image, r: Array, step: float, pal: PackedColorArray) -> Image:
	var w := int(roundf(r[2]/step)); var h := int(roundf(r[3]/step))
	var n := Image.create(w, h, false, Image.FORMAT_RGBA8)
	for y in h:
		for x in w:
			var sx: int = r[0] + int((x+0.5)/w*r[2]); var sy: int = r[1] + int((y+0.5)/h*r[3])
			var c := img.get_pixel(sx, sy)
			if c.a < 0.5: continue
			var best := pal[0]; var d := 99.0
			for p in pal:
				var dd := (c.r-p.r)*(c.r-p.r)+(c.g-p.g)*(c.g-p.g)+(c.b-p.b)*(c.b-p.b)
				if dd < d: d = dd; best = p
			n.set_pixel(x, y, Color(best.r, best.g, best.b, 1))
	return n

func _bounds(n: Image) -> Rect2i:
	return n.get_used_rect()

func _centroid(n: Image) -> Vector2:
	var s := Vector2.ZERO; var k := 0
	for y in n.get_height():
		for x in n.get_width():
			if n.get_pixel(x,y).a > 0.5: s += Vector2(x,y); k += 1
	return s/maxf(k,1)

# Contact sheet: one row per pose group, each frame placed by its foot anchor (red tick) on a shared
# ground line; last cell overlays the group's silhouettes in different colours to show drift.
func _sheet(name: String, e: Dictionary, natives: Array, wstep: float, bstep: float) -> void:
	var rows := [[0,1],[2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[16,17,18,19],[20,21,22,23]]
	var C := 240
	var sheet := Image.create(C*5, C*rows.size(), false, Image.FORMAT_RGBA8)
	sheet.fill(Color(0.86,0.84,0.78))
	for ri in rows.size():
		var group: Array = rows[ri]
		var S := 3 if ri < 2 else 6
		var ground := ri*C + C - 14
		var tints := [Color(1,0,0,0.5),Color(0,0.6,1,0.5),Color(1,0.75,0,0.5),Color(0.2,0.9,0.2,0.5)]
		for gi in group.size():
			var i: int = group[gi]
			var step := bstep if i < 4 else wstep
			var n: Image = natives[i]
			var ax := int(roundf(e.frames[i].anchor[0]/step)); var ay := int(roundf(e.frames[i].anchor[1]/step))
			var big := n.duplicate(); big.resize(n.get_width()*S, n.get_height()*S, Image.INTERPOLATE_NEAREST)
			var cx := gi*C + C/2
			sheet.blend_rect(big, Rect2i(Vector2i.ZERO, big.get_size()), Vector2i(cx - ax*S, ground - ay*S))
			for y in 10: sheet.set_pixel(cx, ground+2+y, Color(0.8,0,0))
			var sil := Image.create(n.get_width()*S, n.get_height()*S, false, Image.FORMAT_RGBA8)
			for y in sil.get_height():
				for x in sil.get_width():
					if big.get_pixel(x,y).a > 0.5: sil.set_pixel(x,y,tints[gi])
			sheet.blend_rect(sil, Rect2i(Vector2i.ZERO, sil.get_size()), Vector2i(4*C + C/2 - ax*S, ground - ay*S))
		for x in sheet.get_width(): sheet.set_pixel(x, ground, Color(0.3,0.3,0.3))
		for y in C: sheet.set_pixel(4*C + C/2, ri*C + y, Color(0.5,0,0,0.6))
	sheet.save_png(OUT + name + "-native-anchored.png")
