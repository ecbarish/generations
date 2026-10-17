// Stage a locally exported pack without inventing a CI run or replacing engine files.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'../../..'),dir=path.join(root,'play/wildbond');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const source=git('rev-parse','HEAD'),tree=git('rev-parse',source+':wildbond-godot');
const names=['index.html','index.js','index.pck','index.wasm'];
const digest=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name))).digest('hex');
const engine={'index.js':'33c94cb3175f3333b82e2a3be5e8e86f77986f0aa2042b1631f6367a4e5bb6ba','index.wasm':'fc74679e3b97f76878947fcd4fbe1268cbfa6188182a2e33bbc3f5dc9bfa57d0'};
for(const [name,hash] of Object.entries(engine))if(digest(name)!==hash)throw Error('Existing engine changed: '+name);
const bytes=fs.statSync(path.join(dir,'index.pck')).size;
let shell=fs.readFileSync(path.join(dir,'index.html'),'utf8'),count=0;
shell=shell.replace(/("index\.pck"\s*:\s*)\d+/g,(_,prefix)=>{count++;return prefix+bytes;});
if(count!==1)throw Error('Expected one shell size field');
fs.writeFileSync(path.join(dir,'index.html'),shell);
const record={built:new Date().toISOString().slice(0,10),godot:'4.7.2-stable',source_commit:source,source_tree:tree,review_run:null,sha256:Object.fromEntries(names.map(name=>[name,digest(name)]))};
fs.writeFileSync(path.join(dir,'build.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({source,tree,bytes,sha256:record.sha256['index.pck']},null,2));
