/* Focused launcher regression; no browser or external THREE download needed. */
const assert=require('node:assert/strict');
const {browserPath}=require('./character-library.cjs');
const windowsChrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
let checks=0;
for(const installed of [true,false]){
 assert.equal(browserPath({CHROME_PATH:'/custom/chromium'},()=>installed),'/custom/chromium');checks++;
}
assert.equal(browserPath({CHROME_PATH:'/missing/explicit/chrome'},()=>{throw new Error('Override must not be probed or silently replaced');}),'/missing/explicit/chrome');checks++;
for(const env of [{},{CHROME_PATH:''}]){
 assert.equal(browserPath(env,p=>{assert.equal(p,windowsChrome);return true;}),windowsChrome);checks++;
 assert.equal(browserPath(env,()=>false),undefined);checks++;
}
console.log('PASS '+checks+' character browser-selection checks');
