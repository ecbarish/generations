extends RefCounted
## Read-only presentation of the existing chapter's actual battle records.
const Catalogue := preload("res://tests/journey/catalogue.gd")
const EFFECTS := {
	"sand-attack":"Lowers the target's accuracy.",
	"tail-whip":"Lowers the target's Defense.",
	"mud-shot":"Lowers the target's Speed on a hit.",
	"ember":"May burn the target (10%).",
	"flamethrower":"May burn the target (10%).",
	"quick-attack":"Usually strikes first."
}

static func describe(c: Dictionary) -> Dictionary:
	var start := Catalogue.threshold(c.id,c.level)
	var end := Catalogue.threshold(c.id,mini(100,int(c.level)+1))
	var moves := []
	for id in c.moves:
		var m: Dictionary=Catalogue.DATA.moves[id]
		moves.append({"id":id,"name":m.name,"type":str(m.el).capitalize(),"category":"Status" if m.pow==0 else ("Special" if m.spec==1 else "Physical"),"power":"—" if m.pow==0 else str(int(m.pow)),"accuracy":"%d%%" % roundi(float(m.accuracy)*100),"pp":"%d/%d" % [c.pp[id],m.pp],"effect":EFFECTS.get(id,"Deals damage to the target.")})
	return {"name":c.name,"level":int(c.level),"types":" / ".join(c.types.map(func(t):return str(t).capitalize())),"status":"Fainted" if c.hp<=0 else ("Burned" if c.status=="burn" else "Healthy"),"hp":"%d/%d HP" % [c.hp,c.max_hp],"hp_fraction":clampf(float(c.hp)/c.max_hp,0,1),"xp":"Maximum level" if c.level==100 else "%d EXP to Lv.%d" % [end-int(c.xp),int(c.level)+1],"xp_fraction":1.0 if c.level==100 else clampf(float(int(c.xp)-start)/maxi(1,end-start),0,1),"stats":"Attack %d    Defense %d\nSp. Atk %d    Sp. Def %d\nSpeed %d" % [c.power,c.guard,c.wits,c.spirit,c.speed],"moves":moves}

static func meter(scene: Node, at: Vector2, width: float, fraction: float, color: Color) -> void:
	var back := ColorRect.new()
	back.position=at;back.size=Vector2(width,4);back.color=scene.INK;back.mouse_filter=Control.MOUSE_FILTER_IGNORE
	scene.detail.add_child(back)
	var fill := ColorRect.new()
	fill.position=Vector2(1,1);fill.size=Vector2((width-2)*fraction,2);fill.color=color;fill.mouse_filter=Control.MOUSE_FILTER_IGNORE
	back.add_child(fill)

static func build(scene: Node, index: int, selected: int) -> void:
	var c: Dictionary=scene.supplies.team[index]
	var v := describe(c)
	if scene.detail!=null:scene.detail.queue_free()
	if scene.menu!=null:scene.menu.hide()
	scene.detail=scene._panel(Vector2(5,7),Vector2(374,202))
	scene.detail.set_meta("summary",v)
	scene._label(scene.detail,"%s  Lv.%d" % [v.name,v.level],Vector2(10,6),Vector2(224,18),13)
	scene._label(scene.detail,"%d / %d" % [index+1,scene.supplies.team.size()],Vector2(322,8),Vector2(43,16),10)
	scene._label(scene.detail,v.types,Vector2(10,27),Vector2(155,15),10)
	scene._label(scene.detail,v.status,Vector2(10,43),Vector2(100,15),10)
	var art: Dictionary=scene.pack.battle_frame(c.id,false)
	if not art.is_empty():
		var atlas := AtlasTexture.new();atlas.atlas=art.texture;atlas.region=art.region
		var portrait := TextureRect.new();portrait.texture=atlas;portrait.position=Vector2(12,61);portrait.size=Vector2(88,65)
		portrait.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;portrait.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;portrait.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST;portrait.mouse_filter=Control.MOUSE_FILTER_IGNORE
		scene.detail.add_child(portrait)
	else:
		scene._label(scene.detail,c.name,Vector2(12,77),Vector2(88,38),12)
	scene._label(scene.detail,v.hp,Vector2(10,128),Vector2(135,15),10)
	meter(scene,Vector2(10,144),142,v.hp_fraction,Color("64ab72") if v.hp_fraction>.5 else (Color("d5ae51") if v.hp_fraction>.2 else Color("c46660")))
	scene._label(scene.detail,v.xp,Vector2(10,150),Vector2(147,16),9)
	meter(scene,Vector2(10,168),142,v.xp_fraction,Color("65a8cc"))
	scene._label(scene.detail,v.stats,Vector2(166,28),Vector2(198,42),10)
	var buttons := []
	for i in v.moves.size():
		var m: Dictionary=v.moves[i]
		var button: Button=scene._choice(scene.detail,("› " if i==selected else "")+m.name+"  "+m.pp,Vector2(166,73+i*18),Vector2(198,18),func():scene.party_action(index,i))
		button.add_theme_font_size_override("font_size",10);buttons.append(button)
	if not v.moves.is_empty():
		selected=clampi(selected,0,v.moves.size()-1)
		var m: Dictionary=v.moves[selected]
		scene._label(scene.detail,"%s / %s · Power %s · %s\n%s" % [m.type,m.category,m.power,m.accuracy,m.effect],Vector2(166,147),Vector2(198,29),9)
	var actions := ["Previous","Next","Lead","Store","Back"]
	var remaining: Array=scene.supplies.team.duplicate()
	remaining.remove_at(index)
	var callbacks := [func():scene.party_action(posmod(index-1,scene.supplies.team.size())),func():scene.party_action((index+1)%scene.supplies.team.size()),func():scene.close_menu();scene.set_lead(index),func():scene.close_menu();scene.store_partner(index),scene.show_party]
	for i in actions.size():
		var button: Button=scene._choice(scene.detail,actions[i],Vector2(10+i*71,179),Vector2(68,19),callbacks[i])
		if i<2:button.disabled=scene.supplies.team.size()<2
		if i==2:button.disabled=index==0 or c.hp<=0
		if i==3:button.disabled=scene.supplies.team.size()<=1 or scene.profile.state.box.size()>=60 or remaining.all(func(other):return other.hp<=0)
	if not buttons.is_empty():buttons[clampi(selected,0,buttons.size()-1)].grab_focus()
