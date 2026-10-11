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
 main._skip_opening()
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
   if name in main.BUILT:
    var width: int=rows[0].length()
    var height: int=rows.size()
    for anchor in [Vector2i(6,5),Vector2i(width-7,5),Vector2i(6,height-6),Vector2i(width-7,height-6)]:
     var nearest: Vector2i=p
     var distance: float=100000.0
     for yy in height:
      for xx in width:
       var candidate:=Vector2i(xx,yy)
       if main.solid(main.tile_at(candidate)) or main._under_roof(candidate) or main.tile_at(candidate)=="D":continue
       if candidate.distance_squared_to(anchor)<distance:
        nearest=candidate;distance=candidate.distance_squared_to(anchor)
     place_at(name,nearest)
     await shot("%s-sector-%d-%d"%[name,anchor.x,anchor.y],size,{"kind":"settled sector coverage"})
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
 # Drive actual engine input actions and actual tap handler, not _step/_switch.
 for size in [Vector2i(1920,1080),Vector2i(812,375)]:
  root.size=size
  var destinations: Dictionary=main.DOORS.duplicate()
  destinations[main.BARN_DOOR]="barn"
  for door in destinations:
   for method in ["key-action","tap-handler"]:
    var destination: String=destinations[door]
    place_at("larkhaven",door+Vector2i.DOWN)
    main.restore.clear()
    for n in names:main.restore.append({"where":n,"at":Vector2(192,108),"r":5000.0,"goal":5000.0})
    if method=="key-action":Input.action_press("move_up")
    else:main._tap(Vector2(door)*main.TILE+Vector2(8,8))
    var queued: Array=main.walk_to.map(func(v):return xy(v))
    var route_candidate: Array=main.route(main.me.tile,door).map(func(v):return xy(v))
    var goal_walkable: bool=main.walkable(door)
    for frame in 120:
     main._process(1.0/60.0)
     if method=="key-action" and frame==1:Input.action_release("move_up")
     if main.map_name==destination and main.trans_t<0.0:break
    Input.action_release("move_up")
    var arrived: bool=main.map_name==destination
    await shot("%s-%s-entry"%[destination,method],size,{"kind":"engine entry transition","method":method,"expected":destination,"arrived":arrived,"door":xy(door),"from":xy(door+Vector2i.DOWN),"queued_at_input":queued,"route_candidate":route_candidate,"goal_walkable":goal_walkable})
    if arrived:
     main.lines.clear()
     var exit_tile: Vector2i=main.BARN_EXIT if destination=="barn" else main.INTERIORS[destination].exit
     if method=="key-action":Input.action_press("move_down")
     else:main._tap(Vector2(exit_tile)*main.TILE+Vector2(8,8))
     for frame in 180:
      main._process(1.0/60.0)
      if main.map_name=="larkhaven" and main.trans_t<0.0:break
     Input.action_release("move_down")
     await shot("%s-%s-exit"%[destination,method],size,{"kind":"engine exit transition","method":method,"expected":"larkhaven","arrived":main.map_name=="larkhaven"})
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
 main.place_t=4.0
 main.cam.force_update_scroll()
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
