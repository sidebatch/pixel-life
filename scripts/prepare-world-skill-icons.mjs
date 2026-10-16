// Mechanical transparent crop/nearest-neighbor packing of approved raster art.
// New location artwork is generated with imagegen, never painted by this script.
import fs from 'node:fs';
import {blank,decodePNG,encodePNG,alphaBounds,crop,blitNearest} from './lib/png.mjs';
const folder='assets/ui/world-skills-v1';fs.mkdirSync(folder,{recursive:true});
const sources={
  fishing:'assets/fishing/rods/sturdy.png',logging:'assets/forestry/axes/iron.png',farming:'assets/farming/mature/wheat.png',
  gathering:'assets/world/bush1.png',mining:'assets/world/rock.png',cooking:'assets/farming/harvest/pumpkin.png',hunting:'assets/player/sword-v1/basic.png',
  oldForest:'assets/forestry/trees/oak.png',deepForest:'assets/forestry/trees/pine.png',forestThree:'assets/forestry/trees/willow.png',
  forestFour:'assets/forestry/trees/ginkgo.png',forestFive:'assets/forestry/trees/cherry.png',forestSix:'assets/forestry/trees/mahogany.png',
  forestSeven:'assets/forestry/trees/sequoia.png',forestEight:'assets/forestry/trees/ironbark.png',forestNine:'assets/forestry/trees/african_blackwood.png',
  forestTen:'assets/forestry/trees/ancient_zelkova.png',forestEleven:'assets/forestry/trees/spirit_ancient.png',forestTwelve:'assets/forestry/trees/origin_tree.png',
  lilacVillage:'assets/ui/source/world-skills-v1/lilac-village.png',sunnyFields:'assets/ui/source/world-skills-v1/sunny-farm.png',
  mountainLake:'assets/ui/source/world-skills-v1/mountain-lake.png',waterfallValley:'assets/ui/source/world-skills-v1/waterfall-valley.png',
  reedSwamp:'assets/ui/source/world-skills-v1/reed-swamp.png',coast:'assets/ui/source/world-skills-v1/coast-harbor.png',
  boatShallow:'assets/ui/source/world-skills-v1/shallow-sea.png',boatMid:'assets/ui/source/world-skills-v1/middle-sea.png',
  boatDeep:'assets/ui/source/world-skills-v1/deep-sea.png',boatGlacier:'assets/ui/source/world-skills-v1/glacier-sea.png'
};
for(const [id,source]of Object.entries(sources)){
  const image=decodePNG(fs.readFileSync(source)),b=alphaBounds(image),cut=crop(image,b.x,b.y,b.width,b.height),out=blank(128,128);
  const scale=112/Math.max(cut.width,cut.height),w=Math.round(cut.width*scale),h=Math.round(cut.height*scale);
  blitNearest(out,cut,Math.floor((128-w)/2),Math.floor((128-h)/2),w,h);
  fs.writeFileSync(`${folder}/${id}.png`,encodePNG(out));
}
fs.writeFileSync(`${folder}/sources.json`,JSON.stringify(sources,null,2)+'\n');
console.log(`Packed ${Object.keys(sources).length} unique world and skill icons.`);
