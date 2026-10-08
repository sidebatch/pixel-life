// Mid-route fragments use the existing code-native sailing art language.
function drawMidVoyageLandmark(paint,kind,x,y,random,palette){
  const ellipse=(cx,cy,rx,ry,color)=>{paint.fillStyle=color;paint.beginPath();paint.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);paint.fill();};
  if(kind==='swellBank'){
    for(let row=0;row<4;row++){
      paint.strokeStyle=row%2?'rgba(137,190,211,.4)':'rgba(224,238,235,.5)';paint.lineWidth=2;
      paint.beginPath();paint.moveTo(x-43,y+row*12);paint.lineTo(x-20,y+row*12-6);paint.lineTo(x+14,y+row*12-5);paint.lineTo(x+45,y+row*12+1);paint.stroke();
    }
    return;
  }
  if(kind==='distantShip'){
    for(let i=0;i<2;i++){
      const px=x-15+i*33,py=y+i*18;
      paint.fillStyle='#7393a6';paint.fillRect(px-14,py,28,5);paint.fillRect(px-5,py-8,11,8);paint.fillRect(px+2,py-14,2,6);
      paint.fillStyle='#aec0c2';paint.fillRect(px-3,py-6,7,3);
    }
    return;
  }
  const large=kind==='freighter',half=large?49:kind==='trawler'?30:19;
  ellipse(x,y+9,half+12,10,'rgba(174,211,221,.2)');
  paint.fillStyle=large?'#2c455b':'#688d94';paint.beginPath();paint.moveTo(x-half,y);paint.lineTo(x-half+10,y-10);
  paint.lineTo(x+half-10,y-10);paint.lineTo(x+half,y);paint.lineTo(x+half-10,y+10);paint.lineTo(x-half+10,y+10);paint.lineTo(x-half,y);paint.fill();
  paint.fillStyle='#bdc6bc';paint.fillRect(x-half+12,y-7,half*2-25,14);
  if(kind==='sailboat'){
    paint.fillStyle='#ede9d4';paint.beginPath();paint.moveTo(x,y-3);paint.lineTo(x,y-35);paint.lineTo(x+24,y-3);paint.lineTo(x,y-3);paint.fill();
    paint.fillStyle='#7795a5';paint.fillRect(x-1,y-37,2,35);paint.fillStyle='#b7d0d1';paint.fillRect(x-16,y+11,33,2);
  }else{
    paint.fillStyle='#e0dfcf';paint.fillRect(x+half-28,y-17,16,17);
    paint.fillStyle='#4e7e97';paint.fillRect(x+half-25,y-13,10,4);
    paint.fillStyle='#718ba0';paint.fillRect(x+half-21,y-31,2,14);paint.fillRect(x+half-27,y-25,14,2);
    if(large){
      const colors=['#8b6252','#a69260','#5a7e76','#7d7893'];
      for(let column=0;column<4;column++)for(let row=0;row<2;row++){
        paint.fillStyle=colors[Math.floor(random()*colors.length)];paint.fillRect(x-half+16+column*13,y-6+row*7,11,6);
        paint.fillStyle='rgba(224,218,186,.3)';paint.fillRect(x-half+17+column*13,y-5+row*7,8,1);
      }
    }else{
      paint.strokeStyle='#7c998f';paint.lineWidth=1;
      for(let net=0;net<4;net++){paint.beginPath();paint.moveTo(x-18+net*5,y-8);paint.lineTo(x-23+net*7,y+8);paint.stroke();}
      paint.fillStyle='#a2b7a6';paint.fillRect(x-19,y-10,23,2);
    }
  }
  paint.strokeStyle=palette.light;paint.lineWidth=1;
  paint.beginPath();paint.moveTo(x-half-12,y+14);paint.lineTo(x-7,y+17);paint.lineTo(x+half+10,y+13);paint.stroke();
}
