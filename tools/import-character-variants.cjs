/* Optional source intake: node tools/import-character-variants.cjs <extracted archives root>.
Requires sharp; does not download or alter game files. Preserves CC0 notices. */
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const input=process.argv[2],out=path.resolve(__dirname,'../shared/assets/characters/quaternius');
function find(d,n){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory()){const r=find(f,n);if(r)return r}else if(e.name===n)return f;}}
async function pack(src,dest){const j=JSON.parse(fs.readFileSync(src)),dir=path.dirname(src),parts=[];let offset=0;function append(b){const at=offset,pad=(4-b.length%4)%4;parts.push(b,Buffer.alloc(pad));offset+=b.length+pad;return at;}
const offsets=j.buffers.map(b=>append(fs.readFileSync(path.join(dir,b.uri))));j.bufferViews.forEach(v=>{v.byteOffset=(v.byteOffset||0)+offsets[v.buffer];v.buffer=0;});
for(const im of j.images||[]){let f=path.join(dir,im.uri);if(!fs.existsSync(f))f=path.join(dir,im.uri.replace('_png.png','.png'));if(!fs.existsSync(f))throw Error('Missing texture '+im.uri);const b=await sharp(f).resize({width:512,height:512,fit:'inside',withoutEnlargement:true}).png().toBuffer();im.bufferView=j.bufferViews.length;j.bufferViews.push({buffer:0,byteOffset:append(b),byteLength:b.length});delete im.uri;}
j.buffers=[{byteLength:offset}];const json=Buffer.from(JSON.stringify(j)),jp=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]),bin=Buffer.concat(parts),h=Buffer.alloc(20),bh=Buffer.alloc(8);h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(28+jp.length+bin.length,8);h.writeUInt32LE(jp.length,12);h.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(path.join(out,dest),Buffer.concat([h,jp,bh,bin]));console.log(dest,fs.statSync(path.join(out,dest)).size);}
(async()=>{
 if(!input)throw Error('Supply extracted archives root');
 fs.mkdirSync(out,{recursive:true});
 const sources=[['realmbound-quaternius-bases','Superhero_Female_FullBody.gltf','Base_Female.glb'],['realmbound-quaternius-outfits','Female_Peasant.gltf','Female_Peasant.glb'],['realmbound-quaternius-outfits','Female_Ranger.gltf','Female_Ranger.glb']];
 for(const [folder,source,dest] of sources){const src=find(path.join(input,folder),source);if(!src)throw Error('Missing source '+source);await pack(src,dest);}
 for(const [folder,source,dest] of [['realmbound-quaternius-bases','License_Standard.txt','LICENSE-base.txt'],['realmbound-quaternius-outfits','License_Standard.txt','LICENSE-outfits.txt']]){const src=find(path.join(input,folder),source);if(!src)throw Error('Missing licence '+source);fs.copyFileSync(src,path.join(out,dest));}
})().catch(e=>{console.error(e);process.exit(1);});
