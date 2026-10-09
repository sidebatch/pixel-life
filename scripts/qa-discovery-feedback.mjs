import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const classes=new Set(),toast={innerHTML:'',classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}},state={tree:false,fish:false,reward:false};
const context={setTimeout:()=>1,clearTimeout(){},window:{matchMedia:()=>({matches:true})},
 isTreeDiscoveryOpen:()=>state.tree,isFishDiscoveryOpen:()=>state.fish,isFishRewardRevealOpen:()=>state.reward,
 document:{getElementById:id=>id==='skillXPToast'?toast:null,querySelectorAll:()=>[]}};
vm.createContext(context);vm.runInContext(['src/data/life-skill-data.js','src/life-skills.js','src/skill-ui.js'].map(p=>fs.readFileSync(p,'utf8')).join('\n'),context);
const run=s=>vm.runInContext(s,context);
for(const [block,skill] of [['tree','logging'],['fish','fishing'],['reward','fishing']]){
 state[block]=true;
 run(`globalThis.before={level:1,xp:0,nextLevelXp:lifeSkillXpForNextLevel('${skill}',1),mastery:0,masteryXp:0};globalThis.after={...before,xp:8};showSkillXpFeedback('${skill}',before,after,8,'새 장비 구매 가능');`);
 assert.ok(!classes.has('show'),'Modal must not hide a running XP toast');assert.equal(run('skillFeedbackState.pending[0]'),skill);
 assert.equal(run('flushPendingSkillXpFeedback()'),false);
 assert.equal(run('skillFeedbackState.pending[4]'),'새 장비 구매 가능');
 run('before.xp=999;after.xp=999;');assert.equal(run('skillFeedbackState.pending[1].xp'),0);assert.equal(run('skillFeedbackState.pending[2].xp'),8);
 state[block]=false;assert.equal(run('flushPendingSkillXpFeedback()'),true);assert.equal(run('skillFeedbackState.pending'),null);
 assert.ok(classes.has('show'));assert.ok(toast.innerHTML.includes(`data-skill-card="${skill}"`));assert.ok(toast.innerHTML.includes('+8 XP'));
 assert.equal((toast.innerHTML.match(/class="skillCard"/g)||[]).length,1);assert.equal(run('flushPendingSkillXpFeedback()'),false);
 run('cancelSkillXpFeedback()');
}
state.fish=true;run("showSkillXpFeedback('fishing',before,after,8);cancelSkillXpFeedback()");state.fish=false;
assert.equal(run('flushPendingSkillXpFeedback()'),false);assert.equal(classes.has('show'),false);
console.log('Discovery feedback passed: tree/fish/reward deferred XP, immutable snapshots, one common toast, cancel, no visual double grant');
