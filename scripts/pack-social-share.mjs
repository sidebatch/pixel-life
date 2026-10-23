import fs from 'node:fs';
import {blank,decodePNG,encodePNG,blitNearest} from './lib/png.mjs';

// Mechanical size normalization only; the artwork and title come from image_gen.
const source=decodePNG(fs.readFileSync('assets/social/source/share-v1.png'));
const target=blank(1200,630);
if(Math.abs(source.width/source.height-1200/630)>0.01)throw Error('Cover aspect ratio would distort the illustration');
blitNearest(target,source,0,0,target.width,target.height);
fs.writeFileSync('assets/social/pixel-life-share-v1.png',encodePNG(target));
console.log('Packed social cover: 1200 × 630 PNG, nearest-neighbor, no scene changes.');
