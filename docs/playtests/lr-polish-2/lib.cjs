const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=require('path').resolve(__dirname,'../../..');
const T={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml'};
exports.run=(fn)=>{const srv=http.createServer((q,r)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':T[path.extname(p)]||'application/octet-stream'});r.end(d)})}).listen(0,'localhost',async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const base=`http://localhost:${srv.address().port}`;
 try{await fn(b,base)}finally{await b.close();srv.close()}});};
exports.open=async(b,base,vp,mob)=>{const ctx=await b.newContext({viewport:vp,isMobile:mob,hasTouch:mob,deviceScaleFactor:mob?2:1});const pg=await ctx.newPage();pg.errs=[];pg.on('pageerror',e=>pg.errs.push(e.message));await pg.goto(base+'/games/little-ranch/');await pg.waitForFunction(()=>window.LR);return pg;};
