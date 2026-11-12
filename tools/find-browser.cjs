// Find an installed Chrome, Chromium or Edge for Playwright on Windows, macOS or Linux.
// CHROME_PATH wins. Returns undefined when nothing is found, so Playwright falls back to its own Chromium.
const fs=require('fs');
module.exports=function browserPath(){
  if(process.env.CHROME_PATH)return process.env.CHROME_PATH;
  const local=process.env.LOCALAPPDATA||'',pf=process.env.ProgramFiles||'C:/Program Files',pf86=process.env['ProgramFiles(x86)']||'C:/Program Files (x86)';
  const candidates={
    win32:[pf+'/Google/Chrome/Application/chrome.exe',pf86+'/Google/Chrome/Application/chrome.exe',local+'/Google/Chrome/Application/chrome.exe',
      pf86+'/Microsoft/Edge/Application/msedge.exe',pf+'/Microsoft/Edge/Application/msedge.exe'],
    darwin:['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
    linux:['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser',
      '/snap/bin/chromium','/usr/bin/microsoft-edge','/opt/pw-browsers/chromium'],
  }[process.platform]||[];
  return candidates.find(p=>{try{return fs.statSync(p).isFile();}catch(e){return false;}});
};
