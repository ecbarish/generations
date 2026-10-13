/* Build fresh, bounded startup context. Read-only; no network, writes, model calls or task claiming. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const routes={
 wildbond:['docs/wildbond-plan.md','docs/art/wildbond-art-direction.md'],
 realmbound:['docs/realmbound-40-60.md'],
 starfall:['docs/plans/starfall-village.md','docs/plans/starfall-guild.md'],
 'diamond-manager':['docs/diamond-manager-balance.md'],
 otherworld:['docs/plans/otherworld.md'],
 'diamond-career':['docs/plans/diamond-career.md','docs/plans/sports-careers.md'],
 'little-ranch':['docs/DEVELOPMENT-PATH.md'],
 arcade:['docs/GOALS.md'],
 art:['docs/art/README.md','docs/art/asset-library.md'],
 'local-ai':['docs/research/local-ai-helper.md','tools/local-ai/README.md']
};
function section(text,heading){const lines=text.split(/\r?\n/),at=lines.findIndex(l=>l.startsWith('## ')&&l.slice(3).startsWith(heading));if(at<0)throw Error('Missing required section: '+heading);let end=at+1;while(end<lines.length&&!lines[end].startsWith('## '))end++;return lines.slice(at,end).join('\n');}
function build({root,agent='Codex',task=null,project=null,maxChars=16000,now=new Date()}){
 if(!Number.isInteger(maxChars)||maxChars<1000)throw Error('max-chars must be an integer >= 1000');
 if(task&&!/^[A-Za-z0-9][A-Za-z0-9.-]{0,79}$/.test(task))throw Error('Invalid task ID');
 if(project&&!routes[project])throw Error('Unknown project; choose '+Object.keys(routes).join(', '));
 const sources=[];function read(file){const content=fs.readFileSync(path.join(root,file),'utf8');sources.push({path:file,sha256:crypto.createHash('sha256').update(content).digest('hex'),bytes:Buffer.byteLength(content)});return content;}
 const rules=read('AGENTS.md'),queue=read('docs/QUEUE.md'),comms=read('docs/COMMS.md');
 const cycle=section(queue,'This cycle'),cycleHeading=cycle.split('\n')[0];
 const dateMatches=[...cycleHeading.matchAll(/\d{4}-\d{2}-\d{2}/g)].map(m=>m[0]);
 if(dateMatches.length<2)throw Error('Cycle heading must include start and end dates');
 const today=now.toISOString().slice(0,10),expired=today>dateMatches[1],notStarted=today<dateMatches[0];
 let previousGame='';
 const taskRows=cycle.split('\n').filter(l=>l.startsWith('|')&&!/^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(l)&&!l.startsWith('| Game')).map(row=>{const cells=row.split('|');if(cells[1]?.trim())previousGame=cells[1].trim();else cells[1]=' '+previousGame+' ';return cells.join('|');});
 const selected=taskRows.filter(row=>task?row.split('|').map(s=>s.trim()).includes(task):new RegExp(agent==='Codex'?'ChatGPT|Codex':agent.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(row));
 const messages=[];const re=/^### .+$/gm;const headings=[...comms.matchAll(re)];
 for(let i=0;i<headings.length;i++){const start=headings[i].index,end=headings[i+1]?.index??comms.length;messages.push({heading:headings[i][0],line:comms.slice(0,start).split('\n').length,text:comms.slice(start,end).trim()});}
 const recent=messages.slice(0,3),relevant=task?messages.filter(m=>new RegExp('(^|[^A-Za-z0-9.-])'+task.replace(/\./g,'\\.')+'([^A-Za-z0-9.-]|$)').test(m.text)).slice(0,3):[];
 const chosen=[...new Set([...recent,...relevant])];
 const references=(project?routes[project]:[]).filter(file=>fs.existsSync(path.join(root,file)));
 let head=null;try{head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
 const warnings=[];
 for(const file of project?routes[project]:[])if(!references.includes(file))warnings.push('Missing route pointer: '+file+'. Use the exact task source; do not infer an absent design.');
 if(expired||notStarted)warnings.push('CURRENT CYCLE IS '+(expired?'EXPIRED':'NOT STARTED')+'. Do not select backlog work automatically; request/record a cycle update.');
 if(task&&!selected.length)warnings.push('Task '+task+' is not in This cycle. Proceed only with an explicit current user request; this packet grants no authorization.');
 const omittedTaskMessages=task?messages.filter(m=>m.text.includes(task)&&!chosen.includes(m)).length:0;
 if(omittedTaskMessages)warnings.push(omittedTaskMessages+' older task mentions omitted; inspect their COMMS headings if needed.');
 const messageContext=chosen.map(m=>{const pointer='docs/COMMS.md:'+m.line;if(m.text.length>1400){warnings.push('Long message at '+pointer+' is indexed only; read it before acting on it.');return '### '+pointer+'\n'+m.heading+'\n[Long message: read the full scoped entry before acting.]';}return '### '+pointer+'\n'+m.text;}).join('\n\n');
 const markdown=[
 '# Fresh agent task packet',
 'Generated: '+now.toISOString()+' | checkout HEAD: '+(head||'unavailable')+' | agent label: '+agent+' | task: '+(task||'selection pending'),
 'This is a routing aid, not a cached decision. Fetch/reconcile current main and live open PRs before claiming. Rebuild after branch switches or new coordination. Historical START-HERE/CLAUDE status is not a release record.',
 '## Mandatory rules\n'+rules,
 '## Current cycle\n'+cycleHeading+'\nOnly This cycle (or an explicit current user request) authorizes work. The full cycle, dates, owners and done-when lines remain in docs/QUEUE.md. Read docs/STUDIO-PLAN.md sections 4 and your game when selecting/replanning; no full portfolio sweep for a scoped fix.',
 '## Named task rows\n'+(selected.length?selected.join('\n'):'No matching rows. Do not invent a next task.'),
 '## Recent and task-specific coordination\n'+(messageContext||'No message headings found. Read docs/COMMS.md before acting.'),
 '## Read on demand\n'+(references.length?references.map(f=>'- '+f).join('\n'):'- Select --project for scoped design pointers.')+'\n- The exact ticket in docs/ROADMAP.md or docs/DEVELOPMENT-PATH.md; find the task ID with rg, then read that section.\n- docs/PROCESS.md for claim/review/merge procedures, .github/PULL_REQUEST_TEMPLATE.md for Tower metadata.\n- docs/CREATIVE.md only the relevant writing/art/design rules. Wildbond story requires docs/lore/wildbond-threads.md.\n- Source files and tests owned by this task. Follow their local AGENTS.md instructions.\n- docs/AI-START.md for route details; archives only for unresolved historical questions.',
 '## Warnings\n'+(warnings.length?warnings.map(w=>'- '+w).join('\n'):'None.'),
 '## Source fingerprints\n'+sources.map(s=>s.path+' '+s.sha256).join('\n')
 ].join('\n\n')+'\n';
 if(markdown.length>maxChars)throw Error('Context needs '+markdown.length+' characters, budget '+maxChars+'. No content silently truncated. Choose a narrower task or raise --max-chars deliberately.');
 return {schemaVersion:1,generatedAt:now.toISOString(),head,agent,task,project,cycle:{heading:cycleHeading,start:dateMatches[0],end:dateMatches[1],expired,notStarted},taskRows:selected,sources,references,warnings,characters:markdown.length,approxTokens:Math.ceil(markdown.length/4),tokenEstimateNote:'Characters/4 is a rough estimate, not provider token accounting.',markdown};
}
function main(args){const options={root:path.resolve(__dirname,'..')};let json=false;for(let i=0;i<args.length;i++){const a=args[i];if(a==='--json'){json=true;continue;}if(a==='--help'){console.log('node tools/agent-context.cjs [--agent Codex] [--task ID] [--project '+Object.keys(routes).join('|')+'] [--max-chars 16000] [--json]');return;}const key={'--agent':'agent','--task':'task','--project':'project','--max-chars':'maxChars'}[a];if(!key||!args[i+1])throw Error('Unknown/incomplete argument: '+a);options[key]=key==='maxChars'?Number(args[++i]):args[++i];}const result=build(options);console.log(json?JSON.stringify(result,null,2):result.markdown);}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={build,section};
