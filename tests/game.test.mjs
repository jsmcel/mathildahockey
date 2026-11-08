import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const temp=await mkdtemp(path.join(tmpdir(),'hockey-tests-'));
const bundle=path.join(temp,'engine.mjs');
await build({entryPoints:['lib/hockey.ts'],bundle:true,platform:'node',format:'esm',outfile:bundle,logLevel:'silent'});
const {Hockey}=await import(pathToFileURL(bundle));
globalThis.Image=class{complete=false;};
globalThis.requestAnimationFrame=()=>1;
globalThis.cancelAnimationFrame=()=>{};
const opts={sound:false,auto:true,slow:true,effects:false,target:3};
const game=(team=['matilda','red','chuck'],rival=0)=>new Hockey({},team,rival,{...opts},()=>{});
test('ordinary and special shots reach the opposing goal, count once, and finish at target',()=>{
  const g=game();
  for(let n=1;n<=3;n++){
    g.shoot(true);
    for(let i=0;i<300&&!g.state.goal;i++)g.update(1/60);
    assert.equal(g.state.ours,n);
    assert.equal(g.state.theirs,0);
    g.update(.1);assert.equal(g.state.ours,n);
    if(n<3){g.update(3);assert.equal(g.state.goal,false);}
  }
  assert.equal(g.state.finished,true);
  g.shoot();g.update(10);assert.equal(g.state.ours,3);g.destroy();
});
test('all six abilities produce their own effect and share a rechargeable meter',()=>{
  for(const id of ['matilda','red','chuck','bomb','blues','stella']){
    const g=game([id,'red','chuck']);g.special();assert.equal(g.state.power,0,id);
    if(id==='matilda'||id==='red'){assert.equal(g.puck.super,true);assert.equal(g.puck.owner,-1);}
    if(id==='chuck')assert.ok(g.boosted>g.clock);
    if(id==='bomb')assert.equal(g.puck.owner,0);
    if(id==='blues')assert.equal(g.players[0].x,500);
    if(id==='stella')assert.ok(g.protectedUntil>g.clock);
    const prior=g.boosted;g.special();assert.equal(g.boosted,prior);g.destroy();
  }
  const g=game(['chuck','red','matilda']);g.special();for(let i=0;i<1100;i++)g.update(1/60);assert.equal(g.state.power,100);g.destroy();
});
test('pause freezes puck, player movement, score, and ability recharge',()=>{
  const g=game();g.state.power=20;g.pause(true);const before=JSON.stringify([g.players,g.puck,g.state]);g.update(20);g.shoot();g.pass();g.special();g.setActive(2);assert.equal(JSON.stringify([g.players,g.puck,g.state]),before);g.destroy();
});
test('passes change both the puck carrier and controlled player; settings affect pace',()=>{
  const g=game();g.pass();assert.equal(g.puck.owner,1);assert.equal(g.state.active,1);g.pass(2);assert.equal(g.puck.owner,2);assert.equal(g.state.active,2);
  const slow=game(),fast=game();fast.options.slow=false;slow.update(1);fast.update(1);assert.ok(fast.players[0].x>slow.players[0].x);g.destroy();slow.destroy();fast.destroy();
});
test('piggy goals count for the opponents and never count repeatedly during a goal',()=>{
  const g=game();Object.assign(g.puck,{owner:-1,x:55,y:280,vx:-400,vy:0,lock:2});g.update(.02);assert.equal(g.state.theirs,1);g.update(.02);assert.equal(g.state.theirs,1);g.destroy();
});
await rm(temp,{recursive:true,force:true});
