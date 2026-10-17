// Read-only source extraction and deterministic diagram generation. Run from any cwd.
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const folder=__dirname, root=path.resolve(folder,'../../..');
const source=path.join(root,'wildbond-godot/data/wildbond.json');
const data=JSON.parse(fs.readFileSync(source));
const graph=JSON.parse(fs.readFileSync(path.join(root,'docs/plans/wildbond-world/world-graph.json')));
const sha=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const ids=['larkhaven','thornwood_route'];
const maps=ids.map(id=>{const m=data.MAPS[id];return {id,name:m.name,offset:id==='larkhaven'?[0,0]:[-3,-20],rows:m.rows,start:m.start,exits:m.exits,doors:m.doors??{},pen:m.pen??null,npcs:m.npcs.map(n=>({who:n.who,at:n.at,act:n.act??null})),items:m.items.map(i=>({id:i.id,at:i.at})),signs:m.signs??{}};});
const localIds=['larkhaven','millgrass','larkburrow','thornwood_route','dewcut','thornwood_grove','thornwood','rootwater','knothollow','sunthread'];
const plan={schema:1,title:'Larkhaven / Thornwood local layout study',source:'wildbond-godot/data/wildbond.json',source_sha256:sha,regional_authority:'docs/plans/wildbond-world/world-graph.json',units:{cell_metres:1.25,north:'negative world Z',origin_global_cell:[11,0]},status:'study_only',solid:Object.keys(data.TILES).filter(k=>data.TILES[k].solid),maps,connector:[[10,-2],[11,-2],[10,-1],[11,-1]],proposals:[{id:'millgrass',name:'Millgrass Lane',status:'candidate_geometry',offset:[-15,3],rows:['TTTTTTTTTTTTTTTT','T,,,,,,,,,,,,,,T','T,,,,,,,,,,,,,,T','T,,............T','C...,,,,,,,,,...','T,,,,,,,,,,,,,,T','T,,,,,,,,,,,,,,T','T,,,,,,,,,,,,,,T','TTTTTTTTTTTTTTTT'],notes:'Proposed west opening at Larkhaven (0,7); no production landing assignment. C is the visible closed Larkburrow mouth; no new cave or shortcut is opened.'}],reserved:[{id:'west_lane',at:[0,7],target:'millgrass',status:'planned_phase_1'},{id:'dewcut',at:[25,-10],target:'dewcut',status:'planned_phase_1',note:'Current east exit goes directly to Old Root Grove; planned Dewcut takes over that connection, retaining the Stone-partner requirement at its far shelf.'}],regional:{places:graph.places.filter(p=>localIds.includes(p.id)),links:graph.links.filter(l=>localIds.includes(l.a)&&localIds.includes(l.b)),total_places:graph.places.length,total_links:graph.links.length,source_note:'The region graph is planning data, not loaded by the current adventure.'}};
const out=path.join(root,'wildbond-godot/tests/layout_plan');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'layout.json'),JSON.stringify(plan,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const tile=26,ox=452,oy=640;
const pos=(x,y)=>[ox+x*tile,oy+y*tile];
const colors={'T':'#355744','~':'#5795aa','r':'#bc7060','#':'#d4c9a8','=':'#a19372','P':'#b8964f','D':'#f8e4b7','N':'#4ca99a','S':'#4ca99a','E':'#4ca99a','"':'#739b57','.':'#d6c7a2',',':'#b6c595','f':'#d9b87c','C':'#716b72'};
let s=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1110" viewBox="0 0 1600 1110"><rect width="1600" height="1110" fill="#f7f2e4"/><style>text{font-family:Segoe UI,Arial,sans-serif;fill:#263f42}.small{font-size:15px}.label{font-size:17px;font-weight:700}</style><text x="40" y="48" font-size="32" font-weight="700">LARKHAVEN + THORNWOOD</text><text x="40" y="78" font-size="18">Measured local layout · north up · 1 cell = 1.25 m · study, not a production map update</text>`;
function grid(m,proposed=false){m.rows.forEach((row,y)=>[...row].forEach((c,x)=>{let [px,py]=pos(x+m.offset[0],y+m.offset[1]);s+=`<rect x="${px}" y="${py}" width="26" height="26" fill="${colors[c]??'#b6c595'}" stroke="${proposed?'#c99a4c':'#f7f2e4'}" stroke-width=".4"/>`;if('DPNSEC'.includes(c))s+=`<text x="${px+13}" y="${py+18}" font-size="15" text-anchor="middle">${c}</text>`;}));}
for(const m of maps)grid(m);for(const m of plan.proposals)grid(m,true);
for(const [x,y] of plan.connector){const [px,py]=pos(x,y);s+=`<rect x="${px}" y="${py}" width="26" height="26" fill="#d6c7a2" stroke="#f7f2e4"/>`;}
const [wx,wy]=pos(0,7);s+=`<rect x="${wx}" y="${wy}" width="26" height="26" fill="#e6b354"/><path d="M ${wx-20} ${wy+13} h 66" stroke="#e6b354" stroke-width="6"/>`;
function marker(x,y,label,color='#596d88'){const [px,py]=pos(x,y);s+=`<circle cx="${px+13}" cy="${py+13}" r="8" fill="${color}" stroke="#fff8e7" stroke-width="2"/><text x="${px+25}" y="${py+6}" font-size="15" font-weight="700">${esc(label)}</text>`;}
for(const m of maps){for(const n of m.npcs)marker(n.at[0]+m.offset[0],n.at[1]+m.offset[1],n.who[0].toUpperCase()+n.who.slice(1));for(const i of m.items)marker(i.at[0]+m.offset[0],i.at[1]+m.offset[1],'Item','#b58d3e');}
function caption(x,y,title,note){const [px,py]=pos(x,y);s+=`<rect x="${px}" y="${py-24}" width="270" height="48" rx="5" fill="#f7f2e4" fill-opacity=".93"/><text x="${px+7}" y="${py-4}" class="label">${esc(title)}</text><text x="${px+7}" y="${py+16}" class="small">${esc(note)}</text>`;}
caption(-14,1,'MILLGRASS LANE','Candidate geometry / planned west branch');
caption(-14,10,'LARKBURROW','Visible mouth; later home shortcut');
caption(0,15,'LARKHAVEN','Inn · Shop · Ranch · Paddock');
caption(26,-18,'THORNWOOD TRAIL','North to Thornwood / Gate Loft');
caption(26,-10,'DEWCUT → GROVE','Planned branch / Stone partner at shelf');
for(const [x,y,label] of [[4,3,'HEALING INN'],[18,3,'SHOP'],[7,9,'RANCH'],[16,9,'PADDOCK']]){const [px,py]=pos(x,y);s+=`<text x="${px+13}" y="${py+17}" text-anchor="middle" font-size="12" font-weight="700">${label}</text>`;}
s+=`<rect x="1190" y="650" width="370" height="380" rx="10" fill="#e9e4d4"/><text x="1210" y="685" font-size="22" font-weight="700">READ THIS MAP</text>`;
const notes=['Solid green: current tree boundary','Blue: current non-swimmable water','Pale tan: paths / door approaches','D: exact existing door','Blue dot: existing NPC anchor','Gold dot: existing item anchor','Amber: proposed west opening','Millgrass geometry is a proposal','North/east destinations continue','Cave mouth stays closed in blockout','No new NPC dialogue or save fields','Buildings retain current footprints'];
notes.forEach((n,i)=>s+=`<text x="1210" y="${718+i*25}" class="small">${esc(n)}</text>`);
s+=`<text x="40" y="1070" font-size="16">Authority: existing map cells + #455 connected world design / WBW-3 graph. Art references may decorate; they do not define collision or topology.</text></svg>`;
fs.writeFileSync(path.join(folder,'local-layout.svg'),s);
console.log(`Wrote ${maps.length} source maps, ${plan.regional.links.length} local graph links, diagram and study layout.`);
