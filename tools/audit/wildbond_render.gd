extends SceneTree
const R := preload("res://scripts/rules.gd")
var main: Node
var manifest: Array = []
var folder := ""
func _initialize() -> void:
 main = load("res://scenes/main.tscn").instantiate()
 main.no_save = true
 main.settings.keep = false
 main.show_howto = false
 root.add_child(main)
 capture.call_deferred()
func xy(p: Vector2i) -> Array:
 return [p.x,p.y]
func place_at(name: String, p: Vector2i) -> void:
 main._set_map(name)
 main.me.where=name
 main.me.tile=p
 main.me.pos=Vector2(p)*main.TILE
 main.me.path.clear()
 main.me.face=Vector2i.UP
 main.walk_to.clear()
 main.lines.clear()
 main.trans_t=-1.0
 if main.partner:
  main.partner.where=name
  main.partner.tile=p+Vector2i.DOWN
  main.partner.pos=Vector2(main.partner.tile)*main.TILE
  main.partner.path.clear()
 main.cam.position=main.me.pos+Vector2(8,8)
 main.cam.reset_smoothing()
func capture() -> void:
 folder=OS.get_environment("REVIEW_OUTPUT")
 DirAccess.make_dir_recursive_absolute(folder)
 main.set_process(false)
 main.battle.set_process(false)
 main.stage="free"
 main.fade_in=1.0
 main.fade_rect.color.a=0.0
 main.painted=true
 main.spilled=true
 for panel in [main.register,main.card,main.title,main.howto,main.satchel,main.lessons,main.battle,main.shop,main.book]:
  panel.visible=false
 main.lines.clear()
 var rng:=RandomNumberGenerator.new()
 rng.seed=150
 main.team=[R.make("cindercub",8,{},rng)]
 main.partner=main.starters[0]
 main.partner.id="cindercub"
 root.borderless=true
 root.min_size=Vector2i(1,1)
 root.position=Vector2i.ZERO
 var names: Array=main.BUILT.duplicate()
 names.append("barn")
 names.append_array(main.INTERIORS.keys())
 for size in [Vector2i(1920,1080),Vector2i(812,375)]:
  root.size=size
  main.restore.clear()
  for name in names:
   main.restore.append({"where":name,"at":Vector2(192,108),"r":5000.0,"goal":5000.0})
  for name in names:
   var p:=Vector2i(11,10)
   if name in main.BUILT:
    var start=main.DATA.MAPS[name].start
    p=Vector2i(int(start[0]),int(start[1]))
   place_at(name,p)
   await shot("%s-overview"%name,size,{"kind":"overview"})
   var rows=main.cur_map()
   for y in rows.size():
    for x in rows[0].length():
     if rows[y][x]!="D":continue
     var door:=Vector2i(x,y)
     var functional: String="closed facade"
     if name=="larkhaven" and main.DOORS.has(door):functional=str(main.DOORS[door])
     if name=="larkhaven" and door==main.BARN_DOOR:functional="barn"
     for offset in [Vector2i(-1,1),Vector2i(0,1),Vector2i(1,1)]:
      var at: Vector2i=door+offset
      if main.solid(main.tile_at(at)) or main._under_roof(at):
       manifest.append({"map":name,"door":xy(door),"at":xy(at),"skipped":"solid approach; static audit covers reachability"})
       continue
      place_at(name,at)
      await shot("%s-door-%d-%d-from-%d-%d"%[name,x,y,at.x,at.y],size,{"kind":"door approach","door":xy(door),"function":functional})
   if main.INTERIORS.has(name):
    place_at(name,main.INTERIORS[name].keeper_at+Vector2i(0,2))
    await shot("%s-resident"%name,size,{"kind":"resident approach"})
   if name=="barn":
    for at in [Vector2i(4,6),Vector2i(21,8),Vector2i(2,10)]:
     place_at(name,at)
     await shot("barn-service-%d-%d"%[at.x,at.y],size,{"kind":"stall trough workbench"})
  # Faded colour is a distinct renderer state, not a photo filter.
  main.spilled=false
  main.restore.clear()
  for name in main.BUILT:
   var start=main.DATA.MAPS[name].start
   place_at(name,Vector2i(int(start[0]),int(start[1])))
   await shot("%s-faded"%name,size,{"kind":"faded overview"})
  main.spilled=true
 root.size=Vector2i(375,812)
 place_at("larkhaven",Vector2i(11,7))
 await shot("portrait",root.size,{"kind":"portrait rotation behavior"})
 var f=FileAccess.open(folder+"/manifest.json",FileAccess.WRITE)
 f.store_string(JSON.stringify(manifest,"  ")+"\n")
 f.close()
 print("MAP_REVIEW captures: ",manifest.size())
 main.queue_free()
 await process_frame
 quit()
func shot(label: String,size: Vector2i,meta: Dictionary) -> void:
 main._update_ui()
 main.queue_redraw()
 main.colour_layer.queue_redraw()
 main.canopy.queue_redraw()
 for i in 4:await process_frame
 await RenderingServer.frame_post_draw
 var position:=DisplayServer.window_get_position()
 var actual:=DisplayServer.window_get_size()
 var filename="%s-%dx%d.png"%[label,size.x,size.y]
 var output: Array=[]
 var status:=OS.execute("import",["-window","root","-crop","%dx%d+%d+%d"%[actual.x,actual.y,position.x,position.y],"+repage",folder+"/"+filename],output,true)
 if status!=0 or actual!=size:
  push_error("Capture failed "+filename+str(output));quit(2);return
 meta.merge({"file":filename,"map":main.map_name,"player":xy(main.me.tile),"partner":xy(main.partner.tile),"size":xy(actual),"spilled":main.spilled,"camera":xy(Vector2i(main.cam.position)),"scene_state":"free; actors retained; no saves; paused time; startup fade settled"})
 manifest.append(meta)
 print("CAPTURE ",filename)
