'use strict';
// Run: node test-hero-reference.cjs
// This public reference dataset contains HERO facts only. Do not add players.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=__dirname;
const data=JSON.parse(fs.readFileSync(path.join(base,'heroes.v1.json'),'utf8'));
const schema=JSON.parse(fs.readFileSync(path.join(base,'schema.v1.json'),'utf8'));
const index=JSON.parse(fs.readFileSync(path.join(base,'catalog.v1.json'),'utf8'));
const context={window:{}};
const originalCatalogPath=path.join(base,'../catalog.js');
if(fs.existsSync(originalCatalogPath)){
 vm.runInNewContext(fs.readFileSync(originalCatalogPath,'utf8'),context);
 assert.deepEqual(index.heroes.map(x=>x.name).sort(),
  Array.from(context.window.NRW_BEAR_CATALOG.heroes,x=>x.name).sort(),
  'source catalog snapshot matches host app when checked inside welcome-nrw');
}
const catalog={heroes:index.heroes,heroTypes:Object.fromEntries(index.heroes.map(x=>[x.name,x.type]))};
function validate(d){
 assert.equal(d.schemaVersion,1);
 assert.equal(d.publicDataOnly,true);
 assert.equal(d.releaseStatus,'research-preview');
 assert.equal(new Set(d.records.map(r=>r.id)).size,d.records.length,'no duplicate hero keys');
 assert.equal(new Set(d.records.map(r=>r.name)).size,d.records.length,'no duplicate hero names');
 assert.equal(d.records.length,catalog.heroes.length,'catalog coverage: no unlisted heroes');
 assert.deepEqual(d.records.map(r=>r.name).sort(),catalog.heroes.map(r=>r.name).sort(),
  'reference index must match in-app hero catalog');
 assert.equal(schema.properties.publicDataOnly.const,true,'schema declares public-only');
 assert.equal(schema.properties.schemaVersion.const,1,'schema is versioned');
 assert.deepEqual(Object.keys(schema.$defs.hero.properties).sort(),[
  'conquestBaseByHeroLevel','expeditionSkills','generation','id','name','source','starProgression','status','troopType'
 ].sort());
 let verified=0;
 for(const row of d.records){
  assert.equal(row.troopType,catalog.heroTypes[row.name],'hero troop type consistent with catalog');
  assert.match(row.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(row.source.catalog,'catalog.v1.json');
  assert.equal(row.conquestBaseByHeroLevel,null,'never guess level 1–80 base stats');
  assert.equal(Object.prototype.hasOwnProperty.call(row,'playerId'),false,'no private player data');
  if(row.status==='metadata-only'){
   assert.equal(row.starProgression,null,'unsourced progression remains unknown');
   assert.equal(row.source.stats,null,'do not invent source URLs');
   assert.equal(row.generation,null,'unknown generation remains unknown');
   assert.equal(row.expeditionSkills.length,0,'unknown skills remain empty');
   continue;
  }
  assert.equal(row.status,'partial-sourced','cannot claim complete data');
  verified++;
  assert.ok(Number.isInteger(row.generation)&&row.generation>=1);
  assert.equal(row.source.stats,'https://kingshotdata.com/heroes/'+row.id+'/');
  assert.match(row.source.verifiedOn,/^\d{4}-\d\d-\d\d$/);
  const p=row.starProgression;
  assert.equal(p.sourceRowIndices,'1..31');
  assert.equal(p.rowToDisplayStarTier,'unverified','no unverified row->star mapping');
  for(const key of ['expeditionAttackPercent','expeditionDefensePercent','shardsToNextRow']){
   assert.equal(p[key].length,31,row.name+' '+key+' must have 31 sourced steps');
   assert.ok(p[key].every(x=>Number.isFinite(x)&&x>=0),'every progression entry numeric');
  }
  for(let i=1;i<31;i++)assert.ok(p.expeditionAttackPercent[i]>=p.expeditionAttackPercent[i-1],
   row.name+' cannot regress in progression row '+(i+1));
  assert.equal(row.expeditionSkills.length,3,'expedition skills need all three verified');
  for(const skill of row.expeditionSkills){
   assert.equal(skill.valuesBySkillLevel.length,5,'skill has exactly 5 source values');
   assert.ok(skill.valuesBySkillLevel.every(n=>Number.isFinite(n)&&n>=0));
   assert.equal(typeof skill.conditions,'object');
  }
 }
 assert.ok(verified>=4,'minimum reference baseline: Yang, Rosa, Petra and Zoe');
 const pairs={Yang:[68.17,540.43],Rosa:[46.71,370.30],
  Petra:[36.61,290.23],Zoe:[30.30,240.19]};
 for(const [name,[first,last]] of Object.entries(pairs)){
  const p=d.records.find(x=>x.name===name).starProgression.expeditionAttackPercent;
  assert.equal(p[0],first,name+' first source row');
  assert.equal(p[30],last,name+' last source row');
 }
 // Strict privacy: no player IDs or aliases are even modelled in the JSON.
 // Hero "name" is public canon; "username" / account properties are not.
 for(const row of d.records){
  for(const key of Object.keys(row))
   assert.ok(!/^(player|account|username|discord|userId|ingameId)/i.test(key),
    'forbidden private registry key: '+key);
 }
 return {count:d.records.length,sourced:verified,missing:d.records.length-verified};
}
const stats=validate(data);
// Probe invalid data and ensure validators/tests catch source-data corruption.
const duplicate=structuredClone(data);duplicate.records[1].id=duplicate.records[0].id;
assert.throws(()=>validate(duplicate),/duplicate hero keys/);
const imputed=structuredClone(data);const unknown=imputed.records.find(r=>r.status==='metadata-only');
unknown.starProgression={expeditionAttackPercent:[0]}; 
assert.throws(()=>validate(imputed),/unsourced progression/);
console.log('PUBLIC HERO REFERENCE: '+stats.count+' heroes indexed, '+stats.sourced+
 ' source-backed, '+stats.missing+' explicitly unknown; schema, provenance and privacy checks passed.');
