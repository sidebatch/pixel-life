// Sword action v1 extends, rather than edits, the protected character v2 rig.
// The current fitted body/chop art supplies the two arm frames. Sword angles
// belong to this action family so later sword tiers share the same motion.
const SWORD_ACTION=Object.freeze({
  artPose:'chop',
  columns:2,
  frames:Object.freeze(Object.fromEntries(['down','right','left','up'].map(face=>[
    face,Object.freeze(CHARACTER_RIG.poses.chop.frames[face].map((base,index)=>Object.freeze({
      grip:base.grip,
      toolBehind:base.toolBehind,
      headMotion:base.headMotion,
      // Rear slash crosses right to left behind the head; only the blade
      // outside the hair silhouette is visible. Axe retains its own angles.
      angle:{down:[-2.1,.72],right:[-1.95,.12],left:[Math.PI+1.95,Math.PI-.12],up:[-.55,-2.8]}[face][index]
    })))
  ])))
});
const SWORD_TOOLS=Object.freeze({
  'sword.basic':Object.freeze({grip:[25,69],tip:[81,15],nativeAngle:Math.atan2(-54,56),nativeLength:Math.hypot(56,54)})
});
const SWORDS=Object.freeze([
  Object.freeze({id:'sword.basic',name:'기본 검',tier:1,asset:'basic',
    description:'처음부터 가지고 있는 검. 허공에서 휘두를 수 있어요. 전투와 상위 검은 이후 업데이트에서 추가돼요.'})
]);
const SWORD_BY_ID=new Map(SWORDS.map(sword=>[sword.id,sword]));
const DEFAULT_SWORD_ID='sword.basic';
const SWORD_SWING_TIMING=Object.freeze({impactMs:270,durationMs:700});
