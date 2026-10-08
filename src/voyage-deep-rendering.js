// Pixel silhouettes and sparse localized glow, never gameplay weather/time.
function drawDeepVoyageLandmark(paint,kind,x,y,random,palette){
  const polygon=(pts,color)=>voyagePixelPolygon(paint,pts.map(([px,py])=>[x+px,y+py]),color);
  if(kind==='cloudBank'){
    for(let i=0;i<6;i++){
      const cx=x-55+i*19,cy=y+random()*14;
      voyagePixelPolygon(paint,[[cx-26,cy+7],[cx-21,cy-3],[cx-8,cy-9],[cx+8,cy-5],[cx+24,cy+2],[cx+17,cy+12],[cx-10,cy+14]],'rgba(10,20,36,.24)');
      drawVoyageWaveCrest(paint,cx-20,cy+17,30,'rgba(111,139,157,.1)');
    }
  }else if(kind==='giantShadow'){
    polygon([[-63,1],[-48,-11],[-25,-15],[3,-12],[27,-9],[51,-3],[65,4],[40,13],[1,18],[-38,14]],'rgba(5,17,29,.45)');
    polygon([[-47,0],[-83,-22],[-73,0],[-83,21],[-47,9]],'rgba(5,17,29,.4)');
    polygon([[2,-5],[-11,-32],[-25,-9]],'rgba(5,17,29,.4)');
    drawVoyageWaveCrest(paint,x+12,y-5,36,'rgba(119,161,159,.12)');
  }else if(kind==='glowBloom'){
    for(let i=0;i<12;i++)drawDeepVoyageMidObject(paint,'jellyGlow',x+random()*100-50,y+random()*65-32,random,palette);
  }else if(kind==='darkCurrent'){
    for(let i=0;i<5;i++){
      const color=i%2?'rgba(5,18,32,.24)':'rgba(125,163,170,.14)';
      drawVoyageWaveCrest(paint,x-62+i%2*14,y+i*14,113,color,i===0);
      drawVoyageWaveCrest(paint,x-44,y+i*14+6,62,color);
    }
  }else if(kind==='abyssalRidge'){
    for(let i=0;i<6;i++){
      const bx=x-62+i*20,top=y-19-random()*30;
      voyagePixelPolygon(paint,[[bx,y+25],[bx+14,top],[bx+37,y+25]],'rgba(8,24,34,.4)');
      voyagePixelPolygon(paint,[[bx+14,top],[bx+17,y+6],[bx+5,y+14]],'rgba(62,85,85,.22)');
      voyagePixelRect(paint,bx+13,top+8,2,3,'rgba(129,187,173,.25)');
    }
    for(let i=0;i<9;i++)voyagePixelRect(paint,x-58+random()*120,y+10+random()*20,2,2,'rgba(137,200,186,.38)');
  }
}
function drawDeepVoyageMidObject(paint,kind,x,y,random,palette){
  if(kind==='jellyGlow'){
    voyagePixelOval(paint,x,y,10,7,'rgba(108,189,182,.08)');
    voyagePixelPolygon(paint,[[x-7,y+2],[x-6,y-3],[x-2,y-5],[x+3,y-5],[x+7,y+1]],'rgba(133,199,184,.4)');
    voyagePixelRect(paint,x-3,y-3,5,2,'rgba(190,228,203,.7)');
    for(let i=0;i<3;i++){
      voyagePixelRect(paint,x-4+i*4,y+3,2,6+i%2*2,'rgba(131,189,177,.4)');
      voyagePixelRect(paint,x-2+i*4,y+9+i%2*2,2,4,'rgba(131,189,177,.3)');
    }
  }else if(kind==='lanternSchool'){
    for(let i=0;i<5;i++){
      const cx=x-15+i*8,cy=y+(i%2)*8;
      voyagePixelRect(paint,cx-5,cy,10,2,'rgba(78,119,139,.45)');voyagePixelRect(paint,cx-7,cy-2,2,6,'rgba(78,119,139,.4)');
      voyagePixelRect(paint,cx+3,cy,2,2,'rgba(168,219,181,.72)');
    }
  }else if(kind==='shadowTrail'){
    for(let i=0;i<3;i++){
      const cx=x+i*8,cy=y+i*11;
      voyagePixelPolygon(paint,[[cx-15,cy],[cx-5,cy-4],[cx+12,cy],[cx+3,cy+5]],'rgba(5,18,30,.35)');
    }
  }else if(kind==='coldFoam'){
    for(let i=0;i<3;i++)drawVoyageWaveCrest(paint,x-16+i*8,y+i%2*6,18,'rgba(145,176,182,.3)',i===0);
  }
}
