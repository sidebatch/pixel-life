// Shared code-native deck geometry; sailing scenery lives in voyage-scenes.js.
function drawVoyageDeck(){
  const deck=WORLD_DEFINITION.voyageDeck;if(!deck)return;
  const x=deck.x*TILE-camX,y=deck.y*TILE-camY,w=deck.w*TILE,h=deck.h*TILE;
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
  const cabin=WORLD_DEFINITION.voyageDeck?.cabin;if(!cabin)return;
  const x=cabin.x*TILE-camX,y=cabin.y*TILE-camY,w=cabin.w*TILE,h=cabin.h*TILE;
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
  if(typeof hasFishVoyageRewardFlag==='function'&&hasFishVoyageRewardFlag()){
    // Keep the ornament below the fixed voyage HUD at the normal fishing view.
    const fx=x+w-15,fy=y+h-20;
    ctx.fillStyle='#d8bd80';ctx.fillRect(fx,fy-40,3,59);
    ctx.fillStyle='#26788d';ctx.beginPath();ctx.moveTo(fx+3,fy-39);ctx.lineTo(fx+38,fy-34);ctx.lineTo(fx+29,fy-22);ctx.lineTo(fx+38,fy-10);ctx.lineTo(fx+3,fy-16);ctx.fill();
    ctx.strokeStyle='#d4efde';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx+9,fy-27);ctx.lineTo(fx+17,fy-24);ctx.lineTo(fx+25,fy-27);ctx.stroke();
  }
  ctx.restore();
}
