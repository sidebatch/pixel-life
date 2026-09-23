const skillFeedbackState={token:0,hideTimer:null,overlayTimer:null};

function skillCardMarkup(skillId,snapshot=lifeSkillProgressSnapshot(skillId),nextGoal=''){
  const skill=LIFE_SKILLS[skillId];
  const isMastery=snapshot.level>=LIFE_SKILL_MAX_LEVEL;
  const title=isMastery?`Lv.100 · 숙련도 ${snapshot.mastery}`:`Lv.${snapshot.level}`;
  const value=isMastery?snapshot.masteryXp:snapshot.xp;
  const required=isMastery?lifeSkillMasteryXpRequired(snapshot.mastery):snapshot.nextLevelXp;
  const percent=Math.min(100,Math.floor(value/required*100));
  return `<div class="skillCard" data-skill-card="${skillId}">
    <div class="skillCardTop"><span class="skillCardIcon">${skill.icon}</span><b>${skill.name}</b><strong class="skillCardLevel">${title}</strong></div>
    <div class="skillCardBar${percent>=98?' veryNear':percent>=90?' near':''}" role="progressbar" aria-label="${skill.name} 경험치" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
    <div class="skillCardFoot"><span class="skillCardXp">${value.toLocaleString()} / ${required.toLocaleString()} XP</span><b class="skillCardPercent">${percent}%</b></div>
    ${nextGoal?`<small class="skillCardGoal">다음 목표 · ${nextGoal}</small>`:''}
  </div>`;
}

function setSkillCardProgress(skillId,snapshot,instant=false){
  const isMastery=snapshot.level>=LIFE_SKILL_MAX_LEVEL;
  const value=isMastery?snapshot.masteryXp:snapshot.xp;
  const required=isMastery?lifeSkillMasteryXpRequired(snapshot.mastery):lifeSkillXpForNextLevel(skillId,snapshot.level);
  const percent=Math.min(100,Math.floor(value/required*100));
  document.querySelectorAll(`[data-skill-card="${skillId}"]`).forEach(card=>{
    card.querySelector('.skillCardLevel').textContent=isMastery?`Lv.100 · 숙련도 ${snapshot.mastery}`:`Lv.${snapshot.level}`;
    card.querySelector('.skillCardXp').textContent=`${value.toLocaleString()} / ${required.toLocaleString()} XP`;
    card.querySelector('.skillCardPercent').textContent=`${percent}%`;
    const bar=card.querySelector('.skillCardBar');
    bar.setAttribute('aria-valuenow',String(percent));
    bar.classList.toggle('near',percent>=90);
    bar.classList.toggle('veryNear',percent>=98);
    const fill=bar.querySelector('span');
    if(instant){fill.style.transition='none';fill.style.width=`${percent}%`;fill.offsetWidth;fill.style.transition='';}
    else fill.style.width=`${percent}%`;
  });
}

function showSkillLevelUp(skillId,level,mastery,currentReward,nextGoal){
  const overlay=document.getElementById('skillLevelUpOverlay');
  if(!overlay) return;
  const skill=LIFE_SKILLS[skillId];
  overlay.replaceChildren();
  const icon=document.createElement('span');icon.textContent=skill.icon;
  const title=document.createElement('b');title.textContent=mastery===null?`${skill.name} Lv.${level}!`:`${skill.name} 숙련도 ${mastery}!`;
  const reward=document.createElement('p');reward.textContent=currentReward||'실력이 늘었어요!';
  overlay.append(icon,title,reward);
  if(nextGoal){const next=document.createElement('small');next.textContent=`다음 목표 · ${nextGoal}`;overlay.append(next);}
  overlay.classList.add('show');
  clearTimeout(skillFeedbackState.overlayTimer);
  skillFeedbackState.overlayTimer=setTimeout(()=>overlay.classList.remove('show'),1550);
  playSkillLevelUpSound();
}

let skillLevelAudioContext=null;
function playSkillLevelUpSound(){
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass) return;
  try{
    skillLevelAudioContext ||= new AudioContextClass();
    const now=skillLevelAudioContext.currentTime;
    [523.25,659.25,783.99].forEach((frequency,index)=>{
      const oscillator=skillLevelAudioContext.createOscillator();
      const gain=skillLevelAudioContext.createGain();
      oscillator.type='sine';oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(.0001,now+index*.11);
      gain.gain.exponentialRampToValueAtTime(.025,now+index*.11+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,now+index*.11+.27);
      oscillator.connect(gain);gain.connect(skillLevelAudioContext.destination);
      oscillator.start(now+index*.11);oscillator.stop(now+index*.11+.3);
    });
  }catch(_){}
}

function skillFeedbackPause(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function showSkillXpFeedback(skillId,before,after,gained,currentReward='',nextGoal=''){
  const toast=document.getElementById('skillXPToast');
  if(!toast||!gained) return;
  const token=++skillFeedbackState.token;
  clearTimeout(skillFeedbackState.hideTimer);
  toast.innerHTML=`<div class="skillToastGain">+${gained} XP</div>${skillCardMarkup(skillId,before)}`;
  toast.classList.add('show');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduced){
    setSkillCardProgress(skillId,after,true);
    if(after.level>before.level||after.mastery>before.mastery){
      showSkillLevelUp(skillId,after.level,after.mastery>before.mastery?after.mastery:null,currentReward,nextGoal);
    }
  }else{
    await skillFeedbackPause(40);
    if(token!==skillFeedbackState.token) return;
    const levelCount=after.level-before.level;
    const animatedLevels=Math.min(levelCount,3);
    for(let step=0;step<animatedLevels;step++){
      const level=before.level+step;
      setSkillCardProgress(skillId,{level,xp:lifeSkillXpForNextLevel(skillId,level),mastery:0,masteryXp:0});
      await skillFeedbackPause(420);
      if(token!==skillFeedbackState.token) return;
      const nextLevel=level+1;
      showSkillLevelUp(skillId,nextLevel,null,step===animatedLevels-1?currentReward:'',nextGoal);
      setSkillCardProgress(skillId,{level:nextLevel,xp:0,mastery:0,masteryXp:0},true);
      await skillFeedbackPause(180);
      if(token!==skillFeedbackState.token) return;
    }
    if(levelCount===0&&after.mastery>before.mastery){
      setSkillCardProgress(skillId,{level:100,xp:0,mastery:before.mastery,masteryXp:lifeSkillMasteryXpRequired(before.mastery)});
      await skillFeedbackPause(420);
      if(token!==skillFeedbackState.token) return;
      showSkillLevelUp(skillId,100,after.mastery,currentReward,nextGoal);
      setSkillCardProgress(skillId,{level:100,xp:0,mastery:after.mastery,masteryXp:0},true);
    }
    setSkillCardProgress(skillId,after);
  }
  skillFeedbackState.hideTimer=setTimeout(()=>toast.classList.remove('show'),3000);
}
