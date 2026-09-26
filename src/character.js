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
  // Front/back carry shows a narrow three-quarter edge, not the broad side.
  // Keep the right-hand pivot and shaft length; side views/swings stay intact.
  const frontBackCarry=pose.tool==='axe'&&pose.pose==='walk'&&
    (pose.face==='down'||pose.face==='up');
  const mirror=pose.face==='left'||frontBackCarry;
  const nativeAngle=mirror?Math.PI-tool.nativeAngle:tool.nativeAngle;
  const axisAngle=frontBackCarry?(pose.face==='down'?-1.95:-1.19):frame.angle;
  return {key,x,y,rotation:axisAngle-nativeAngle,axisAngle,
    edgeScale:frontBackCarry?0.55:1,scale:length/tool.nativeLength,mirror,
    behind:frame.toolBehind,tip:{x:x+Math.cos(axisAngle)*length,y:y+Math.sin(axisAngle)*length}};
}

function drawCharacterTool(transform){
  const image=transform&&characterToolImgs[transform.key];
  if(!image) return;
  const tool=CHARACTER_RIG.tools[transform.key];
  ctx.save();ctx.translate(transform.x,transform.y);
  if(transform.edgeScale<1){
    // Foreshorten only the dimension across the handle axis. Squashing the
    // texture's x axis would move the grip and bend its diagonal handle.
    ctx.rotate(transform.axisAngle);ctx.scale(1,transform.edgeScale);
    ctx.rotate(transform.rotation-transform.axisAngle);
  }else ctx.rotate(transform.rotation);
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
  const appearance=typeof getCharacterRenderAppearance==='function'?getCharacterRenderAppearance():GAME_STATE.appearance||{};
  const outfit=appearance.outfitId||DEFAULT_OUTFIT_ID;
  const drawLayer=name=>{
    // Chop source art has wider heads on some impact frames despite equal
    // cell/feet dimensions. Keep the same head dimensions, but translate/tilt
    // it around the neck with the torso instead of freezing it in place.
    const stableChopHead=pose.pose==='chop'&&(name==='Head'||name==='Hair');
    const layerPose=stableChopHead?'walk':pose.pose;
    const layerFrame=stableChopHead?0:pose.frame;
    const part=['Body','Head','Grip'].includes(name)?'body':name==='Hair'?'hair':name==='Backpack'?'backpack':null;
    const partId=part&&appearance[part==='backpack'?'backpackId':part+'Id'];
    const partLayers=part&&CHARACTER_PARTS[part].get(partId);
    const key=partLayers?.[layerPose+name]||layerPose+name;
    const image=name==='Outfit'&&characterOutfitImgs[outfit]?.[pose.pose]||
      characterLayerImgs[key];
    if(!image)return;
    const motion=stableChopHead&&definition.frames[pose.face][pose.frame].headMotion;
    if(motion){
      const unit=size/cell,[px,py]=motion.pivot,[dx,dy]=motion.offset;
      ctx.save();ctx.translate(x+(px+dx)*unit,y+(py+dy)*unit);ctx.rotate(motion.rotation);
      ctx.drawImage(image,layerFrame*cell,row*cell,cell,cell,-px*unit,-py*unit,size,size);
      ctx.restore();
    }else ctx.drawImage(image,layerFrame*cell,row*cell,cell,cell,x,y,size,size);
  };
  if(transform?.behind)drawCharacterTool(transform);
  drawLayer('Body');drawLayer('Outfit');drawLayer('Backpack');
  if(!transform?.behind)drawCharacterTool(transform);
  // A raised preparation hand passes behind the head. Drawing all gripping
  // hands last made this skin patch look like an exposed bald rear skull.
  const handBehindHead=(pose.pose==='chop'||pose.pose==='fish')&&pose.frame===0;
  if(handBehindHead)drawLayer('Grip');
  drawLayer('Head');drawLayer('Hair');
  if(!handBehindHead)drawLayer('Grip');
  return transform;
}

function getFishingRodTipPosition(){
  const actorX=DESKTOP_SMOOTH_RENDER?player.px-camX:Math.round(player.px-camX);
  const actorY=DESKTOP_SMOOTH_RENDER?player.py-camY:Math.round(player.py-camY);
  return getCharacterToolTransform(actorX,actorY)?.tip||{x:actorX,y:actorY-24};
}
