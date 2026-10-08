// Cosmetic collection progression is separate from legacy coin/XP/rod flags.
function fishDexRewardQualifications(fishCollections={}){
  const discovered=FISH_DATA.filter(fish=>Number(fishCollections[fish.id]?.count)>0).length;
  const milestoneIds=FISH_DEX_MILESTONES.filter(reward=>discovered>=reward.count).map(reward=>reward.id);
  const habitatIds=FISHING_HABITATS.filter(habitat=>{
    const fish=FISH_DATA.filter(item=>item.habitat===habitat.id);
    return fish.length===habitat.targetSpeciesCount&&fish.length>0&&fish.every(item=>Number(fishCollections[item.id]?.count)>0);
  }).map(habitat=>habitat.id);
  return {milestoneIds,habitatIds};
}
function normalizeSavedFishDexRewards(raw,fishCollections={}){
  const qualified=fishDexRewardQualifications(fishCollections);
  const modern=raw&&typeof raw==='object'&&raw.schemaVersion===1;
  const revealed=(key,ids)=>modern?(Array.isArray(raw[key])?raw[key]:[]).filter((id,i,all)=>ids.includes(id)&&all.indexOf(id)===i):[...ids];
  // Old saves get earned cosmetics quietly; modern unfinished cards remain pending.
  return {schemaVersion:1,...qualified,
    revealedMilestoneIds:revealed('revealedMilestoneIds',qualified.milestoneIds),
    revealedHabitatIds:revealed('revealedHabitatIds',qualified.habitatIds)};
}
function getFishDexRewardState(state=GAME_STATE){
  const collections=state.collections||(state.collections={fish:{}});
  const current=collections.fishRewards;
  if(!current||current.schemaVersion!==1||
    !['milestoneIds','habitatIds','revealedMilestoneIds','revealedHabitatIds'].every(key=>Array.isArray(current[key])))
    collections.fishRewards=normalizeSavedFishDexRewards(current,collections.fish);
  return collections.fishRewards;
}
function syncFishDexRewards(state=GAME_STATE){
  const current=getFishDexRewardState(state),next=normalizeSavedFishDexRewards(current,state.collections.fish);
  Object.assign(current,next);
  return current;
}
function pendingFishDexReward(){
  const state=getFishDexRewardState();
  const habitat=FISHING_HABITATS.find(item=>state.habitatIds.includes(item.id)&&!state.revealedHabitatIds.includes(item.id));
  if(habitat)return {kind:'habitat',id:habitat.id,name:habitat.shortLabel+' 도감 졸업',symbol:'✓',
    description:habitat.label+'의 모든 물고기를 발견했습니다. 이 서식지의 도장과 영구 장식이 도감에 남습니다.',
    progress:habitat.targetSpeciesCount+' / '+habitat.targetSpeciesCount+'종 발견'};
  const milestone=FISH_DEX_MILESTONES.find(item=>state.milestoneIds.includes(item.id)&&!state.revealedMilestoneIds.includes(item.id));
  return milestone?{...milestone,kind:'milestone',progress:milestone.count+' / '+FISH_DATA.length+'종 발견'}:null;
}
function acknowledgeFishDexReward(reward){
  const state=syncFishDexRewards(),ids=reward?.kind==='habitat'?state.habitatIds:state.milestoneIds;
  const key=reward?.kind==='habitat'?'revealedHabitatIds':'revealedMilestoneIds';
  if(!reward||!ids.includes(reward.id)||state[key].includes(reward.id))return false;
  const previous=[...state[key]];state[key].push(reward.id);
  if(!saveGame()){state[key]=previous;return false;}
  return true;
}
function fishDexActiveTitle(){
  const ids=getFishDexRewardState().milestoneIds;
  return [...FISH_DEX_MILESTONES].reverse().find(reward=>reward.title&&ids.includes(reward.id))?.title||
    (GAME_STATE.progression.flags?.masterAnglerTitle?'강태공':null);
}
function fishDexRewardFrame(){
  const ids=getFishDexRewardState().milestoneIds;
  return ids.includes('world-master-angler')?'fish-reward-aurora':ids.includes('wave-frame')?'fish-reward-wave':'';
}
function hasFishVoyageRewardFlag(){return getFishDexRewardState().milestoneIds.includes('voyage-flag');}
