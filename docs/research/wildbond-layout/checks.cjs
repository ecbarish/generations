const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..');
const plan=JSON.parse(fs.readFileSync(path.join(root,'wildbond-godot/tests/layout_plan/layout.json')));
const raw=fs.readFileSync(path.join(root,plan.source));const data=JSON.parse(raw);
const graph=JSON.parse(fs.readFileSync(path.join(root,plan.regional_authority)));
let passed=0;const check=(ok,note)=>{assert(ok,note);passed++};
check(crypto.createHash('sha256').update(raw).digest('hex')===plan.source_sha256,'source fingerprint current');
check(JSON.stringify(plan.solid)===JSON.stringify(Object.keys(data.TILES).filter(k=>data.TILES[k].solid)),'collision keys retained');
const current=new Map(),proposed=new Map();
for(const map of plan.maps){const source=data.MAPS[map.id];for(const key of ['rows','start','exits','doors','pen','signs'])check(JSON.stringify(map[key])===JSON.stringify(source[key]??({doors:{},signs:{},pen:null}[key])),'current '+map.id+' '+key+' retained');check(JSON.stringify(map.npcs)===JSON.stringify(source.npcs.map(n=>({who:n.who,at:n.at,act:n.act??null}))),'NPC anchors retained');check(JSON.stringify(map.items)===JSON.stringify(source.items.map(i=>({id:i.id,at:i.at}))),'item anchors retained');map.rows.forEach((row,y)=>[...row].forEach((c,x)=>current.set([x+map.offset[0],y+map.offset[1]].join(','),c)));}
for(const cell of plan.connector)current.set(cell.join(','),'.');
for(const map of plan.proposals){check(map.rows.every(r=>r.length===map.rows[0].length),'candidate rows rectangular');check(map.status==='candidate_geometry','proposed geometry clearly marked');map.rows.forEach((row,y)=>[...row].forEach((c,x)=>proposed.set([x+map.offset[0],y+map.offset[1]].join(','),c)));}
function glyph(x,y,future){if(future&&x===0&&y===7)return '.';return (future?proposed.get([x,y].join(',')):undefined)??current.get([x,y].join(','))??'T';}
function distance(target,future=false,avoidGrass=false){let queue=[[11,7,0]],seen=new Set(['11,7']);for(let i=0;i<queue.length;i++){const [x,y,d]=queue[i];if(x===target[0]&&y===target[1])return d;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=[nx,ny].join(','),g=glyph(nx,ny,future);if(seen.has(k)||plan.solid.includes(g)||g==='C'||(avoidGrass&&g==='"'))continue;seen.add(k);queue.push([nx,ny,d+1]);}}return null;}
const metrics={cell_metres:1.25,walk_metres_per_second:3,paths:[]};
for(const [name,at] of [['Healing Inn',[4,4]],['Shop',[18,4]],['Ranch',[7,10]],['Maren',[9,11]],['Pip',[21,7]],['Town item',[22,12]],['Bram',[11,-13]],['Trail item',[5,-15]],['North continuation',[10,-20]],['East grove branch',[25,-10]]]){const cells=distance(at);check(cells!==null,name+' reachable in existing layout');metrics.paths.push({from:'Larkhaven start (11,7)',to:name,cells,metres:cells*1.25,movement_only_seconds:Number((cells*1.25/3).toFixed(1))});}
check(distance([10,-20],false,true)!==null,'safe main route avoids tall grass');
check(distance([-14,7])===null,'current map does not have west branch');
check(distance([-14,7],true)!==null,'planned branch reaches cave approach');
check(distance([-15,7],true)===null,'cave mouth stays closed');
check(glyph(0,7,false)==='T'&&glyph(0,7,true)==='.', 'only planned mode opens candidate west boundary');
for(const link of plan.regional.links)check(JSON.stringify(link)===JSON.stringify(graph.links.find(l=>l.id===link.id)),'regional link/gate reused verbatim: '+link.id);
check(plan.regional.total_places===graph.places.length&&plan.regional.total_links===graph.links.length,'region counts use authoritative graph');
check(plan.regional.links.some(l=>l.id==='larkhaven--millgrass'),'local plan respects west route');
const home=plan.regional.links.find(l=>l.id==='larkburrow--sunthread');check(home.gate.some(g=>g.field==='stone')&&home.gate.some(g=>g.badge==='loom'),'later home shortcut retains both requirements');
for(const name of ['local-layout.svg','local-layout.png','art-reference.png','art-prompt.txt','location-template.md'])check(fs.existsSync(path.join(__dirname,name)),'review artifact exists: '+name);
fs.writeFileSync(path.join(__dirname,'walking-metrics.json'),JSON.stringify(metrics,null,2)+'\n');
console.log(`Layout checks: ${passed} passed, 0 failed. Wrote movement-only walking metrics.`);
