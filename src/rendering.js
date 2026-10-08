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
  const theme=WORLD_DEFINITION.terrain||{};
  drawPathShape(x,y,theme.pathRim||'#bd9558',42);
  drawPathShape(x,y,theme.pathCore||'#d9b36c',36);

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
function drawForestHills(terrain){
  for(const hill of terrain.hills||[]){
    const x=hill.x*TILE-camX,y=hill.y*TILE-camY,w=hill.w*TILE,h=hill.h*TILE;
    if(x>VIEW_W+TILE||y>VIEW_H+TILE||x+w<-TILE||y+h<-TILE)continue;
    ctx.save();
    ctx.fillStyle='rgba(20,47,36,.32)';
    roundedRectPath(ctx,x+7,y+16,w,h,54);ctx.fill();
    ctx.fillStyle='rgba(179,196,128,.27)';
    roundedRectPath(ctx,x,y,w,h,52);ctx.fill();
    ctx.strokeStyle='rgba(30,61,42,.45)';ctx.lineWidth=7;
    roundedRectPath(ctx,x+4,y+4,w-8,h-8,48);ctx.stroke();
    ctx.strokeStyle='rgba(213,221,156,.22)';ctx.lineWidth=3;
    roundedRectPath(ctx,x+38,y+32,w-76,h-75,37);ctx.stroke();
    // Broken stone lip and strata read as a raised, walkable forest slope.
    for(let index=1;index<hill.w-1;index++){
      const px=x+index*TILE+Math.round(hash2(hill.x+index,hill.y)*12);
      const py=y+h-14+Math.round(hash2(index,hill.y)*5);
      ctx.fillStyle=index%3===0?'rgba(55,72,58,.42)':'rgba(106,113,85,.38)';
      ctx.fillRect(px,py,25,7);ctx.fillRect(px+4,py+8,16,4);
    }
    ctx.restore();
  }
}
function drawForestWaterfalls(terrain){
  for(const fall of terrain.waterfalls||[]){
    const x=Math.round(fall.x*TILE-camX),y=Math.round(fall.y*TILE-camY);
    const w=fall.w*TILE,h=fall.h*TILE;
    if(x>VIEW_W+TILE||y>VIEW_H+TILE||x+w<-TILE||y+h<-TILE)continue;
    ctx.save();
    ctx.fillStyle='#354c49';ctx.fillRect(x-10,y-16,w+20,h+23);
    ctx.fillStyle='#5e7060';ctx.fillRect(x-10,y-18,w+20,18);
    ctx.fillStyle='#328eb1';ctx.fillRect(x+22,y,w-44,h);
    for(let row=0;row<h;row+=16){
      const wobble=Math.round(hash2(fall.x+row,fall.y)*13);
      const left=16+wobble,right=17+Math.round(hash2(row,fall.y)*14);
      ctx.fillStyle=row%32===0?'#657269':'#455b55';
      ctx.fillRect(x-8,y+row,left+8,16);
      ctx.fillRect(x+w-right,y+row,right+8,16);
      ctx.fillStyle='rgba(26,47,47,.4)';
      ctx.fillRect(x+left-4,y+row+13,12,3);
      ctx.fillRect(x+w-right-8,y+row+13,12,3);
    }
    for(let stripe=0;stripe<fall.w*4;stripe++){
      const sx=x+25+stripe*12+Math.round(Math.sin(tNow/340+stripe)*2);
      if(sx>x+w-30)break;
      ctx.fillStyle=stripe%3===0?'rgba(194,248,245,.78)':stripe%3===1?'rgba(82,200,218,.8)':'rgba(28,127,176,.6)';
      ctx.fillRect(sx,y+4,4+(stripe%3)*2,h-8);
      ctx.fillStyle='rgba(239,254,250,.58)';
      for(let row=0;row<fall.h*2;row++){
        const drift=(Math.floor(tNow/130)+row*23+stripe*11)%(h-8);
        ctx.fillRect(sx+2,y+4+drift,5,9);
      }
    }
    ctx.fillStyle='rgba(225,253,250,.88)';
    for(let bubble=0;bubble<fall.w*5;bubble++){
      const bx=x+(bubble*37)%(w+7)-4;
      ctx.fillRect(bx,y+h-12+(bubble%3)*5,12+(bubble%3)*5,4);
    }
    if(fall.mist){
      for(let cloud=0;cloud<7;cloud++){
        const drift=Math.sin(tNow/1300+cloud)*8;
        ctx.fillStyle='rgba(218,252,246,.1)';
        ctx.beginPath();ctx.ellipse(x-18+cloud*(w+36)/6+drift,y+h+12+(cloud%3)*13,36+(cloud%3)*10,13+(cloud%2)*8,0,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
  }
}
function drawMountainRidges(terrain){
  for(const ridge of terrain.ridges||[]){
    const x=ridge.x*TILE-camX,y=ridge.y*TILE-camY,w=ridge.w*TILE,h=ridge.h*TILE;
    if(x>VIEW_W||y>VIEW_H||x+w<0||y+h<0)continue;
    ctx.save();
    ctx.fillStyle='#637c7e';ctx.fillRect(x,y+h*.58,w,h*.42);
    for(let peak=0;peak<3;peak++){
      const left=x+peak*w/3,top=y+(peak%2)*h*.15,pw=w*.46;
      ctx.fillStyle=peak%2?'#788e90':'#8fa1a0';
      ctx.beginPath();ctx.moveTo(left,y+h);ctx.lineTo(left+pw*.46,top);ctx.lineTo(Math.min(x+w,left+pw),y+h);ctx.closePath();ctx.fill();
      ctx.fillStyle='#536d72';ctx.beginPath();ctx.moveTo(left+pw*.46,top);ctx.lineTo(left+pw*.55,y+h);ctx.lineTo(Math.min(x+w,left+pw),y+h);ctx.closePath();ctx.fill();
      ctx.fillStyle='#d9e4df';ctx.beginPath();ctx.moveTo(left+pw*.46,top);ctx.lineTo(left+pw*.3,top+h*.27);ctx.lineTo(left+pw*.45,top+h*.2);ctx.lineTo(left+pw*.53,top+h*.3);ctx.lineTo(left+pw*.6,top+h*.24);ctx.closePath();ctx.fill();
    }
    for(let row=0;row<3;row++){
      ctx.fillStyle=row%2?'#82978c':'#617f74';
      for(let col=0;col<ridge.w;col++)ctx.fillRect(x+col*TILE,y+h-25+row*8+(col%3)*3,TILE,8);
    }
    ctx.restore();
  }
}

function drawSwampWaterDetails(terrain){
  if(!terrain.swamp)return;
  ctx.save();
  for(const [index,pad] of (terrain.lilyPads||[]).entries()){
    if(!waterSet.has(key(pad.x,pad.y)))continue;
    const x=Math.round((pad.x+.5)*TILE-camX),y=Math.round((pad.y+.5)*TILE-camY);
    if(x<-90||y<-40||x>VIEW_W+90||y>VIEW_H+40)continue;
    ctx.fillStyle='rgba(28,45,34,.3)';ctx.beginPath();ctx.ellipse(x+3,y+4,17,7,0,0,Math.PI*2);ctx.fill();
    for(let leaf=0;leaf<3;leaf++){
      const px=x+leaf*9-9,py=y+(leaf%2)*5;
      ctx.fillStyle=leaf%2?'#667c4d':'#738952';ctx.beginPath();ctx.ellipse(px,py,12,6,0,0,Math.PI*1.8);ctx.fill();
      ctx.fillStyle='#455e40';ctx.fillRect(px-2,py-1,8,2);
    }
    const ripple=(tNow/170+index*7)%32;
    ctx.strokeStyle='rgba(168,188,145,.16)';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(x-21,y+12,5+ripple/3,2+ripple/8,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='rgba(190,207,168,.08)';
    ctx.beginPath();ctx.ellipse(x+Math.sin(tNow/2100+index)*15,y-19,57,11,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function drawTerrain(){
  // Movement/collision is still tile based, but the terrain is painted as connected surfaces.
  const terrain=WORLD_DEFINITION.terrain||{};
  ctx.fillStyle=terrain.ground||(FOREST_REGION_SPECIES[GAME_STATE.regionId]?'#538a53':GAME_STATE.regionId==='sunnyFields'?'#91c66a':'#78b85b');
  ctx.fillRect(0,0,VIEW_W,VIEW_H);
  drawForestHills(terrain);
  drawMountainRidges(terrain);

  const x0=Math.max(0,Math.floor(camX/TILE)-2), y0=Math.max(0,Math.floor(camY/TILE)-2);
  const x1=Math.min(MAP_W-1,Math.ceil((camX+VIEW_W)/TILE)+2), y1=Math.min(MAP_H-1,Math.ceil((camY+VIEW_H)/TILE)+2);

  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const type=tileTypeAt(x,y), wx=x*TILE, wy=y*TILE;
    if(type==='path') drawPathTile(x,y);
    else if(type==='stone') worldRect(wx-1,wy-1,TILE+2,TILE+2,'#9ca2a9');
    else if(type==='water') worldRect(wx-1,wy-1,TILE+2,TILE+2,terrain.waterColor||'#2b91c9');
  }

  // Large patches cross several movement cells, which visually breaks the grid.
  ctx.save();
  ctx.globalAlpha=.09;
  for(let gy=Math.floor(camY/144)*144-144;gy<camY+VIEW_H+144;gy+=144){
    for(let gx=Math.floor(camX/144)*144-144;gx<camX+VIEW_W+144;gx+=144){
      const r=hash2(gx/144,gy/144);
      const cx=gx-camX+40+r*65, cy=gy-camY+30+hash2(gy/91,gx/77)*75;
      ctx.fillStyle=r>.5?(terrain.patchA||'#2f7b47'):(terrain.patchB||'#b5d76b');
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

  drawForestWaterfalls(terrain);
  drawSwampWaterDetails(terrain);

  bridgeSet.forEach(k=>{
    if(WORLD_DEFINITION.voyageDeck)return;
    const [x,y]=k.split(',').map(Number);
    ctx.drawImage(imgs.bridge,Math.round(x*TILE-camX-1),Math.round(y*TILE-camY-1),TILE+2,TILE+2);
  });
}
function onScreen(wx,wy,w=100,h=120){
  return wx+w>-40+camX&&wy+h>-40+camY&&wx-w<VIEW_W+camX&&wy-h<VIEW_H+camY;
}
function drawRegionExits(){
  for(const exit of REGION_EXITS[GAME_STATE.regionId]||[]){
    const x=Math.round(exit.x*TILE-camX),y=Math.round(exit.y*TILE-camY);
    ctx.save();
    ctx.fillStyle='rgba(251,226,143,.28)';ctx.fillRect(x+3,y+3,TILE-6,TILE-6);
    ctx.strokeStyle='#ffe5a0';ctx.lineWidth=3;ctx.strokeRect(x+5,y+5,TILE-10,TILE-10);
    ctx.fillStyle='#fff3cf';ctx.font='900 17px system-ui';ctx.textAlign='center';
    const direction=exit.y<=2?'↑':exit.y>=MAP_H-3?'↓':exit.x>=MAP_W-3?'→':'←';
    ctx.fillText(direction,x+TILE/2,y+31);
    ctx.font='900 9px system-ui';ctx.fillText(exit.label,x+TILE/2,y+44);
    ctx.restore();
  }
}

function drawFarmGround(){
  if(GAME_STATE.regionId!=='sunnyFields') return;
  for(const plot of WORLD_DEFINITION.farmPlots){
    const x=Math.round(plot.x*TILE-camX),y=Math.round(plot.y*TILE-camY);
    const phase=getFarmPlotPhase(plot),state=getFarmPlotState(plot);
    ctx.save();
    const locked=phase==='LOCKED';
    // Keep unavailable plots in the same soil family as growing plots; only
    // desaturate them and add a small lock instead of a separate grey tile.
    ctx.fillStyle=locked?'#4a6047':'#50382b';ctx.fillRect(x+7,y+5,34,38);ctx.fillRect(x+4,y+9,40,30);
    ctx.fillStyle=locked?'#637554':'#755037';ctx.fillRect(x+7,y+9,34,30);
    ctx.fillStyle=locked?'#7b8962':'#94643e';
    for(let line=0;line<3;line++) ctx.fillRect(x+10,y+13+line*10,28,3);
    if(phase==='LOCKED'){
      ctx.fillStyle='#d9dcc3';ctx.fillRect(x+20,y+23,9,8);
      ctx.strokeStyle='#d9dcc3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+24.5,y+22,4,Math.PI,0);ctx.stroke();
    }else{
      ctx.fillStyle='#ad7849';ctx.fillRect(x+13,y+10,8,2);ctx.fillRect(x+29,y+37,7,2);
      if(phase!=='EMPTY'){
        const crop=LIFE_CROP_BY_ID.get(state.cropId);
        const progress=Math.max(0,Math.min(1,(Date.now()-state.plantedAt)/crop.growMs));
        if(phase==='GROWING'&&progress<.15){
          // A covered seed: the crop itself must not be visible yet.
          ctx.fillStyle='#553722';ctx.fillRect(x+17,y+25,15,5);ctx.fillRect(x+20,y+22,9,3);
          ctx.fillStyle='#ab7749';ctx.fillRect(x+22,y+22,5,2);
        }else if(phase==='GROWING'&&progress<.45){
          // The first two leaves are shared by all four crops.
          ctx.fillStyle='#3e6934';ctx.fillRect(x+23,y+22,3,15);
          ctx.fillStyle='#72b84c';ctx.fillRect(x+16,y+22,8,4);ctx.fillRect(x+25,y+19,8,4);
          ctx.fillStyle='#96d268';ctx.fillRect(x+18,y+21,5,2);ctx.fillRect(x+27,y+18,5,2);
        }else{
          const ready=phase==='READY';
          const sprite=ready?matureCropImgs[crop.id]:youngCropImgs[crop.id];
          const size=ready?58:48;
          const bottomRatio=ready&&crop.id==='corn'?.96:ready&&crop.id==='potato'?.9:.84;
          const drawX=Math.round(x+(TILE-size)/2),drawY=Math.round(y+43-size*bottomRatio);
          ctx.drawImage(sprite,drawX,drawY,size,size);
        }
        if(phase==='READY'){
          ctx.fillStyle='#fff2b1';ctx.fillRect(x+37,y+8,4,4);
        }
      }
    }
    ctx.restore();
  }
}

function drawTreeHpBar(tree,hp){
  const ratio=Math.max(0,Math.min(1,hp/(FORESTRY_TREES[tree.species]?.maxHp||LIFE_CONTENT.treeHp)));
  const x=Math.round(tree.x*TILE-camX)+3,y=Math.round(tree.y*TILE-camY)-74;
  ctx.fillStyle='#102016';ctx.fillRect(x-2,y-2,46,11);
  ctx.fillStyle='#080808';ctx.fillRect(x,y,42,7);
  if(ratio>0){
    ctx.fillStyle=ratio>.75?'#59c871':ratio>.5?'#f1d24e':ratio>.25?'#ee7649':ratio>.1?'#a92b30':'#63151e';
    ctx.fillRect(x,y,Math.max(1,Math.round(42*ratio)),7);
  }
  ctx.strokeStyle='#d9dfc7';ctx.lineWidth=1;ctx.strokeRect(x-.5,y-.5,43,8);
}
function drawResourceTree(tree){
  const state=getTreeState(tree),x=Math.round(tree.x*TILE-camX),y=Math.round(tree.y*TILE-camY);
  const hit=lifeUi.hit&&lifeUi.hit.regionId===GAME_STATE.regionId&&lifeUi.hit.x===tree.x&&lifeUi.hit.y===tree.y&&tNow<lifeUi.hit.until;
  if(state.hp===0){
    const stump=forestStumpImgs[tree.species];
    if(stump) ctx.drawImage(stump,x-8,y-12,64,64);
    if(hit) drawTreeHpBar(tree,0);
    if(hit&&lifeUi.hit.cut){
      const age=650-(lifeUi.hit.until-tNow);
      for(let index=0;index<6;index++){
        const angle=-Math.PI/2+(index-2.5)*.42;
        const reach=age*.065*(.75+(index%3)*.2);
        ctx.fillStyle=index%2?'#9b6b36':'#dfad61';
        ctx.fillRect(Math.round(x+24+Math.cos(angle)*reach),Math.round(y+14+Math.sin(angle)*reach+age*age*.00005),3,3);
      }
    }
    return;
  }
  const sway=hit?Math.round(Math.sin(tNow/28)*4):0;
  drawWorldTree(tree,sway);
  if(Math.abs(player.x-tree.x)+Math.abs(player.y-tree.y)<=1){
    ctx.fillStyle='#f4d179';ctx.fillRect(x+30,y+29,6,8);
  }
  if(state.hp<FORESTRY_TREES[tree.species].maxHp||hit) drawTreeHpBar(tree,state.hp);
}
function drawWorldTree(tree,sway=0){
  const x=Math.round(tree.x*TILE-camX),y=Math.round(tree.y*TILE-camY);
  const forestImage=FOREST_REGION_SPECIES[GAME_STATE.regionId]&&forestTreeImgs[tree.species];
  if(forestImage) ctx.drawImage(forestImage,x-24+sway,y-64,96,115);
  else ctx.drawImage(imgs.treeStage24||imgs.treeClean||imgs.tree,x-22+sway,y-64,92,116);
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

function drawMarketShop(){
  const image=imgs.buildingMarket;
  if(!image) return;
  const width=marketShop.w*TILE,height=218;
  const doorCenterX=Math.round((marketShop.x+marketShop.w/2)*TILE-camX);
  const x=Math.round(doorCenterX-width/2);
  const groundY=Math.round((marketShop.y+marketShop.h)*TILE-camY);
  ctx.save();
  ctx.fillStyle='rgba(24,49,37,.20)';
  ctx.beginPath();ctx.ellipse(doorCenterX,groundY-3,marketShop.w*TILE*.48,14,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(image,x,groundY-height+8,width,height);
  ctx.restore();
}

function drawHarborWaterDetails(){
  if(GAME_STATE.regionId!=='coast')return;
  ctx.save();
  const pulse=.55+.2*Math.sin(tNow/420);
  for(const buoy of [{x:10,y:34,c:'#ef5d4b'},{x:24,y:40,c:'#f2b84a'},{x:55,y:37,c:'#ef5d4b'}]){
    const x=Math.round((buoy.x+.5)*TILE-camX),y=Math.round((buoy.y+.5)*TILE-camY+Math.sin(tNow/360+buoy.x)*3);
    ctx.globalAlpha=pulse;ctx.fillStyle='rgba(226,249,255,.45)';ctx.beginPath();ctx.ellipse(x,y+7,18,5,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle=buoy.c;ctx.fillRect(x-6,y-9,12,16);ctx.fillStyle='#f8e6b0';ctx.fillRect(x-3,y-13,6,5);
  }
  const boat=WORLD_DEFINITION.fixedObjects?.harbor?.boat;
  if(boat){
    const x=boat.x*TILE-camX,y=(boat.y+boat.h)*TILE-camY;
    ctx.globalAlpha=.25;ctx.strokeStyle='#d9f5ff';ctx.lineWidth=4;
    for(let line=0;line<3;line++){
      ctx.beginPath();ctx.moveTo(x-15-line*10,y-40+line*14);ctx.quadraticCurveTo(x-45-line*18,y-34+line*14,x-85-line*25,y-28+line*14);ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHarborTicketBooth(booth){
  const x=Math.round(booth.x*TILE-camX),ground=Math.round((booth.y+booth.h)*TILE-camY);
  const width=booth.w*TILE,height=154;
  ctx.save();
  ctx.fillStyle='rgba(49,42,31,.2)';ctx.beginPath();ctx.ellipse(x+width/2,ground-2,width*.46,13,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#765137';ctx.fillRect(x+12,ground-height+26,width-24,height-30);
  ctx.fillStyle='#b97b49';ctx.fillRect(x+20,ground-height+38,width-40,height-46);
  ctx.fillStyle='#315f70';ctx.fillRect(x+6,ground-height+14,width-12,30);
  ctx.fillStyle='#447f8e';ctx.fillRect(x+18,ground-height,width-36,22);
  ctx.fillStyle='#173c49';ctx.fillRect(x+44,ground-86,width-88,45);
  ctx.fillStyle='#bde7e5';ctx.fillRect(x+51,ground-79,width-102,29);
  ctx.fillStyle='#493321';ctx.fillRect(x+width/2-20,ground-52,40,48);
  ctx.fillStyle='#f7d987';ctx.fillRect(x+width/2-42,ground-height+7,84,19);
  ctx.fillStyle='#233b40';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText('TICKETS',x+width/2,ground-height+20);
  ctx.fillStyle='#e9bd67';ctx.fillRect(x+width/2+10,ground-31,5,5);
  ctx.restore();
}

function drawHarborBoat(boat){
  const x=Math.round(boat.x*TILE-camX),y=Math.round(boat.y*TILE-camY);
  const width=boat.w*TILE,height=boat.h*TILE;
  ctx.save();
  ctx.fillStyle='rgba(7,34,51,.32)';ctx.beginPath();ctx.ellipse(x+width*.48,y+height*.58,width*.52,height*.34,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+12,y+height*.18);ctx.lineTo(x+width*.72,y+10);ctx.lineTo(x+width-3,y+height*.5);ctx.lineTo(x+width*.72,y+height-12);ctx.lineTo(x+12,y+height*.82);ctx.closePath();
  ctx.fillStyle='#f1e3bf';ctx.fill();ctx.strokeStyle='#704d37';ctx.lineWidth=9;ctx.stroke();
  ctx.fillStyle='#2e7890';ctx.fillRect(x+35,y+42,width-112,height-84);
  ctx.fillStyle='#e8d7ad';ctx.fillRect(x+92,y+67,112,104);
  ctx.fillStyle='#2a5969';ctx.fillRect(x+105,y+79,86,45);
  ctx.fillStyle='#b9e2e4';ctx.fillRect(x+114,y+87,30,27);ctx.fillRect(x+151,y+87,30,27);
  ctx.fillStyle='#7c5032';ctx.fillRect(x+56,y+height/2-8,width-138,16);
  ctx.fillStyle='#e8d7ad';ctx.fillRect(x+68,y+height/2-5,width-162,10);
  const mastX=x+218;ctx.fillStyle='#5c402b';ctx.fillRect(mastX,y+16,9,height-32);
  ctx.strokeStyle='#d9c493';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(mastX+4,y+22);ctx.lineTo(x+50,y+height*.22);ctx.moveTo(mastX+4,y+24);ctx.lineTo(x+width-28,y+height*.5);ctx.stroke();
  ctx.fillStyle='#d45f48';ctx.beginPath();ctx.moveTo(mastX+8,y+28);ctx.lineTo(mastX+72,y+61);ctx.lineTo(mastX+8,y+79);ctx.closePath();ctx.fill();
  ctx.restore();
}

function drawHarborCrate(crate,index){
  const x=Math.round(crate.x*TILE-camX+5),y=Math.round(crate.y*TILE-camY+8);
  ctx.save();ctx.fillStyle='rgba(44,34,23,.22)';ctx.fillRect(x+5,y+32,38,8);
  ctx.fillStyle=index%2?'#91613b':'#a87143';ctx.fillRect(x,y,42,38);
  ctx.strokeStyle='#5c3b27';ctx.lineWidth=4;ctx.strokeRect(x+2,y+2,38,34);ctx.beginPath();ctx.moveTo(x+4,y+4);ctx.lineTo(x+38,y+34);ctx.moveTo(x+38,y+4);ctx.lineTo(x+4,y+34);ctx.stroke();ctx.restore();
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

function forestryPlayerDrawDepth(){
  const playerDepth=player.py+20;
  const chop=lifeUi.chop?.regionId===GAME_STATE.regionId?lifeUi.chop:null;
  // The target tree should cover a player standing north of it.
  return chop?.tree&&player.face!=='down'?
    Math.max(playerDepth,chop.tree.y*TILE+TILE+1):playerDepth;
}

function drawPlayer(){
  const wx=player.px-camX,wy=player.py-camY;
  const actorX=DESKTOP_SMOOTH_RENDER?wx:Math.round(wx),actorY=DESKTOP_SMOOTH_RENDER?wy:Math.round(wy);
  ctx.fillStyle='rgba(10,25,26,.22)';
  ctx.beginPath();ctx.ellipse(actorX,actorY+13,18,7,0,0,Math.PI*2);ctx.fill();
  drawCharacterActor(actorX,actorY);
}

function drawFishingEffects(){
  if(typeof isFishingActive!=='function'||!isFishingActive()||!fishingState.spot) return;
  const spotX=(fishingState.spot.x+.5)*TILE-camX;
  const spotY=(fishingState.spot.y+.5)*TILE-camY;
  const rodTip=getFishingRodTipPosition();
  const playerX=rodTip.x,playerY=rodTip.y;
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
    const markX=spotX+15,markY=spotY-12+Math.sin(tNow/90)*2;
    ctx.font='900 24px system-ui';ctx.textAlign='center';
    ctx.strokeStyle='rgba(23,42,47,.9)';ctx.lineWidth=4;ctx.strokeText('!',markX,markY);
    ctx.fillStyle='#fff3a7';ctx.fillText('!',markX,markY);
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
  const period=getWorldTimePeriod();
  if(visual.alpha>0.002){
    ctx.save();
    const gradient=ctx.createLinearGradient(0,0,0,VIEW_H);
    const color=`${visual.tint[0]},${visual.tint[1]},${visual.tint[2]}`;
    gradient.addColorStop(0,`rgba(${color},${Math.min(.58,visual.alpha*1.22).toFixed(3)})`);
    gradient.addColorStop(.52,`rgba(${color},${(visual.alpha*.88).toFixed(3)})`);
    gradient.addColorStop(1,`rgba(${color},${(visual.alpha*.58).toFixed(3)})`);
    ctx.fillStyle=gradient;
    ctx.fillRect(0,0,VIEW_W,VIEW_H);
    ctx.restore();
  }

  // Dawn and dusk receive a soft warm horizon instead of a flat color wash.
  if(period==='DAWN'||period==='DUSK'){
    ctx.save();
    const warm=ctx.createLinearGradient(0,VIEW_H*.05,0,VIEW_H*.72);
    const strength=period==='DUSK'?.15:.10;
    warm.addColorStop(0,'rgba(255,198,128,0)');
    warm.addColorStop(.42,`rgba(255,174,94,${strength})`);
    warm.addColorStop(1,'rgba(255,129,73,0)');
    ctx.globalCompositeOperation='screen';ctx.fillStyle=warm;ctx.fillRect(0,0,VIEW_W,VIEW_H);
    ctx.restore();
  }

  // A gentle vignette gives night depth while keeping the player readable.
  if(period==='NIGHT'){
    const px=player.px-camX,py=player.py-camY;
    const radius=Math.max(VIEW_W,VIEW_H)*.72;
    const vignette=ctx.createRadialGradient(px,py,70,px,py,radius);
    vignette.addColorStop(0,'rgba(5,12,35,0)');
    vignette.addColorStop(.55,'rgba(5,12,35,.035)');
    vignette.addColorStop(1,'rgba(3,8,28,.22)');
    ctx.save();ctx.fillStyle=vignette;ctx.fillRect(0,0,VIEW_W,VIEW_H);ctx.restore();
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
    ? `rgba(18,30,65,${(.16+.17*flash).toFixed(3)})`
    : 'rgba(75,135,172,.075)';
  ctx.fillRect(0,0,VIEW_W,VIEW_H);

  // Moving translucent curtains make precipitation read across the full screen.
  const curtain=ctx.createLinearGradient(0,0,VIEW_W,VIEW_H);
  curtain.addColorStop(0,storm?'rgba(120,157,196,.08)':'rgba(155,202,224,.045)');
  curtain.addColorStop(.45,'rgba(205,232,245,0)');
  curtain.addColorStop(1,storm?'rgba(85,119,168,.10)':'rgba(118,173,204,.05)');
  ctx.fillStyle=curtain;ctx.fillRect(0,0,VIEW_W,VIEW_H);

  const wrap=(value,size)=>((value%size)+size)%size;
  const drawRainLayer=(count,speed,length,slope,alpha,width,phase)=>{
    ctx.strokeStyle=storm?'rgba(198,224,255,.72)':'rgba(202,237,255,.58)';
    ctx.lineWidth=width;ctx.lineCap='round';
    const spanX=VIEW_W+160,spanY=VIEW_H+180;
    for(let i=0;i<count;i++){
      // Independent X/Y seeds prevent diagonal bands and empty screen regions.
      const seedX=hash2(i*19.17+phase,phase*7.31+i*.13);
      const seedY=hash2(i*41.73+phase*2.7,phase*13.11+i*.37);
      const variation=.76+hash2(i*11.3+phase,phase+i*3.1)*.48;
      const y=wrap(seedY*spanY+tNow*speed*variation,spanY)-90;
      const windDrift=tNow*speed*.16-y*(slope/Math.max(1,length));
      const x=wrap(seedX*spanX+windDrift,spanX)-80;
      ctx.globalAlpha=alpha*(.7+hash2(i*29+phase,phase*5+i)*.45);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-slope,y+length);ctx.stroke();
    }
  };

  if(storm){
    drawRainLayer(360,.86,18,8,.34,1,11);
    drawRainLayer(150,1.24,42,15,.61,1.7,37);
    drawRainLayer(70,1.55,58,21,.52,2.1,71);
  }else{
    drawRainLayer(320,.64,15,5,.29,1,5);
    drawRainLayer(110,.98,30,9,.39,1.3,23);
  }

  // Small impact rings add motion to the ground and water without extra assets.
  ctx.strokeStyle=storm?'rgba(208,235,255,.32)':'rgba(210,241,255,.22)';
  ctx.lineWidth=1;
  const splashCount=storm?52:28;
  for(let i=0;i<splashCount;i++){
    const seedX=hash2(i*31.7+9,17+i*.2),seedY=hash2(i*67.1+3,41+i*.4);
    const x=seedX*VIEW_W,y=seedY*VIEW_H;
    const life=wrap(tNow*.0018+i*.137,1);
    const r=1.5+life*4;
    ctx.globalAlpha=(.24+hash2(i*13,seedX)*.18)*(1-life);
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
  drawFarmGround();
  drawRegionExits();

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

  drawHarborWaterDetails();
  drawVoyageDeck();

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
  if(WORLD_DEFINITION.voyageDeck)renderables.push({y:(WORLD_DEFINITION.voyageDeck.cabin.y+WORLD_DEFINITION.voyageDeck.cabin.h)*TILE,draw:drawVoyageCabin});
  buildings.forEach(b=>{
    const localDepth=(b.depthLine ?? b.h);
    renderables.push({y:(b.y+localDepth)*TILE,draw:()=>drawBuilding(b)});
  });
  trees.forEach(o=>{
    if(!onScreen(o.x*TILE,o.y*TILE,100,120)) return;
    renderables.push({y:o.y*TILE+TILE,draw:()=>o.interactable?drawResourceTree(o):drawWorldTree(o)});
  });
  rocks.forEach(o=>renderables.push({y:o.y*TILE+TILE,draw:()=>ctx.drawImage(imgs.rock,o.x*TILE-camX-6,o.y*TILE-camY-10,60,58)}));
  if(GAME_STATE.regionId==='lilacVillage'){
    renderables.push({y:(marketShop.y+marketShop.h)*TILE,draw:drawMarketShop});
    renderables.push({y:sign.y*TILE+TILE,draw:()=>ctx.drawImage(imgs.sign,sign.x*TILE-camX-8,sign.y*TILE-camY-20,64,68)});
    renderables.push({y:bench.y*TILE+TILE,draw:()=>ctx.drawImage(imgs.bench,bench.x*TILE-camX-26,bench.y*TILE-camY-8,100,56)});
    renderables.push({y:lamp.y*TILE+TILE,draw:()=>ctx.drawImage(imgs.lamp,lamp.x*TILE-camX+5,lamp.y*TILE-camY-38,38,86)});
  }
  const harbor=WORLD_DEFINITION.fixedObjects?.harbor;
  if(harbor?.ticketBooth)renderables.push({y:(harbor.ticketBooth.y+harbor.ticketBooth.h)*TILE,draw:()=>drawHarborTicketBooth(harbor.ticketBooth)});
  if(harbor?.boat)renderables.push({y:(harbor.boat.y+harbor.boat.h-.5)*TILE,draw:()=>drawHarborBoat(harbor.boat)});
  (harbor?.crates||[]).forEach((crate,index)=>renderables.push({y:(crate.y+1)*TILE,draw:()=>drawHarborCrate(crate,index)}));
  npcs.forEach(n=>renderables.push({y:n.y*TILE+TILE,draw:()=>drawNPC(n)}));
  renderables.push({y:forestryPlayerDrawDepth(),draw:drawPlayer});
  renderables.sort((a,b)=>a.y-b.y).forEach(r=>r.draw());

  drawFishingEffects();

  drawWorldTimeEffects();
  drawWeatherEffects();
  drawWorldDebug();

}
