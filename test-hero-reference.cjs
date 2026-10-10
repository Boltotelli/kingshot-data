'use strict';
// Source-aware PUBLIC Kingshot reference integrity tests. No network in CI.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=__dirname;
const data=JSON.parse(fs.readFileSync(path.join(base,'heroes.v1.json'),'utf8'));
const schema=JSON.parse(fs.readFileSync(path.join(base,'schema.v1.json'),'utf8'));
const index=JSON.parse(fs.readFileSync(path.join(base,'catalog.v1.json'),'utf8'));
const tierMap=JSON.parse(fs.readFileSync(path.join(base,'star-tiers.v1.json'),'utf8'));
const catalogJs=path.join(base,'../catalog.js');
if(fs.existsSync(catalogJs)){
 const scope={window:{}};vm.runInNewContext(fs.readFileSync(catalogJs,'utf8'),scope);
 assert.deepEqual(index.heroes.map(x=>x.name).sort(),
  Array.from(scope.window.NRW_BEAR_CATALOG.heroes,x=>x.name).sort(),
  'standalone catalog snapshot remains aligned with welcome-nrw when available');
}
const classes=Object.fromEntries(index.heroes.map(x=>[x.name,x.type]));
const allowedMax={1:200.16,2:240.19,3:290.23,4:370.30,5:444.36,
 6:540.43,7:650.52,8:780.62};
const expectedCost=[0,1,1,2,2,2,2,...Array(5).fill(5),15,
 ...Array(5).fill(15),40,...Array(5).fill(40),100,...Array(6).fill(100)];
