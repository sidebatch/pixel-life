// Shared authored attachment contract for every wardrobe. Whole bag art is
// placed on the rear shoulder; the runtime torso/head supply the occlusion.
import {blank,crop,mainSpriteBounds,blitNearest} from './png.mjs';
export function attachedPack(art,face,pose,frame){
  if(face===0)return blank(96,96);
  const side=face===1||face===2,b=mainSpriteBounds(art),result=blank(96,96);
  const scale=Math.min((side?15:26)/b.width,23/b.height);
  const width=Math.round(b.width*scale),height=Math.round(b.height*scale);
  // Impact torso leans forward. The shoulder's rear edge rises and shifts
  // back, unlike the head centre. Never attach a bag to the head's offset.
  const [dx,dy]=pose==='chop'?(frame===0?[-1,-1]:[-3,-4]):
    pose==='walk'?(frame===1?[1,-1]:frame===2?[-1,1]:[0,0]):
    frame===0?[-1,-1]:[0,0];
  const left=side?27+dx:Math.round(48-width/2),x=face===2?96-left-width:left;
  blitNearest(result,crop(art,b.x,b.y,b.width,b.height),x,59+dy,width,height);
  return result;
}
