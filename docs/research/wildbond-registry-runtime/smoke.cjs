// Actual committed-pack boot/input smoke; fresh browser contexts, no game-method hooks or player saves.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../..'),dir=path.join(root,'play/wildbond'),out=__dirname;
const build=JSON.parse(fs.readFileSync(path.join(dir,'build.json')));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex');
for(const [file,sha] of Object.entries(build.sha256))assert.equal(hash(file),sha,'Manifest hash: '+file);
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://local').pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(dir,'.'+name);if(!file.startsWith(dir+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.pck':'application/octet-stream','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const results=[];
 try{for(const [width,height,touch] of [[1366,768,false],[390,844,true],[844,390,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon.ico'))errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>!document.getElementById('status'),null,{timeout:90000});
  await page.waitForTimeout(1200);
  const before=`howto-${width}x${height}.png`;const beforeImage=await page.screenshot({path:path.join(out,before)});
  // In portrait, tap the visible How to play card above the controls, rather than the empty control surround.
  if(touch)await page.touchscreen.tap(width/2,height>width?100:height/2);else await page.keyboard.press('Space');
  await page.waitForTimeout(1800);
  const after=`arrival-${width}x${height}.png`;const afterImage=await page.screenshot({path:path.join(out,after)});
  assert(!beforeImage.equals(afterImage),`${width}x${height}: input visibly changes the screen (inspect screenshots too)`);
  assert.deepEqual(errors,[],`${width}x${height}: no runtime errors`);
  assert(await page.locator('canvas').isVisible(),`${width}x${height}: rendered canvas visible`);
  results.push({width,height,touch,booted:true,errors,before,after});await context.close();
 }}finally{await browser.close();server.close();}
 const record={source_commit:build.source_commit,source_tree:build.source_tree,pack_sha256:build.sha256['index.pck'],pack_bytes:fs.statSync(path.join(dir,'index.pck')).size,results};
 fs.writeFileSync(path.join(out,'smoke.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record,null,2));
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