function validate(d){
 assert.equal(tierMap.schemaVersion,1);
 assert.equal(tierMap.mappingStatus,'verified-by-independent-shard-tables');
 assert.equal(tierMap.rows.length,31,'complete zero-to-five-star table');
 assert.equal(tierMap.totalShardsTo5Stars,1065);
 assert.deepEqual(tierMap.fullStarTotals,[10,40,115,300,600]);
 assert.deepEqual(tierMap.rows.map(r=>r.shardsToReachStep),expectedCost);
 assert.equal(tierMap.rows[28].fullStars,4);assert.equal(tierMap.rows[28].partialTier,4);
 assert.equal(tierMap.rows[28].sourceRow,29,'Yang 4★ T4 source table row');
 assert.equal(tierMap.rows[30].fullStars,5);assert.equal(tierMap.rows[30].partialTier,0);
 for(let i=0,total=0;i<tierMap.rows.length;i++){
  total+=expectedCost[i];
  assert.deepEqual(tierMap.rows[i],{
   sourceRow:i+1,step:i,fullStars:Math.floor(i/6),partialTier:i%6,
   shardsToReachStep:expectedCost[i],cumulativeShards:total
  });
 }
 assert.equal(d.schemaVersion,1);assert.equal(d.publicDataOnly,true);
 assert.equal(d.releaseStatus,'research-preview','still lacks level-specific base values');
 assert.equal(schema.properties.publicDataOnly.const,true);
 assert.equal(schema.properties.schemaVersion.const,1);
 assert.equal(d.records.length,37,'all 37 catalog heroes');
 assert.equal(index.heroes.length,d.records.length);
 assert.equal(new Set(d.records.map(x=>x.id)).size,37,'no duplicate ids');
 assert.equal(new Set(d.records.map(x=>x.name)).size,37,'no duplicate heroes');
 assert.deepEqual(d.records.map(x=>x.name).sort(),index.heroes.map(x=>x.name).sort());
 let secondary=0,primary=0;
 for(const h of d.records){
  assert.equal(h.troopType,classes[h.name],h.name+' class matches public index');
  assert.match(h.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(h.status,'partial-sourced','never mark unknown level bases fully verified');
  assert.equal(h.conquestBaseByHeroLevel,null,'no fabricated 1–80 hero base values');
  assert.ok(Number.isInteger(h.generation)&&h.generation>=1&&h.generation<=8);
  assert.equal(h.source.catalog,'catalog.v1.json');
  assert.match(h.source.stats,/^https:\/\/kingshotdata\.com\/heroes\/[a-z0-9-]+\/$/);
  assert.match(h.source.verifiedOn,/^\d{4}-\d{2}-\d{2}$/);
  assert.match(h.source.skillSource,/^https:\/\/(kingshotdata\.com|github\.com)\/.+/);
  assert.ok(['primary-checked','secondary-only'].includes(h.source.skillVerification));
  if(h.source.skillVerification==='primary-checked')primary++;else secondary++;
  const p=h.starProgression;
  assert.equal(p.sourceRowIndices,'1..31');
  assert.equal(p.rowToDisplayStarTier,'validated-six-steps-per-star');
  for(const key of ['expeditionAttackPercent','expeditionDefensePercent','shardsToNextRow']){
   assert.equal(p[key].length,31,h.name+' '+key+' 31 rows');
   assert.ok(p[key].every(x=>Number.isFinite(x)&&x>=0),h.name+' nonnegative source numbers');
  }
  assert.deepEqual(p.shardsToNextRow,expectedCost,'exact 31 shard costs from primary source');
  for(const [a,b] of [[1,6],[7,12],[13,18],[19,24],[25,30]]){
   const expected=[10,40,115,300,600][(a-1)/6];
   assert.equal(p.shardsToNextRow.slice(a,b+1).reduce((s,x)=>s+x,0),expected,'independent tier costs');
  }
  assert.equal(p.shardsToNextRow.reduce((s,x)=>s+x,0),1065,'five-star total');
  for(let i=0;i<31;i++){
   assert.equal(p.expeditionAttackPercent[i],p.expeditionDefensePercent[i],h.name+' base expedition progression');
   if(i>0)assert.ok(p.expeditionAttackPercent[i]>=p.expeditionAttackPercent[i-1],h.name+' monotonic');
  }
  const expMax=h.name==='Diana'?110.09:h.name==='Amadeus'?260.21:
   h.generation===1&&['Olive','Edwin','Seth','Forrest'].includes(h.name)?90.07:
   h.generation===1&&['Amane','Yeonwoo','Fahd','Chenko','Gordon','Howard','Quinn'].includes(h.name)?140.11:
   allowedMax[h.generation];
  assert.equal(p.expeditionAttackPercent[30],expMax,h.name+' max must match direct source');
  assert.ok(h.expeditionSkills.length>=2&&h.expeditionSkills.length<=3,
   h.name+' rare/epic have 2 skills, legendary 3');
  for(const skill of h.expeditionSkills){
   assert.ok(typeof skill.name==='string'&&skill.name.length>=2);
   assert.ok(typeof skill.effect==='string'&&skill.effect.length>=2);
   assert.equal(skill.valuesBySkillLevel.length,5,h.name+' / '+skill.name);
   assert.ok(skill.valuesBySkillLevel.every(n=>Number.isFinite(n)&&n>=0));
   assert.equal(typeof skill.conditions,'object');
   for(const effect of skill.additionalEffects||[]){
    assert.equal(effect.valuesBySkillLevel.length,5,h.name+' secondary effect');
    assert.ok(effect.valuesBySkillLevel.every(n=>Number.isFinite(n)&&n>=0));
    assert.ok(effect.effect.length>=2);
   }
  }
  for(const key of Object.keys(h))
   assert.ok(!/^(player|account|username|discord|userId|ingameId)/i.test(key),
    'private player field forbidden '+key);
 }
 assert.equal(primary+secondary,37);
 // Real display examples: Yang 4★T4 is row 29, Rosa 5★ is row 31.
 const yang=d.records.find(x=>x.name==='Yang').starProgression.expeditionAttackPercent;
 const rosa=d.records.find(x=>x.name==='Rosa').starProgression.expeditionAttackPercent;
 const toIndex=(stars,tier)=>{assert.ok(Number.isInteger(stars)&&stars>=0&&stars<=5);
  assert.ok(Number.isInteger(tier)&&tier>=0&&tier<=5&&(stars!==5||tier===0));
  return stars*6+tier;};
 assert.equal(toIndex(4,4),28);
 assert.equal(yang[toIndex(4,4)],472.18);
 assert.equal(rosa[toIndex(5,0)],370.30);
 const amadeus=d.records.find(x=>x.name==='Amadeus').starProgression.expeditionAttackPercent;
 const helga=d.records.find(x=>x.name==='Helga').starProgression.expeditionAttackPercent;
 assert.ok(amadeus[30]>helga[30],'do NOT collapse Amadeus Gen1 into regular mythic table');
 assert.ok(d.records.find(x=>x.name==='Diana').starProgression.expeditionAttackPercent[30]<
   d.records.find(x=>x.name==='Howard').starProgression.expeditionAttackPercent[30],
  'do NOT collapse Diana into the generic epic table');
 return {heroes:d.records.length,primary,secondary};
}
const result=validate(data);
const dup=structuredClone(data);dup.records[1].id=dup.records[0].id;
assert.throws(()=>validate(dup),/duplicate ids/);
const corrupt=structuredClone(data);corrupt.records[2].starProgression.shardsToNextRow[12]=5;
assert.throws(()=>validate(corrupt),/shard costs/);
const leaked=structuredClone(data);leaked.records[1].playerId='123456';
assert.throws(()=>validate(leaked),/private player field/);
console.log('KINGSHot reference: '+result.heroes+' heroes with 31 star steps; '+
 result.primary+' primary-checked skill sets, '+result.secondary+
 ' secondary-source sets; 1,065 shards and privacy invariants passed.');
