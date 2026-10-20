// CI coverage for the gameplay rule: proximity never causes aggression.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {decodePNG,crop,alphaBounds} from './lib/png.mjs';
const read=file=>fs.readFileSync(file,'utf8'),state={regionId:'wildwoodHunt',inventory:[{id:'sentinel',quantity:3}],progression:{coins:123}};
const context={console,Math,document:{hidden:false,getElementById:()=>null},window:{},TILE:48,
  GAME_STATE:state,player:{x:20,y:34,px:984,py:1656,face:'up',moving:false},menuOpen:false,dialogOpen:false,
  lifeUi:{chop:null},dirVec:{up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},
  blocked:new Set(),key:(x,y)=>x+','+y,inside:(x,y)=>x>0&&y>0&&x<63&&y<47,
  regionExitAt:()=>null,isFishingActive:()=>false,showLifeToast(){},clearMovement(){},showDialog(){},
  REGION_EXITS:{wildwoodHunt:[{to:'lilacVillage',entry:{x:48,y:37}}]}};
vm.createContext(context);
vm.runInContext(read('src/data/hunting-data.js')+'\n'+read('src/hunting.js')+
  '\nglobalThis.hunt={state:huntingState,types:WILDLIFE_TYPES,spawns:HUNTING_SPAWNS,rules:HUNTING_RULES};',context);
const run=code=>vm.runInContext(code,context),advance=ms=>{for(let t=0;t<ms;t+=40)run(`updateHunting(${Math.min(40,ms-t)})`);};
const snapshot=JSON.stringify(state);
advance(30000);assert.equal(context.hunt.state.hp,100);assert(context.hunt.state.animals.every(a=>a.mode==='idle'));
assert.equal(Object.keys(context.hunt.types).length,5);assert.equal(context.hunt.state.animals.length,10);
assert.equal(new Set(context.hunt.spawns.map(a=>a.x+','+a.y)).size,10);
run('for(const a of huntingState.animals){resetHuntingAnimal(a);a.wait=1e9;}globalThis.a=huntingState.animals[0];');
assert(run("strikeHuntingWildlife({mode:'sword',regionId:'wildwoodHunt'})"));
assert.equal(context.a.hp,48);assert.equal(context.hunt.state.animals.filter(a=>a.mode==='aggro').length,1);
advance(650);assert(context.a.windup);const hp=context.hunt.state.hp,clock=context.hunt.state.clock;
context.menuOpen=true;advance(2000);assert.equal(context.hunt.state.hp,hp);assert.equal(context.hunt.state.clock,clock);context.menuOpen=false;
advance(650);assert.equal(context.hunt.state.hp,88);
Object.assign(context.player,{x:55,y:41,px:2664,py:1992});advance(25000);
assert.equal(context.a.mode,'idle');assert.equal(context.a.hp,64);
// Walls and facing protect neutral bystanders from an unrelated swing.
run('resetHuntingAnimal(a);a.wait=1e9;player.x=20;player.y=34;player.px=984;player.py=1656;player.face="down";');
assert.equal(run("strikeHuntingWildlife({mode:'sword',regionId:'wildwoodHunt'})"),false);
context.player.face='up';context.blocked.add('20,33');assert.equal(run("strikeHuntingWildlife({mode:'sword',regionId:'wildwoodHunt'})"),false);context.blocked.clear();
assert.equal(context.a.mode,'idle');
// Every held tool can hit once through the common impact hook; no economic grant.
for(const [tool,damage]of Object.entries(context.hunt.rules.toolDamage)){
  run('resetHuntingAnimal(a);');assert(run(`strikeHuntingWildlife({mode:'${tool}',regionId:'wildwoodHunt'})`));assert.equal(context.a.hp,64-damage);
}
run('resetHuntingAnimal(a);');assert(run("strikeHuntingWildlife({regionId:'wildwoodHunt'})"));assert.equal(context.a.hp,54,'Existing axe actions have no mode field');
assert.equal(JSON.stringify(state),snapshot);
for(const id of Object.keys(context.hunt.types)){
  const image=decodePNG(fs.readFileSync(`assets/hunting/${id}-v1.png`));assert.equal(image.width,192);assert.equal(image.height,192);
  for(let i=0;i<4;i++){const b=alphaBounds(crop(image,(i%2)*96,Math.floor(i/2)*96,96,96));assert(b.width>12&&b.height>12&&b.x>=4&&b.y>=4&&b.x+b.width<=92&&b.y+b.height<=91);}
}
const attackSnapshot=JSON.stringify({state,hunt:context.hunt.state});let motionFrames=0;
for(const id of Object.keys(context.hunt.types))for(const face of ['down','left','right','up']){
  const image=decodePNG(fs.readFileSync(`assets/hunting/${id}-attack-v1.png`));
  assert.equal(image.width,192);assert.equal(image.height,192);
  const frame=['down','left','right','up'].indexOf(face),b=alphaBounds(crop(image,(frame%2)*96,Math.floor(frame/2)*96,96,96));
  assert(b.width>12&&b.height>12&&b.x>=4&&b.y>=4&&b.x+b.width<=92&&b.y+b.height<=91,'Attack art must fit the same feet/margin contract');
  assert(!fs.readFileSync(`assets/hunting/${id}-attack-v1.png`).equals(fs.readFileSync(`assets/hunting/${id}-v1.png`)),'Attack must have distinct authored artwork');
  const actor={type:id,hp:100,mode:'aggro',face,windup:{at:0,face},attackRecovery:null};context.visualActor=actor;
  const idle=run('getHuntingAttackVisual(visualActor,0,false)'),charge=run('getHuntingAttackVisual(visualActor,400,false)'),strike=run('getHuntingAttackVisual(visualActor,599,false)');
  assert.equal(idle.phase,'windup');assert.equal(charge.phase,'windup');assert.equal(strike.phase,'attack');
  assert.notEqual(strike.image,idle.image);assert(charge.scaleY<1);assert(Math.hypot(strike.offsetX,strike.offsetY)>10);
  const [dx,dy]=context.dirVec[face];assert(charge.offsetX*dx+charge.offsetY*dy<0);assert(strike.offsetX*dx+strike.offsetY*dy>0);
  actor.windup=null;actor.attackRecovery={at:600,face};
  const impact=run('getHuntingAttackVisual(visualActor,600,false)'),recover=run('getHuntingAttackVisual(visualActor,800,false)'),done=run('getHuntingAttackVisual(visualActor,860,false)');
  assert.equal(impact.phase,'impact');assert.equal(impact.image,strike.image);assert.equal(recover.phase,'recover');assert.equal(done.phase,'idle');assert.equal(done.offsetX,0);assert.equal(done.offsetY,0);
  const reduced=run('getHuntingAttackVisual(visualActor,600,true)');assert.equal(reduced.image,impact.image);assert.equal(reduced.offsetX,0);assert.equal(reduced.offsetY,0);assert.equal(reduced.lift,0);
  motionFrames+=7;
}
assert.equal(JSON.stringify({state,hunt:context.hunt.state}),attackSnapshot,'Rendering attack phases must not mutate gameplay or saved state');
console.log(`Hunting attack motion passed: ${motionFrames} species/direction phases, anticipation/impact/recovery, reduced motion and pure rendering.`);
console.log('Hunting passed: five 4-direction species, ten neutral spawns, individual retaliation, telegraph/pause, leash/reset, wall/facing guards, four tool families, unchanged economy.');
