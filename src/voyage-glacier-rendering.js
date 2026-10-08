// Stepped ice facets and subdued pixel aurora; no vector ribbons/graph-like rays.
function drawGlacierVoyageLandmark(paint,kind,x,y,random,palette){
  const polygon=(points,color)=>voyagePixelPolygon(paint,points,color);
  if(kind==='auroraVeil'){
    const colors=['rgba(134,207,180,.22)','rgba(161,157,207,.17)','rgba(199,221,196,.14)'];
    for(let band=0;band<3;band++)for(let point=0;point<18;point++){
      const px=x-80+point*9,py=y-20+Math.sin(point*.32+band)*14+band*9;
      voyagePixelRect(paint,px,py,10,4,colors[band]);
      if(point%3!==0)voyagePixelRect(paint,px+2,py+4,6,8+random()*6,colors[band]);
    }
    for(let i=0;i<8;i++)voyagePixelRect(paint,x-65+random()*130,y+31+random()*15,3,2,'rgba(195,224,202,.24)');
  }else if(kind==='snowBank'){
    for(let cloud=0;cloud<5;cloud++)drawVoyageWaveCrest(paint,x-65+cloud*22,y+cloud%2*7,54,'rgba(216,227,227,.13)');
    for(let flake=0;flake<30;flake++)voyagePixelRect(paint,x-75+random()*150,y-25+random()*80,2,2,'rgba(231,238,228,.4)');
  }else if(kind==='iceShelf'){
    polygon([[x-74,y+12],[x-62,y-12],[x-25,y-19],[x-5,y-9],[x+29,y-21],[x+70,y-8],[x+78,y+17],[x+25,y+33],[x-27,y+31]],'#52798a');
    polygon([[x-70,y+8],[x-59,y-11],[x-25,y-16],[x-6,y-6],[x+29,y-18],[x+66,y-6],[x+74,y+15],[x+25,y+29],[x-26,y+27]],'#9cbfc8');
    polygon([[x-59,y-11],[x-25,y-16],[x-6,y-6],[x+29,y-18],[x+66,y-6],[x+55,y+5],[x-47,y+8]],'#e4e9dc');
    for(let i=0;i<5;i++)voyagePixelRect(paint,x-44+i*23,y+14-i%2*5,3,10,'#729aab');
    drawVoyageWaveCrest(paint,x-57,y+34,75,'rgba(183,214,206,.48)');
  }else if(kind==='iceArch'){
    polygon([[x-58,y+22],[x-47,y-24],[x-30,y-45],[x+29,y-37],[x+56,y+21],[x+29,y+26],[x+19,y-7],[x-17,y-10],[x-28,y+28]],'#557d92');
    polygon([[x-55,y+19],[x-44,y-24],[x-30,y-42],[x+27,y-34],[x+52,y+18],[x+30,y+22],[x+20,y-9],[x-19,y-13],[x-30,y+25]],'#a9c6cc');
    polygon([[x-44,y-24],[x-30,y-42],[x+27,y-34],[x+33,y-16],[x-25,y-23]],'#e4ebe0');
    voyagePixelRect(paint,x+36,y-3,4,19,'#779da9');
    drawVoyageWaveCrest(paint,x-60,y+31,58,'rgba(205,225,216,.45)');
  }else if(kind==='iceberg'){
    const height=43+random()*27;
    polygon([[x-54,y+17],[x-38,y-18],[x-15,y-height-3],[x+10,y-height+10],[x+33,y-18],[x+54,y+18],[x+13,y+34]],'#4f778c');
    polygon([[x-51,y+15],[x-35,y-18],[x-15,y-height],[x+8,y-height+12],[x+30,y-18],[x+51,y+16],[x+13,y+31]],'#b5cfd3');
    polygon([[x-51,y+15],[x-15,y-height],[x-5,y-14],[x+13,y+31]],'#e5ece0');
    polygon([[x+8,y-height+12],[x+30,y-18],[x+51,y+16],[x+13,y+31],[x+7,y-13]],'#7c9fad');
    voyagePixelRect(paint,x-9,y-27,3,14,'#c6dad5');
    voyagePixelLine(paint,x+21,y-9,x+26,y+3,'#648b9d');voyagePixelLine(paint,x+26,y+3,x+22,y+11,'#648b9d');
    voyagePixelLine(paint,x-31,y+1,x-16,y+12,'#c7dcd7');voyagePixelRect(paint,x+6,y+17,3,3,'#d4e4db');
    drawVoyageWaveCrest(paint,x-59,y+37,83,'rgba(191,218,209,.5)');
    drawVoyageWaveCrest(paint,x+22,y+34,33,'rgba(224,235,219,.42)');
  }
}
function drawGlacierVoyageMidObject(paint,kind,x,y,random,palette){
  if(kind==='iceFloes'||kind==='iceShards'){
    const size=kind==='iceFloes'?12+random()*9:5+random()*5;
    voyagePixelPolygon(paint,[[x-size,y+2],[x-size*.5,y-6],[x+size*.7,y-4],[x+size,y+4],[x,y+8]],'#7fa7b2');
    voyagePixelPolygon(paint,[[x-size+2,y+1],[x-size*.5,y-6],[x+size*.7,y-4],[x+size-3,y],[x,y+4]],'#dbe7dc');
    drawVoyageWaveCrest(paint,x-size-5,y+12,size*2+10,'rgba(187,214,204,.3)');
  }else if(kind==='snowFlurry'){
    for(let flake=0;flake<12;flake++)voyagePixelRect(paint,x-17+random()*35,y-24+random()*48,2,2,'rgba(225,234,222,.5)');
  }else if(kind==='crystalWake'){
    for(let row=0;row<3;row++)drawVoyageWaveCrest(paint,x-15+row*2,y+row*6,31,'rgba(201,224,211,.5)',row===0);
  }
}
