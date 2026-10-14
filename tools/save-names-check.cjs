/* Save names never change (rename to Generations, docs/proposals/rename-checklist.md items 9, 14, 15).
   Browser saves live under these localStorage key names, and the Godot games save into a folder named from
   config/name in project.godot. Renaming any of them leaves players' saves behind, so this check fails if one
   disappears from the file that uses it. To add a new save name, add it here; never edit or remove one.
     node tools/save-names-check.cjs */
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const NAMES={
  'shared/engine.js':['arcade-index-v1','arcade-backup:'],
  'shared/settings.js':['arcade-settings-v1'],
  'shared/votes.js':['arcade-votes-v1','arcade-tester-id'],
  'shared/gm.js':['arcade-gm','arcade-gm-log'],
  'games/realmbound/js/00-core.js':['realmbound-save-v1'],
  'games/wildbond/js/02-state.js':['wildbond-save-v1'],
  'games/wildbond/js/05-ui.js':['wildbond-modes-unlocked'],
  'games/otherworld/js/00-data.js':['otherworld-save-v1'],
  'games/diamond-career/js/00-data.js':['diamond-career-save-v1'],
  'games/diamond-manager/js/league.js':['diamond-manager-save-v1'],
  'games/starfall-guild/js/00-data.js':['starfall-guild-save-v1'],
  'games/primordial/index.html':['primordial-save-v1'],
  'games/storm-front/game.js':['storm-front-save-v1'],
  'games/lighthouse-watch/game.js':['lighthouse-watch-save-v1'],
  'games/briskets-crossing/game.js':['briskets-crossing-save-v1'],
  'games/ember-bricks/game.js':['ember-bricks-save-v1'],
  'games/lantern-bowl/game.js':['lantern-bowl-save-v1'],
  'games/little-ranch/game.js':['little-ranch-settings-v1'],
  'wildbond-godot/project.godot':['config/name="Wildbond (Godot trial)"'],
  'starfall-godot/project.godot':['config/name="Starfall (Godot)"'],
};
const missing=[];let n=0;
for(const [file,names] of Object.entries(NAMES)){
  let text='';try{text=fs.readFileSync(path.join(ROOT,file),'utf8');}catch(e){missing.push(file+' (file missing)');continue;}
  for(const name of names){n++;if(!text.includes(name))missing.push(file+': '+name);}
}
if(missing.length){console.log('save names changed, saves would be lost: '+missing.join('; '));process.exit(1);}
console.log(n+' save names unchanged');
