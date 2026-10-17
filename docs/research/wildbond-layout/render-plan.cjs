const fs=require('fs'), path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1600,height:1110},deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.join(__dirname,'local-layout.svg')).href);
 await page.screenshot({path:path.join(__dirname,'local-layout.png')});
 await browser.close();
 console.log('Rendered measured local diagram.');
})().catch(e=>{console.error(e);process.exit(1);});
