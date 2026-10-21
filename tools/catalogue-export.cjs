'use strict';
// The Wildbond source this exporter read has left the public repository.
// shared/catalogue.js is a frozen snapshot. Realmbound still imports it.
// Run: node tools/catalogue-export.cjs --check
const fs=require('fs'),path=require('path');
const target=path.join(path.resolve(__dirname,'..'),'shared/catalogue.js');
const text=fs.readFileSync(target,'utf8');
if(!/const CreatureCatalogue = Object\.freeze\(/.test(text)) throw Error('shared/catalogue.js no longer defines CreatureCatalogue');
const count=(text.match(/"name":/g)||[]).length;
if(process.argv.includes('--check')) console.log('PASS: frozen catalogue snapshot still defines CreatureCatalogue ('+count+' names).');
else console.log('The Wildbond source has left this repository. shared/catalogue.js stays as the frozen snapshot ('+count+' names). Nothing was written.');
