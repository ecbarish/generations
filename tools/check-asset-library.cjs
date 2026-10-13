/* Registry integrity and production-readiness checks. No asset conversion or game writes. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const catalogue=JSON.parse(fs.readFileSync(process.argv[2]?path.resolve(process.argv[2]):path.join(root,'shared/assets/catalog.json'),'utf8'));
const ids=new Set(),digests=new Map(),errors=[];
if(catalogue.schemaVersion!==1||!Array.isArray(catalogue.assets))errors.push('Unsupported catalogue schema');
for(const a of catalogue.assets||[]){
 if(!/^[a-z0-9][a-z0-9./-]*$/.test(a.id)||ids.has(a.id))errors.push('Invalid or duplicate ID: '+a.id);ids.add(a.id);
 if(!['reference','prototype','production'].includes(a.status))errors.push('Invalid status: '+a.id);
 if(!a.name||!a.category||!Array.isArray(a.tags)||!Array.isArray(a.usedBy)||!a.rights?.state)errors.push('Missing identity/provenance fields: '+a.id);
 if(!Array.isArray(a.representations)||!a.representations.length)errors.push('Missing representation: '+a.id);
 if(!['verified','unverified','project-authored'].includes(a.rights?.state))errors.push('Invalid rights state: '+a.id);
 if(a.preview&&!fs.existsSync(path.join(root,a.preview)))errors.push('Missing preview: '+a.id);
 for(const r of a.representations||[]){
  if(typeof r.path!=='string'||r.path.includes('..')||r.path.includes('\\')||r.path.startsWith('/')||/^[a-z]+:/i.test(r.path)){errors.push('Unsafe path: '+a.id);continue;}
  const p=path.join(root,r.path);if(!fs.existsSync(p)){errors.push('Missing file: '+r.path);continue;}
  if(!digests.has(r.path))digests.set(r.path,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
  if(r.sha256!==digests.get(r.path))errors.push('Source changed without updating representation: '+r.path);
  if(!Number.isInteger(r.revision)||r.revision<1)errors.push('Invalid representation revision: '+a.id);
 }
 if(a.status==='production'&&(a.rights.state!=='verified'||!a.acceptance?.evidence||!a.compatibility?.contract))errors.push('Production asset lacks rights, acceptance or compatibility contract: '+a.id);
 if(a.rights.state==='verified'&&(!a.rights.license||!a.rights.source))errors.push('Verified rights without source: '+a.id);
 for(const dependency of a.dependencies||[])if(!catalogue.assets.some(x=>x.id===dependency))errors.push('Unknown dependency '+dependency+' in '+a.id);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`PASS: ${ids.size} stable asset IDs; ${digests.size} source files; paths/hashes/dependencies/status/rights gates valid.`);
