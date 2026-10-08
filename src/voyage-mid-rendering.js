// Distant ships share the warm, outlined pixel language of harbor art v2.
function drawMidVoyageLandmark(paint,kind,x,y,random,palette){
  const rect=(dx,dy,w,h,color)=>voyagePixelRect(paint,x+dx,y+dy,w,h,color);
  const polygon=(pts,color)=>voyagePixelPolygon(paint,pts.map(([px,py])=>[x+px,y+py]),color);
  if(kind==='swellBank'){
    for(let row=0;row<4;row++)drawVoyageWaveCrest(paint,x-45+row%2*7,y+row*12,84,row%2?'rgba(152,193,204,.36)':'rgba(222,234,224,.48)',row===0);
    return;
  }
  if(kind==='distantShip'){
    for(let i=0;i<2;i++){
      const px=x-15+i*33,py=y+i*18;
      voyagePixelPolygon(paint,[[px-16,py-2],[px+15,py-2],[px+11,py+6],[px-11,py+6]],'#436779');
      voyagePixelRect(paint,px-12,py-2,24,3,'#c4c6b0');
      voyagePixelRect(paint,px-5,py-10,10,8,'#d2d2ba');voyagePixelRect(paint,px+2,py-16,2,6,'#596e75');
      drawVoyageWaveCrest(paint,px-18,py+9,33,'rgba(179,211,204,.38)');
    }
    return;
  }
  const large=kind==='freighter',half=large?49:kind==='trawler'?30:19;
  drawVoyageWaveCrest(paint,x-half-12,y+18,half*2+20,'rgba(169,206,200,.45)');
  polygon([[-half-2,0],[-half+8,-12],[half-10,-12],[half+3,0],[half-9,12],[-half+7,12]],'#354e58');
  polygon([[-half+2,-1],[-half+10,-9],[half-10,-9],[half-2,0],[half-9,9],[-half+10,9]],'#c4c3a5');
  rect(-half+11,-5,half*2-23,10,'#987b56');rect(-half+14,3,half*2-29,2,'#bc9b65');
  if(kind==='sailboat'){
    polygon([[0,-3],[0,-37],[25,-3]],'#667c80');
    polygon([[3,-6],[3,-31],[21,-6]],'#e7dfbe');rect(-2,-39,2,39,'#594f42');
    rect(-half+8,9,half*2-16,2,'#719699');
  }else{
    rect(half-29,-20,19,21,'#40555b');rect(half-27,-18,15,17,'#e0d9b8');
    rect(half-25,-15,10,5,'#4d798a');rect(half-24,-15,3,2,'#8eafb2');
    rect(half-22,-32,2,12,'#5c6560');rect(half-28,-28,14,2,'#948b70');
    if(large){
      const colors=['#996b59','#b3a06d','#628875','#83819a'];
      for(let column=0;column<4;column++)for(let row=0;row<2;row++){
        const dx=-half+15+column*13,dy=-7+row*8,color=colors[Math.floor(random()*colors.length)];
        rect(dx,dy,12,8,'#485960');rect(dx+2,dy,9,6,color);rect(dx+3,dy+1,6,2,'rgba(229,217,178,.4)');
      }
    }else{
      rect(-20,-9,22,15,'#576b5a');rect(-18,-7,18,9,'#87937a');
      rect(-15,-6,2,7,'#aab090');rect(-8,-6,2,7,'#aab090');
      rect(-21,-12,26,2,'#786b50');rect(-19,-24,2,14,'#6a6655');
      voyagePixelLine(paint,x-18,y-23,x+4,y-12,'#b0a77e',2);
    }
  }
}
