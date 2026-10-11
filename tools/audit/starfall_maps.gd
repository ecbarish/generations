extends SceneTree
var main:Node
var results=[]
var layouts=[]
var target_layout=[]
const DIRS=[Vector2i.UP,Vector2i.DOWN,Vector2i.LEFT,Vector2i.RIGHT]
func _initialize():
 main=load('res://scenes/main.tscn').instantiate();main.no_save=true;root.add_child(main);run.call_deferred()
func coords(p):return [p.x,p.y]
func flood(start):
 var seen={start:true};var q=[start]
 while not q.is_empty():
  var p=q.pop_front()
  for d in DIRS:
   var n=p+d
   if not seen.has(n) and not main.solid(n):seen[n]=true;q.append(n)
 return seen
func inspect(label):
 var seen=flood(main.me.tile);var targets=[];var grid=[]
 var named={'SERVE_AT':main.SERVE_AT,'ORDER_AT':main.ORDER_AT,'READ_AT':main.READ_AT,'GATE':main.GATE,'INN_STEP':main.INN_STEP,'BRYN_HOME':main.BRYN_HOME}
 for name in named:
  var p=named[name];targets.append({'id':name,'at':coords(p),'reachable':seen.has(p)})
 for k in main.PLOTS:
  var p=main._step_of(k);targets.append({'id':k+'-step','at':coords(p),'reachable':seen.has(p),'prop_at':coords(main.PLOTS[k]+Vector2i(2,1))})
 for y in main.MAP.size():
  var line=''
  for x in main.MAP[0].length():
   var p=Vector2i(x,y);line+=('#' if main.solid(p) else ('o' if seen.has(p) else '?'))
  grid.append(line)
 if target_layout.is_empty():
  for target in targets:target_layout.append({'id':target.id,'at':target.at})
 var layout=layouts.find(grid)
 if layout<0:layout=layouts.size();layouts.append(grid)
 results.append({'state':label,'reachable_cells':seen.size(),'unreachable_targets':targets.filter(func(v):return not v.reachable).map(func(v):return v.id),'grid':layout})
func run():
 main.set_process(false);main.rank=3;main.built.clear()
 enumerate(main.PLOTS.keys(),0,[])
 var f=FileAccess.open(OS.get_environment('AUDIT_OUTPUT'),FileAccess.WRITE);f.store_string(JSON.stringify({'states':results,'grids':layouts,'targets':target_layout},'')+'\n');f.close()
 print('AUDIT: ',results.size(),' construction states')
 quit()

func enumerate(plots, index, used):
 if index == plots.size():
  inspect(JSON.stringify(main.built));return
 var key=plots[index]
 main.built.erase(key)
 enumerate(plots,index+1,used)
 for kind in main.BUILDINGS:
  if used.has(kind):continue
  main.built[key]={'what':kind,'left':0.0}
  enumerate(plots,index+1,used+[kind])
 main.built.erase(key)
