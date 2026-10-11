/* Original rigid-joint character art for the Realmbound 3D trial. No external assets. */
(()=>{'use strict';
 const T=window.THREE;if(!T)return;
 const material=hex=>new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness:.88});
 const palette={skin:material('#e7b68f'),dark:material('#292a33'),cream:material('#ede5cf'),leather:material('#6c4534'),gold:material('#cbae68'),hair:material('#50372d'),grey:material('#8c8980')};
 function part(parent,geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function ellipsoid(parent,x,y,z,sx,sy,sz,mat){const m=part(parent,new T.SphereGeometry(1,20,12),mat,x,y,z);m.scale.set(sx,sy,sz);return m;}
 function rounded(parent,x,y,z,w,h,d,r,mat){
  const sh=new T.Shape(),a=-w/2,b=-h/2;r=Math.min(r,w/3,h/3,d/3);
  sh.moveTo(a+r,b);sh.lineTo(a+w-r,b);sh.quadraticCurveTo(a+w,b,a+w,b+r);sh.lineTo(a+w,b+h-r);sh.quadraticCurveTo(a+w,b+h,a+w-r,b+h);sh.lineTo(a+r,b+h);sh.quadraticCurveTo(a,b+h,a,b+h-r);sh.lineTo(a,b+r);sh.quadraticCurveTo(a,b,a+r,b);
  const geo=new T.ExtrudeGeometry(sh,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,steps:1,curveSegments:4});geo.scale(w/(w+2*r),h/(h+2*r),1);geo.translate(0,0,-(d-2*r)/2);return part(parent,geo,mat,x,y,z);
 }
 function tube(parent,x,y,z,r1,r2,h,mat){return part(parent,new T.CylinderGeometry(r1,r2,h,14),mat,x,y,z);}
 function group(parent,x,y,z){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
 function create({keeper=false}={}){
  const g=new T.Group(),upper=group(g,0,0,0),torso=group(upper,0,.08,0),coat=material(keeper?'#56705b':'#315e79'),pants=material('#354557'),trim=material(keeper?'#bd9d63':'#af5942'),hair=keeper?palette.grey:palette.hair;
  // Tailored jacket, collar, belt and layered shoulder sleeves.
  const jacket=tube(torso,0,.96,0,.24,.29,.61,coat);jacket.scale.z=.7;
  rounded(torso,0,.66,0,.57,.12,.34,.025,palette.leather);
  rounded(torso,0,.66,.188,.11,.09,.025,.007,palette.gold);
  rounded(torso,0,1.22,.025,.32,.10,.28,.025,palette.cream).name='underlayer-detail';
  rounded(torso,0,1.19,.17,.30,.11,.065,.018,trim).name='underlayer-detail';
  rounded(torso,.055,1.04,.18,.07,.29,.035,.01,trim).name='underlayer-detail';
  for(const x of [-.16,.16])rounded(torso,x,.86,.19,.15,.12,.025,.01,coat).name='underlayer-detail';
  if(keeper){rounded(torso,0,.85,.19,.41,.43,.035,.016,palette.cream);rounded(torso,0,1.03,.215,.22,.09,.012,.003,trim);}
  tube(torso,0,1.28,0,.055,.065,.13,palette.skin);const head=group(torso,0,1.47,0);head.scale.setScalar(.58);
  ellipsoid(head,0,0,0,.245,.27,.235,palette.skin);
  const cap=part(head,new T.SphereGeometry(.254,24,16,0,Math.PI*2,0,Math.PI*.40),hair,0,.025,-.006);cap.scale.z=.98;cap.name='hair';
  // Hair ends at the forehead in front, but extends behind the ears at the rear.
  ellipsoid(head,0,.025,-.145,.23,.17,.115,hair).name='hair';
  for(const sign of [-1,1]){
   ellipsoid(head,sign*.246,-.015,0,.042,.065,.034,palette.skin);
   const eye=ellipsoid(head,sign*.082,.018,.224,.029,.023,.013,palette.cream);eye.name='eye';
   ellipsoid(head,sign*.081,.018,.235,.012,.017,.008,palette.dark);
   rounded(head,sign*.083,.069,.223,.065,.012,.016,.003,hair);
   const fringe=ellipsoid(head,sign*.13,.151,.14,.078,.088,.070,hair);fringe.rotation.z=sign*.25;fringe.name='hair';
  }
  ellipsoid(head,0,-.025,.24,.031,.032,.037,palette.skin);
  rounded(head,0,-.112,.221,.051,.008,.014,.002,palette.leather);
  if(keeper)ellipsoid(head,0,-.135,.18,.15,.091,.065,hair);
  const arms=[],elbows=[],legs=[],knees=[],feet=[];
  for(const sign of [-1,1]){
   const arm=group(torso,sign*.30,1.18,0);tube(arm,0,-.125,0,.094,.076,.25,coat);
   const elbow=group(arm,0,-.25,0);tube(elbow,0,-.115,0,.072,.062,.23,coat);tube(elbow,0,-.207,0,.075,.075,.07,palette.leather);
   ellipsoid(elbow,0,-.278,0,.064,.083,.060,palette.skin);
   arms.push(arm);elbows.push(elbow);
   const leg=group(g,sign*.14,.74,0);tube(leg,0,-.165,0,.107,.084,.33,pants);
   const knee=group(leg,0,-.33,0);tube(knee,0,-.155,0,.083,.073,.31,pants);
   const foot=group(knee,0,-.34,0);rounded(foot,0,0,.07,.19,.135,.29,.032,palette.leather);rounded(foot,0,-.055,.075,.20,.023,.30,.007,palette.dark);
   legs.push(leg);knees.push(knee);feet.push(foot);
  }
  const pack=group(torso,0,0,0);if(!keeper){
   rounded(pack,0,1.02,-.255,.42,.48,.23,.055,palette.leather);
   rounded(pack,0,1.19,-.385,.39,.12,.035,.01,trim);
   rounded(pack,0,.99,-.383,.19,.19,.03,.014,trim);
   for(const sign of [-1,1]){rounded(pack,sign*.18,1.06,.17,.055,.43,.035,.01,palette.leather);rounded(pack,sign*.18,.93,.195,.055,.05,.016,.006,palette.gold);}
  }
  g.userData={upper,head,arms,elbows,legs,knees,feet,keeper,pack,coat,coatHex:keeper?"#56705b":"#315e79"};return g;
 }
 function animate(g,{walking=false,phase=0,time=0,reduced=false,talking=false}={}){
  const r=g.userData,walk=walking&&!reduced,breath=reduced?0:Math.sin(time*1.8)*.004;
  r.upper.position.y=(walk?-.03:0)+breath;r.head.rotation.y=talking&&!reduced?Math.sin(time*1.2)*.04:0;
  for(let i=0;i<2;i++){
   const p=phase+i*Math.PI,swing=walk?Math.sin(p):0;
   r.arms[i].rotation.x=-swing*.30;r.arms[i].rotation.z=(i?-.07:.07);r.elbows[i].rotation.x=-.13;
   r.legs[i].position.y=walk?.71:.74;
   if(walk){
    // Two-bone inverse kinematics: stance feet stay low, swing feet clear the floor.
    const cycle=((p/(Math.PI*2))%1+1)%1,stance=cycle<.5,u=stance?cycle*2:(cycle-.5)*2;
    const z=stance?.19-.38*u:-.19+.38*u*u*(3-2*u),y=.08+(stance?0:.12*Math.sin(u*Math.PI)),dy=y-.71;
    const a=.33,b=.34,d=T.MathUtils.clamp(Math.hypot(dy,z),.20,a+b-.001);
    const base=Math.atan2(-z,-dy),offset=Math.acos(T.MathUtils.clamp((a*a+d*d-b*b)/(2*a*d),-1,1));
    r.legs[i].rotation.x=base-offset;r.knees[i].rotation.x=Math.PI-Math.acos(T.MathUtils.clamp((a*a+b*b-d*d)/(2*a*b),-1,1));
    r.feet[i].rotation.x=-r.legs[i].rotation.x-r.knees[i].rotation.x;
   }else{r.legs[i].rotation.x=r.knees[i].rotation.x=r.feet[i].rotation.x=0;}
  }
  if(talking){r.arms[1].rotation.x=-.25;r.elbows[1].rotation.x=-.7-(reduced?0:Math.sin(time*2)*.10);}
 }
 function faceTowards(g,point,dt){const a=Math.atan2(point.x-g.position.x,point.z-g.position.z),diff=Math.atan2(Math.sin(a-g.rotation.y),Math.cos(a-g.rotation.y));g.rotation.y+=diff*Math.min(1,dt*12);}
 window.RealmTrialCharacters={create,animate,faceTowards};
})();