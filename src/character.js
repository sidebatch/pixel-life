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
  for(const key of Object.keys(SWORD_TOOLS)){
    const image=characterToolImgs[key];
    if(!image||image.width!==96||image.height!==96)
      throw new Error(`Sword tool does not match rig: ${key}`);
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
    const sword=lifeUi.chop.mode==='sword';
    return {pose:sword?'sword':'chop',face,
      frame:tNow-lifeUi.chop.startedAt<(sword?SWORD_SWING_TIMING:FORESTRY_CHOP_TIMING).impactMs?0:1,
      tool:sword?'sword':'axe'};
  }
  if(typeof isFishingActive==='function'&&isFishingActive()){
    const phase=fishingState.phase;
    const frame=phase==='casting'&&fishingState.timer<FISHING_CONFIG.castMs*.55?0:phase==='result'?2:1;
    return {pose:'fish',face,frame,tool:'rod'};
  }
  const frame=player.moving?[0,1,2,1][Math.floor(tNow/105)%4]:0;
  return {pose:'walk',face,frame,tool:GAME_STATE.appearance?.activeTool||'axe'};
}

function getCharacterWalkAlignment(pose){
  // The authored boot-centred frames shift the collar under a stationary head.
  // Register the whole body/wardrobe/hand together; never change the head scale.
  // The approved soft registration is now normal play. Comparison modes
  // retain both the pre-correction and former balanced offsets.
  if(pose.pose!=='walk'||pose.face!=='down')return 0;
  if(CHARACTER_WALK_PREVIEW_ENABLED&&characterWalkPreview==='original')return 0;
  if(CHARACTER_WALK_PREVIEW_ENABLED&&characterWalkPreview==='balanced')return [0,3,-2][pose.frame];
  return [0,2,-1][pose.frame];
}

function getCharacterWalkHeadAlignment(pose){
  // Preserve the approved head-to-collar registration while the soft trial
  // reduces the torso's horizontal travel. Shared by both character bodies.
  return (!CHARACTER_WALK_PREVIEW_ENABLED||characterWalkPreview==='soft')&&
    pose.pose==='walk'&&pose.face==='down'?[0,-1,1][pose.frame]:0;
}

function getCharacterToolTransform(actorX,actorY,pose=getCharacterPose()){
  const frame=(pose.pose==='sword'?SWORD_ACTION:CHARACTER_RIG.poses[pose.pose]).frames[pose.face][pose.frame];
  const asset=pose.tool==='rod'?getEquippedFishingRod().asset:
    pose.tool==='sword'?getEquippedSword().asset:getEquippedForestryAxe().asset;
  const key=`${pose.tool}.${asset}`,tool=pose.tool==='sword'?SWORD_TOOLS[key]:CHARACTER_RIG.tools[key];
  if(!tool) return null;
  const unit=CHARACTER_RIG.renderSize/CHARACTER_RIG.cell;
  const x=actorX+(frame.grip[0]+getCharacterWalkAlignment(pose)-CHARACTER_RIG.feet[0])*unit;
  const y=actorY+20+(frame.grip[1]-CHARACTER_RIG.feet[1])*unit;
  const length=(pose.tool==='rod'?(pose.pose==='fish'?48:36):
    pose.tool==='sword'?(pose.pose==='sword'?38:30):pose.pose==='chop'?34:26)*unit;
  // Front/back carry and swings show a narrow three-quarter edge, not the broad
  // side. Keep the right-hand pivot and shaft length; side views stay intact.
  const frontBackCarry=pose.tool==='axe'&&pose.pose==='walk'&&
    (pose.face==='down'||pose.face==='up');
  const oldBladeComparison=CHARACTER_WALK_PREVIEW_ENABLED&&characterWalkPreview==='original'||
    typeof CHARACTER_MASTER_PREVIEW_ENABLED!=='undefined'&&CHARACTER_MASTER_PREVIEW_ENABLED&&
    characterMasterPreview==='original';
  const frontBackSwing=!oldBladeComparison&&pose.tool==='axe'&&pose.pose==='chop'&&
    (pose.face==='down'||pose.face==='up');
  // In front-view preparation the cutting edge must face forward, not back
  // over the shoulder. Impact and rear-view art already have the correct side.
  const mirror=pose.face==='left'||frontBackCarry||frontBackSwing&&pose.face==='down'&&pose.frame===0;
  const nativeAngle=mirror?Math.PI-tool.nativeAngle:tool.nativeAngle;
  const axisAngle=frontBackCarry?(pose.face==='down'?-1.95:-1.19):frame.angle;
  return {key,x,y,rotation:axisAngle-nativeAngle,axisAngle,
    edgeScale:frontBackCarry||frontBackSwing?0.55:1,scale:length/tool.nativeLength,mirror,
    behind:frame.toolBehind,tip:{x:x+Math.cos(axisAngle)*length,y:y+Math.sin(axisAngle)*length}};
}

