export async function acknowledgeFishRewardCards(page){
  const seen=[];
  for(let i=0;i<16;i++){
    await page.evaluate(()=>{if(typeof updateFishRewardReveal==='function')updateFishRewardReveal();});
    const reward=await page.evaluate(()=>typeof fishRewardRevealState!=='undefined'&&fishRewardRevealState.open?{...fishRewardRevealState.reward}:null);
    if(!reward)return seen;
    seen.push(reward);
    await page.locator('#fishRewardClaim').tap();
    await page.waitForFunction(id=>!isFishRewardRevealOpen()||fishRewardRevealState.reward?.id!==id,reward.id);
  }
  throw Error('Fish reward receipt queue did not finish');
}
