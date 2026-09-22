function worldRect(wx,wy,w,h,color){
  ctx.fillStyle=color;
  ctx.fillRect(Math.floor(wx-camX),Math.floor(wy-camY),Math.ceil(w),Math.ceil(h));
}

// PATH STANDARD V1
// Gameplay remains on the 48px tile grid, but roads are rendered as connected
// footpaths instead of full square tiles. This removes the prototype/grid look.
function pathNeighbor(x,y,dx,dy){ return pathSet.has(key(x+dx,y+dy)); }
function drawPathShape(x,y,color,width){
  const sx=Math.round(x*TILE-camX), sy=Math.round(y*TILE-camY);
  const c=TILE/2, half=width/2;
  const n=pathNeighbor(x,y,0,-1), s=pathNeighbor(x,y,0,1);
  const w=pathNeighbor(x,y,-1,0), e=pathNeighbor(x,y,1,0);
  ctx.fillStyle=color;

  // central rounded pad
  ctx.beginPath();
  ctx.arc(sx+c,sy+c,half,0,Math.PI*2);
  ctx.fill();

  // four directional arms; intersections and corners connect automatically
  if(n) ctx.fillRect(Math.round(sx+c-half),sy,Math.ceil(width),Math.ceil(c));
  if(s) ctx.fillRect(Math.round(sx+c-half),Math.round(sy+c),Math.ceil(width),Math.ceil(c));
  if(w) ctx.fillRect(sx,Math.round(sy+c-half),Math.ceil(c),Math.ceil(width));
  if(e) ctx.fillRect(Math.round(sx+c),Math.round(sy+c-half),Math.ceil(c),Math.ceil(width));

  // fill inside corners so T/cross/corner junctions read as one continuous road
  if(n&&w) ctx.fillRect(Math.round(sx+c-half),Math.round(sy+c-half),Math.ceil(half),Math.ceil(half));
  if(n&&e) ctx.fillRect(Math.round(sx+c),Math.round(sy+c-half),Math.ceil(half),Math.ceil(half));
  if(s&&w) ctx.fillRect(Math.round(sx+c-half),Math.round(sy+c),Math.ceil(half),Math.ceil(half));
  if(s&&e) ctx.fillRect(Math.round(sx+c),Math.round(sy+c),Math.ceil(half),Math.ceil(half));
}
function pathContainsLocal(x,y,lx,ly,width=36){
  const c=TILE/2, half=width/2;
  const dx=lx-c, dy=ly-c;
  if(dx*dx+dy*dy<=half*half) return true;
  if(pathNeighbor(x,y,0,-1) && Math.abs(dx)<=half && ly<=c) return true;
  if(pathNeighbor(x,y,0,1) && Math.abs(dx)<=half && ly>=c) return true;
  if(pathNeighbor(x,y,-1,0) && Math.abs(dy)<=half && lx<=c) return true;
  if(pathNeighbor(x,y,1,0) && Math.abs(dy)<=half && lx>=c) return true;
  return false;
}
function drawPathTile(x,y){
  // Slight dark rim + warm inner dirt gives the path readable edges without outlines.
  drawPathShape(x,y,'#bd9558',42);
  drawPathShape(x,y,'#d9b36c',36);

  const sx=x*TILE-camX, sy=y*TILE-camY;
  // deterministic dirt grains / tiny embedded pebbles
  for(let i=0;i<7;i++){
    const r1=hash2(x*37+i*11,y*53+i*17);
    const r2=hash2(x*61+i*19,y*29+i*23);
    const lx=5+Math.floor(r1*(TILE-10));
    const ly=5+Math.floor(r2*(TILE-10));
    if(!pathContainsLocal(x,y,lx,ly,34)) continue;
    const rr=hash2(x*13+i*7,y*31+i*5);
    ctx.globalAlpha=rr>.55?.18:.12;
    ctx.fillStyle=rr>.72?'#896a43':'#f3cf87';
    const pw=rr>.82?4:3, ph=rr>.82?2:1;
    ctx.fillRect(Math.round(sx+lx),Math.round(sy+ly),pw,ph);
  }
  ctx.globalAlpha=1;

  // A few grass pixels creep into the road edge. They are ground decoration only.
  for(let i=0;i<3;i++){
    const r=hash2(x*101+i*41,y*73+i*31);
    if(r<.58) continue;
    const angle=r*Math.PI*2;
    const rad=18+hash2(x+i,y-i)*3;
    const lx=TILE/2+Math.cos(angle)*rad;
    const ly=TILE/2+Math.sin(angle)*rad;
    if(!pathContainsLocal(x,y,lx,ly,42) || pathContainsLocal(x,y,lx,ly,31)) continue;
    ctx.globalAlpha=.28;
    ctx.fillStyle='#4f8e47';
    ctx.fillRect(Math.round(sx+lx),Math.round(sy+ly),2,4);
  }
  ctx.globalAlpha=1;
}
function drawTerrain(){
  // Movement/collision is still tile based, but the terrain is painted as connected surfaces.
  ctx.fillStyle='#78b85b';
  ctx.fillRect(0,0,VIEW_W,VIEW_H);

  const x0=Math.max(0,Math.floor(camX/TILE)-2), y0=Math.max(0,Math.floor(camY/TILE)-2);
  const x1=Math.min(MAP_W-1,Math.ceil((camX+VIEW_W)/TILE)+2), y1=Math.min(MAP_H-1,Math.ceil((camY+VIEW_H)/TILE)+2);

  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const type=tileTypeAt(x,y), wx=x*TILE, wy=y*TILE;
    if(type==='path') drawPathTile(x,y);
    else if(type==='stone') worldRect(wx-1,wy-1,TILE+2,TILE+2,'#9ca2a9');
    else if(type==='water') worldRect(wx-1,wy-1,TILE+2,TILE+2,'#2b91c9');
  }

  // Large patches cross several movement cells, which visually breaks the grid.
  ctx.save();
  ctx.globalAlpha=.09;
  for(let gy=Math.floor(camY/144)*144-144;gy<camY+VIEW_H+144;gy+=144){
    for(let gx=Math.floor(camX/144)*144-144;gx<camX+VIEW_W+144;gx+=144){
      const r=hash2(gx/144,gy/144);
      const cx=gx-camX+40+r*65, cy=gy-camY+30+hash2(gy/91,gx/77)*75;
      ctx.fillStyle=r>.5?'#2f7b47':'#b5d76b';
      ctx.beginPath();ctx.ellipse(cx,cy,70+r*45,38+r*30,0,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();

  // Fine texture uses a 12px world grid, not the 48px gameplay grid.
  const sx0=Math.floor(camX/12)*12-12, sy0=Math.floor(camY/12)*12-12;
  ctx.save();
  for(let wy=sy0;wy<camY+VIEW_H+12;wy+=12){
    for(let wx=sx0;wx<camX+VIEW_W+12;wx+=12){
      const tx=Math.floor(wx/TILE), ty=Math.floor(wy/TILE);
      if(!inside(tx,ty)) continue;
      const type=tileTypeAt(tx,ty), r=hash2(wx,wy);
      if(type==='grass' && r>.76){
        ctx.globalAlpha=.18;
        ctx.fillStyle=r>.88?'#225f3b':'#e0d66c';
        ctx.fillRect(Math.round(wx-camX+(r*5)%4),Math.round(wy-camY+(r*7)%4),2+(r>.9?2:0),5);
      }else if(type==='water' && r>.89){
        ctx.globalAlpha=.22;ctx.fillStyle='#b9efff';
        ctx.fillRect(Math.round(wx-camX),Math.round(wy-camY),10,2);
      }
    }
  }
  ctx.restore();

  // Smaller pavers make the plaza read as one area rather than 48px square tiles.
  ctx.save();
  ctx.strokeStyle='rgba(77,84,94,.34)';ctx.lineWidth=2;
  for(const area of WORLD_DEFINITION.stoneAreas){
    const stoneMinX=area.x*TILE, stoneMaxX=(area.x+area.w)*TILE;
    const stoneMinY=area.y*TILE, stoneMaxY=(area.y+area.h)*TILE;
    for(let y=stoneMinY;y<=stoneMaxY;y+=24){
      for(let x=stoneMinX;x<=stoneMaxX;x+=32){
        const ox=((Math.floor((y-stoneMinY)/24)&1)?16:0);
        ctx.strokeRect(Math.round(x+ox-camX),Math.round(y-camY),32,24);
      }
    }
  }
  ctx.restore();

  // Only shoreline edges are highlighted; internal water-cell borders are never drawn.
  ctx.save();
  ctx.strokeStyle='rgba(213,245,255,.48)';ctx.lineWidth=3;ctx.lineCap='round';
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    if(!waterSet.has(key(x,y))) continue;
    const wx=x*TILE-camX, wy=y*TILE-camY;
    if(!waterSet.has(key(x,y-1)) && !bridgeSet.has(key(x,y-1))){ctx.beginPath();ctx.moveTo(wx+4,wy+3);ctx.lineTo(wx+TILE-4,wy+3);ctx.stroke();}
    if(!waterSet.has(key(x,y+1)) && !bridgeSet.has(key(x,y+1))){ctx.beginPath();ctx.moveTo(wx+4,wy+TILE-3);ctx.lineTo(wx+TILE-4,wy+TILE-3);ctx.stroke();}
    if(!waterSet.has(key(x-1,y)) && !bridgeSet.has(key(x-1,y))){ctx.beginPath();ctx.moveTo(wx+3,wy+4);ctx.lineTo(wx+3,wy+TILE-4);ctx.stroke();}
    if(!waterSet.has(key(x+1,y)) && !bridgeSet.has(key(x+1,y))){ctx.beginPath();ctx.moveTo(wx+TILE-3,wy+4);ctx.lineTo(wx+TILE-3,wy+TILE-4);ctx.stroke();}
  }
  ctx.restore();

  bridgeSet.forEach(k=>{
    const [x,y]=k.split(',').map(Number);
    ctx.drawImage(imgs.bridge,Math.round(x*TILE-camX-1),Math.round(y*TILE-camY-1),TILE+2,TILE+2);
  });
}
function onScreen(wx,wy,w=100,h=120){
  return wx+w>-40+camX&&wy+h>-40+camY&&wx-w<VIEW_W+camX&&wy-h<VIEW_H+camY;
}
const DEBUG_BUILDING_ANCHORS=false;
function drawBuilding(b){
  const img=imgs[b.sprite];
  if(!img) return;
  const footprintX=b.x*TILE-camX;
  const footprintBottom=(b.y+b.h)*TILE-camY;
  const footprintCenterX=footprintX+(b.w*TILE)/2;

  // Building Standard 2.0: align the ART'S REAL DOOR CENTER to the WORLD DOOR TILE CENTER.
  // Do not center the whole PNG and assume the door is in the middle.
  const scaleX=b.drawW/img.naturalWidth;
  const doorAnchorX=(b.artAnchor?.doorCenterX ?? img.naturalWidth/2)*scaleX;
  const targetDoorCenterX=(b.entrance.door.x+.5)*TILE-camX;
  const drawX=Math.round(targetDoorCenterX-doorAnchorX);
  const groundOffsetY=b.artAnchor?.groundOffsetY ?? 10;
  const drawY=Math.round(footprintBottom-b.drawH+groundOffsetY);

  // subtle shared world shadow; shadow follows collision footprint, not decorative overhangs.
  ctx.save();
  ctx.fillStyle='rgba(24,49,37,.16)';
  ctx.beginPath();
  ctx.ellipse(Math.round(footprintCenterX),Math.round(footprintBottom-3),Math.round(b.w*TILE*.48),17,0,0,Math.PI*2);
  ctx.fill();
  ctx.drawImage(img,drawX,drawY,b.drawW,b.drawH);

  // QA-only guide. Keep disabled in production.
  if(DEBUG_BUILDING_ANCHORS){
    const approachCenterX=(b.entrance.approach.x+.5)*TILE-camX;
    const approachCenterY=(b.entrance.approach.y+.5)*TILE-camY;
    ctx.strokeStyle='rgba(255,70,70,.95)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(targetDoorCenterX,drawY);ctx.lineTo(targetDoorCenterX,footprintBottom+TILE);ctx.stroke();
    ctx.fillStyle='rgba(255,235,70,.95)';ctx.beginPath();ctx.arc(approachCenterX,approachCenterY,5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function drawBuildings(){
  buildings.forEach(drawBuilding);
}

function roundedRectPath(ctx,x,y,w,h,r){
  const rr=Math.max(0,Math.min(r,Math.abs(w)/2,Math.abs(h)/2));
  if(typeof ctx.roundRect==='function'){
    ctx.beginPath();ctx.roundRect(x,y,w,h,rr);return;
  }
  ctx.beginPath();
  ctx.moveTo(x+rr,y);ctx.lineTo(x+w-rr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rr);
  ctx.lineTo(x+w,y+h-rr);ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
  ctx.lineTo(x+rr,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-rr);
  ctx.lineTo(x,y+rr);ctx.quadraticCurveTo(x,y,x+rr,y);ctx.closePath();
}

function npcFacing(npc){
  const dx=player.x-npc.x, dy=player.y-npc.y;
  if(Math.abs(dx)+Math.abs(dy)>2) return npc.face||'down';
  if(Math.abs(dx)>Math.abs(dy)) return dx<0?'left':'right';
  return dy<0?'up':'down';
}

function drawNPC(npc){
  // Independent NPC sprite sheets only: no runtime tint rectangles or vector accessories.
  const sheet=npcImgs[npc.sprite];
  if(!sheet) return;
  const wx=npc.px-camX, wy=npc.py-camY;
  const face=npcFacing(npc);
  const row={down:0,left:1,right:2,up:3}[face] ?? 0;
  const walkCycle=npc.moving ? Math.floor(tNow/120)%4 : 0;
  const frame=npc.moving ? [0,1,2,1][walkCycle] : 1;
  const CELL=96;
  const size=100*npc.scale;
  const dx=Math.round(wx-size/2), dy=Math.round(wy-size+26);

  ctx.save();
  ctx.fillStyle='rgba(10,25,26,.22)';
  ctx.beginPath();ctx.ellipse(Math.round(wx),Math.round(wy+13),18,7,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(sheet,frame*CELL,row*CELL,CELL,CELL,dx,dy,size,size);

  if(Math.abs(player.x-npc.x)+Math.abs(player.y-npc.y)<=2){
    ctx.font='700 11px system-ui';ctx.textAlign='center';
    const tw=ctx.measureText(npc.name).width+18;
    const labelY=dy+3;
    ctx.fillStyle='rgba(10,35,37,.76)';
    roundedRectPath(ctx,wx-tw/2,labelY-14,tw,19,8);ctx.fill();
    ctx.fillStyle='#fff';ctx.fillText(npc.name,wx,labelY);
  }
  ctx.restore();
}

function drawPlayer(){
  // Player side-animation safety rule:
  // row 1 (right) is the canonical side animation. Left ALWAYS mirrors row 1.
  // This prevents a generated left-row frame from ever facing the wrong way.
  const wx=player.px-camX, wy=player.py-camY;
  const face=player.face||'down';
  const mirrorLeft=face==='left';
  const row=face==='down'?0:face==='up'?3:1;
  const walkCycle=player.moving ? Math.floor(tNow/105)%4 : 0;
  const frame=player.moving ? [0,1,2,1][walkCycle] : 1;
  const CELL=96;
  const size=100; // same render cell size as NPCs
  const actorX=DESKTOP_SMOOTH_RENDER?wx:Math.round(wx), actorY=DESKTOP_SMOOTH_RENDER?wy:Math.round(wy);
  const dx=actorX-size/2, dy=actorY-size+26;

  ctx.fillStyle='rgba(10,25,26,.22)';
  ctx.beginPath();ctx.ellipse(actorX,actorY+13,18,7,0,0,Math.PI*2);ctx.fill();

  if(playerSheet){
    if(mirrorLeft){
      ctx.save();
      ctx.translate(actorX,0);
      ctx.scale(-1,1);
      ctx.drawImage(playerSheet,frame*CELL,row*CELL,CELL,CELL,-size/2,dy,size,size);
      ctx.restore();
    }else{
      ctx.drawImage(playerSheet,frame*CELL,row*CELL,CELL,CELL,dx,dy,size,size);
    }
    return;
  }

  // Fallback follows the same canonical-right rule.
  const legacyFace=mirrorLeft?'right':face;
  const legacy=playerImgs[`${legacyFace}_${frame===2?2:frame===1?1:0}`] || playerImgs[`${legacyFace}_0`] || playerImgs['down_0'];
  if(legacy){
    const h=71,w=legacy.width*h/legacy.height;
    const lx=actorX-w/2, ly=actorY-h+24;
    if(mirrorLeft){
      ctx.save();ctx.translate(actorX,0);ctx.scale(-1,1);
      ctx.drawImage(legacy,-w/2,ly,w,h);ctx.restore();
    }else{
      ctx.drawImage(legacy,lx,ly,w,h);
    }
  }
}

function drawFishingEffects(){
  if(typeof isFishingActive!=='function'||!isFishingActive()||!fishingState.spot) return;
  const spotX=(fishingState.spot.x+.5)*TILE-camX;
  const spotY=(fishingState.spot.y+.5)*TILE-camY;
  const playerX=player.px-camX, playerY=player.py-camY-24;
  if(spotX<-30||spotY<-30||spotX>VIEW_W+30||spotY>VIEW_H+30) return;

  ctx.save();
  ctx.strokeStyle='rgba(35,39,50,.55)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(playerX,playerY);ctx.quadraticCurveTo((playerX+spotX)/2,playerY-8,spotX,spotY);ctx.stroke();

  const bite=fishingState.phase==='bite';
  const bob=Math.sin(tNow/180)*2+(bite?Math.sin(tNow/55)*3:0);
  ctx.globalAlpha=.25;
  ctx.strokeStyle='#d7f7ff';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(spotX,spotY+7,10+(bite?4:0),3,0,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=1;
  ctx.fillStyle=bite?'#ff695f':'#f8f7e9';
  ctx.beginPath();ctx.arc(spotX,spotY+bob,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=bite?'#fff':'#ec5c62';
  ctx.beginPath();ctx.arc(spotX,spotY+bob-3,4,Math.PI,Math.PI*2);ctx.fill();
  if(bite){
    ctx.font='900 18px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff3a7';
    ctx.fillText('!',spotX,spotY-18+Math.sin(tNow/90)*2);
  }
  ctx.restore();
}


function drawDecor(img, tileX, tileY, baseW, baseH, scale=1, flip=false, yNudge=0){
  const w=baseW*scale, h=baseH*scale;
  const cx=tileX*TILE+TILE/2-camX;
  const bottom=tileY*TILE+TILE-camY+yNudge;
  if(flip){
    ctx.save();ctx.translate(Math.round(cx),0);ctx.scale(-1,1);
    ctx.drawImage(img,-w/2,bottom-h,w,h);ctx.restore();
  }else{
    ctx.drawImage(img,cx-w/2,bottom-h,w,h);
  }
}

function drawWorldTimeEffects(){
  const visual=getWorldTimeVisuals();
  if(visual.alpha>0.002){
    ctx.save();
    ctx.fillStyle=`rgba(${visual.tint[0]},${visual.tint[1]},${visual.tint[2]},${visual.alpha.toFixed(3)})`;
    ctx.fillRect(0,0,VIEW_W,VIEW_H);
    ctx.restore();
  }
  if(visual.light<=0.01) return;

  const drawGlow=(worldX,worldY,radius,alpha)=>{
    const x=worldX-camX,y=worldY-camY;
    if(x+radius<0||y+radius<0||x-radius>VIEW_W||y-radius>VIEW_H) return;
    const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);
    gradient.addColorStop(0,`rgba(255,226,143,${(alpha*visual.light).toFixed(3)})`);
    gradient.addColorStop(.42,`rgba(255,190,91,${(alpha*.35*visual.light).toFixed(3)})`);
    gradient.addColorStop(1,'rgba(255,166,66,0)');
    ctx.fillStyle=gradient;
    ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  };

  ctx.save();
  ctx.globalCompositeOperation='screen';
  drawGlow((lamp.x+.5)*TILE,(lamp.y+.15)*TILE,150,.48);
  buildings.forEach(building=>{
    drawGlow((building.entrance.door.x+.5)*TILE,(building.entrance.door.y+.5)*TILE,105,.24);
  });
  ctx.restore();
}

function drawWeatherEffects(){
  const kind=getWeatherKind();
  if(kind==='clear') return;
  const storm=kind==='storm';
  ctx.save();
  const pulseA=Math.pow(Math.max(0,Math.sin(tNow/2300+1.2)),42);
  const pulseB=Math.pow(Math.max(0,Math.sin(tNow/1570+2.1)),38);
  const flash=storm?Math.max(pulseA,pulseB):0;
  ctx.fillStyle=storm
    ? `rgba(18,30,65,${(.13+.16*flash).toFixed(3)})`
    : 'rgba(95,155,190,.055)';
  ctx.fillRect(0,0,VIEW_W,VIEW_H);

  const drawRainLayer=(count,speed,length,slope,alpha,width,phase)=>{
    ctx.strokeStyle=storm?'rgba(198,224,255,.72)':'rgba(202,237,255,.58)';
    ctx.lineWidth=width;ctx.lineCap='round';
    for(let i=0;i<count;i++){
      const seed=i*83.17+(i%11)*19.3+phase;
      const variation=.72+hash2(i*17+phase,phase+i)*.56;
      const x=((seed+tNow*speed*variation)%(VIEW_W+100))-50;
      const y=((seed*1.73+tNow*(speed*1.7)*variation)%(VIEW_H+120))-60;
      ctx.globalAlpha=alpha*(.72+hash2(i*29+phase,phase)*.45);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-slope,y+length);ctx.stroke();
    }
  };

  if(storm){
    // A dense short-drop layer plus a sparse foreground layer makes the storm
    // read as depth and wind instead of a repeated single-line texture.
    drawRainLayer(260,.76,18,7,.32,1,11);
    drawRainLayer(125,1.16,38,13,.56,1.6,37);
  }else{
    drawRainLayer(260,.58,14,4,.27,1,5);
    drawRainLayer(78,.92,27,7,.34,1.2,23);
  }

  // Small impact rings add motion to the ground and water without extra assets.
  ctx.strokeStyle=storm?'rgba(208,235,255,.32)':'rgba(210,241,255,.22)';
  ctx.lineWidth=1;
  const splashCount=storm?34:18;
  for(let i=0;i<splashCount;i++){
    const seed=i*147.31+9;
    const x=((seed+tNow*.12)%(VIEW_W+40))-20;
    const y=((seed*2.17+tNow*.22)%(VIEW_H+40))-20;
    const r=2+hash2(i*7,seed)*3;
    ctx.globalAlpha=.16+hash2(i*13,seed)*.18;
    ctx.beginPath();ctx.ellipse(x,y,r*1.8,r*.65,0,0,Math.PI*2);ctx.stroke();
  }

  if(storm&&flash>.18){
    const x=80+hash2(Math.floor(tNow/1700),7)*Math.max(1,VIEW_W-160);
    ctx.globalAlpha=Math.min(.9,flash*1.5);
    ctx.strokeStyle='rgba(235,246,255,.95)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-18,VIEW_H*.25);ctx.lineTo(x+8,VIEW_H*.25);ctx.lineTo(x-28,VIEW_H*.58);ctx.stroke();
  }
  ctx.globalAlpha=1;
  ctx.restore();
}

function drawWorld(){
  ctx.clearRect(0,0,VIEW_W,VIEW_H);
  // Visual terrain is blended independently from the reliable tile movement/collision logic.
  drawTerrain();

  // Water shimmer travels across the whole pond instead of restarting in every cell.
  ctx.globalAlpha=.18+.06*Math.sin(tNow/430);
  ctx.fillStyle='#c8f6ff';
  for(let wy=Math.floor(camY/30)*30;wy<camY+VIEW_H+30;wy+=30){
    for(let wx=Math.floor(camX/72)*72;wx<camX+VIEW_W+72;wx+=72){
      const tx=Math.floor(wx/TILE),ty=Math.floor(wy/TILE);
      if(waterSet.has(key(tx,ty))){
        ctx.fillRect(Math.round(wx-camX+8),Math.round(wy-camY+8*Math.sin((wx+wy+tNow*.05)/55)),22,2);
      }
    }
  }
  ctx.globalAlpha=1;

  // Vegetation Layer Standard 4.0:
  // Any vegetation the player/NPC can walk through is a ground decoration and is ALWAYS
  // rendered below actors. It must never enter the Y-depth queue, otherwise it can briefly
  // pop in front/behind an actor while crossing its baseline.
  flowers.forEach(o=>drawDecor(o.v===0?imgs.flower1:imgs.flower2,o.x,o.y,74,66,o.s,o.flip,3));
  grassTufts.forEach(o=>drawDecor(imgs.grassTuft,o.x,o.y,74,70,o.s,o.flip,5));
  bushes.forEach(o=>drawDecor(o.v===0?imgs.bush1:imgs.bush2,o.x,o.y,88,72,o.s,o.flip,4));
  reeds.forEach(o=>drawDecor(imgs.reeds,o.x,o.y,70,92,o.s,o.flip,5));

  // bridge rail hint / fishing sparkle
  const fishingSpot=WORLD_DEFINITION.fishingSpot;
  const fx=fishingSpot.x*TILE-camX-2, fy=fishingSpot.y*TILE-camY+12;
  ctx.fillStyle=`rgba(255,244,145,${.55+.4*Math.sin(tNow/260)})`;
  ctx.beginPath();ctx.arc(fx,fy,4,0,Math.PI*2);ctx.fill();

  // Depth-sorted solid/occluding objects only. Passable vegetation is intentionally excluded.
  // Buildings participate in the SAME Y-sort as trees/actors.
  // Building Standard 3.0: the depth line is independent from sprite size and door position.
  const renderables=[];
  buildings.forEach(b=>{
    const localDepth=(b.depthLine ?? b.h);
    renderables.push({y:(b.y+localDepth)*TILE,draw:()=>drawBuilding(b)});
  });
  trees.forEach(o=>renderables.push({y:o.y*TILE+TILE,draw:()=>ctx.drawImage(imgs.treeStage24||imgs.treeClean||imgs.tree,o.x*TILE-camX-22,o.y*TILE-camY-64,92,116)}));
  rocks.forEach(o=>renderables.push({y:o.y*TILE+TILE,draw:()=>ctx.drawImage(imgs.rock,o.x*TILE-camX-6,o.y*TILE-camY-10,60,58)}));
  renderables.push({y:sign.y*TILE+TILE,draw:()=>ctx.drawImage(imgs.sign,sign.x*TILE-camX-8,sign.y*TILE-camY-20,64,68)});
  renderables.push({y:bench.y*TILE+TILE,draw:()=>ctx.drawImage(imgs.bench,bench.x*TILE-camX-26,bench.y*TILE-camY-8,100,56)});
  renderables.push({y:lamp.y*TILE+TILE,draw:()=>ctx.drawImage(imgs.lamp,lamp.x*TILE-camX+5,lamp.y*TILE-camY-38,38,86)});
  npcs.forEach(n=>renderables.push({y:n.y*TILE+TILE,draw:()=>drawNPC(n)}));
  renderables.push({y:player.py+20,draw:drawPlayer});
  renderables.sort((a,b)=>a.y-b.y).forEach(r=>r.draw());

  drawFishingEffects();

  drawWorldTimeEffects();
  drawWeatherEffects();
  drawWorldDebug();

}
