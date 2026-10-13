// Sickle v1 extends the common right-hand rig; existing tools/poses stay fixed.
const FARM_SICKLE=Object.freeze({id:'sickle.basic',name:'기본 낫',asset:'basic',
  description:'처음부터 가지고 있는 농사 도구. 다 자란 작물을 한 칸씩 수확할 수 있어요.'});
const SICKLE_TOOLS=Object.freeze({
  'sickle.basic':Object.freeze({grip:[28,72],tip:[58,26],nativeAngle:Math.atan2(-46,30),
    nativeLength:Math.hypot(30,46),carryLength:25,swingLength:32})
});
const SICKLE_ACTION=Object.freeze({columns:2,artPose:'chop',
  frames:Object.freeze(Object.fromEntries(['down','right','left','up'].map(face=>[face,
    Object.freeze(CHARACTER_RIG.poses.chop.frames[face].map((frame,index)=>Object.freeze({
      ...frame,angle:{down:[-1.9,.7],right:[-1.7,.15],left:[Math.PI+1.7,Math.PI-.15],up:[-.65,-2.65]}[face][index]
    })))
  ])))
});
const FARM_HARVEST_TIMING=Object.freeze({impactMs:270,durationMs:700});
