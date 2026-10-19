// Local layout evidence; never reads a player's storage. Run: node <this file> before|after
const fs=require('fs'),path=require('path'),http=require('http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../..'),phase=process.argv[2];
if(!['before','after'].includes(phase))throw Error('Choose before or after');
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const results=[];
  try{for(const [width,height,large] of [[568,320,false],[390,844,false],[844,390,false],[1366,768,false],[3440,1440,false],[390,844,true]]){
    const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/games/night-market/`);
    await page.waitForFunction(()=>window.__nightMarket);
    await page.evaluate(large=>{const h=window.__nightMarket;h.state.cash=25;h.state.stalls[0].serves=25;h.render();if(large){document.documentElement.style.fontSize='32px';document.body.style.fontSize='34px';}},large);
    await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const geometry=await page.evaluate(()=>{const box=s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};return {back:box('.home'),cash:box('.coins'),header:box('header'),serve:box('[data-act="serve"]'),scrollWidth:document.documentElement.scrollWidth};});
    const label=`${phase}-${width}x${height}${large?'-large-text':''}`;
    await page.screenshot({path:path.join(__dirname,label+'.png')});
    results.push({label,width,height,large,...geometry});await context.close();
  }}finally{await browser.close();server.close();}
  fs.writeFileSync(path.join(__dirname,phase+'.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results.map(r=>({label:r.label,back:r.back,cash:r.cash,scrollWidth:r.scrollWidth})),null,2));
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
