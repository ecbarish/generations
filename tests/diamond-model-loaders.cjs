/* Exercise the existing Node entry points as well as the browser model's script list.
   Historical --baseline deliberately reads f04364c, before form.js existed. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os');
const {execFileSync}=require('node:child_process'),root=path.resolve(__dirname,'..');
for(const args of [[],['--baseline']]){
  const result=JSON.parse(execFileSync(process.execPath,['tools/diamond-balance-sim.cjs',...args],{cwd:root,encoding:'utf8',timeout:180000}));
  assert.equal(result.seeds.length,12);assert.equal(result.rows.length,7);assert(Number.isFinite(result.maxDrift));
  result.rows.forEach((row,i)=>{assert.equal(row.season,i+1);for(const key of ['opponents','market','standouts'])assert(Number.isFinite(row[key]),key);assert(i===6?row.wins===null:Number.isFinite(row.wins));});
  console.log('PASS balance simulator '+(args.length?'historical f04364c':'current')+' (12 seeds, six seasons)');
}
// The original sports-card browser review predates shelving Career from the hall.
// Run its actual Manager fixture preamble, without launching that obsolete hall review.
const file=path.join(root,'launcher/sports-checks.cjs'),source=fs.readFileSync(file,'utf8'),end=source.indexOf('const career=model(');
assert(end>0,'sports fixture preamble exists');
const output=fs.mkdtempSync(path.join(os.tmpdir(),'diamond-fixture-'));
try{
  const context=vm.createContext({__dirname:path.dirname(file),require:name=>name==='playwright'?{}:require(name),process:{env:{ARCADE_TEST_OUTPUT:output}}});
  vm.runInContext(source.slice(0,end)+'\nglobalThis.fixture=manager;',context,{filename:file,timeout:30000});
  assert.equal(context.fixture.game,'diamond-manager');assert.equal(context.fixture.day,2);
  assert(context.fixture.clubs.every(c=>c.players.every(p=>Array.isArray(p.form.recent))));
  console.log('PASS actual sports Manager fixture (two completed games, valid form-aware save)');
}finally{fs.rmSync(output,{recursive:true,force:true});}
