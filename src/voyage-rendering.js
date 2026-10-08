// Fixed bow composition uses a tapered forward walking area; aft hull is cropped.
// The geometric fallback is kept only for isolated rendering tests/load diagnostics.
function drawVoyageDeck(){
  const deck=WORLD_DEFINITION.voyageDeck;if(!deck)return;
  const x=deck.x*TILE-camX,y=deck.y*TILE-camY,w=deck.w*TILE,h=deck.h*TILE;
  if(deck.view==='bow'){drawVoyageBowDeck(x,y,w,h);return;}
  if(imgs.voyageDeck){
    ctx.save();ctx.fillStyle='rgba(8,38,55,.32)';ctx.fillRect(x-10,y+12,w+20,h+12);
    // Solid footing remains under any transparent trim; no collision changes.
    ctx.fillStyle='#796448';ctx.fillRect(x+4,y+4,w-8,h-8);
    // Nine-slice the painted perimeter so the wooden floor reaches the existing
    // standing tiles. Bulky fenders must not shrink the usable-looking floor.
    drawVoyageDeckSprite(imgs.voyageDeck,x,y,w,h);ctx.restore();return;
  }
  ctx.save();
  // Hull shadow and a continuous deck, not a repeated bridge tile.
  ctx.fillStyle='rgba(8,49,62,.4)';ctx.fillRect(x-13,y+18,w+26,h+14);
  ctx.fillStyle='#324855';ctx.fillRect(x-7,y-7,w+14,h+14);
  ctx.fillStyle='#9e754d';ctx.fillRect(x,y,w,h);
  for(let row=0;row<h/16;row++){
    ctx.fillStyle=row%3===0?'#b88e5e':row%3===1?'#b08457':'#aa7f52';
    ctx.fillRect(x+5,y+row*16+1,w-10,14);
    ctx.fillStyle='#755b43';
    for(let joint=(row%3)*64+40;joint<w-10;joint+=147)ctx.fillRect(x+joint,y+row*16+1,2,14);
  }
  ctx.strokeStyle='#e5ddd0';ctx.lineWidth=4;ctx.strokeRect(x+4,y+4,w-8,h-8);
  ctx.fillStyle='#eee4cf';
  for(let p=20;p<h;p+=48){ctx.fillRect(x+1,y+p,7,13);ctx.fillRect(x+w-8,y+p,7,13);}
  for(let p=24;p<w;p+=48){ctx.fillRect(x+p,y+1,7,13);ctx.fillRect(x+p,y+h-13,7,13);}
  // Rope coils and two life rings remain below characters.
  for(const [cx,cy] of [[x+27,y+80],[x+w-29,y+h-80]]){
    ctx.strokeStyle='#e3c190';ctx.lineWidth=3;
    for(let r=6;r<=15;r+=4){ctx.beginPath();ctx.ellipse(cx,cy,r,r*.65,0,0,Math.PI*2);ctx.stroke();}
  }
  ctx.strokeStyle='#f0eee3';ctx.lineWidth=7;
  for(const cy of [y+150,y+h-130]){ctx.beginPath();ctx.arc(x+w-18,cy,11,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d85b40';ctx.fillRect(x+w-22,cy-14,8,7);ctx.fillRect(x+w-22,cy+7,8,7);}
  ctx.restore();
}
function drawVoyageCabin(){
  if(WORLD_DEFINITION.voyageDeck?.view==='bow')return;
  const cabin=WORLD_DEFINITION.voyageDeck?.cabin;if(!cabin)return;
  const x=cabin.x*TILE-camX,y=cabin.y*TILE-camY,w=cabin.w*TILE,h=cabin.h*TILE;
  if(imgs.voyageCabin){
    ctx.save();ctx.fillStyle='rgba(24,32,39,.22)';ctx.fillRect(x+8,y+15,w,h);
    ctx.drawImage(imgs.voyageCabin,x,y+h-220,w,220);drawVoyageCollectionFlag(x,y,w,h);ctx.restore();return;
  }
  ctx.save();
  ctx.fillStyle='rgba(24,32,39,.27)';ctx.fillRect(x+10,y+20,w,h);
  ctx.fillStyle='#d9ddcb';ctx.fillRect(x,y,w,h);
  ctx.fillStyle='#397780';ctx.fillRect(x+6,y+20,w-12,49);
  for(let i=0;i<3;i++){ctx.fillStyle='#afd9dd';ctx.fillRect(x+18+i*72,y+27,60,34);ctx.fillStyle='#dff4e8';ctx.fillRect(x+23+i*72,y+31,46,3);}
  ctx.fillStyle='#68796d';ctx.fillRect(x-8,y-9,w+16,26);
  ctx.fillStyle='#91a392';ctx.fillRect(x-5,y-9,w+10,9);
  ctx.fillStyle='#426971';ctx.fillRect(x+w/2-24,y+h-70,48,70);
  ctx.fillStyle='#a2c8c8';ctx.fillRect(x+w/2-17,y+h-62,34,26);
  ctx.fillStyle='#e4c074';ctx.fillRect(x+w/2+13,y+h-21,4,5);
  ctx.fillStyle='#b7beb0';ctx.fillRect(x+8,y+h-9,w-16,9);
  drawVoyageCollectionFlag(x,y,w,h);
  ctx.restore();
}
function drawVoyageBowDeck(x,y,w,h){
  ctx.save();
  if(imgs.voyageBow){
    // Compress exterior fenders/rail trim so existing edge-tile centers stay on wood.
    ctx.drawImage(imgs.voyageBow,0,0,24,336,x,y,16,h);
    ctx.drawImage(imgs.voyageBow,24,0,120,336,x+16,y,w-32,h);
    ctx.drawImage(imgs.voyageBow,144,0,24,336,x+w-16,y,16,h);
  }
  else{
    ctx.beginPath();ctx.moveTo(x+w/2-72,y);ctx.lineTo(x+w/2+72,y);ctx.lineTo(x+w-48,y+48);
    ctx.lineTo(x+w,y+96);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.lineTo(x,y+96);ctx.lineTo(x+48,y+48);ctx.closePath();
    ctx.fillStyle='#b57f43';ctx.fill();ctx.save();ctx.clip();
    for(let row=0;row<h;row+=24){ctx.fillStyle=row%48?'#ab753f':'#bd884c';ctx.fillRect(x,y+row,w,22);}
    ctx.restore();ctx.strokeStyle='#345b61';ctx.lineWidth=10;ctx.stroke();
  }
  // A low aft rope marks the limit of the visible forward deck, not open water.
  const ropeY=y+7*TILE-4;ctx.strokeStyle='#c9b88b';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x+10,ropeY);ctx.lineTo(x+w/2,ropeY+5);ctx.lineTo(x+w-10,ropeY);ctx.stroke();
  ctx.fillStyle='#6d5840';ctx.fillRect(x+8,ropeY-11,5,22);ctx.fillRect(x+w-13,ropeY-11,5,22);
  drawVoyageCollectionFlag(x+w/2-72,y,144,48);ctx.restore();
}
function drawVoyageDeckSprite(image,x,y,w,h){
  const sx=[0,30,186,216],sy=[0,18,314,336];
  const dx=[x,x+16,x+w-16,x+w],dy=[y,y+16,y+h-16,y+h];
  for(let row=0;row<3;row++)for(let column=0;column<3;column++){
    ctx.drawImage(image,sx[column],sy[row],sx[column+1]-sx[column],sy[row+1]-sy[row],
      dx[column],dy[row],dx[column+1]-dx[column],dy[row+1]-dy[row]);
  }
}
function drawVoyageCollectionFlag(x,y,w,h){
  if(typeof hasFishVoyageRewardFlag==='function'&&hasFishVoyageRewardFlag()){
    // Keep the ornament below the fixed voyage HUD at the normal fishing view.
    const fx=x+w-15,fy=y+h-20;
    ctx.fillStyle='#d8bd80';ctx.fillRect(fx,fy-40,3,59);
    ctx.fillStyle='#26788d';ctx.beginPath();ctx.moveTo(fx+3,fy-39);ctx.lineTo(fx+38,fy-34);ctx.lineTo(fx+29,fy-22);ctx.lineTo(fx+38,fy-10);ctx.lineTo(fx+3,fy-16);ctx.fill();
    ctx.strokeStyle='#d4efde';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx+9,fy-27);ctx.lineTo(fx+17,fy-24);ctx.lineTo(fx+25,fy-27);ctx.stroke();
  }
}
