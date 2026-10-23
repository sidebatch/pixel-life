import fs from 'node:fs';
import crypto from 'node:crypto';
import {blank,decodePNG,encodePNG,crop,alphaBounds,blitNearest} from './lib/png.mjs';
const jobs=JSON.parse(fs.readFileSync('docs/art/weapon-south-prompts-v2.json','utf8'));
function pack(key,path,width,height,margin){
  const image=decodePNG(fs.readFileSync(jobs.find(j=>j.key===key).source)),bounds=alphaBounds(image),sprite=crop(image,bounds.x,bounds.y,bounds.width,bounds.height),target=blank(width,height);
  const scale=Math.min((width-margin*2)/bounds.width,(height-margin*2)/bounds.height),w=Math.round(bounds.width*scale),h=Math.round(bounds.height*scale);
  blitNearest(target,sprite,Math.round((width-w)/2),Math.round((height-h)/2),w,h);fs.writeFileSync(path,encodePNG(target));
  return {image:path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')};
}
fs.mkdirSync('assets/player/sword-v2',{recursive:true});
const wooden=pack('wooden','assets/player/sword-v2/wooden.png',96,96,10),brak=pack('brakSword','assets/player/sword-v2/brak.png',96,96,10);
pack('southExit','assets/dungeons/south-exit-v1.png',240,200,10);
const contract={id:'sword-materials-v2',date:'2026-10-22',authorization:'User requested starter wooden sword and Brak tusk sword. Preserve shared character/hand/swing geometry and archive previous metal art.',
  weapons:{'sword.basic':{...wooden,name:'목검'},'sword.brak':{...brak,name:'브락의 검'}},
  previousBasicImage:'assets/player/sword-v1/basic.png',previousCraftedImage:'assets/crafting/iron-sword-v1.png',saveAliases:{'sword.iron':'sword.brak'}};
fs.writeFileSync('docs/sword-materials-v2.json',JSON.stringify(contract,null,2)+'\n');
console.log('Packed wooden sword, Brak sword and southern descending exit; original metal art preserved.');
