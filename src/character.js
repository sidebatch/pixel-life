// One coordinate contract for body, clothing and tool grips in every action.
// All authored frames use 96px cells and the same feet at (48,88).
function validateCharacterRigAssets(){
  for(const [pose,definition] of Object.entries(CHARACTER_RIG.poses)){
    for(const name of ['Body','Head','Hair','Outfit','Backpack','Grip']){
      const image=characterLayerImgs[pose+name];
      if(!image||image.width!==definition.columns*CHARACTER_RIG.cell||image.height!==4*CHARACTER_RIG.cell)
        throw new Error(`Character layer dimensions do not match rig: ${pose}${name}`);
    }
  }
  for(const [key,tool] of Object.entries(CHARACTER_RIG.tools)){
    const image=characterToolImgs[key];
    if(!image||image.width!==96||image.height!==96||tool.nativeLength<=0)
      throw new Error(`Character tool does not match rig: ${key}`);
  }
  for(const [part,entries] of Object.entries(CHARACTER_PARTS)){
    const required=part==='body'?['Body','Head','Grip']:part==='hair'?['Hair']:['Backpack'];
    for(const [id,layers] of entries)for(const [pose,definition] of Object.entries(CHARACTER_RIG.poses)){
      for(const name of required){
        const image=characterLayerImgs[layers[pose+name]];
        if(!image||image.width!==definition.columns*CHARACTER_RIG.cell||image.height!==384)
          throw new Error(`Missing or wrong part layer: ${id}/${pose}${name}`);
      }
    }
  }
}

function getCharacterPose(){
  const face=player.face||'down';
  if(lifeUi.chop?.regionId===GAME_STATE.regionId){
    return {pose:'chop',face,frame:tNow-lifeUi.chop.startedAt<FORESTRY_CHOP_TIMING.impactMs?0:1,tool:'axe'};
  }
  if(typeof isFishingActive==='function'&&isFishingActive()){
    const phase=fishingState.phase;
    const frame=phase==='casting'&&fishingState.timer<FISHING_CONFIG.castMs*.55?0:phase==='result'?2:1;
    return {pose:'fish',face,frame,tool:'rod'};
  }
  const frame=player.moving?[0,1,2,1][Math.floor(tNow/105)%4]:0;
  return {pose:'walk',face,frame,tool:GAME_STATE.appearance?.activeTool||'axe'};
}

function getCharacterToolTransform(actorX,actorY,pose=getCharacterPose()){
  const frame=CHARACTER_RIG.poses[pose.pose].frames[pose.face][pose.frame];
  const asset=pose.tool==='rod'?getEquippedFishingRod().asset:getEquippedForestryAxe().asset;
  const key=`${pose.tool}.${asset}`,tool=CHARACTER_RIG.tools[key];
  if(!tool) return null;
  const unit=CHARACTER_RIG.renderSize/CHARACTER_RIG.cell;
  const x=actorX+(frame.grip[0]-CHARACTER_RIG.feet[0])*unit;
  const y=actorY+20+(frame.grip[1]-CHARACTER_RIG.feet[1])*unit;
  const length=(pose.tool==='rod'?(pose.pose==='fish'?48:36):pose.pose==='chop'?34:26)*unit;
  // Keep the shaft on the same hand/angle, but turn the cutting edge toward
  // the character's facing direction when carrying an axe front/back.
  // Side views and active swings keep their existing orientation.
  const frontBackCarry=pose.tool==='axe'&&pose.pose==='walk'&&
    (pose.face==='down'||pose.face==='up');
  const mirror=pose.face==='left'||frontBackCarry;
  const nativeAngle=mirror?Math.PI-tool.nativeAngle:tool.nativeAngle;
  return {key,x,y,rotation:frame.angle-nativeAngle,scale:length/tool.nativeLength,mirror,
    behind:frame.toolBehind,tip:{x:x+Math.cos(frame.angle)*length,y:y+Math.sin(frame.angle)*length}};
}

function drawCharacterTool(transform){
  const image=transform&&characterToolImgs[transform.key];
  if(!image) return;
  const tool=CHARACTER_RIG.tools[transform.key];
  ctx.save();ctx.translate(transform.x,transform.y);ctx.rotate(transform.rotation);
  ctx.scale(transform.mirror?-transform.scale:transform.scale,transform.scale);
  // The origin is the actual handle grip, never the texture corner.
  ctx.drawImage(image,-tool.grip[0],-tool.grip[1]);ctx.restore();
}

function drawCharacterActor(actorX,actorY,pose=getCharacterPose()){
  const definition=CHARACTER_RIG.poses[pose.pose],cell=CHARACTER_RIG.cell;
  const row={down:0,right:1,left:2,up:3}[pose.face],size=CHARACTER_RIG.renderSize;
  const x=actorX-CHARACTER_RIG.feet[0]*size/cell;
  const y=actorY+20-CHARACTER_RIG.feet[1]*size/cell;
  const transform=getCharacterToolTransform(actorX,actorY,pose);
  const outfit=GAME_STATE.appearance?.outfitId||DEFAULT_OUTFIT_ID;
  const appearance=GAME_STATE.appearance||{};
  const drawLayer=name=>{
    const part=['Body','Head','Grip'].includes(name)?'body':name==='Hair'?'hair':name==='Backpack'?'backpack':null;
    const partId=part&&appearance[part==='backpack'?'backpackId':part+'Id'];
    const partLayers=part&&CHARACTER_PARTS[part].get(partId);
    const key=partLayers?.[pose.pose+name]||pose.pose+name;
    const image=name==='Outfit'&&characterOutfitImgs[outfit]?.[pose.pose]||
      characterLayerImgs[key];
    if(image)ctx.drawImage(image,pose.frame*cell,row*cell,cell,cell,x,y,size,size);
  };
  if(transform?.behind)drawCharacterTool(transform);
  drawLayer('Body');drawLayer('Outfit');drawLayer('Backpack');
  if(!transform?.behind)drawCharacterTool(transform);
  drawLayer('Head');drawLayer('Hair');drawLayer('Grip');
  return transform;
}

function getFishingRodTipPosition(){
  const actorX=DESKTOP_SMOOTH_RENDER?player.px-camX:Math.round(player.px-camX);
  const actorY=DESKTOP_SMOOTH_RENDER?player.py-camY:Math.round(player.py-camY);
  return getCharacterToolTransform(actorX,actorY)?.tip||{x:actorX,y:actorY-24};
}
