// Find an installed Chrome, Chromium or Edge for Playwright on Windows, macOS or Linux.
// CHROME_PATH wins, including when it points at a missing file. Returns undefined when
// nothing is found, so Playwright falls back to its own Chromium.
const fs=require('fs'),os=require('os'),path=require('path');
function isFile(p){try{return fs.statSync(p).isFile();}catch(e){return false;}}
// Puppeteer caches Chrome for Testing under PUPPETEER_CACHE_DIR or the platform cache.
// A typical Linux build is chrome/<version>/chrome-linux64/chrome.
function puppeteerBrowsers(){
  const roots=[];
  if(process.env.PUPPETEER_CACHE_DIR)roots.push(process.env.PUPPETEER_CACHE_DIR);
  const home=os.homedir();
  if(process.platform==='darwin')roots.push(path.join(home,'Library/Caches/puppeteer'));
  else if(process.platform==='win32'){
    if(process.env.LOCALAPPDATA)roots.push(path.join(process.env.LOCALAPPDATA,'puppeteer'));
    roots.push(path.join(home,'.cache','puppeteer'));
  }else roots.push(path.join(home,'.cache','puppeteer'));
  const want=/^(chrome|chromium)(\.exe)?$|^Google Chrome for Testing$/;
  const found=[];
  function walk(dir,depth){
    if(depth<0)return;
    let entries;try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch(e){return;}
    for(const ent of entries){
      const full=path.join(dir,ent.name);
      if(ent.isFile()&&want.test(ent.name))found.push(full);
      else if(ent.isDirectory()&&ent.name!=='node_modules')walk(full,depth-1);
    }
  }
  for(const root of roots)walk(root,8);
  return found.sort();
}
function forThisOs(p){
  const s=p.replace(/\\/g,'/');
  if(process.platform==='linux')return s.includes('chrome-linux');
  if(process.platform==='darwin')return s.includes('chrome-mac')||s.includes('Google Chrome for Testing');
  if(process.platform==='win32')return s.includes('chrome-win');
  return true;
}
module.exports=function browserPath(){
  if(process.env.CHROME_PATH)return process.env.CHROME_PATH;
  const local=process.env.LOCALAPPDATA||'',pf=process.env.ProgramFiles||'C:/Program Files',pf86=process.env['ProgramFiles(x86)']||'C:/Program Files (x86)';
  const installed=({
    win32:[pf+'/Google/Chrome/Application/chrome.exe',pf86+'/Google/Chrome/Application/chrome.exe',local+'/Google/Chrome/Application/chrome.exe',
      pf86+'/Microsoft/Edge/Application/msedge.exe',pf+'/Microsoft/Edge/Application/msedge.exe'],
    darwin:['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
    linux:['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/local/bin/google-chrome','/usr/local/bin/chromium','/usr/local/bin/chromium-browser',
      '/usr/bin/chromium','/usr/bin/chromium-browser','/snap/bin/chromium','/usr/bin/microsoft-edge','/opt/google/chrome/chrome','/opt/pw-browsers/chromium'],
  }[process.platform]||[]).find(isFile);
  if(installed)return installed;
  const cached=puppeteerBrowsers().filter(isFile);
  return cached.filter(forThisOs).at(-1)||cached.at(-1);
};
