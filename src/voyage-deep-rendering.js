// Decorative deep-route fragments. They never set gameplay time or weather.
// Compose once per scene into the same bounded canvases as the other routes.
function drawDeepVoyageLandmark(paint,kind,x,y,random,palette){
  const ellipse=(cx,cy,rx,ry,color)=>{paint.fillStyle=color;paint.beginPath();paint.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);paint.fill();};
  if(kind==='cloudBank'){
    for(let i=0;i<8;i++){
      const cx=x-55+i*16,cy=y+random()*17;
      ellipse(cx,cy,26+random()*14,12+random()*9,'rgba(5,12,26,.48)');
      ellipse(cx+3,cy-5,20,9,'rgba(68,78,103,.18)');
    }
  }else if(kind==='giantShadow'){
    ellipse(x,y,66,18,'rgba(3,10,20,.65)');
    paint.fillStyle='rgba(3,10,20,.65)';paint.beginPath();paint.moveTo(x-52,y);
    paint.lineTo(x-91,y-23);paint.lineTo(x-80,y);paint.lineTo(x-91,y+23);paint.lineTo(x-52,y);paint.fill();
    paint.beginPath();paint.moveTo(x+3,y);paint.lineTo(x-12,y-33);paint.lineTo(x-27,y);paint.fill();
    ellipse(x+33,y-3,18,3,'rgba(99,146,152,.11)');
  }else if(kind==='glowBloom'){
    for(let i=0;i<14;i++)drawDeepVoyageMidObject(paint,'jellyGlow',x+random()*100-50,y+random()*65-32,random,palette);
  }else if(kind==='darkCurrent'){
    for(let i=0;i<5;i++){
      paint.strokeStyle=i%2?'rgba(4,13,26,.45)':'rgba(109,149,167,.15)';paint.lineWidth=4;
      paint.beginPath();paint.moveTo(x-65,y+i*13);paint.lineTo(x-20,y+i*13-12);
      paint.lineTo(x+28,y+i*13-7);paint.lineTo(x+70,y+i*13+7);paint.stroke();
    }
  }else if(kind==='abyssalRidge'){
    for(let i=0;i<6;i++){
      paint.fillStyle=i%2?'rgba(5,15,27,.44)':'rgba(28,51,63,.42)';
      paint.beginPath();paint.moveTo(x-62+i*20,y+25);paint.lineTo(x-48+i*20,y-19-random()*30);
      paint.lineTo(x-25+i*20,y+25);paint.fill();
    }
    for(let i=0;i<9;i++)ellipse(x-58+random()*120,y+10+random()*20,2,1,'rgba(129,202,203,.32)');
  }
}
function drawDeepVoyageMidObject(paint,kind,x,y,random,palette){
  const ellipse=(cx,cy,rx,ry,color)=>{paint.fillStyle=color;paint.beginPath();paint.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);paint.fill();};
  if(kind==='jellyGlow'){
    ellipse(x,y,13,11,'rgba(113,205,210,.06)');
    ellipse(x,y,6,4,'rgba(128,220,219,.38)');
    paint.fillStyle='rgba(190,235,227,.65)';paint.fillRect(x-3,y-2,6,2);
    paint.strokeStyle='rgba(117,198,207,.35)';paint.lineWidth=1;
    for(let i=0;i<3;i++){paint.beginPath();paint.moveTo(x-3+i*3,y+3);paint.lineTo(x-4+i*3,y+10);paint.lineTo(x-1+i*3,y+16);paint.stroke();}
  }else if(kind==='lanternSchool'){
    for(let i=0;i<5;i++){
      const cx=x-15+i*7,cy=y+(i%2)*7;
      ellipse(cx,cy,5,2,'rgba(57,103,126,.45)');
      paint.fillStyle='rgba(146,220,197,.7)';paint.fillRect(cx+2,cy,2,1);
    }
  }else if(kind==='shadowTrail'){
    for(let i=0;i<3;i++)ellipse(x+i*8,y+i*11,16-i*3,4,'rgba(1,10,20,.38)');
  }else if(kind==='coldFoam'){
    paint.fillStyle=palette.light;
    for(let i=0;i<5;i++)paint.fillRect(x-15+i*7,y+i%2*3,3+random()*4,1);
  }
}
