// Development oracle: execute only the five inspected original functions, never the demo DOM script.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const original=require('./original-functions.cjs');
const rows=[];
const originalRandom=Math.random;
try {
  for(const stage of [-6,-3,0,3,6]) for(const category of ['physical','special'])
  for(const status of [null,'burn']) for(const roll of [0,.5,.999999])
  for(const [type,targetType] of [['Water','Fire'],['Fire','Water'],['Normal','Fire'],['Electric','Water']]) {
    const attacker={level:12,attack:34,defense:36,spAttack:33,spDefense:31,speed:26,type,stages:{attack:stage},status};
    const defender={level:10,attack:29,defense:27,spAttack:28,spDefense:26,speed:30,type:targetType,stages:{attack:0},status:null};
    const move={category,type,power:40};
    Math.random=()=>roll;
    const result=original.calculateDamage(attacker,defender,move);
    rows.push({kind:'damage',attacker,defender,move,roll,multiplier:result.type,expected:result.damage});
  }
} finally {Math.random=originalRandom;}
for(const hp of [1,19,38]) for(const orb of ['snare','great','ultra'])
for(const status of [null,'sleep','paralysis','burn']) for(const timing of [1,1.5,2]) {
  const result=original.compute({maxHp:38,hp,status},orb,timing);
  rows.push({kind:'catch',hp,orb,orbBonus:result.orb.bonus,status:status||'',timing,
    expected:{baseA:result.baseA,statusBonus:result.statusBonus,timingBonus:result.timingBonus,a:result.a,b:result.b,guaranteed:result.guaranteed,perShake:result.perShake}});
}
const referenceHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'original-functions.cjs'),'utf8').replace(/\r\n/g,'\n')).digest('hex');
const output=JSON.stringify({reference_sha256:referenceHash,rows})+'\n';
const target=path.join(__dirname,'fixtures.json');
if(process.argv.includes('--check')) {
  if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)throw Error('Muse fixtures are stale');
} else fs.writeFileSync(target,output);
const manifest=require('./source-manifest.json');
for(const [name,record] of Object.entries(manifest.files)) {
  if(!name.startsWith('assets/'))continue;
  const bytes=fs.readFileSync(path.join(__dirname,manifest.installed_paths?.[name]||path.basename(name)));
  if(bytes.length!==record.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==record.sha256)throw Error('Supplied asset changed: '+name);
}
console.log(`Muse: ${rows.length} original-JS cases; seven supplied asset hashes match.`);
