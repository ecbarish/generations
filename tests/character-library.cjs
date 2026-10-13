/* Optional visual integration suite: node tests/character-library.cjs <served repo origin>.
   Uses the trial's external THREE r134 CDN. Separate from the offline game CI runner. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
// Keep an explicit override; use the old Windows default only when installed.
function browserPath(env=process.env,exists=fs.existsSync){
 const windowsChrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
 return env.CHROME_PATH||(exists(windowsChrome)?windowsChrome:undefined);
}
module.exports={browserPath};
if(require.main===module)(async()=>{const origin=process.argv[2]||'http://localhost:8777',out=path.resolve(__dirname,'../docs/art/starfall-higgsfield/bench');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:browserPath(),headless:true});const checks=[];function check(ok,label){assert.ok(ok,label);checks.push(label);}
try{for(const [width,height] of [[390,844],[1440,1000],[3440,1440]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),errors=[],warnings=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&m.text().includes('THREE.PropertyBinding'))warnings.push(m.text());});
 await context.addInitScript(()=>{localStorage.setItem('character-bench-sentinel','keep');window.storageWrites=[];for(const key of ['setItem','removeItem','clear']){const old=Storage.prototype[key];Storage.prototype[key]=function(...args){window.storageWrites.push(key);return old.apply(this,args);};}});
 await page.goto(origin+'/experiments/character-library/');await page.waitForFunction(()=>window.CharacterBench?.ready||window.CharacterBench?.error,null,{timeout:60000});check(await page.evaluate(()=>CharacterBench.ready&&!CharacterBench.error),width+' both models loaded');
 check(await page.evaluate(()=>CharacterBench.actors.map(a=>a.sex).join(',')==='male,female'&&CharacterBench.missingTracks.length===0),width+' both variants and all clip bindings');
 const time=await page.evaluate(()=>CharacterBench.actors[0].mixers[0].time);await page.waitForTimeout(120);check(await page.evaluate(t=>CharacterBench.actors[0].mixers[0].time===t,time),width+' reduced motion stays frozen');
 for(const outfit of ['travel','ranger']){
  await page.selectOption('#outfit',outfit);
  for(const motion of ['Idle_Loop','Walk_Loop','Idle_Talking_Loop','Sword_Idle']){
   await page.selectOption('#motion',motion);await page.evaluate(()=>CharacterBench.setPose(.35));
   check(await page.evaluate(o=>CharacterBench.actors.every(a=>Object.entries(a.outfits).every(([k,v])=>v.visible===(k===o))),outfit),width+' '+outfit+' '+motion+' only one body composite');
   check(await page.evaluate(()=>{CharacterBench.scene.updateMatrixWorld(true);return CharacterBench.actors.every(a=>{let valid=true;a.outfits[CharacterBench.state.outfit].traverse(m=>{if(!m.isSkinnedMesh)return;for(let i=0;i<m.geometry.attributes.position.count;i+=Math.max(1,Math.floor(m.geometry.attributes.position.count/25))){const v=new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.position,i);m.boneTransform(i,v);if(![v.x,v.y,v.z].every(Number.isFinite))valid=false;}});return valid;});}),width+' '+outfit+' '+motion+' finite skinned vertices');
  }
  await page.selectOption('#motion','Walk_Loop');await page.check('#weapon');
  const first=await page.evaluate(()=>{CharacterBench.setPose(.15);return CharacterBench.actors.map(a=>{const w=a.weapons[CharacterBench.state.outfit==='travel'?0:1];return {world:w.getWorldPosition(new THREE.Vector3()).toArray(),local:w.position.toArray(),parent:w.parent.name};});});
  const second=await page.evaluate(()=>{CharacterBench.setPose(.65);return CharacterBench.actors.map(a=>{const w=a.weapons[CharacterBench.state.outfit==='travel'?0:1];return {world:w.getWorldPosition(new THREE.Vector3()).toArray(),local:w.position.toArray(),parent:w.parent.name};});});
  check(first.every((f,i)=>f.parent==='hand_r'&&second[i].parent==='hand_r'&&JSON.stringify(f.local)===JSON.stringify(second[i].local)&&f.world.some((v,j)=>Math.abs(v-second[i].world[j])>.001)),width+' '+outfit+' sword follows both moving hands');
  await page.selectOption('#motion','Sword_Idle');await page.evaluate(()=>CharacterBench.setPose(.3));check(await page.evaluate(()=>CharacterBench.actors.every(a=>{const w=a.weapons[CharacterBench.state.outfit==='travel'?0:1],grip=w.getWorldPosition(new THREE.Vector3()),tip=w.localToWorld(new THREE.Vector3(0,-.55,0)),forward=new THREE.Vector3(0,0,1).applyQuaternion(a.visual.quaternion);return tip.sub(grip).dot(forward)>0;})),width+' '+outfit+' blade points forward in sword stance');
  await page.uncheck('#weapon');check(await page.evaluate(()=>CharacterBench.actors.every(a=>a.weapons.every(w=>!w.visible))),width+' '+outfit+' weapon removal');
  for(const view of ['front','side','rear','three-quarter']){await page.selectOption('#view',view);check(await page.evaluate(v=>CharacterBench.state.view===v,view),width+' '+outfit+' '+view+' selectable');}
 }
 await page.selectOption('#outfit','travel');await page.selectOption('#motion','Idle_Loop');await page.selectOption('#view','front');await page.evaluate(()=>CharacterBench.setPose(.3));await page.screenshot({path:path.join(out,'travel-front-'+width+'.png'),fullPage:true});
 if(width===1440){for(const outfit of ['travel','ranger'])for(const view of ['side','rear']){await page.selectOption('#outfit',outfit);await page.selectOption('#view',view);await page.screenshot({path:path.join(out,outfit+'-'+view+'.png')});}await page.selectOption('#view','three-quarter');await page.selectOption('#motion','Sword_Idle');await page.check('#weapon');await page.evaluate(()=>CharacterBench.setPose(.3));await page.screenshot({path:path.join(out,'ranger-sword.png')});}
 await page.getByRole('button',{name:'Play',exact:true}).click();const before=await page.evaluate(()=>CharacterBench.actors[0].mixers[0].time);await page.waitForTimeout(180);check(await page.evaluate(t=>CharacterBench.actors[0].mixers[0].time>t,before),width+' explicit play advances clips');await page.getByRole('button',{name:'Pause',exact:true}).click();
 check(await page.evaluate(()=>localStorage.getItem('character-bench-sentinel')==='keep'&&storageWrites.length===0),width+' save storage untouched');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' no horizontal overflow');check(errors.length===0&&warnings.length===0,width+' no script or animation-binding errors');await context.close();
}
for(const pattern of ['**/Base_Female.glb','**/three.min.js']){const c=await browser.newContext(),p=await c.newPage();await p.route(pattern,r=>r.abort());await p.goto(origin+'/experiments/character-library/');await p.waitForFunction(()=>window.CharacterBench?.error,null,{timeout:60000});check(await p.locator('#loading').isVisible()&&(await p.locator('#loading').textContent()).includes('could not load'),'failure recovery '+pattern);await c.close();}
fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({date:'2026-10-13',checks:checks.length,passed:checks,scope:'Source-rig integration and UI; not production garment acceptance or device performance'},null,2)+'\n');console.log('PASS '+checks.length+' character bench checks');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
