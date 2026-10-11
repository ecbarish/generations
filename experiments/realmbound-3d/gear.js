/* Original modular equipment for the isolated trial. Input matches h.gear; no saves or rules. */
(()=>{'use strict';
 const T=window.THREE;if(!T)return;
 const SLOTS=['head','chest','legs','feet','hands','weapon','offhand','trinket'];
 const TYPES={head:['cloth','leather','mail'],chest:['cloth','leather','mail'],legs:['cloth','leather','mail'],feet:['cloth','leather','mail'],hands:['cloth','leather','mail'],weapon:['sword','dagger','mace','staff','bow'],offhand:['shield','tome','dagger'],trinket:['charm']};
 const colors={cloth:'#675880',leather:'#765139',mail:'#8b9ba4',wood:'#765036',steel:'#b7c8ce',gold:'#caae70',unknown:'#d47dc0'};
 function profile(slot,item){const type=slot==='weapon'?item.wtype:slot==='offhand'?item.otype:slot==='trinket'?'charm':item.atype;const supported=TYPES[slot].includes(type);return {id:'gear/'+slot+'/'+(supported?type:'unknown'),type:supported?type:'unknown',slot,name:String(item.name||'Unnamed equipment'),rar:Number.isFinite(item.rar)?item.rar:1};}
 function mount(parent,name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
 function prepare(hero){const r=hero.userData;if(r.gearSockets)return;
  r.gearSockets={head:[mount(r.head,'head')],chest:[mount(r.upper,'chest',0,1.04,0),...r.arms.map(a=>mount(a,'shoulder',0,-.065,0))],legs:[...r.legs,...r.knees].map(l=>mount(l,'legs')),feet:r.feet.map(f=>mount(f,'feet')),hands:r.elbows.map(e=>mount(e,'hands',0,-.278,0)),weapon:[mount(r.elbows[1],'weapon',0,-.28,.025)],offhand:[mount(r.elbows[0],'offhand',0,-.28,.025)],trinket:[mount(r.upper,'trinket',0,1.17,.255)]};
  r.gearVisuals={};r.gearDescriptors={};
 }
 function build(parent,p,side){
  const g=mount(parent,p.id),materials=new Map();g.userData={assetId:p.id,slot:p.slot,type:p.type};
  function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:new T.Color(c).convertSRGBToLinear(),roughness:c===colors.steel?.38:.8}));return materials.get(c);}
  function mesh(geo,c,x,y,z){const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
  const box=(x,y,z,w,h,d,c)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z);
  const ball=(x,y,z,w,h,d,c)=>{const m=mesh(new T.SphereGeometry(1,16,10),c,x,y,z);m.scale.set(w,h,d);return m;};
  const rod=(x,y,z,r,h,c)=>mesh(new T.CylinderGeometry(r,r,h,12),c,x,y,z);
  const base=colors[p.type]||colors.unknown,trim=p.rar>=3?'#8cc6c9':p.type==='mail'?'#b6c1c5':colors.leather;
  if(p.type==='unknown'){ball(0,0,.07,.10,.10,.10,base);return g;}
  if(p.slot==='head'){
   const cap=mesh(new T.SphereGeometry(.275,20,12,0,Math.PI*2,0,Math.PI*.45),base,0,.025,0);cap.scale.z=.97;
   if(p.type==='mail'){box(0,.115,.247,.36,.035,.035,trim);for(const s of [-1,1])box(s*.252,-.06,0,.04,.23,.27,base);}
   else if(p.type==='leather'){box(0,.075,.245,.38,.04,.06,trim);box(0,.21,-.01,.025,.045,.31,trim);}
   else{ball(0,.19,-.13,.19,.15,.19,base);}
  }else if(p.slot==='chest'){
   if(side>0){const sleeve=rod(0,0,0,.109,.16,base);sleeve.scale.z=.98;return g;}const plate=mesh(new T.CylinderGeometry(.25,.29,.56,10),base,0,.025,0);plate.scale.z=.75;
   box(0,-.18,.248,.38,.025,.025,trim);box(0,.20,.225,.40,.025,.035,trim);
   
  }else if(p.slot==='legs'){rod(0,-.16,0,side<2?.112:.089,.31,base);box(0,-.16,side<2?.095:.077,.14,.21,.035,base);
  }else if(p.slot==='feet'){box(0,.024,.075,.205,.115,.305,base);box(0,.11,-.025,.17,.13,.13,base);box(0,.077,.18,.18,.018,.06,base);
  }else if(p.slot==='hands'){ball(0,0,0,.071,.087,.067,base);rod(0,.085,0,.077,.085,base);box(0,0,.068,.085,.06,.012,base);
  }else if(p.slot==='trinket'){ball(0,0,0,.025,.035,.015,colors.gold);box(0,.04,0,.009,.04,.009,colors.gold);
  }else if(p.type==='shield'){const sh=new T.Shape();sh.moveTo(-.22,.28);sh.lineTo(.22,.28);sh.lineTo(.22,-.08);sh.lineTo(0,-.34);sh.lineTo(-.22,-.08);sh.closePath();const rim=mesh(new T.ExtrudeGeometry(sh,{depth:.045,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:1,steps:1}),colors.steel,-.06,.07,.12);const inset=mesh(new T.ShapeGeometry(sh),colors.wood,-.06,.07,.18);inset.scale.set(.90,.90,1);ball(-.06,.07,.20,.045,.045,.022,colors.steel);
  }else if(p.type==='tome'){box(0,.015,.11,.22,.29,.10,'#57436b');box(0,.015,.17,.15,.22,.025,'#e6d7b2');box(0,.015,.192,.03,.27,.014,trim);
  }else if(p.type==='bow'){
   const curve=new T.CatmullRomCurve3([new T.Vector3(0,-.55,.05),new T.Vector3(.14,-.30,.05),new T.Vector3(.18,0,.05),new T.Vector3(.14,.30,.05),new T.Vector3(0,.55,.05)]);mesh(new T.TubeGeometry(curve,24,.027,8,false),colors.wood,0,0,0);rod(0,0,.05,.006,1.1,'#ded4bb');box(.18,0,.05,.055,.14,.06,colors.leather);
  }else if(p.type==='staff'){rod(0,.05,.06,.035,1.45,colors.wood);ball(0,.84,.06,.08,.11,.08,'#80bac8');rod(0,.70,.06,.06,.05,trim);
  }else if(p.type==='mace'){rod(0,.15,.07,.03,.44,colors.wood);ball(0,.42,.07,.10,.10,.10,colors.steel);for(const s of [-1,1])box(s*.09,.42,.07,.035,.16,.09,colors.steel);g.rotation.z=Math.PI+.20;
  }else{const length=p.type==='dagger'?.25:.45;rod(0,-.015,.08,.035,.18,colors.leather);box(0,.095,.08,.16,.025,.045,colors.steel);box(0,.12+length/2,.08,.065,length,.025,colors.steel);const tip=mesh(new T.ConeGeometry(.047,.10,4),colors.steel,0,.17+length,.08);tip.rotation.y=Math.PI/4;g.rotation.z=Math.PI+(p.slot==='offhand'?-.20:.20);}
  return g;
 }
 function clear(hero,slot){const r=hero.userData;for(const g of r.gearVisuals[slot]||[]){g.traverse(o=>{if(o.geometry)o.geometry.dispose();});const mats=new Set();g.traverse(o=>{if(o.material)mats.add(o.material);});mats.forEach(m=>m.dispose());g.removeFromParent();}delete r.gearVisuals[slot];delete r.gearDescriptors[slot];}
 function apply(hero,gear={}){prepare(hero);const r=hero.userData;for(const slot of SLOTS){clear(hero,slot);const item=gear[slot];if(!item)continue;const p=profile(slot,item);r.gearDescriptors[slot]=p;r.gearVisuals[slot]=r.gearSockets[slot].map((socket,i)=>build(socket,p,i));}r.head.traverse(o=>{if(o.name==='hair')o.visible=!gear.head;});r.pack.visible=!gear.chest;r.upper.traverse(o=>{if(o.name==='underlayer-detail')o.visible=!gear.chest;});const cloth=gear.chest?.atype==='mail'?'#3e4d57':gear.chest?.atype==='leather'?'#475340':gear.chest?.atype==='cloth'?'#514864':r.coatHex;r.coat.color.set(cloth).convertSRGBToLinear();return r.gearDescriptors;}
 function kit(atype,wtype,otype){const gear={};for(const slot of SLOTS)gear[slot]={slot,rar:1,ilvl:10,name:slot,atype,wtype,otype};return gear;}
 // Explicit demonstration items, not generated rewards or the player's equipment.
 const presets=[{name:'Travel clothes',gear:{}},{name:'Warrior kit',gear:kit('mail','sword','shield')},{name:'Hunter kit',gear:kit('leather','bow','dagger')},{name:'Mage kit',gear:kit('cloth','staff','tome')}];
 window.RealmTrialGear={SLOTS,profile,prepare,apply,presets};
})();