function drawCharacterTool(transform){
  const image=transform&&characterToolImgs[transform.key];
  if(!image) return;
  const tool=SWORD_TOOLS[transform.key]||CHARACTER_RIG.tools[transform.key];
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
  const definition=pose.pose==='sword'?SWORD_ACTION:CHARACTER_RIG.poses[pose.pose],cell=CHARACTER_RIG.cell;
  const row={down:0,right:1,left:2,up:3}[pose.face],size=CHARACTER_RIG.renderSize;
  const x=actorX-CHARACTER_RIG.feet[0]*size/cell;
  const y=actorY+20-CHARACTER_RIG.feet[1]*size/cell;
  const transform=getCharacterToolTransform(actorX,actorY,pose);
  const appearance=typeof getCharacterRenderAppearance==='function'?getCharacterRenderAppearance():GAME_STATE.appearance||{};
  // Ria's front/right axe passes in front of her hair. The archived comparison
  // alone keeps the old depth; left/back still follow the rig's behind-tool flag.
  const oldRiaDepth=typeof CHARACTER_MASTER_PREVIEW_ENABLED!=='undefined'&&
    CHARACTER_MASTER_PREVIEW_ENABLED&&characterMasterPreview==='original';
  const axeInFrontOfRiaHair=!oldRiaDepth&&appearance.bodyId==='body.female'&&
    pose.tool==='axe'&&!transform?.behind;
  const swordInFrontOfHair=pose.tool==='sword'&&!transform?.behind;
  const toolOverHair=axeInFrontOfRiaHair||swordInFrontOfHair;
  const outfit=appearance.outfitId||DEFAULT_OUTFIT_ID;
  const drawLayer=name=>{
    // Chop source art has wider heads on some impact frames despite equal
    // cell/feet dimensions. Keep the same head dimensions, but translate/tilt
    // it around the neck with the torso instead of freezing it in place.
    const stableChopHead=(pose.pose==='chop'||pose.pose==='sword')&&(name==='Head'||name==='Hair');
    const artPose=pose.pose==='sword'?'chop':pose.pose;
    const layerPose=stableChopHead?'walk':artPose;
    const layerFrame=stableChopHead?0:pose.frame;
    const part=['Body','Head','Grip'].includes(name)?'body':name==='Hair'?'hair':name==='Backpack'?'backpack':null;
    const partId=part&&appearance[part==='backpack'?'backpackId':part+'Id'];
    const partLayers=part&&CHARACTER_PARTS[part].get(partId);
    const key=partLayers?.[layerPose+name]||layerPose+name;
    const outfitImages=typeof getCharacterOutfitImages==='function'?getCharacterOutfitImages(outfit):characterOutfitImgs[outfit];
    const image=name==='Outfit'&&outfitImages?.[artPose]||
      characterLayerImgs[key];
    if(!image)return;
    const motion=stableChopHead&&definition.frames[pose.face][pose.frame].headMotion;
    if(motion){
      const unit=size/cell,[px,py]=motion.pivot,[dx,dy]=motion.offset;
      ctx.save();ctx.translate(x+(px+dx)*unit,y+(py+dy)*unit);ctx.rotate(motion.rotation);
      ctx.drawImage(image,layerFrame*cell,row*cell,cell,cell,-px*unit,-py*unit,size,size);
      ctx.restore();
    }else{
      const bodyOffset=(name==='Head'||name==='Hair'?
        getCharacterWalkHeadAlignment(pose):getCharacterWalkAlignment(pose))*size/cell;
      ctx.drawImage(image,layerFrame*cell,row*cell,cell,cell,x+bodyOffset,y,size,size);
    }
  };
  if(transform?.behind)drawCharacterTool(transform);
  // Side bags are complete silhouettes attached behind the torso. Let the
  // anatomy occlude them; do not reuse a clipped strip from the old costume.
  const sidePack=pose.face==='right'||pose.face==='left';
  if(sidePack)drawLayer('Backpack');
  drawLayer('Body');drawLayer('Outfit');
  if(!sidePack)drawLayer('Backpack');
  if(!transform?.behind&&!toolOverHair)drawCharacterTool(transform);
  // A raised preparation hand passes behind the head. Drawing all gripping
  // hands last made this skin patch look like an exposed bald rear skull.
  const handBehindHead=(pose.pose==='chop'||pose.pose==='sword'||pose.pose==='fish')&&pose.frame===0;
  if(handBehindHead)drawLayer('Grip');
  drawLayer('Head');drawLayer('Hair');
  if(toolOverHair)drawCharacterTool(transform);
  if(!handBehindHead)drawLayer('Grip');
  return transform;
}

function getFishingRodTipPosition(){
  const actorX=DESKTOP_SMOOTH_RENDER?player.px-camX:Math.round(player.px-camX);
  const actorY=DESKTOP_SMOOTH_RENDER?player.py-camY:Math.round(player.py-camY);
  return getCharacterToolTransform(actorX,actorY)?.tip||{x:actorX,y:actorY-24};
}
