extends SceneTree
var main: Node
var results := []
var issues := []
const DIRS = [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]
func _initialize():
 main=load('res://scenes/main.tscn').instantiate()
 main.no_save=true
 main.settings.keep=false
 main.show_howto=false
 root.add_child(main)
 run.call_deferred()
func vec(a): return Vector2i(int(a[0]),int(a[1]))
func coords(p): return [p.x,p.y]
func open(p):
 return not main.solid(main.tile_at(p)) and not main._under_roof(p) and main.tile_at(p)!='D'
func flood(start):
 var seen={start:true};var q=[start]
 while not q.is_empty():
  var p=q.pop_front()
  for d in DIRS:
   var n=p+d
   if not seen.has(n) and open(n):seen[n]=true;q.append(n)
 return seen
func run():
 main.set_process(false);main.battle.set_process(false);main.stage='free'
 for actor in main.actors():actor.where='audit-hidden'
 var names=main.BUILT.duplicate();names.append('barn');names.append_array(main.INTERIORS.keys())
 for name in names:
  main.map_name=name;main._set_map(name)
  for actor in main.actors():actor.where='audit-hidden'
  var start=Vector2i(11,11) if name=='barn' else (main.INTERIORS[name].exit+Vector2i.UP if main.INTERIORS.has(name) else vec(main.DATA.MAPS[name].start))
  var reached=flood(start);var rows=main.cur_map();var exits=[];var doors=[];var targets=[];var roof_open=[];var grid=[]
  for y in rows.size():
   var line=''
   for x in rows[0].length():
    var p=Vector2i(x,y);var ch=rows[y][x]
    line+=('R' if main._under_roof(p) else ('#' if main.solid(ch) else ('o' if reached.has(p) else '?')))
    if main._under_roof(p) and not main.solid(ch):roof_open.append(coords(p))
    if ch=='d':
     exits.append({'at':coords(p),'reachable':reached.has(p),'tile':ch})
     if not reached.has(p):issues.append({'map':name,'kind':'interior-exit','at':coords(p)})
    if ch=='D':
     var front=p+Vector2i.DOWN
     doors.append({'at':coords(p),'front':coords(front),'front_reachable':reached.has(front),'roof':main._under_roof(p)})
     if not reached.has(front):issues.append({'map':name,'kind':'door-approach','at':coords(p)})
    if not main.indoors() and int(main.DATA.TILES.get(ch,{}).get('exit',0))==1:
     exits.append({'at':coords(p),'reachable':reached.has(p),'tile':ch})
     if not reached.has(p):issues.append({'map':name,'kind':'exit','at':coords(p)})
   grid.append(line)
  if not main.indoors():
   var data=main.DATA.MAPS[name]
   for item in data.get('items',[]):
    var p=vec(item.at);targets.append({'kind':'item','id':item.id,'at':coords(p),'reachable':reached.has(p)})
    if not reached.has(p):issues.append({'map':name,'kind':'item','id':item.id,'at':coords(p)})
   for npc in data.get('npcs',[]):
    var p=vec(npc.at);var near=false
    for d in DIRS:near=near or reached.has(p+d)
    targets.append({'kind':'npc','id':npc.who,'at':coords(p),'adjacent_reachable':near,'under_roof':main._under_roof(p)})
    if not near or main._under_roof(p):issues.append({'map':name,'kind':'npc','id':npc.who,'at':coords(p),'under_roof':main._under_roof(p)})
   for key in data.get('signs',{}):
    var bits=key.split(',');var p=Vector2i(int(bits[0]),int(bits[1]));var near=false
    for d in DIRS:near=near or reached.has(p+d)
    targets.append({'kind':'sign','at':coords(p),'adjacent_reachable':near})
    if not near:issues.append({'map':name,'kind':'sign','at':coords(p)})
   # Every actual portal arrival must be in the same movement component.
   for other in main.DATA.MAPS:
    for ex in main.DATA.MAPS[other].exits.values():
     if ex.to==name:
      var p=Vector2i(int(ex.x),int(ex.y))
      targets.append({'kind':'arrival','from':other,'at':coords(p),'reachable':reached.has(p)})
      if not reached.has(p):issues.append({'map':name,'kind':'arrival','from':other,'at':coords(p)})
  if main.INTERIORS.has(name):
   var p=main.INTERIORS[name].keeper_at+Vector2i(0,2)
   targets.append({'kind':'keeper-front','at':coords(p),'reachable':reached.has(p)})
   if not reached.has(p):issues.append({'map':name,'kind':'keeper-front','at':coords(p)})
   if main.INTERIORS[name].has('find'):
    var item=main.INTERIORS[name].find;var at=item.at
    targets.append({'kind':'home-find','id':item.id,'at':coords(at),'reachable':reached.has(at)})
    if not reached.has(at):issues.append({'map':name,'kind':'home-find','at':coords(at)})
  # Witness route(), which ignores roofs, returning a physically illegal step.
  var witness={}
  if not roof_open.is_empty():
   var starts=reached.keys().filter(func(v):
    for p in roof_open:
     if (v-vec(p)).length()<=3.0:return true
    return false)
   for from in starts:
    for goal in reached:
     var route=main.route(from,goal)
     var blocked=route.filter(func(v):return main._under_roof(v))
     if not blocked.is_empty():
      witness={'from':coords(from),'to':coords(goal),'blocked':blocked.map(func(v):return coords(v)),'route':route.map(func(v):return coords(v))};break
    if not witness.is_empty():break
  if not witness.is_empty():
   main.me.where=name;main.me.tile=vec(witness.from);main.me.pos=Vector2(main.me.tile)*main.TILE
   main.me.path.clear();main.walk_to.clear();main.partner=null;main.meet_after=null;main.trans_t=-1.0
   for panel in [main.lessons,main.card,main.battle,main.shop,main.book]:panel.visible=false
   main._tap(Vector2(vec(witness.to))*main.TILE+Vector2(8,8))
   witness['tap_queued_route']=main.walk_to.map(func(v):return coords(v))
   witness['goal_walkable']=main.walkable(vec(witness.to))
   witness['first_blocked_walkable']=main.walkable(vec(witness.blocked[0]))
   main.me.where='audit-hidden'
  results.append({'map':name,'size':[rows[0].length(),rows.size()],'start':coords(start),'reachable_cells':reached.size(),'doors':doors,'exits':exits,'targets':targets,'roof_on_open_tiles':roof_open,'route_roof_witness':witness,'grid':grid})
 var output={'maps':results,'findings':issues}
 var path=OS.get_environment('AUDIT_OUTPUT')
 var f=FileAccess.open(path,FileAccess.WRITE);f.store_string(JSON.stringify(output,'  ')+'\n');f.close()
 print('AUDIT: ',results.size(),' maps; ',issues.size(),' target findings')
 quit()
