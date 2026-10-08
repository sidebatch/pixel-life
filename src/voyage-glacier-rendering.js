// Frozen polar scenery is decorative: actual fishing weather/time remain independent.
function drawGlacierVoyageLandmark(paint,kind,x,y,random,palette){
  const ellipse=(cx,cy,rx,ry,color)=>{paint.fillStyle=color;paint.beginPath();paint.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);paint.fill();};
  const polygon=(points,color)=>{paint.fillStyle=color;paint.beginPath();points.forEach(([px,py],i)=>i?paint.lineTo(px,py):paint.moveTo(px,py));paint.fill();};
  if(kind==='auroraVeil'){
    // Low-contrast frozen ribbons, no flashes or extra frame allocations.
    for(let band=0;band<3;band++){
      const colors=['rgba(126,226,205,.22)','rgba(173,173,228,.2)','rgba(195,233,216,.18)'];
      paint.strokeStyle=colors[band];paint.lineWidth=11-band*2;paint.beginPath();
      for(let point=0;point<10;point++){
        const px=x-78+point*17,py=y-25+Math.sin(point*.65+band)*18+band*13;
        if(point===0)paint.moveTo(px,py);else paint.lineTo(px,py);
      }
      paint.stroke();
      for(let ray=0;ray<13;ray++){
        paint.fillStyle=colors[band];paint.fillRect(x-74+ray*12,y-27+Math.sin(ray*.6+band)*16,2,12+random()*24);
      }
    }
  }else if(kind==='snowBank'){
    for(let cloud=0;cloud<7;cloud++)ellipse(x-55+cloud*18,y+random()*10,28,12,'rgba(216,230,241,.18)');
    for(let flake=0;flake<38;flake++){
      paint.fillStyle='rgba(231,241,244,.42)';paint.fillRect(x-75+random()*150,y-25+random()*80,1+random()*2,2);
    }
  }else if(kind==='iceShelf'){
    ellipse(x,y+20,78,17,'rgba(175,218,226,.2)');
    polygon([[x-70,y+8],[x-59,y-11],[x-25,y-16],[x-6,y-6],[x+29,y-18],[x+66,y-6],[x+74,y+15],[x+25,y+29],[x-26,y+27]],'#a9cedb');
    polygon([[x-59,y-11],[x-25,y-16],[x-6,y-6],[x+29,y-18],[x+66,y-6],[x+55,y+5],[x-47,y+8]],'#e6eef0');
    paint.fillStyle='#7ba7c1';for(let i=0;i<5;i++)paint.fillRect(x-44+i*23,y+14-i%2*5,2,10);
  }else if(kind==='iceArch'){
    ellipse(x,y+21,64,14,'rgba(187,227,232,.25)');
    polygon([[x-55,y+19],[x-44,y-24],[x-30,y-42],[x+27,y-34],[x+52,y+18],[x+30,y+22],[x+20,y-9],[x-19,y-13],[x-30,y+25]],'#afcddd');
    polygon([[x-44,y-24],[x-30,y-42],[x+27,y-34],[x+33,y-16],[x-25,y-23]],'#e8f0f0');
    paint.fillStyle='#789fbc';paint.fillRect(x+36,y-3,4,19);
  }else if(kind==='iceberg'){
    const height=43+random()*27;
    ellipse(x,y+20,58,17,'rgba(169,219,232,.23)');
    polygon([[x-51,y+15],[x-35,y-18],[x-15,y-height],[x+8,y-height+12],[x+30,y-18],[x+51,y+16],[x+13,y+31]],'#bcd9e4');
    polygon([[x-51,y+15],[x-15,y-height],[x-5,y-14],[x+13,y+31]],'#e8f1f2');
    polygon([[x+8,y-height+12],[x+30,y-18],[x+51,y+16],[x+13,y+31],[x+7,y-13]],'#80acc6');
  }
}
function drawGlacierVoyageMidObject(paint,kind,x,y,random,palette){
  if(kind==='iceFloes'||kind==='iceShards'){
    const size=kind==='iceFloes'?12+random()*9:5+random()*5;
    paint.fillStyle='#a2cddc';paint.beginPath();paint.moveTo(x-size,y+2);paint.lineTo(x-size*.5,y-6);
    paint.lineTo(x+size*.7,y-4);paint.lineTo(x+size,y+4);paint.lineTo(x,y+8);paint.lineTo(x-size,y+2);paint.fill();
    paint.fillStyle='#e0edef';paint.fillRect(x-size*.5,y-4,size,3);
    paint.fillStyle='rgba(188,224,231,.25)';paint.fillRect(x-size-4,y+10,size*2+8,2);
  }else if(kind==='snowFlurry'){
    for(let flake=0;flake<12;flake++){
      paint.fillStyle='rgba(222,238,242,.48)';paint.fillRect(x-17+random()*35,y-24+random()*48,2,2);
    }
  }else if(kind==='crystalWake'){
    paint.strokeStyle=palette.light;paint.lineWidth=1;
    for(let row=0;row<3;row++){paint.beginPath();paint.moveTo(x-15,y+row*5);paint.lineTo(x-3,y+row*5-2);paint.lineTo(x+16,y+row*5);paint.stroke();}
  }
}
